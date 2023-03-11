import { createSlice } from "@reduxjs/toolkit";

export const slideShowSlice = createSlice({
    name: "component",
    initialState: {
        inSlideShow: false,
        currentIndex: 0,
        lastTouchX: 0,
        maxIndex: 0,
    },
    reducers: {
        startSlideShow: (state) => {
            state.inSlideShow = true;
        },
        endSlideShow: (state) => {
            state.inSlideShow = false;
        },
        setTouchPoint: (state, action) => {
            state.lastTouchX = action.payload;
        },
        setCurrentIndex: (state, action) => {
            state.currentIndex = action.payload;
        },
        setMaxIndex: (state, action) => {
            state.maxIndex = action.payload;
        }
    }
});

export const { startSlideShow, endSlideShow, setTouchPoint, setCurrentIndex, setMaxIndex } = slideShowSlice.actions;

export default slideShowSlice.reducer;
