use std::{
    hash::{Hash, Hasher},
    net::{self, SocketAddr},
    path::{Path, PathBuf},
    time::Duration,
    vec::IntoIter,
};

use pea_server::utils::{
    get_local_ip_address,
    log::{log_debug, log_normal, terminal_message},
    storage::{FileIndex, FileMetadata},
};

struct Config {
    address: Box<dyn net::ToSocketAddrs<Iter = IntoIter<SocketAddr>> + Send + Sync>,
    content_root: PathBuf,
}

const SERVER_CONTENT: &str = "./content/index.json";

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let address = Box::new(
        std::env::args()
            .nth(1)
            .unwrap_or_else(|| SocketAddr::from((get_local_ip_address(), 8080)).to_string()),
    );
    let content_root = PathBuf::from(
        std::env::args()
            .nth(2)
            .unwrap_or_else(|| "./files".to_string()),
    );
    log_normal(&format!(
        "trying to run server on address: http://{} with content at : {}",
        address,
        content_root.to_string_lossy()
    ));
    let config = Config {
        address,
        content_root,
    };
    tokio::spawn(async move {
        // generate_static_content(&config).expect("generating static content should not fail");
        create_and_run_server(&config)
            .expect("server creation should not fail")
            .await
            .expect("server running should not fail");
    });
    input_listener().expect("expect input listener not to fail");
    Ok(())
}

fn input_listener() -> crossterm::Result<()> {
    terminal_message("Enter q to shutdown server");
    loop {
        if crossterm::event::poll(Duration::from_millis(1000))? {
            if let crossterm::event::Event::Key(event) = crossterm::event::read()? {
                if event.code == crossterm::event::KeyCode::Char('q') {
                    shutdown_server();
                }
            }
        }
    }
}

fn shutdown_server() {
    log_debug("intializing shutdown");
    std::process::exit(0);
}

fn generate_static_content(config: &Config) -> std::io::Result<()> {
    let content_path = PathBuf::from(SERVER_CONTENT);
    log_normal(&format!(
        "using :{} as the content directory",
        content_path.to_string_lossy()
    ));
    log_normal("starting content generation");
    let content_files = generate_content(&config.content_root)?;
    log_normal(&format!(
        "content generation completed with {} files",
        content_files.len()
    ));
    Ok(())
}

fn generate_content(content_root: &Path) -> Result<Vec<String>, std::io::Error> {
    let mut content_files = Vec::new();
    for path in std::fs::read_dir(content_root)
        .expect("expect iteration over content root to work")
        .flatten()
    {
        if let Some(file_name) = add_content(&path.path())? {
            content_files.push(file_name);
        }
    }
    Ok(content_files)
}

fn add_content(path: &Path) -> Result<Option<String>, std::io::Error> {
    let path_as_lossy_str = path.to_string_lossy();
    let file_name = path.file_stem().unwrap_or_else(|| {
        panic!(
            "expect file name extraction not to fail for file {}",
            path_as_lossy_str
        )
    });
    match path.extension() {
        Some(file_extension) => {
            let file_extension = file_extension
                .to_str()
                .expect("file_extension will always be a valid string since we check it above");
            let mut hasher = std::collections::hash_map::DefaultHasher::new();
            file_name.hash(&mut hasher);
            let new_name = format!("{}.{}", hasher.finish(), file_extension);
            let destination = PathBuf::from(format!("{SERVER_CONTENT}/{}", new_name));
            std::fs::copy(path, destination)?;
            Ok(Some(new_name))
        }
        None => {
            log_normal(&format!(
                "ignoring file {:?} due to improper file extension",
                file_name
            ));
            Ok(None)
        }
    }
}

fn create_and_run_server(config: &Config) -> std::io::Result<actix_web::dev::Server> {
    log_normal(&format!(
        "starting server at: {:?}",
        config.address.to_socket_addrs()
    ));
    let server = actix_web::HttpServer::new(move || {
        let cors = actix_cors::Cors::permissive();
        actix_web::App::new()
            .wrap(cors)
            .route("/", actix_web::web::get().to(index))
            .route("/files", actix_web::web::get().to(get_files))
            .service(
                actix_web::web::resource("/content/{file_name}")
                    .route(actix_web::web::get().to(get_content)),
            )
            .service(
                actix_files::Files::new("/static", "./client-content/static").show_files_listing(),
            )
    })
    .bind(config.address.as_ref())?;
    Ok(server.run())
}

