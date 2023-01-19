import axios from "axios";
import React from "react";
import "./App.css";
import config from "./config.json";

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

import VideoPage from "./VideoPage";
import OtherFilePage from "./OtherFilePage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

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
    const router = createBrowserRouter([
      { path: "/", element: <VideoPage videos={videos} /> },
      { path: "/videos", element: <VideoPage videos={videos} /> },
      { path: "/other", element: <OtherFilePage files={other_files} /> },
    ]);
    return (
      <Container className="p-3">
        <Navbar bg="dark" variant="dark">
          <Container>
            <Navbar.Brand href="/">PeaServer</Navbar.Brand>
            <Nav className="me-auto">
              <Nav.Link href="/">Home</Nav.Link>
              <Nav.Link href="/videos">Videos</Nav.Link>
              <Nav.Link href="/other">Other Files</Nav.Link>
            </Nav>
          </Container>
        </Navbar>
        <RouterProvider router={router} />
      </Container>
    );
  }
}

export default App;
