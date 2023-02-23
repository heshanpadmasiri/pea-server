use std::{
    io::Write,
    path::{Path, PathBuf},
    process::Command,
};

fn main() {
    let client_content_dir = PathBuf::from("./client-content");
    let client_src_root = PathBuf::from("./pea-client");
    let client_config_paths = [
        client_src_root.join("src/config.json"),
        PathBuf::from("./mobile-client/config.json"),
    ];
    if Ok("release".to_owned()) == std::env::var("PROFILE") {
        for each in client_config_paths {
            create_server_config(&each);
        }
        clean_and_create_dir(&client_content_dir);
        create_and_copy_static_page(&client_src_root, &client_content_dir)
    }
}

fn clean_and_create_dir(dir_name: &Path) {
    Command::new("rm")
        .args(["-rf", &dir_name.to_string_lossy()])
        .status()
        .unwrap();
    Command::new("mkdir").args([dir_name]).status().unwrap();
}

fn create_and_copy_static_page(src: &Path, dest: &Path) {
    Command::new("npm")
        .args(["run", "build"])
        .current_dir(src)
        .status()
        .unwrap();
    let src_artifact = src.join("build/");
    Command::new("cp")
        .args([
            "-r",
            &src_artifact.to_string_lossy(),
            &dest.to_string_lossy(),
        ])
        .status()
        .unwrap();
}

fn create_server_config(config_path: &Path) {
    let url = format!("http://{}:8080", get_local_ip_address());
    let config = format!(
        r#"
    {{
        "SERVER_URL": "{url}"
    }}
    "#
    );
    let mut f = std::fs::OpenOptions::new()
        .write(true)
        .create(true)
        .open(config_path)
        .unwrap();
    f.write_all(config.as_bytes()).unwrap();
}
// copy of same function in lib
fn get_local_ip_address() -> std::net::IpAddr {
    match local_ip_address::local_ip() {
        Ok(address) => address,
        Err(_) => {
            // workaround for https://github.com/EstebanBorai/local-ip-address/issues/82
            let network_interfaces = local_ip_address::list_afinet_netifas().unwrap();

            for (name, ip) in network_interfaces.into_iter() {
                if ip.is_ipv4() && name.starts_with("en") {
                    return ip;
                }
            }
            panic!("mac os workaround failed");
        }
    }
}
