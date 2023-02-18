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
