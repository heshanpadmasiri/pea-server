use std::path::Path;

pub fn log_normal(message: &str) {
    println!("{}", message);
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
