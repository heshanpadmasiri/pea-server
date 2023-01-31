import navbar from "./navbar";
import config from "./config.json";
import axios from "axios";

import React, { useState} from "react";
import { useForm } from "react-hook-form";

import Container from "react-bootstrap/Container";

function UploadPage() {
  const { register, handleSubmit } = useForm();
  const [updateProgress, setUpdateProgress ] = useState(0);
  const nav = navbar();

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("file", data.file[0]);
    const post_config = {
      onUploadProgress: progressEvent => {
          var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          if (percentCompleted == 100) {
            setUpdateProgress(0);
          }
          else {
            setUpdateProgress(percentCompleted);
          }
      },
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }
    axios
      .post(`${config.SERVER_URL}/file`, formData, post_config)
      .then((res) => console.log(res))
      .catch((err) => console.error(err));
  };

  return (
    <Container className="p-3">
      {nav}
      <p> Update progress {updateProgress}% </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="file" {...register("file")} />
        <input type="submit" />
      </form>
    </Container>
  );
}

export default UploadPage;
