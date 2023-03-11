import { createSlice } from "@reduxjs/toolkit";

export const componentSlice = createSlice({
    name: "component",
    initialState: {
        tagSelectorInitialized: false,
        imagePageInitialized: false
    },
    reducers: {
        tagSelectorInitialized: (state) => {
            state.tagSelectorInitialized = true;
        },
        imagePageInitialized: (state) => {
            state.imagePageInitialized = true;
        }
    }
});

export const { tagSelectorInitialized, imagePageInitialized } = componentSlice.actions;

export default componentSlice.reducer;
