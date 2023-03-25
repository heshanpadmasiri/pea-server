import { configureStore } from '@reduxjs/toolkit';
import tagReducer from './tagSlice';
import slideShowReducer from './slideShowSlice';
import { apiSlice } from './apiSlice';

const store = configureStore({
    reducer: {
        tags: tagReducer,
        slideShow: slideShowReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware(
        { serializableCheck: false }
    ).concat(apiSlice.middleware)
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store;
