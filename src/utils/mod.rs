pub mod storage;

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

#[cfg(test)]
mod tests {
    use std::{
        fs::{remove_dir_all, File, self},
        path::{Path, PathBuf}, collections::hash_map::DefaultHasher, hash::{Hash, Hasher},
    };

    use crate::utils::{get_local_ip_address, storage::{clean_up_dir, FileMetadata}};

    use super::storage::FileIndex;
    #[test]
    fn test_get_local_ip() {
        let ip = get_local_ip_address();
        assert!(ip.is_ipv4());
    }

    #[test]
    fn test_clean_up_dir() {
        let test_storage = &PathBuf::from("./libtest_1");
        let index_path = &PathBuf::from("./libtest_1.index");
        initialize_storage(test_storage);
        let _index = index_for_dir(index_path, test_storage);
        clean_up_dir(test_storage).expect("expect cleanup up directory to succeed");
        assert!(test_storage
            .read_dir()
            .expect("expect reading directory to succeed")
            .next()
            .is_none());
        cleanup_storage(index_path, test_storage);
    }

    #[test]
    fn test_files() {
        let test_storage = &PathBuf::from("./libtest_2");
        let index_path = &PathBuf::from("./libtest_2.index");
        initialize_storage(test_storage);
        let index = index_for_dir(index_path, test_storage);
        let mut metadata = index.files();
        let files = ["1.mp4", "2.jpg", "3.mkv", "6.txt"];
        let mut expected: Vec<FileMetadata> = files
            .into_iter()
            .map(|name| {
                let path = test_storage.join(name);
                let mut hasher = DefaultHasher::new();
                path.hash(&mut hasher);
                let id = hasher.finish();
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
        cleanup_storage(index_path, test_storage);
    }

    #[test]
    fn test_files_to_work_on_empty_dir() {
        let test_storage = &PathBuf::from("./libtest_3");
        let index_path = &PathBuf::from("./libtest_3.index");
        initialize_storage(test_storage);
        clean_up_dir(test_storage).expect("expect cleanup up directory to succeed");
        let index = index_for_dir(index_path, test_storage);
        let metadata = index.files();
        assert_eq!(metadata, []);
        cleanup_storage(index_path, test_storage);
    }

    fn index_for_dir(index_path: &Path, dir: &Path) -> FileIndex {
        let mut index = FileIndex::new(index_path);
        index
            .add_dir(dir)
            .expect("expect indexing directory to succeed");
        index
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

    fn cleanup_storage(index_path: &Path, test_storage: &Path) {
        fs::remove_file(index_path).expect("expect deleting index to succeed");
        if !test_storage.exists() {
            panic!("test storage is already deleted");
        }
        remove_dir_all(test_storage).expect("expect deleting test storage to succeed")
    }
}
