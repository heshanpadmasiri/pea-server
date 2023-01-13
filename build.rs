use std::{path::PathBuf, process::Command};

fn main() {
    let client_content_dir = "client-content";
    let content_dir = "content";

    let local_ip = get_local_ip_address();

    clean_and_create_dir(client_content_dir);
    clean_and_create_dir(content_dir);
    create_and_copy_static_page("pea-client", client_content_dir)
}

fn clean_and_create_dir(dir_name: &str) {
    Command::new("rm")
        .args(["-rf", &format!("./{}", dir_name)])
        .status()
        .unwrap();
    Command::new("mkdir").args([dir_name]).status().unwrap();
}

fn create_and_copy_static_page(src: &str, dest: &str) {
    Command::new("npm")
        .args(["run", "build"])
        .current_dir(PathBuf::from(format!("./{}", src)))
        .status()
        .unwrap();
    Command::new("cp")
        .args(["-r", &format!("./{}/build/", src), &format!("./{}", dest)])
        .status()
        .unwrap();
}

// copy of same function in lib
fn get_local_ip_address() -> std::net::IpAddr {
     match local_ip_address::local_ip() {
            Ok(address) => {
                address
            }
            Err(_) => {
                // workaround for https://github.com/EstebanBorai/local-ip-address/issues/82
                let network_interfaces = local_ip_address::list_afinet_netifas().unwrap();

                for (name, ip) in network_interfaces.into_iter() {
                    if ip.is_ipv4() && name.starts_with("en"){
                        return ip;
                    }
                }
                panic!("mac os workaround failed");
            }
     }
}
