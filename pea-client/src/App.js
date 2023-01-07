import axios from "axios";
import React from "react";
import "./App.css";
import config from "./config.json";

function video_tag(filename) {
  const src = `${config.SERVER_URL}/content/${filename}`;
  return (
    <video controls>
      <source src={src} type="video/mp4"></source>
    </video>
  );
}
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
    const fileItems = files.map((each) => (
      <div className="grid-item" key={each.id}>
        {video_tag(each.name)}
      </div>
    ));
    return (
      <div className="App">
        <h1> Pea server </h1>
        <div className="gird-container">{fileItems}</div>
      </div>
    );
  }
}
export default App;
