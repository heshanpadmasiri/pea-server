import axios from "axios";
import config from "../config.json";

export interface Metadata {
    name: string,
    id: string,
    ty: string,
    tags: string[],
}

export function getFiles(): Promise<Metadata[]> {
    return new Promise((resolve, reject) => {
        axios.get(config.SERVER_URL + "/files")
            .then((res) => {
                return resolve(res.data);
            }).catch((err) => {
                return reject(err);
            })
    });
}
