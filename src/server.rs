use std::{
    hash::{Hash, Hasher},
    path::{Path, PathBuf},
};

use actix_files as fs;
use actix_web::{web, App, HttpRequest, HttpServer};
use fs::NamedFile;
use tokio::{fs::File, io::AsyncWriteExt};

struct Config {
    address: (String, u16),
    content_root: PathBuf,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            address: ("192.168.8.176".to_string(), 8080),
            content_root: PathBuf::from("./files"),
        }
    }
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let config = Config::default();
    generate_static_page(&config).await?;
    create_and_run_server(&config).await
}

async fn generate_static_page(config: &Config) -> std::io::Result<()> {
    let content_path = PathBuf::from("./content");
    if content_path.exists() {
        std::fs::remove_dir_all("./content")?;
    }
    std::fs::create_dir("./content")?;
    let content_files = generate_content(&config.content_root).await?;
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
    let mut file = File::create("./content/index.html").await?;
    file.write_all(body.as_bytes()).await?;
    Ok(())
}

async fn generate_content(content_root: &Path) -> Result<Vec<String>, std::io::Error> {
    let mut content_files = Vec::new();
    for path in std::fs::read_dir(content_root)
        .expect("expect iteration over content root to work")
        .flatten()
    {
        content_files.push(add_file_to_content(&path.path()).await?);
    }
    Ok(content_files)
}

async fn add_file_to_content(path: &Path) -> Result<String, std::io::Error> {
    let path_as_lossy_str = path.to_string_lossy();
    let file_name = path.file_stem().unwrap_or_else(|| {
        panic!(
            "expect file name extraction not to fail for file {}",
            path_as_lossy_str
        )
    });
    let file_extension = path
        .extension()
        .unwrap_or_else(|| {
            panic!(
                "expect to have proper extension for file {}",
                path_as_lossy_str
            )
        })
        .to_str()
        .unwrap_or_else(|| panic!("expect a valid extension for file {}", path_as_lossy_str));
    if file_extension != "mp4" {
        panic!("only mp4 files supported");
    }
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    file_name.hash(&mut hasher);
    let new_name = format!("{}.{}", hasher.finish(), file_extension);
    let destination = PathBuf::from(format!("./content/{}", new_name));
    tokio::fs::copy(path, destination).await?;
    Ok(new_name)
}

async fn create_and_run_server(config: &Config) -> std::io::Result<()> {
    HttpServer::new(move || {
        App::new()
            .route("/", web::get().to(index))
            .service(fs::Files::new("/content", "./content").show_files_listing())
    })
    .bind(config.address.clone())?
    .run()
    .await
}

async fn index(_req: HttpRequest) -> actix_web::Result<NamedFile> {
    let path: PathBuf = "./content/index.html".parse().unwrap();
    Ok(NamedFile::open(path)?)
}
