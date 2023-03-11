import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from "../config.json";
import { Metadata } from './services';

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: config.SERVER_URL }),
    endpoints: (builder) => ({
        getTags: builder.query<string[], void>({
            query: () => '/tags'
        }),
        getFilesByType: builder.query<Metadata[], string>({
            query: (type) => `/files/${type}`
        })
    })
});

export const { useGetTagsQuery, useGetFilesByTypeQuery } = apiSlice;
