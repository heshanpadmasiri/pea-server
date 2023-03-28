import { PreloadedState, combineReducers, configureStore } from '@reduxjs/toolkit';
import tagReducer from './tagSlice';
import slideShowReducer from './slideShowSlice';
import searchReducer from './searchSlice';
import { apiSlice } from './apiSlice';

const rootReducer = combineReducers({
    tags: tagReducer,
    slideShow: slideShowReducer,
    search: searchReducer,
    [apiSlice.reducerPath]: apiSlice.reducer
});

export const setupStore = (preloadedState?: PreloadedState<RootState>) => {
    return configureStore({
        reducer: rootReducer,
        middleware: getDefaultMiddleware => getDefaultMiddleware(
            { serializableCheck: false }
        ).concat(apiSlice.middleware),
        preloadedState
    })
};

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']
