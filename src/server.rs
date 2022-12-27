use std::{path::PathBuf};

use actix_files as fs;
use actix_web::{get, App, HttpResponse, HttpServer, Responder};

struct Config {
    address: (String, u16),
    content_root: PathBuf,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            address: ("192.168.8.176".to_string(), 8080),
            content_root: PathBuf::from("./content"),
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = Config::default();
    create_and_run_server(config).await
}

async fn create_and_run_server(config: Config) -> std::io::Result<()> {
    HttpServer::new(move || {
        App::new().service(root).service(
            fs::Files::new(
                "/files",
                config
                    .content_root
                    .to_str()
                    .expect("expect content root path to be valid string"),
            )
            .show_files_listing(),
        )
    })
    .bind(config.address)?
    .run()
    .await
}

#[get("/")]
async fn root() -> impl Responder {
    println!("Request received");
    HttpResponse::Ok().body(test_body())
}

fn test_body() -> String {
    r#"
    <!DOCTYPE html>
    <html>
        <head>
            <title>Pea server</title>
        </head>
        <body>

            <h1>Pea server debug</h1>
            <video controls width="320" height="240">
                <source src="/files/11869_1080.mp4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </body>
    </html>
    "#
    .to_string()
}
