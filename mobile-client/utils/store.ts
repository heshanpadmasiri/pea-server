import { configureStore } from '@reduxjs/toolkit';
import tagReducer from './tagSlice';
import slideShowReducer from './slideShowSlice';
import videoReducer from './videoSlice';
import { apiSlice } from './apiSlice';

const store = configureStore({
    reducer: {
        tages: tagReducer,
        slideShow: slideShowReducer,
        video: videoReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(apiSlice.middleware)
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store;
