use std::{path::PathBuf, env};

use pea_server::utils::storage::FileIndex;

fn main() {
    simple_logger::SimpleLogger::new().init().unwrap();
    let index_file = PathBuf::from(
        std::env::args()
            .nth(1)
            .unwrap_or_else(|| env::var("PEA_INDEX_FILE").unwrap()),
    );
    let content_root = PathBuf::from(
        std::env::args()
            .nth(2)
            .unwrap_or_else(|| env::var("PEA_FILES_DIR").unwrap()),
    );
    let mut index = FileIndex::new(&index_file);
    index.add_dir(&content_root).unwrap();
}
