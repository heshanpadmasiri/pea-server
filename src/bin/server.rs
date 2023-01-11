use std::{
    hash::{Hash, Hasher},
    net::{self, SocketAddr},
    path::{Path, PathBuf},
    vec::IntoIter,
};

use actix_cors::Cors;
use actix_files as fs;
use actix_web::{dev::Server, web, App, HttpResponse, HttpServer};
use pea_server::{log_normal, copy_files};
use serde::{Deserialize, Serialize};

struct Config {
    address: Box<dyn net::ToSocketAddrs<Iter = IntoIter<SocketAddr>> + Send + Sync>,
    content_root: PathBuf,
}

const SERVER_CONTENT: &str = "./content";

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let address = Box::new(
        std::env::args()
            .nth(1)
            .unwrap_or_else(|| "192.168.8.176:8080".to_string()),
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
    generate_static_content(&config)?;
    create_and_run_server(&config)?.await
}

fn generate_static_content(config: &Config) -> std::io::Result<()> {
    let content_path = PathBuf::from(SERVER_CONTENT);
    log_normal(&format!(
        "using :{} as the content directory",
        content_path.to_string_lossy()
    ));
    if content_path.exists() {
        std::fs::remove_dir_all(&content_path)?;
    }
    std::fs::create_dir(&content_path)?;
    log_normal("starting content generation");
    let content_files = generate_content(&config.content_root)?;
    log_normal(&format!(
        "content generation completed with {} files",
        content_files.len()
    ));
    let index_content = PathBuf::from("./pea-client/build/");
    copy_index_content(&index_content)?;
    Ok(())
}

fn copy_index_content(index_content_path: &Path) -> std::io::Result<()> {
    if !index_content_path.exists() && !index_content_path.is_dir() {
        panic!("failed to find index content directory at {}", index_content_path.to_string_lossy());
    }
    let destination = PathBuf::from(format!("{SERVER_CONTENT}/"));
    for path in std::fs::read_dir(index_content_path)
        .expect("expect iteration over content root to work")
        .flatten()
    {
        copy_files(&path.path(), &destination )?;
    }
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
            if file_extension != "mp4" {
                log_normal(&format!("ignoring file {:?} not supported", file_name));
                return Ok(None);
            }
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

fn create_and_run_server(config: &Config) -> std::io::Result<Server> {
    log_normal(&format!(
        "starting server at: {:?}",
        config.address.to_socket_addrs()
    ));
    let server = HttpServer::new(move || {
        let cors = Cors::permissive();
        App::new()
            .wrap(cors)
            .route("/files", web::get().to(get_files))
            .service(fs::Files::new("/content", "./content").show_files_listing())
    })
    .bind(config.address.as_ref())?;
    Ok(server.run())
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct FileData {
    name: String,
    id: u64,
    ty: String,
}

async fn get_files() -> HttpResponse {
    let files = get_all_files();
    let body = serde_json::to_string(&files).unwrap();
    HttpResponse::Ok()
        .content_type("application/json")
        .body(body)
}

fn get_all_files() -> Vec<FileData> {
    let mut files = vec![];
    for path in std::fs::read_dir(PathBuf::from(SERVER_CONTENT))
        .expect("expect iteration over server content to work")
        .flatten()
        .map(|each| each.path())
    {
        if path.is_file()
            && path
                .extension()
                .expect("expect valid file extension")
                .to_string_lossy()
                == "mp4"
        {
            files.push(file_data(&path));
        }
    }
    files
}

fn file_data(path: &Path) -> FileData {
    let name = path
        .file_name()
        .expect("expect filename")
        .to_str()
        .expect("expect valid file name")
        .to_string();
    let id = path
        .file_stem()
        .expect("expect file stem")
        .to_str()
        .expect("expect valid file name")
        .parse::<u64>()
        .unwrap();
    let ty = path
        .extension()
        .expect("expect valid file extension")
        .to_str()
        .expect("expect properly formatted extension")
        .to_string();
    FileData { name, id, ty }
}

#[cfg(test)]
mod tests {
    use std::{fs::File, path::PathBuf};

    use crate::{create_and_run_server, get_files, Config, FileData};
    use actix_web::{
        body::to_bytes,
        http::{self},
    };
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
    async fn can_get_files() {
        initialize();
        let resp = get_files().await;
        assert_eq!(resp.status(), http::StatusCode::OK);
        let actual = to_bytes(resp.into_body()).await.unwrap();
        let actual: Vec<FileData> = serde_json::from_slice(&actual).unwrap();

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
        ];
        assert_eq!(actual, expected)
    }

    // FIXME: once we have the proper client building pipeline that needs to be triggered before,
    // every test properly creating the content dir
    fn initialize() {
        INIT.call_once(|| {
            let content_path = PathBuf::from("./content");
            let path = &content_path;
            if path.exists() {
                std::fs::remove_dir_all(path).expect("expect cleaning up content dir to succeed");
            }
            std::fs::create_dir(path).expect("expect creating content dir to succeed");
            let content_files = ["1.mp4", "2.mp4", "3.mkv", "6.txt"];
            for each in content_files {
                File::create(path.join(format!("./{each}")))
                    .unwrap_or_else(|_| panic!("expect creating {} to succeed", each));
            }
        })
    }
}
