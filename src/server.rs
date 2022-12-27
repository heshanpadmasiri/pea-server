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
                println!("ignoring file {:?} not supported", file_name);
                return Ok(None);
            }
            let file_extension = file_extension.to_str().expect("file_extension will always be a valid string since we check it above");
            let mut hasher = std::collections::hash_map::DefaultHasher::new();
            file_name.hash(&mut hasher);
            let new_name = format!("{}.{}", hasher.finish(), file_extension);
            let destination = PathBuf::from(format!("./content/{}", new_name));
            tokio::fs::copy(path, destination).await?;
            Ok(Some(new_name))
        }
        None => {
            println!(
                "ignoring file {:?} due to improper file extension",
                file_name
            );
            Ok(None)
        }
    }
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
