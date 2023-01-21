import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";

function navbar() {
  return (
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
  );
}


export default navbar
