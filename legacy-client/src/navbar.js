import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import { LinkContainer } from "react-router-bootstrap";

function navbar() {
  return (
    <Navbar bg="dark" variant="dark">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>PeaServer</Navbar.Brand>
        </LinkContainer>
        <Nav className="me-auto">
          <LinkContainer to="/">
            <Nav.Link>Home</Nav.Link>
          </LinkContainer>
          <LinkContainer to="/videos">
            <Nav.Link>Videos</Nav.Link>
          </LinkContainer>
          <LinkContainer to="/images">
            <Nav.Link>Images</Nav.Link>
          </LinkContainer>
          <LinkContainer to="/other">
            <Nav.Link>Other Files</Nav.Link>
          </LinkContainer>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default navbar;
