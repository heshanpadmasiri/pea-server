import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from "../config.json";
import { Metadata } from './services';

export type Condition = {
    type: string,
    tags: string[]
}

export type QueryResult = {
    isLoading: boolean,
    isError: boolean,
    isSuccess: boolean,
    error: any,
    data: Metadata[]
}

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: config.SERVER_URL }),
    endpoints: (builder) => ({
        getTags: builder.query<string[], void>({
            query: () => '/tags'
        }),
        getFilesByType: builder.query<Metadata[], string>({
            query: (type) => `/files/${type}`
        }),
        getFilesByCondition: builder.query<Metadata[], Condition>({
            query: ({ type, tags }) => ({
                url: '/query',
                method: 'POST',
                body: {
                    data: { tags, ty: type }
                }
            })
        })
    })
});

export const { useGetTagsQuery, useGetFilesByTypeQuery, useGetFilesByConditionQuery } = apiSlice;
