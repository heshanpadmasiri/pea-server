import axios from "axios";
import config from "../config.json";

export interface Metadata {
    name: string,
    id: string,
    ty: string,
    tags: string[],
}

export enum AsyncRequestState {
    LOADING = "loading",
    ERROR = "error",
    DONE = "done",
    UNDEF = "undef"
}

export function fileContentUrl(file: Metadata): string {
    return config.SERVER_URL + "/content/" + file.id;
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

const IMAGE_TYPES = ["jpeg", "jpg", "png", "gif", "bmp", "tiff", "tif", "svg", "webp"];

// export function getImages(): Promise<Metadata[]> {
//     return new Promise((resolve, reject) => {
//         Promise.all(IMAGE_TYPES.map(async (type) => {
//             let res = await axios.get(config.SERVER_URL + "/files/" + type);
//             return res.data;
//         })).then((image_arrays) => {
//             resolve(image_arrays.flat())
//         }).catch((err) => {
//             reject(err);
//         });
// 
//     });
// }

export function getImagesWithTags(tags: string[]): Promise<Metadata[]> {
    return new Promise((resolve, reject) => {
        Promise.all(IMAGE_TYPES.map(async (type) => {
            let res = await axios.post(config.SERVER_URL + "/query", { data: { tags: tags, ty: type } });
            return res.data;
        })).then((image_arrays) => {
            resolve(image_arrays.flat())
        }).catch((err) => {
            reject(err);
        });

    });
}

export function isImage(file: Metadata): boolean {
    return IMAGE_TYPES.includes(file.ty);
}

export function getPdfs(): Promise<Metadata[]> {
    return new Promise((resolve, reject) => {
        axios.get(config.SERVER_URL + "/files/" + "pdf")
            .then((res) => {
                return resolve(res.data);
            }).catch((err) => {
                return reject(err);
            })
    });
}

export function isPdf(file: Metadata): boolean {
    return file.ty === "pdf";
}

export function getVideos(): Promise<Metadata[]> {
    return new Promise((resolve, reject) => {
        axios.get(config.SERVER_URL + "/files/" + "mp4").then((res) => {
            return resolve(res.data);
        }).catch((err) => {
            return reject(err);
        })
    });
}

export function getVideosWithTags(tags: string[]): Promise<Metadata[]> {
    return new Promise((resolve, reject) => {
        axios.post(config.SERVER_URL + "/query", { data: { tags: tags, ty: "mp4" } }).then((res) => {
            return resolve(res.data);
        }).catch((err) => {
            return reject(err);
        })
    });
}

export function isVideo(file: Metadata): boolean {
    return file.ty === "mp4";
}
