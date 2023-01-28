import navbar from "./navbar"

import Container from "react-bootstrap/Container";
function upload_page() {
    const nav = navbar();
    return (<Container className="p-3">{nav}<h1>Pea server</h1></Container>);
}

export default upload_page
