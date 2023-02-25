use std::{
    collections::{hash_map::DefaultHasher, HashMap, HashSet},
    fs::File,
    hash::{Hash, Hasher},
    io::Write,
    path::{Path, PathBuf},
};

use log::{debug, error, info};

#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq, Clone)]
pub struct FileMetadata {
    pub name: String,
    pub id: u64,
    pub ty: String,
    pub path: PathBuf,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug)]
pub enum FileErr {
    PathDoesNotExist,
    IndexDoesNotExist,
    IndexInvalid,
    IdInvalid,
    DBError,
    FailedToCreateFile,
}

impl std::fmt::Display for FileErr {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FileErr::PathDoesNotExist => write!(f, "path does not exist"),
            FileErr::IndexDoesNotExist => write!(f, "index file does not exits"),
            FileErr::IndexInvalid => write!(f, "index invalid"),
            FileErr::IdInvalid => write!(f, "id invalid"),
            FileErr::DBError => write!(f, "db error"),
            FileErr::FailedToCreateFile => write!(f, "failed to create file"),
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
                debug!("empty index");
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

    pub fn tags(&self) -> Vec<String> {
        let buffer: HashSet<String> = self
            .db
            .values()
            .filter_map(|each| each.tags.clone())
            .flatten()
            .collect();
        buffer.into_iter().collect()
    }

    pub fn files_of_type(&self, ty: String) -> Vec<FileMetadata> {
        self.db
            .values()
            .filter(|each| each.ty == ty)
            .cloned()
            .collect()
    }

    pub fn files_of_tag(&self, tags: &Vec<String>) -> Vec<FileMetadata> {
        self.db
            .values()
            .filter(|each| match &each.tags {
                None => false,
                Some(each_tags) => {
                    for each in tags {
                        if !each_tags.contains(each) {
                            return false;
                        }
                    }
                    true
                }
            })
            .cloned()
            .collect()
    }

    pub fn get_file_path(&self, id: u64) -> Result<PathBuf, FileErr> {
        match self.db.get(&id) {
            Some(metadata) => Ok(metadata.path.clone()),
            None => Err(FileErr::IdInvalid),
        }
    }

    pub fn add_dir(&mut self, path: &Path) -> Result<(), FileErr> {
        let new_files = files_in_dir(path, None)?;
        for each in new_files {
            self.add_file_to_db(each);
        }
        serialize_db(&self.index_file, &self.db)
    }

    fn add_file(&mut self, path: &Path) -> Result<(), FileErr> {
        if path.is_dir() {
            panic!("use `add_dir` to add directory");
        }
        self.add_file_to_db(file_metadata(path, None));
        serialize_db(&self.index_file, &self.db)
    }

    fn add_file_to_db(&mut self, file: FileMetadata) {
        if self.db.contains_key(&file.id) {
            panic!("duplicate id for {file:?}");
        }
        self.db.insert(file.id, file);
    }
}

pub fn create_file(
    index: &mut FileIndex,
    filen_name: String,
    content: &[u8],
) -> Result<(), FileErr> {
    let recieved_dir = PathBuf::from("./recieved");
    if !recieved_dir.exists() {
        info!("creating recieved dir");
        let result = std::fs::create_dir(&recieved_dir);
        if result.is_err() {
            error!("recieved_dir creation failed due to {result:?}");
            return Err(FileErr::FailedToCreateFile);
        }
    }
    let path = recieved_dir.join(filen_name);
    match File::create(&path) {
        Ok(mut file) => match Write::write_all(&mut file, content) {
            Ok(_) => index.add_file(&path),
            Err(err) => {
                error!("failed to write to file failed due to {err:?}");
                Err(FileErr::FailedToCreateFile)
            }
        },
        Err(err) => {
            error!("failed to create file failed due to {err:?}");
            Err(FileErr::FailedToCreateFile)
        }
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
            Ok(res) => Ok(res),
            Err(_) => Err(FileErr::IndexDoesNotExist),
        },
        Err(_) => Err(FileErr::IndexDoesNotExist),
    }
}

fn serialize_db(path: &Path, db: &FileDB) -> Result<(), FileErr> {
    let values: Vec<FileMetadata> = db.values().cloned().collect();
    let parent_dir = path.parent().unwrap();
    match std::fs::create_dir_all(parent_dir) {
        Ok(_) => match serde_json::to_string_pretty(&values) {
            Ok(body) => {
                let f = std::fs::OpenOptions::new()
                    .write(true)
                    .create(true)
                    .open(path);
                match f {
                    Ok(mut file) => {
                        file.write_all(body.as_bytes())
                            .expect("writing to index file must succeed");
                        Ok(())
                    }
                    Err(err) => {
                        error!("faild to write to index file due to {err:?}");
                        Err(FileErr::DBError)
                    }
                }
            }
            Err(err) => {
                error!("db serialization failed due to {err:?}");
                Err(FileErr::DBError)
            }
        },
        Err(err) => {
            error!("failed to create dir: {parent_dir:?} to store index file due to {err:?}");
            Err(FileErr::DBError)
        }
    }
}

fn files_in_dir(path: &Path, tags: Option<Vec<String>>) -> Result<Vec<FileMetadata>, FileErr> {
    if !path.is_dir() {
        error!("path {path:?} is not a directory");
        return Err(FileErr::PathDoesNotExist);
    }
    let mut metadata = Vec::new();
    for child_path in std::fs::read_dir(path)
        .expect("expect iteration over directory to succeed")
        .map(|each| each.expect("expect dir entry to be valid").path())
    {
        if is_system_file(&child_path) {
            continue;
        }
        if child_path.is_dir() {
            let new_tag = child_path
                .file_name()
                .unwrap()
                .to_string_lossy()
                .to_string();
            let new_tags = match &tags {
                Some(tags) => {
                    let mut buffer = tags.clone();
                    buffer.push(new_tag);
                    Some(buffer)
                }
                None => Some(vec![new_tag]),
            };
            metadata.extend(files_in_dir(&child_path, new_tags)?);
        } else if child_path.extension().is_some() {
            metadata.push(file_metadata(&child_path, tags.clone()));
        }
    }
    Ok(metadata)
}

fn is_system_file(path: &Path) -> bool {
    if path.is_dir() {
        return false;
    }
    let file_name = path.file_name().unwrap().to_string_lossy();
    let extension = match path.extension() {
        Some(extension) => extension.to_string_lossy(),
        None => std::borrow::Cow::Borrowed(""),
    };
    if extension == "enc" {
        return true;
    }
    if file_name == ".DS_Store" {
        return true;
    }
    return file_name.trim().starts_with("._");
}

fn file_metadata(path: &Path, tags: Option<Vec<String>>) -> FileMetadata {
    let name = path
        .file_name()
        .expect("expect filename")
        .to_str()
        .expect("expect valid file name")
        .to_string();
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
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
        tags,
    }
}

pub fn copy_files(src: &Path, dest: &Path) -> std::io::Result<()> {
    println!("src: {src:?} dest: {dest:?}");
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
            info!("creating directory: {dest_dir:?}");
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
