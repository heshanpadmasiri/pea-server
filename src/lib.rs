use std::path::Path;

pub fn log_normal(message: &str) {
    println!("{}", message);
}

pub fn log_debug(message: &str) {
    println!("DEBUG: {}", message);
}

pub fn terminal_message(message: &str) {
    print!("{}", message);
}

pub fn get_local_ip_address() -> std::net::IpAddr {
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

pub fn copy_files(src: &Path, dest: &Path) -> std::io::Result<()> {
    println!("src: {:?} dest: {:?}", src, dest);
    if !src.exists() || !dest.exists() {
        panic!("src or destination is invalid");
    }
    if src.is_file() {
        let dest_file = if dest.is_dir() {
            dest.join(
                src.file_name()
                    .expect("expect src filename extraction to work"),
            )
        } else {
            dest.to_path_buf()
        };
        std::fs::copy(src, dest_file)?;
    } else {
        let dest_dir = dest.join(
            src.file_name()
                .expect("expect extracting source directory name to succeed"),
        );
        if !dest_dir.exists() {
            log_normal(&format!("creating directory: {:?}", dest_dir));
            std::fs::create_dir_all(&dest_dir)?;
        }
        for file in std::fs::read_dir(src)
            .expect("expect iteration over source dir to work")
            .flatten()
        {
            copy_files(&file.path(), &dest_dir)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use crate::get_local_ip_address;

    #[test]
    fn test_get_local_ip() {
        let ip = get_local_ip_address();
        assert!(ip.is_ipv4());
    }
}
