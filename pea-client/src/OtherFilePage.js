import React from "react";
import config from "./config.json";

class OtherFilePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      files: props.files,
    };
  }

  render() {
    const { files } = this.state;
    const file_tags = files.map((each) => {
      return file_tag(each.name, each.id);
    });
    return <ul>{file_tags}</ul>;
  }
}

function file_tag(filename, id) {
  const src = `${config.SERVER_URL}/content/${filename}`;
  return (
    <li key={id}>
      <a href={src}>{filename}</a>{" "}
    </li>
  );
}
export default OtherFilePage;
