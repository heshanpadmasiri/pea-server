use actix_files as fs;
use actix_web::{get, App, HttpResponse, HttpServer, Responder};

#[get("/")]
async fn hello() -> impl Responder {
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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let ip = "192.168.8.176";
    HttpServer::new(|| {
        App::new()
            .service(hello)
            .service(fs::Files::new("/files", "./files").show_files_listing())
    })
    .bind((ip, 8080))?
    .run()
    .await
}
