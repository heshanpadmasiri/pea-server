import { configureStore } from '@reduxjs/toolkit';
import tagReducer from './tagSlice';
import componentReducer from './componentSlice';
import { apiSlice } from './apiSlice';

const store = configureStore({
    reducer: {
        tages: tagReducer,
        components: componentReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(apiSlice.middleware)
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store;
