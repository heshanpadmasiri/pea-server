use std::path::PathBuf;

use pea_server::utils::storage::FileIndex;

fn main() {
    simple_logger::SimpleLogger::new().init().unwrap();
    let index_file = PathBuf::from(
        std::env::args()
            .nth(1)
            .unwrap_or_else(|| "./content/index.json".to_string()),
    );
    let content_root = PathBuf::from(
        std::env::args()
            .nth(2)
            .unwrap_or_else(|| "./files".to_string()),
    );
    let mut index = FileIndex::new(&index_file);
    index.add_dir(&content_root).unwrap();
}
