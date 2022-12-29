use std::{
    hash::{Hash, Hasher},
    net::{self, SocketAddr},
    path::{Path, PathBuf},
    vec::IntoIter,
};

use actix_files as fs;
use actix_web::{web, App, HttpRequest, HttpServer};
use fs::NamedFile;
use pea_server::log_normal;
use tokio::{fs::File, io::AsyncWriteExt};

struct Config {
    address: Box<dyn net::ToSocketAddrs<Iter = IntoIter<SocketAddr>>>,
    content_root: PathBuf,
}

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
    generate_static_page(&config).await?;
    create_and_run_server(&config).await
}

async fn generate_static_page(config: &Config) -> std::io::Result<()> {
    let content_path = PathBuf::from("./content");
    log_normal(&format!(
        "using :{} as the content directory",
        content_path.to_string_lossy()
    ));
    if content_path.exists() {
        std::fs::remove_dir_all(&content_path)?;
    }
    std::fs::create_dir(&content_path)?;
    log_normal("starting content generation");
    let content_files = generate_content(&config.content_root).await?;
    log_normal(&format!(
        "content generation completed with {} files",
        content_files.len()
    ));
    let video_tags: Vec<String> = content_files
        .iter()
        .map(|file_name| {
            format!(
                r#"
            <video controls width="320" height="240">
                <source src="/content/{}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        "#,
                file_name
            )
        })
        .collect();
    let content_section = video_tags.join("\n");
    let body = format!(
        r#"
    <!DOCTYPE html>
    <html>
        <head>
            <title>Pea server</title>
        </head>
        <body>

            <h1>Pea server debug</h1>
            {content_section}
        </body>
    </html>
    "#
    );
    let mut file = File::create(content_path.join("./index.html")).await?;
    file.write_all(body.as_bytes()).await?;
    Ok(())
}

async fn generate_content(content_root: &Path) -> Result<Vec<String>, std::io::Error> {
    let mut content_files = Vec::new();
    for path in std::fs::read_dir(content_root)
        .expect("expect iteration over content root to work")
        .flatten()
    {
        if let Some(file_name) = add_file_to_content(&path.path()).await? {
            content_files.push(file_name);
        }
    }
    Ok(content_files)
}

async fn add_file_to_content(path: &Path) -> Result<Option<String>, std::io::Error> {
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
            let destination = PathBuf::from(format!("./content/{}", new_name));
            tokio::fs::copy(path, destination).await?;
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

async fn create_and_run_server(config: &Config) -> std::io::Result<()> {
    log_normal(&format!("starting server at: {:?}", config.address.to_socket_addrs()));
    HttpServer::new(move || {
        App::new()
            .route("/", web::get().to(index))
            .service(fs::Files::new("/content", "./content").show_files_listing())
    })
    .bind(config.address.as_ref())?
    .run()
    .await
}

async fn index(_req: HttpRequest) -> actix_web::Result<NamedFile> {
    let path: PathBuf = "./content/index.html".parse().unwrap();
    Ok(NamedFile::open(path)?)
}
