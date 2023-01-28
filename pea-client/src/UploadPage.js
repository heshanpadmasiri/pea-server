import navbar from "./navbar";
import config from "./config.json";

import React from "react";
import { useForm } from "react-hook-form";

import Container from "react-bootstrap/Container";

function UploadPage() {
  const { register, handleSubmit } = useForm();
  const nav = navbar();

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("file", data.file[0]);

    const res = await fetch(`${config.SERVER_URL}/file`, {
      method: "POST",
      body: formData,
    }).then((res) => res.json());
    alert(JSON.stringify(`${res.message}, status: ${res.status}`));
  };

  return (
    <Container className="p-3">
      {nav}
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="file" {...register("file")} />
        <input type="submit" />
      </form>
    </Container>
  );
}

export default UploadPage;
