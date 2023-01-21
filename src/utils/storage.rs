use std::path::{Path, PathBuf};

use crate::utils::log::log_normal;

#[derive(Debug, PartialEq)]
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
}

impl std::fmt::Display for FileErr {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FileErr::PathDoesNotExist => write!(f, "path does not exist"),
            FileErr::IndexDoesNotExist => write!(f, "index file does not exits"),
            FileErr::IndexInvalid => write!(f, "index invalid"),
            FileErr::IdInvalid => write!(f, "id invalid"),
        }
    }
}

pub struct FileIndex {
    index_file: PathBuf,
}

impl FileIndex {
    pub fn new(index_file: &Path) -> Self {
        Self {
            index_file: index_file.to_path_buf(),
        }
    }

    pub fn files(&self) -> Result<Vec<FileMetadata>, FileErr> {
        files(&self.index_file)
    }

    pub fn get_file_path(&self, id: u64) -> Result<PathBuf, FileErr> {
        get_file_path(&self.index_file, id)
    }
}

fn files(path: &Path) -> Result<Vec<FileMetadata>, FileErr> {
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
            metadata.extend(files(&child_path)?);
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

// move to file index
fn get_file_path(index: &Path, id: u64) -> Result<PathBuf, FileErr> {
    if !index.exists() {
        return Err(FileErr::IndexDoesNotExist);
    }
    // TODO: change index to be an index file
    else if !index.is_dir() {
        return Err(FileErr::IndexInvalid);
    }
    let id = id.to_string();
    for path in std::fs::read_dir(index)
        .expect("expect iteration over index to succeed")
        .flatten()
        .map(|each| each.path())
    {
        if let Some(id_str) = path.file_stem() {
            if id_str.to_string_lossy() == id {
                return Ok(path);
            }
        }
    }
    Err(FileErr::IdInvalid)
}
