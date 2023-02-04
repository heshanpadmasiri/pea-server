import React from "react";
import Container from "react-bootstrap/Container";
import config from "./config.json";
import navbar from "./navbar";
import ImageGallery from "react-image-gallery";
import axios from "axios";
class ImagePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      images: []
    };
  }

  componentDidMount() {
    this.get_images();
  }

  get_images() {
    const image_tys = ["jpg", "jpeg"];
    Promise.all(image_tys.map(async (ty) => {
      let res = await axios.get(`${config.SERVER_URL}/files/${ty}`);
      return res.data
    })).then(image_array => {
      this.setState({
        images: image_array.flat()
      })
    })
  }

  render() {
    const { images } = this.state;
    console.log(images)
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
