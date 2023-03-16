import React from "react";
import "./App.css";

import Container from "react-bootstrap/Container";
import VideoPage from "./VideoPage";
import OtherFilePage from "./OtherFilePage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ImagePage from "./images";
import UploadPage from "./UploadPage";

function App () {
  const router = createBrowserRouter([
    { path: "/", element: <UploadPage/> },
    { path: "/videos", element: <VideoPage/> },
    { path: "/other", element: <OtherFilePage/> },
    { path: "/images", element: <ImagePage/> },
  ]);
  return (
    <Container className="p-3">
      <RouterProvider router={router}/>
    </Container>
  );
}

export default App;
