import axios from "axios";
import React from "react";
import "./App.css";
import config from "./config.json";

import Container from "react-bootstrap/Container";
import VideoPage from "./VideoPage";
import OtherFilePage from "./OtherFilePage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ImagePage from "./images";

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
    const videos = files.filter((each) => each.ty === "mp4");
    const other_files = files.filter((each) => each.ty !== "mp4");
    const image_files = files.filter((each) => is_image_type(each.ty));
    const router = createBrowserRouter([
      { path: "/", element: <VideoPage videos={videos} /> },
      { path: "/videos", element: <VideoPage videos={videos} /> },
      { path: "/other", element: <OtherFilePage files={other_files} /> },
      { path: "/images", element: <ImagePage images={image_files} /> },
    ]);
    return (
      <Container className="p-3">
        <RouterProvider router={router}/>
      </Container>
    );
  }
}

function is_image_type(ty) {
  const image_tys = ["jpg", "jpeg"]
  return image_tys.includes(ty)
}

export default App;
