use std::{
    env,
    net::{self, SocketAddr},
    path::PathBuf,
    thread,
    time::Duration,
    vec::IntoIter,
};

use futures_util::StreamExt as _;
use log::{debug, error, info};
use pea_server::utils::{
    get_local_ip_address,
    registry::{register_server, unregister_server, RegistryData},
    storage::{FileMetadata, Message, StorageServer},
};

struct Config {
    id: uuid::Uuid,
    address: Box<dyn net::ToSocketAddrs<Iter = IntoIter<SocketAddr>> + Send + Sync>,
    index_path: PathBuf,
}

struct ServerState {
    storage_server_transmitter: crossbeam_channel::Sender<Message>,
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    simple_logger::SimpleLogger::new()
        .with_level(log::LevelFilter::Info)
        .init()
        .unwrap();
    let discovery_enable = std::env::args().any(|each| each == "--discovery");
    let index_path =
        std::env::args()
            .nth(1)
            .or_else(|| {
                Some(env::var("PEA_INDEX_FILE").expect(
                    "failed to read PEA_INDEX_FILE env var and no index file path was given",
                ))
            })
            .map(PathBuf::from)
            .unwrap();
    let address = Box::new(
        std::env::args()
            .nth(2)
            .unwrap_or_else(|| SocketAddr::from((get_local_ip_address(), 8080)).to_string()),
    );
    info!("trying to run server on address: http://{address}");
    let id = uuid::Uuid::new_v4();
    let config = Config {
        address,
        index_path,
        id,
    };
    let register_data = if discovery_enable {
        Some(RegistryData::from(&config))
    } else {
        None
    };
    let tx = StorageServer::initialize(&config.index_path);
    tokio::spawn(async move {
        create_and_run_server(config, tx.clone())
            .expect("server creation should not fail")
            .await
            .expect("server running should not fail");
    });
    if let Some(server) = &register_data {
        register_server(server).expect("expect server registration to succeed");
    }
    let input_handler = thread::spawn(|| {
        input_listener(register_data);
    });
    input_handler.join().expect("input handler should not fail");
    Ok(())
}

fn input_listener(registry_data: Option<RegistryData>) {
    println!("Enter q to shutdown server");
    loop {
        if crossterm::event::poll(Duration::from_millis(1000)).expect("polling should not fail") {
            if let crossterm::event::Event::Key(event) =
                crossterm::event::read().expect("reading key event should not fail")
            {
                if event.code == crossterm::event::KeyCode::Char('q') {
                    break;
                }
            }
        }
    }
    shutdown_server(registry_data);
}

fn shutdown_server(server: Option<RegistryData>) {
    debug!("unregistering server");
    if let Some(server) = server {
        unregister_server(server).expect("unregistering server should not fail");
    }
    debug!("starting shutdown");
    std::process::exit(0);
}

fn create_and_run_server(
    config: Config,
    storage_server_transmitter: crossbeam_channel::Sender<Message>,
) -> std::io::Result<actix_web::dev::Server> {
    info!("starting server at: {:?}", config.address.to_socket_addrs());
    let server_state = actix_web::web::Data::new(ServerState {
        storage_server_transmitter,
    });
    let server = actix_web::HttpServer::new(move || {
        let cors = actix_cors::Cors::permissive();
        actix_web::App::new()
            .app_data(server_state.clone())
            .wrap(cors)
            .route("/", actix_web::web::get().to(index))
            .route("/files", actix_web::web::get().to(get_files))
            .route("/tags", actix_web::web::get().to(get_tags))
            .route("/file", actix_web::web::post().to(post_file))
            .route("/files/{type}", actix_web::web::get().to(get_file_by_type))
            .route("/query", actix_web::web::post().to(get_files_by_tags))
            .service(
                actix_web::web::resource("/content/{file_name}")
                    .route(actix_web::web::get().to(get_content)),
            )
            .service(
                actix_files::Files::new(
                    "/static",
                    PathBuf::from(
                        env::var("PEA_CLIENT_CONTENT_DIR")
                            .expect("make sure PEA_CLIENT_CONTENT_DIR is set"),
                    )
                    .join("static"),
                )
                .show_files_listing(),
            )
    })
    .bind(config.address.as_ref())?;
    Ok(server.run())
}

