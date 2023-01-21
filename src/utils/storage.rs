use std::{
    collections::{hash_map::DefaultHasher, HashMap},
    hash::{Hash, Hasher},
    io::Write,
    path::{Path, PathBuf},
};

use crate::utils::log::log_normal;

use super::log::log_debug;

#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq, Clone)]
pub struct FileMetadata {
    pub name: String,
    pub id: u64,
    pub ty: String,
    pub path: PathBuf,
}

#[derive(Debug)]
pub enum FileErr {
    PathDoesNotExist,
    IndexDoesNotExist,
    IndexInvalid,
    IdInvalid,
    DBError,
}

impl std::fmt::Display for FileErr {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FileErr::PathDoesNotExist => write!(f, "path does not exist"),
            FileErr::IndexDoesNotExist => write!(f, "index file does not exits"),
            FileErr::IndexInvalid => write!(f, "index invalid"),
            FileErr::IdInvalid => write!(f, "id invalid"),
            FileErr::DBError => write!(f, "db error"),
        }
    }
}

type FileDB = HashMap<u64, FileMetadata>;

pub struct FileIndex {
    index_file: PathBuf,
    db: FileDB,
}

impl FileIndex {
    pub fn new(index_file: &Path) -> Self {
        let db = match deserialize_db(index_file) {
            Ok(current) => current,
            Err(_) => {
                log_debug("empty index");
                HashMap::new()
            }
        };
        Self {
            db,
            index_file: index_file.to_path_buf(),
        }
    }

    pub fn files(&self) -> Vec<FileMetadata> {
        self.db.values().cloned().collect()
    }

    pub fn get_file_path(&self, id: u64) -> Result<PathBuf, FileErr> {
        match self.db.get(&id) {
            Some(metadata) => {
                return Ok(metadata.path.clone());
            }
            None => {
                return Err(FileErr::IdInvalid);
            }
        }
    }

    pub fn add_dir(&mut self, path: &Path) -> Result<(), FileErr> {
        let new_files = files_in_dir(path)?;
        for each in new_files {
            if self.db.contains_key(&each.id) {
                panic!("duplicate id for {:?}", each);
            }
            self.db.insert(each.id, each);
        }
        serialize_db(&self.index_file, &self.db)
    }
}

fn deserialize_db(path: &Path) -> Result<FileDB, FileErr> {
    Ok(read_index_file(path)?
        .into_iter()
        .map(|each| (each.id, each))
        .collect())
}

fn read_index_file(path: &Path) -> Result<Vec<FileMetadata>, FileErr> {
    match std::fs::read_to_string(path) {
        Ok(content) => match serde_json::from_str::<Vec<FileMetadata>>(&content) {
            Ok(res) => {
                return Ok(res);
            }
            Err(_) => {
                return Err(FileErr::IndexDoesNotExist);
            }
        },
        Err(_) => Err(FileErr::IndexDoesNotExist),
    }
}

fn serialize_db(path: &Path, db: &FileDB) -> Result<(), FileErr> {
    let values: Vec<FileMetadata> = db.values().cloned().collect();
    match serde_json::to_string_pretty(&values) {
        Ok(body) => {
            let f = std::fs::OpenOptions::new()
                .write(true)
                .create(true)
                .open(path);
            match f {
                Ok(mut file) => {
                    file.write_all(body.as_bytes())
                        .expect("writing to index file must succeed");
                    return Ok(());
                }
                Err(_) => {
                    return Err(FileErr::DBError);
                }
            }
        }
        Err(_) => {
            return Err(FileErr::DBError);
        }
    }
}

fn files_in_dir(path: &Path) -> Result<Vec<FileMetadata>, FileErr> {
    if !path.is_dir() {
        return Err(FileErr::PathDoesNotExist);
    }
    let mut metadata = Vec::new();
    for child_path in std::fs::read_dir(path)
        .expect("expect iteration over directory to succeed")
        .flatten()
        .map(|each| each.path())
    {
        if child_path.is_dir() {
            metadata.extend(files_in_dir(&child_path)?);
        } else if child_path.extension().is_some() {
            metadata.push(file_metadata(&child_path));
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
    let mut hasher = DefaultHasher::new();
    let file_stem = path
        .file_stem()
        .expect("expect file stem")
        .to_str()
        .expect("expect valid file name");
    file_stem.hash(&mut hasher);
    let id = hasher.finish();
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

pub fn clean_up_dir(path: &Path) -> std::io::Result<()> {
    if path.exists() {
        std::fs::remove_dir_all(path)?;
    }
    std::fs::create_dir(path)
}