async fn index(_req: actix_web::HttpRequest) -> actix_web::Result<actix_files::NamedFile> {
    let path: PathBuf = "./client-content/index.html".parse().unwrap();
    Ok(actix_files::NamedFile::open(path)?)
}

async fn get_files() -> actix_web::HttpResponse {
    let files = get_all_files();
    let body = serde_json::to_string(&files).unwrap();
    actix_web::HttpResponse::Ok()
        .content_type("application/json")
        .body(body)
}

async fn get_content(req: actix_web::HttpRequest) -> actix_web::Result<actix_files::NamedFile> {
    let file_name: String = req.match_info().query("file_name").parse().unwrap();
    let file_id: Vec<u64> = file_name
        .split(".")
        .take(1)
        .map(|id| id.parse::<u64>().unwrap())
        .collect();
    let file_id = file_id[0];
    let index = FileIndex::new(&PathBuf::from(SERVER_CONTENT));
    let file_path = index.get_file_path(file_id).unwrap();
    Ok(actix_files::NamedFile::open(file_path)?)
}

#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq)]
struct FileData {
    name: String,
    id: u64,
    ty: String,
}

impl From<FileMetadata> for FileData {
    fn from(value: FileMetadata) -> Self {
        Self {
            name: value.name,
            id: value.id,
            ty: value.ty,
        }
    }
}

fn get_all_files() -> Vec<FileData> {
    let index = FileIndex::new(&PathBuf::from(SERVER_CONTENT));
    index
        .files()
        .into_iter()
        .map(|each| each.into())
        .collect()
}

#[cfg(test)]
mod tests {
    use std::{fs::File, io::Write, path::PathBuf};

    use crate::{create_and_run_server, get_files, index, Config, FileData};
    use actix_web::{
        body::to_bytes,
        http::{self, header::ContentType},
        test,
    };
    use pea_server::utils::storage::clean_up_dir;
    use std::sync::Once;

    static INIT: Once = Once::new();

    #[tokio::test]
    async fn can_start_server() {
        initialize();
        tokio::spawn(async move {
            let config = Config {
                address: Box::new(format!("localhost:{}", 5000)),
                content_root: PathBuf::from("./test_content"),
            };
            create_and_run_server(&config)
                .expect("expect server startup to succeed")
                .await
                .expect("expect sever running to succeed");
        })
        .abort()
    }
    #[actix_web::test]
    async fn can_get_the_index_page() {
        initialize();
        let req = test::TestRequest::default()
            .insert_header(ContentType::plaintext())
            .to_http_request();
        index(req)
            .await
            .expect("expect getting index.html to succeed");
    }

    #[actix_web::test]
    async fn can_get_files() {
        initialize();
        let resp = get_files().await;
        assert_eq!(resp.status(), http::StatusCode::OK);
        let actual = to_bytes(resp.into_body()).await.unwrap();
        let mut actual: Vec<FileData> = serde_json::from_slice(&actual).unwrap();
        actual.sort_by_key(|data| data.id);

        let expected: Vec<FileData> = vec![
            FileData {
                name: "1.mp4".to_string(),
                id: 1,
                ty: "mp4".to_string(),
            },
            FileData {
                name: "2.mp4".to_string(),
                id: 2,
                ty: "mp4".to_string(),
            },
            FileData {
                name: "3.mkv".to_string(),
                id: 3,
                ty: "mkv".to_string(),
            },
            FileData {
                name: "6.txt".to_string(),
                id: 6,
                ty: "txt".to_string(),
            },
        ];
        assert_eq!(actual, expected)
    }

    // every test properly creating the content dir
    fn initialize() {
        INIT.call_once(|| {
            let content_path = PathBuf::from("./content");
            let path = &content_path;
            clean_up_dir(&path).expect("expect creating content dir to succeed");
            let content_files = ["1.mp4", "2.mp4", "3.mkv", "6.txt", ".gitignore", "noext"];
            for each in content_files {
                File::create(path.join(format!("./{each}")))
                    .unwrap_or_else(|_| panic!("expect creating {} to succeed", each));
            }
            let content_path = PathBuf::from("./client-content");
            let path = &content_path;
            clean_up_dir(&path).expect("expect creating content dir to succeed");
            let mut index_file = File::create(path.join("./index.html"))
                .expect("expect creating index.html to succeed");
            index_file
                .write_all(b"<html></html>")
                .expect("expect writing to index.html to succeed");
        })
    }
}
