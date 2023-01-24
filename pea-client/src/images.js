import React from "react";
import Container from "react-bootstrap/Container";
import config from "./config.json";
import navbar from "./navbar";
import ImageGallery from "react-image-gallery";
class ImagePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      images: props.images,
    };
  }

  render() {
    const { images } = this.state;
    const items = images.map((each) => {
      return { original: `${config.SERVER_URL}/content/${each.id}` };
    });
    const nav = navbar();
    return (
      <Container className="p-3">
        {nav}
        <ImageGallery items={items} infinite={true} />
      </Container>
    );
  }
}

export default ImagePage;
