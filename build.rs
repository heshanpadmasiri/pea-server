use std::{path::PathBuf, process::Command};

fn main() {
    let client_content_dir = "client-content";
    let content_dir = "content";

    clean_and_create_dir(client_content_dir);
    clean_and_create_dir(content_dir);
    create_and_copy_static_page("pea-client", client_content_dir)
}

fn clean_and_create_dir(dir_name: &str) {
    Command::new("rm")
        .args(["-rf", &format!("./{}", dir_name)])
        .status()
        .unwrap();
    Command::new("mkdir").args([dir_name]).status().unwrap();
}

fn create_and_copy_static_page(src: &str, dest: &str) {
    Command::new("npm")
        .args(["run", "build"])
        .current_dir(PathBuf::from(format!("./{}", src)))
        .status()
        .unwrap();
    Command::new("cp")
        .args(["-r", &format!("./{}/build/", src), &format!("./{}", dest)])
        .status()
        .unwrap();
}
