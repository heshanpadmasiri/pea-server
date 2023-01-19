import axios from "axios";
import React from "react";
import { Container } from "react-bootstrap";
import "./App.css";
import config from "./config.json";
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: false,
      files: [],
    };
  }

  componentDidMount() {
    this.get_all_files();
  }

  get_all_files() {
    axios
      .get(`${config.SERVER_URL}/files`)
      .then((res) => {
        this.setState({ loading: false, error: false, files: res.data });
      })
      .catch((err) => {
        console.error(err);
        this.setState({ loading: false, error: true });
      });
  }

  render() {
    const { loading, error, files } = this.state;
    if (error) {
      return (
        <div className="App">
          <h1>Error</h1>
        </div>
      );
    } else if (loading) {
      return (
        <div className="App">
          <p>loading</p>
        </div>
      );
    }
    const videoItems = files
      .filter((each) => each.ty === "mp4")
      .map((each) => (
        <div className="grid-item" key={each.id}>
          {video_tag(each.name)}
        </div>
      ));
    const fileItems = files
      .filter((each) => each.ty !== "mp4")
      .map((each) => (
        <ul className="grid-item" key={each.id}>
          {file_tag(each.name)}
        </ul>
      ));

    return (
      <Container className="p-3">
        <h1 className="header"> Pea server </h1>
        <h2> Videos</h2>
        <div className="gird-container">{videoItems}</div>
        <h2> Other files</h2>
        {fileItems}
      </Container>
    );
  }
}

function video_tag(filename) {
  const src = `${config.SERVER_URL}/content/${filename}`;
  return (
      <video controls>
        <source src={src} type="video/mp4"></source>
      </video>
  );
}

function file_tag(filename) {
  const src = `${config.SERVER_URL}/content/${filename}`;
  return (
      <li>
        <a href={src}>{filename}</a>{" "}
      </li>
  );
}
export default App;
