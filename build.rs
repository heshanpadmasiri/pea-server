use std::{path::PathBuf, process::Command};

fn main() {
    Command::new("rm")
        .args(["-rf", "./content"])
        .status()
        .unwrap();
    Command::new("mkdir").args(["content"]).status().unwrap();
    Command::new("npm")
        .args(["run", "build"])
        .current_dir(PathBuf::from("./pea-client"))
        .status()
        .unwrap();
    Command::new("cp")
        .args(["-r", "./pea-client/build/", "./content"])
        .status()
        .unwrap();
}