impl From<&Config> for RegistryData {
    fn from(config: &Config) -> Self {
        let address = config.address.to_socket_addrs().unwrap().next().unwrap();
        Self {
            id: config.id.to_string(),
            address: address.ip().to_string(),
            port: address.port() as u64,
        }
    }
}

async fn index(_req: actix_web::HttpRequest) -> actix_web::Result<actix_files::NamedFile> {
    let path: PathBuf = PathBuf::from(
        env::var("PEA_CLIENT_CONTENT_DIR").expect("make sure PEA_CLIENT_CONTENT_DIR is set"),
    )
    .join("index.html");
    Ok(actix_files::NamedFile::open(path)?)
}

type State = actix_web::web::Data<ServerState>;

async fn get_files(state: State) -> actix_web::HttpResponse {
    info!("get file request received");
    let storage_tx = &state.storage_server_transmitter.clone();
    let (tx, rx) = crossbeam_channel::bounded(1);
    if storage_tx.send(Message::GetAllFiles(tx)).is_err() {
        error!("failed to send get all files to storage server");
        return actix_web::HttpResponse::InternalServerError().finish();
    }
    match rx.recv() {
        Ok(files) => {
            let body = serde_json::to_string(&files).unwrap();
            actix_web::HttpResponse::Ok()
                .content_type("application/json")
                .body(body)
        }
        Err(_) => {
            error!("failed to receive files from storage server");
            actix_web::HttpResponse::InternalServerError().finish()
        }
    }
}

async fn get_tags(state: State) -> actix_web::HttpResponse {
    info!("get tags request received");
    let storage_tx = &state.storage_server_transmitter.clone();
    let (tx, rx) = crossbeam_channel::bounded(1);
    if storage_tx.send(Message::GetAllTags(tx)).is_err() {
        error!("failed to send get all tags to storage server");
        return actix_web::HttpResponse::InternalServerError().finish();
    }
    match rx.recv() {
        Ok(tags) => {
            let body = serde_json::to_string(&tags).unwrap();
            actix_web::HttpResponse::Ok()
                .content_type("application/json")
                .body(body)
        }
        Err(_) => {
            error!("failed to receive files from storage server");
            actix_web::HttpResponse::InternalServerError().finish()
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq)]
struct TagQueryData {
    // if ty is "" then it is ignored
    ty: String,
    tags: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq)]
struct TagQuery {
    data: TagQueryData,
}

async fn get_files_by_tags(
    query: actix_web::web::Json<TagQuery>,
    state: State,
) -> actix_web::HttpResponse {
    let data = &query.data;
    info!("get files by request received with query: {:?}", &data);
    let storage_tx = &state.storage_server_transmitter.clone();
    let (tx, rx) = crossbeam_channel::bounded(1);
    if storage_tx
        .send(Message::GetFilesOfTags(data.tags.clone(), tx))
        .is_err()
    {
        error!("failed to send get files of tags to storage server");
        return actix_web::HttpResponse::InternalServerError().finish();
    }
    match rx.recv() {
        Ok(files) => {
            let files = if data.ty.is_empty() {
                files
            } else {
                files
                    .into_iter()
                    .filter(|file| file.ty == data.ty)
                    .collect()
            };
            let file_data: Vec<FileData> = files.into_iter().map(|f| f.into()).collect();
            let body = serde_json::to_string(&file_data).unwrap();
            actix_web::HttpResponse::Ok()
                .content_type("application/json")
                .body(body)
        }
        Err(_) => {
            error!("failed to receive files from storage server");
            actix_web::HttpResponse::InternalServerError().finish()
        }
    }
}

