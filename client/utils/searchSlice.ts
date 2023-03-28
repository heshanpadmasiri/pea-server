import { createSlice } from '@reduxjs/toolkit';

export const searchSlice = createSlice({
    name: 'search',
    initialState: {
        query: <undefined | string>undefined,
    },
    reducers: {
        clearQuery: (state) => {
            state.query = undefined;
        },
        setQuery: (state, action) => {
            const newQuery = action.payload as string;
            state.query = newQuery;
        }
    }
})

export const { clearQuery, setQuery } = searchSlice.actions;
export default searchSlice.reducer;
