import React from "react";
import Container from "react-bootstrap/Container";
import config from "./config.json";
import navbar from "./navbar";
import axios from "axios";

class OtherFilePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
    };
  }

  componentDidMount() {
    this.get_files();
  }

  get_files() {
    const reserved_types = ["jpg", "jpeg", "mp4"]
    axios
      .get(`${config.SERVER_URL}/files`)
      .then((res) => {
        const files = res.data.filter(each => {
          return reserved_types.indexOf(each.ty) === -1;
        })
        this.setState({
          files
        })
      })
      .catch((err) => {
        console.error(err);
      });
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
  const src = `${config.SERVER_URL}/content/${id}`;
  return (
    <li key={id}>
      <a href={src}>{filename}</a>{" "}
    </li>
  );
}
export default OtherFilePage;
