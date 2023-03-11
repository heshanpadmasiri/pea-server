import { createSlice } from "@reduxjs/toolkit";

export type Thumbnail = AsyncState | { uri: string }
export enum AsyncState {
    loading = "loading",
    error = "error"
};

export type ThumbnailCardProps = {
    index: number,
    id: string,
    url: string,
    thumbnail: Thumbnail,
    title: string,
}

export const videoSlice = createSlice({
    name: "video",
    initialState: {
        thumbnailProps: [] as ThumbnailCardProps[],
        initialized: false,
    },
    reducers: {
        initializeThumbnailProps: (state, action) => {
            state.thumbnailProps = action.payload;
            state.initialized = true;
        },
        updateThumbnailProp: (state, action) => {
            const { index, thumbnail } = action.payload;
            state.thumbnailProps[index].thumbnail = thumbnail;
        }
    }
});

export const { initializeThumbnailProps, updateThumbnailProp } = videoSlice.actions;

export default videoSlice.reducer;
