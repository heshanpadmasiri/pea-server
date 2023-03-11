import { createSlice } from "@reduxjs/toolkit";

export const tagSlice = createSlice({
    name: "tags",
    initialState: {
        selectedTags: <string[]>[],
    },
    reducers: {
        selectTag: (state, action) => {
            if (state.selectedTags.includes(action.payload)) {
                return;
            }
            state.selectedTags.push(action.payload);
        },
        unselectTag: (state, action) => {
            state.selectedTags = state.selectedTags.filter((tag) => tag !== action.payload);
        },
    }
});

export const { selectTag, unselectTag } = tagSlice.actions;

export default tagSlice.reducer;
