use actix_web::{get, Responder, HttpResponse, HttpServer, App};

#[get("/")]
async fn hello() -> impl Responder {
    println!("Request received");
    HttpResponse::Ok().body("Pea server")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let ip = "192.168.8.176";
    HttpServer::new(|| {
        App::new().service(hello)
    }).bind((ip, 8080))?
    .run()
    .await
}
