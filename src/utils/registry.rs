#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq)]
struct RegistryConfig {
    url: String,
    auth: String
}

#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq)]
pub struct RegistryData {
    pub id: String,
    pub address: String,
    pub port: u64
}

fn get_registry_config() -> RegistryConfig {
    let config = std::fs::read_to_string("config.json").unwrap();
    serde_json::from_str(&config).unwrap()
}

pub fn register_server(server: &RegistryData) -> Result<(), Box<dyn std::error::Error>> {
    let config = get_registry_config();
    let client = reqwest::blocking::Client::new();
    let res = client.post(format!("{}/register", config.url))
        .header("API-Key", &config.auth)
        .header("Content-Type", "application/json")
        .json(&server)
        .send()?;
    if res.status().is_success() {
        Ok(())
    } else {
        Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, "failed to register server")))
    }
}

pub fn unregister_server(server: RegistryData) -> Result<(), Box<dyn std::error::Error>> {
    let config = get_registry_config();
    let client = reqwest::blocking::Client::new();
    let res = client.delete(format!("{}/unregister", config.url))
        .header("API-Key", &config.auth)
        .header("Content-Type", "application/json")
        .json(&server)
        .send()?;
    if res.status().is_success() {
        Ok(())
    } else {
        Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, "failed to register server")))
    }
}