async fn post_file(
    mut payload: actix_multipart::Multipart,
    state: State,
) -> actix_web::Result<actix_web::HttpResponse> {
    while let Some(item) = payload.next().await {
        info!("post file request received");
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
                info!("creating {} with size {} bytes", file_name, content.len());
                let storage_tx = &state.storage_server_transmitter.clone();
                let (tx, rx) = crossbeam_channel::bounded(1);
                if storage_tx
                    .send(Message::CreateFile(file_name, content, tx))
                    .is_err()
                {
                    error!("failed to send create file to storage server");
                    return Ok(actix_web::HttpResponse::InternalServerError().into());
                }
                match rx.recv() {
                    Ok(result) => match result {
                        Ok(_) => {
                            info!("file created successfully");
                        }
                        Err(e) => {
                            error!("failed to create file: {}", e);
                            return Ok(actix_web::HttpResponse::InternalServerError().into());
                        }
                    },
                    Err(_) => {
                        error!("failed to receive create file response from storage server");
                        return Ok(actix_web::HttpResponse::InternalServerError().into());
                    }
                }
            }
        }
    }
    Ok(actix_web::HttpResponse::Ok().into())
}

async fn get_file_by_type(
    path: actix_web::web::Path<String>,
    state: State,
) -> actix_web::HttpResponse {
    let file_type = path.into_inner();
    info!("get file by type request received: {}", file_type);
    let storage_tx = &state.storage_server_transmitter.clone();
    let (tx, rx) = crossbeam_channel::bounded(1);
    if storage_tx
        .send(Message::GetFilesOfType(file_type, tx))
        .is_err()
    {
        error!("failed to send get files of tags to storage server");
        return actix_web::HttpResponse::InternalServerError().finish();
    }
    match rx.recv() {
        Ok(files) => {
            let files: Vec<FileData> = files.into_iter().map(|each| each.into()).collect();
            let body = serde_json::to_string(&files).unwrap();
            actix_web::HttpResponse::Ok()
                .content_type("application/json")
                .body(body)
        }
        Err(_) => {
            error!("failed to receive files from storage server");
            actix_web::HttpResponse::InternalServerError().finish()
        }
    }
}

async fn get_content(
    req: actix_web::HttpRequest,
    state: State,
) -> actix_web::Result<actix_files::NamedFile> {
    let file_name: String = req.match_info().query("file_name").parse().unwrap();
    let file_id = file_name.trim().parse::<u64>().unwrap();
    info!("get file request received: {}", file_name);
    let storage_tx = &state.storage_server_transmitter.clone();
    let (tx, rx) = crossbeam_channel::bounded(1);
    if storage_tx.send(Message::GetFilePath(file_id, tx)).is_err() {
        error!("failed to send get files of tags to storage server");
        return Err(actix_web::error::ErrorBadRequest(
            "failed to send get files of tags to storage server",
        ));
    }
    match rx.recv() {
        Ok(result) => match result {
            Ok(path) => Ok(actix_files::NamedFile::open(path)?),
            Err(e) => {
                error!("failed to get file path: {}", e);
                Err(actix_web::error::ErrorBadRequest("failed to get file path"))
            }
        },
        Err(_) => {
            error!("failed find a file with the given id");
            Err(actix_web::error::ErrorBadRequest(
                "failed find a file with the given id",
            ))
        }
    }
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct FileUpload {
    name: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq)]
struct FileData {
    name: String,
    id: String,
    ty: String,
    tags: Vec<String>,
}

impl From<FileMetadata> for FileData {
    fn from(value: FileMetadata) -> Self {
        let tags = match value.tags {
            Some(tags) => tags,
            None => Vec::new(),
        };
        Self {
            name: value.name,
            id: value.id.to_string(),
            ty: value.ty,
            tags,
        }
    }
}

#[cfg(test)]
mod tests {
    use std::{
        env,
        fs::File,
        io::{Read, Write},
        path::PathBuf,
    };

