import navbar from "./navbar";
import config from "./config.json";
import axios from "axios";

import React, { useState} from "react";
import { useForm } from "react-hook-form";

import Container from "react-bootstrap/Container";

function UploadPage() {
  const { register, handleSubmit } = useForm();
  const [uploadProgress, setUploadProgress ] = useState(0);
  const [uploadActive, setUploadActive] = useState(false);
  const nav = navbar();

  const onSubmit = async (data) => {
    setUploadActive(true);
    const formData = new FormData();
    formData.append("file", data.file[0]);
    const post_config = {
      onUploadProgress: progressEvent => {
          var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          if (percentCompleted === 100) {
            setUploadProgress(0);
            setUploadActive(false);
          }
          else {
            setUploadProgress(percentCompleted);
          }
      },
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }
    axios
      .post(`${config.SERVER_URL}/file`, formData, post_config)
      .then((res) => console.log(res))
      .catch((err) => {
          console.error(err);
          setUploadActive(false);
      });
  };

  return (
    <Container className="p-3">
      {nav}
      {upload_progress(uploadProgress)}
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="file" {...register("file")} />
        <input disabled={uploadActive} type="submit" />
      </form>
    </Container>
  );
}

function upload_progress(progress) {
    return (progress === 0) ? (<p>no active upload</p>) : 
                              (<div> 
                                 <label for="upload">Upload progress {progress}%</label>
                                 <progress id="upload" value={progress} max="100"> {progress}% </progress>
                               </div>)
}

export default UploadPage;
