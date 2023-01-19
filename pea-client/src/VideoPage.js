import Container from "react-bootstrap/Container";
import React from "react";
import config from "./config.json";

class VideoPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      videos: props.videos,
    };
  }

  render() {
    const { videos } = this.state;
    const videoTags = videos.map((each) => video_tag(each.name, each.id));
    return <Container className="p-3">{videoTags}</Container>;
  }
}

function video_tag(filename, id) {
  const src = `${config.SERVER_URL}/content/${filename}`;
  return (
    <video key={id} controls>
      <source src={src} type="video/mp4"></source>
    </video>
  );
}

export default VideoPage;