    use crate::{
        create_and_run_server, get_file_by_type, get_files_by_tags, get_tags, index, post_file,
        Config, FileData, ServerState, TagQuery, TagQueryData,
    };
    use actix_web::{
        http::header::{self, ContentType, HeaderMap},
        test,
        web::{self, Bytes},
        App,
    };
    use pea_server::utils::storage::{clean_up_dir, FileIndex, FileMetadata, StorageServer};
    use std::sync::Once;

    static INIT: Once = Once::new();
    const TEST_INDEX: &str = "test_index.json";

    #[tokio::test]
    async fn can_start_server() {
        initialize();
        tokio::spawn(async move {
            let config = Config {
                id: uuid::Uuid::new_v4(),
                address: Box::new(format!("localhost:{}", 5000)),
                index_path: PathBuf::from(TEST_INDEX),
            };
            let tx = StorageServer::initialize(&config.index_path);
            create_and_run_server(config, tx)
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
        let server = test::init_service(
            App::new()
                .app_data(actix_web::web::Data::new(ServerState {
                    storage_server_transmitter: StorageServer::initialize(&PathBuf::from(
                        TEST_INDEX,
                    )),
                }))
                .route("/file", web::post().to(post_file)),
        )
        .await;
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
        let index = FileIndex::new(&PathBuf::from(TEST_INDEX));
        let indexed_files: Vec<String> = index.files().into_iter().map(|each| each.name).collect();
        for (file_name, content) in expected {
            let file_path =
                PathBuf::from(env::var("PEA_RECEIVED_FILES_DIR").unwrap()).join(file_name);
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
        std::fs::remove_file(TEST_INDEX).expect("expect deleting index to succeed");
    }

    #[actix_web::test]
    async fn can_get_files_by_type() {
        initialize();
        let test_index_path = PathBuf::from("./get_files_by_index_test.json");
        let files = vec![
            FileMetadata {
                name: "1.txt".to_string(),
                id: 1,
                ty: "txt".to_string(),
                path: PathBuf::from("./dummy-file/1.txt"),
                tags: None,
            },
            FileMetadata {
                name: "2.mp4".to_string(),
                id: 2,
                ty: "mp4".to_string(),
                path: PathBuf::from("./dummy-file/2.mp4"),
                tags: None,
            },
        ];
        let body = serde_json::to_string_pretty(&files).unwrap();
        std::fs::write(&test_index_path, body).expect("expect creating index file to succeed");
        let server = test::init_service(
            App::new()
                .app_data(actix_web::web::Data::new(ServerState {
                    storage_server_transmitter: StorageServer::initialize(&test_index_path),
                }))
                .route("/files/{type}", web::get().to(get_file_by_type)),
        )
        .await;
        let request = test::TestRequest::get().uri("/files/txt").to_request();
        let response = test::call_service(&server, request).await;
        assert!(response.status().is_success());
        let response_body: Vec<FileData> = test::read_body_json(response).await;
        assert_eq!(
            response_body,
            vec![FileData {
                name: "1.txt".to_string(),
                id: 1.to_string(),
                ty: "txt".to_string(),
                tags: vec![]
            },]
        );
        std::fs::remove_file(test_index_path).expect("expect cleaning test index file to succeed");
    }

    #[actix_web::test]
    async fn can_get_all_tags() {
        initialize();
        let test_index_path = PathBuf::from("./get_all_tags.json");
        let files = vec![
            FileMetadata {
                name: "1.txt".to_string(),
                id: 1,
                ty: "txt".to_string(),
                path: PathBuf::from("./dummy-file/1.txt"),
                tags: Some(vec!["tag1".to_string(), "tag2".to_string()]),
            },
            FileMetadata {
                name: "2.mp4".to_string(),
                id: 2,
                ty: "mp4".to_string(),
                path: PathBuf::from("./dummy-file/2.mp4"),
                tags: Some(vec![
                    "tag1".to_string(),
                    "tag4".to_string(),
                    "tag3".to_string(),
                ]),
            },
        ];
        let body = serde_json::to_string_pretty(&files).unwrap();
        std::fs::write(&test_index_path, body).expect("expect creating index file to succeed");
        let server = test::init_service(
            App::new()
                .app_data(actix_web::web::Data::new(ServerState {
                    storage_server_transmitter: StorageServer::initialize(&test_index_path),
                }))
                .route("/tags", web::get().to(get_tags)),
        )
        .await;
        let request = test::TestRequest::get().uri("/tags").to_request();
        let response = test::call_service(&server, request).await;
        assert!(response.status().is_success());
        let mut response_body: Vec<String> = test::read_body_json(response).await;
        response_body.sort();
        let expected = vec![
            "tag1".to_string(),
            "tag2".to_string(),
            "tag3".to_string(),
            "tag4".to_string(),
        ];
        assert_eq!(response_body, expected);
        std::fs::remove_file(test_index_path).expect("expect cleaning test index file to succeed");
    }

    #[actix_web::test]
    async fn can_query_files_by_tags() {
        initialize();
        let test_index_path = PathBuf::from("./query_files_with_tags.json");
        let files = vec![
            FileMetadata {
                name: "1.txt".to_string(),
                id: 1,
                ty: "txt".to_string(),
                path: PathBuf::from("./dummy-file/1.txt"),
                tags: Some(vec!["tag1".to_string(), "tag2".to_string()]),
            },
            FileMetadata {
                name: "2.mp4".to_string(),
                id: 2,
                ty: "mp4".to_string(),
                path: PathBuf::from("./dummy-file/2.mp4"),
                tags: Some(vec![
                    "tag1".to_string(),
                    "tag2".to_string(),
                    "tag3".to_string(),
                    "tag4".to_string(),
                ]),
            },
            FileMetadata {
                name: "3.mp4".to_string(),
                id: 3,
                ty: "mp4".to_string(),
                path: PathBuf::from("./dummy-file/2.mp4"),
                tags: Some(vec!["tag1".to_string()]),
            },
        ];
        let body = serde_json::to_string_pretty(&files).unwrap();
        std::fs::write(&test_index_path, body).expect("expect creating index file to succeed");

        let server = test::init_service(
            App::new()
                .app_data(actix_web::web::Data::new(ServerState {
                    storage_server_transmitter: StorageServer::initialize(&test_index_path),
                }))
                .route("/query", web::post().to(get_files_by_tags)),
        )
        .await;

        let query = TagQuery {
            data: TagQueryData {
                ty: "mp4".to_string(),
                tags: vec!["tag1".to_string(), "tag2".to_string()],
            },
        };
        let request = test::TestRequest::post()
            .uri("/query")
            .set_json(query)
            .to_request();
        let response = test::call_service(&server, request).await;
        assert!(response.status().is_success());
        let response_body: Vec<FileData> = test::read_body_json(response).await;
        let mut res_files = response_body
            .into_iter()
            .map(|each| each.name)
            .collect::<Vec<String>>();
        res_files.sort();
        let expected = vec!["2.mp4".to_string()];
        assert_eq!(res_files, expected);

        let query = TagQuery {
            data: TagQueryData {
                ty: "".to_string(),
                tags: vec!["tag1".to_string(), "tag2".to_string()],
            },
        };
        let request = test::TestRequest::post()
            .uri("/query")
            .set_json(query)
            .to_request();
        let response = test::call_service(&server, request).await;
        assert!(response.status().is_success());
        let response_body: Vec<FileData> = test::read_body_json(response).await;
        let mut res_files = response_body
            .into_iter()
            .map(|each| each.name)
            .collect::<Vec<String>>();
        res_files.sort();
        let expected = vec!["1.txt".to_string(), "2.mp4".to_string()];
        assert_eq!(res_files, expected);

        std::fs::remove_file(test_index_path).expect("expect cleaning test index file to succeed");
    }
    // every test properly creating the content dir
    fn initialize() {
        INIT.call_once(|| {
            let content_path = PathBuf::from(env::var("PEA_CLIENT_CONTENT_DIR").unwrap());
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
