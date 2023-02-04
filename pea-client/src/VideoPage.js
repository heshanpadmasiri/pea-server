import Container from "react-bootstrap/Container";
import React from "react";
import config from "./config.json";
import navbar from "./navbar";
import axios from "axios";

class VideoPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      videos: [],
    };
  }

  componentDidMount() {
    this.get_videos();
  }

  get_videos() {
    axios
      .get(`${config.SERVER_URL}/files/mp4`)
      .then((res) => {
        this.setState({
          videos: res.data,
        });
      })
      .catch((err) => console.error(err));
  }

  render() {
    const { videos } = this.state;
    console.log(videos);
    const videoTags = videos.map((each) => video_tag(each.name, each.id));
    const nav = navbar();
    return (
      <Container className="p-3">
        {nav}
        {videoTags}
      </Container>
    );
  }
}

function video_tag(filename, id) {
  const src = `${config.SERVER_URL}/content/${id}`;
  return (
    <video key={id} controls>
      <source src={src} type="video/mp4"></source>
    </video>
  );
}

export default VideoPage;
