import Container from "react-bootstrap/Container";
import React from "react";
import config from "./config.json";
import navbar from "./navbar";

class VideoPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      videos: props.videos,
    };
  }

  render() {
    const { videos } = this.state;
    console.log(videos);
    const videoTags = videos.map((each) => video_tag(each.name, each.id));
    const nav = navbar();
    return (<Container className="p-3">{nav}{videoTags}</Container>);
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
