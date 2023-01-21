use std::path::{Path, PathBuf};

#[derive(Debug, PartialEq)]
pub struct FileMetadata {
    pub name: String,
    pub id: u64,
    pub ty: String,
    pub path: PathBuf,
}

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

pub fn files(path: &Path) -> Result<Vec<FileMetadata>, ()> {
    if !path.is_dir() {
        return Err(());
    }
    let mut metadata = Vec::new();
    for child_path in std::fs::read_dir(path)
        .expect("expect iteration over directory to succeed")
        .flatten()
        .map(|each| each.path())
    {
        if child_path.is_dir() {
            metadata.extend(files(&child_path)?);
        } else {
            if let Some(_) = child_path.extension() {
                metadata.push(file_metadata(&child_path));
            }
        }
    }
    Ok(metadata)
}

fn file_metadata(path: &Path) -> FileMetadata {
    let name = path
        .file_name()
        .expect("expect filename")
        .to_str()
        .expect("expect valid file name")
        .to_string();
    let id = path
        .file_stem()
        .expect("expect file stem")
        .to_str()
        .expect("expect valid file name")
        .parse::<u64>()
        .unwrap();
    let ty = path
        .extension()
        .expect("expect valid file extension")
        .to_str()
        .expect("expect properly formatted extension")
        .to_string();
    FileMetadata {
        name,
        id,
        ty,
        path: path.to_path_buf(),
    }
}

pub fn clean_up_dir(path: &Path) -> std::io::Result<()> {
    if path.exists() {
        std::fs::remove_dir_all(path)?;
    }
    std::fs::create_dir(path)
}

#[cfg(test)]
mod tests {
    use std::{
        fs::{remove_dir_all, File},
        path::{Path, PathBuf},
    };

    use crate::{clean_up_dir, files, get_local_ip_address, FileMetadata};
    #[test]
    fn test_get_local_ip() {
        let ip = get_local_ip_address();
        assert!(ip.is_ipv4());
    }

    #[test]
    fn test_clean_up_dir() {
        let test_storage = &PathBuf::from("./libtest_1");
        initialize_storage(test_storage);
        clean_up_dir(test_storage).expect("expect cleanup up directory to succeed");
        assert!(test_storage
            .read_dir()
            .expect("expect reading directory to succeed")
            .next()
            .is_none());
        cleanup_storage(test_storage);
    }

    #[test]
    fn test_files() {
        let test_storage = &PathBuf::from("./libtest_2");
        initialize_storage(test_storage);
        let mut metadata = files(test_storage).expect("expect reading test storage to succeed");
        let files = ["1.mp4", "2.jpg", "3.mkv", "6.txt"];
        let mut expected: Vec<FileMetadata> = files
            .into_iter()
            .map(|name| {
                let path = test_storage.join(format!("./{name}"));
                let id = path
                    .file_stem()
                    .expect("expect file name")
                    .to_string_lossy()
                    .parse::<u64>()
                    .unwrap();
                let ty = path
                    .extension()
                    .expect("expect valid file extension")
                    .to_string_lossy();
                FileMetadata {
                    name: name.to_string(),
                    id,
                    ty: ty.to_string(),
                    path,
                }
            })
            .collect();
        expected.sort_by_key(|each| each.id);
        metadata.sort_by_key(|each| each.id);
        assert_eq!(metadata, expected);
        cleanup_storage(test_storage);
    }

    #[test]
    fn test_files_to_work_on_empty_dir() {
        let test_storage = &PathBuf::from("./libtest_3");
        initialize_storage(test_storage);
        clean_up_dir(test_storage).expect("expect cleanup up directory to succeed");
        let metadata = files(test_storage).expect("expect reading empty storage to succeed");
        assert_eq!(metadata, []);
        cleanup_storage(test_storage);
    }

    #[test]
    fn test_files_to_work_on_non_existing_dir() {
        let test_storage = &PathBuf::from("nodir");
        files(test_storage).expect_err("expect reading invalid dir to fail");
    }

    fn initialize_storage(test_storage: &Path) {
        if test_storage.exists() {
            panic!("test storage is already existing, try manual cleaning");
        }
        let files = ["1.mp4", "2.jpg", "3.mkv", "6.txt", ".no_name", "no_ext"];
        std::fs::create_dir(test_storage).expect("expect test storage dir creation to succeed");
        for file in files {
            File::create(test_storage.join(format!("./{file}")))
                .expect("expect file creation to succeed");
        }
    }

    fn cleanup_storage(test_storage: &Path) {
        if !test_storage.exists() {
            panic!("test storage is already deleted");
        }
        remove_dir_all(test_storage).expect("expect deleting test storage to succeed")
    }
}
