use std::{
    net::{self, SocketAddr},
    path::PathBuf,
    time::Duration,
    vec::IntoIter,
};

use futures_util::StreamExt as _;
use pea_server::utils::{
    get_local_ip_address,
    log::{log_debug, log_normal, terminal_message},
    storage::{create_file, FileIndex, FileMetadata},
};

struct Config {
    address: Box<dyn net::ToSocketAddrs<Iter = IntoIter<SocketAddr>> + Send + Sync>,
}

const SERVER_CONTENT: &str = "./content/index.json";

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let address = Box::new(
        std::env::args()
            .nth(1)
            .unwrap_or_else(|| SocketAddr::from((get_local_ip_address(), 8080)).to_string()),
    );
    log_normal(&format!(
        "trying to run server on address: http://{address}"
    ));
    let config = Config { address };
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
    log_debug("starting shutdown");
    std::process::exit(0);
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
            .route("/file", actix_web::web::post().to(post_file))
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
    let files = all_files();
    let body = serde_json::to_string(&files).unwrap();
    actix_web::HttpResponse::Ok()
        .content_type("application/json")
        .body(body)
}

async fn post_file(
    mut payload: actix_multipart::Multipart,
) -> actix_web::Result<actix_web::HttpResponse> {
    let mut index = FileIndex::new(&PathBuf::from(SERVER_CONTENT));
    while let Some(item) = payload.next().await {
        let mut field = item?;
        let content_disposition = field.content_disposition();
        match content_disposition.get_filename() {
            None => {
                return Ok(actix_web::HttpResponse::Forbidden().into());
            }
            Some(file_name) => {
                let mut content: Vec<u8> = Vec::new();
                let file_name = file_name.to_string();
                while let Some(chunk) = field.next().await {
                    for each in chunk? {
                        content.push(each);
                    }
                }
                if create_file(&mut index, file_name, &content).is_err() {
                    return Ok(actix_web::HttpResponse::InternalServerError().into());
                }
            }
        }
    }
    Ok(actix_web::HttpResponse::Ok().into())
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct FileUpload {
    name: String,
}

async fn get_content(req: actix_web::HttpRequest) -> actix_web::Result<actix_files::NamedFile> {
    let file_name: String = req.match_info().query("file_name").parse().unwrap();
    let file_id = file_name.trim().parse::<u64>().unwrap();
    let index = FileIndex::new(&PathBuf::from(SERVER_CONTENT));
    let file_path = index.get_file_path(file_id).unwrap();
    Ok(actix_files::NamedFile::open(file_path)?)
}

#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq)]
struct FileData {
    name: String,
    id: String,
    ty: String,
}

impl From<FileMetadata> for FileData {
    fn from(value: FileMetadata) -> Self {
        Self {
            name: value.name,
            id: value.id.to_string(),
            ty: value.ty,
        }
    }
}

fn all_files() -> Vec<FileData> {
    let index = FileIndex::new(&PathBuf::from(SERVER_CONTENT));
    index.files().into_iter().map(|each| each.into()).collect()
}

#[cfg(test)]
mod tests {
    use std::{
        fs::File,
        io::{Read, Write},
        path::PathBuf,
    };

    use crate::{create_and_run_server, index, post_file, Config, SERVER_CONTENT};
    use actix_web::{
        http::header::{self, ContentType, HeaderMap},
        test,
        web::{self, Bytes},
        App,
    };
    use pea_server::utils::storage::{clean_up_dir, FileIndex};
    use std::sync::Once;

    static INIT: Once = Once::new();

    #[tokio::test]
    async fn can_start_server() {
        initialize();
        tokio::spawn(async move {
            let config = Config {
                address: Box::new(format!("localhost:{}", 5000)),
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
    async fn can_upload_files() {
        initialize();
        // TODO: send an actual file
        let server = test::init_service(App::new().route("/file", web::post().to(post_file))).await;
        let bytes = Bytes::from(
            "testasdadsad\r\n\
             --abbc761f78ff4d7cb7573b5a23f96ef0\r\n\
             Content-Disposition: form-data; name=\"file\"; filename=\"f1.txt\"\r\n\
             Content-Type: text/plain; charset=utf-8\r\nContent-Length: 4\r\n\r\n\
             test\r\n\
             --abbc761f78ff4d7cb7573b5a23f96ef0\r\n\
             Content-Disposition: form-data; name=\"file\"; filename=\"f2.txt\"\r\n\
             Content-Type: text/plain; charset=utf-8\r\nContent-Length: 4\r\n\r\n\
             data\r\n\
             --abbc761f78ff4d7cb7573b5a23f96ef0--\r\n",
        );
        let mut headers = HeaderMap::new();
        headers.insert(
            header::CONTENT_TYPE,
            header::HeaderValue::from_static(
                "multipart/mixed; boundary=\"abbc761f78ff4d7cb7573b5a23f96ef0\"",
            ),
        );
        let mut request = test::TestRequest::post().uri("/file").set_payload(bytes);
        for (k, v) in headers {
            request = request.insert_header((k, v));
        }
        let request = request.to_request();
        let resp = test::call_service(&server, request).await;
        assert!(resp.status().is_success());
        let expected = [("f1.txt", "test"), ("f2.txt", "data")];
        let index = FileIndex::new(&PathBuf::from(SERVER_CONTENT));
        let indexed_files: Vec<String> = index.files().into_iter().map(|each| each.name).collect();
        for (file_name, content) in expected {
            let file_path = PathBuf::from("./recieved").join(file_name);
            let mut file = std::fs::File::open(&file_path).expect("expect file to exist");
            let mut actual = Vec::new();
            file.read_to_end(&mut actual)
                .expect("expect file reading to succeed");
            assert_eq!(actual, content.as_bytes());
            std::fs::remove_file(file_path).expect("expect deleting file to succeed");
            assert!(indexed_files
                .iter()
                .any(|name| { name == &file_name.to_string() }));
        }
        std::fs::remove_file("./content/index.json").expect("expect deleting index to succeed");
    }

    // every test properly creating the content dir
    fn initialize() {
        INIT.call_once(|| {
            let content_path = PathBuf::from("./client-content");
            let path = &content_path;
            clean_up_dir(path).expect("expect creating content dir to succeed");
            let mut index_file = File::create(path.join("./index.html"))
                .expect("expect creating index.html to succeed");
            index_file
                .write_all(b"<html></html>")
                .expect("expect writing to index.html to succeed");
        })
    }
}
