import React from "react";
import Container from "react-bootstrap/Container";
import config from "./config.json";
import navbar from "./navbar";

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
    const nav = navbar();
    return (<Container className="p-3">{nav}<ul>{file_tags}</ul></Container>);
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
