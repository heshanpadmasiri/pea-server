import React from "react";
import Container from "react-bootstrap/Container";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import config from "./config.json";
import navbar from "./navbar";
import ImageGallery from "react-image-gallery";
import axios from "axios";
class ImagePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      images: [],
      tags: [],
      selected_tags: [],
    };
  }

  componentDidMount() {
    this.get_images();
    this.get_tags();
  }


  get_images() {
    const { selected_tags } = this.state;
    if (selected_tags.length === 0) {
      this.get_images_without_tags();
    } else {
      this.get_images_with_tags(selected_tags);
    }
  }

  get_images_with_tags(tags) {
    const image_tys = ["jpg", "jpeg"];
    Promise.all(image_tys.map(async (ty) => {
      let res = await axios.post(`${config.SERVER_URL}/query`, {
        data: {
          ty,
          tags
        }
      });
      return res.data
    })).then(image_array => {
      this.setState({
        images: image_array.flat()
      })
    })
  }

  get_images_without_tags() {
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

  get_tags() {
    axios.get(`${config.SERVER_URL}/tags`).then((res) => {
      this.setState({
        tags: res.data
      });
    });
  }

  get_tag_switches() {
    const { tags, selected_tags } = this.state;
    return tags.map((tag, id) => {
      return (
        <Form.Check
          type="switch"
          id={id}
          key={id}
          label={tag}
          checked={selected_tags.includes(tag)}
          onChange={() => {
            if (selected_tags.includes(tag)) {
              const new_tags = selected_tags.filter((t) => t !== tag);
              this.setState({
                selected_tags: new_tags,
              });
            } else {
              selected_tags.push(tag);
              this.setState({
                selected_tags,
              });
            }
            this.get_images();
          }}
        />
      );
    });
  }

  render() {
    const { images } = this.state;
    const items = images.map((each) => {
      return { original: `${config.SERVER_URL}/content/${each.id}` };
    });
    const nav = navbar();
    const tag_switches = this.get_tag_switches();
    return (
      <Container className="p-3">
        {nav}
        <Row>
          <Col sm={2}>{tag_switches}</Col>
          <Col sm={10}>
            <ImageGallery items={items} infinite={true} />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default ImagePage;
