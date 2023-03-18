import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from '../config.json';

export interface Metadata {
    name: string,
    id: string,
    ty: string,
    tags: string[],
}

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

export function fileContentUrl(file: Metadata): string {
    return config.SERVER_URL + '/content/' + file.id;
}

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: config.SERVER_URL }),
    endpoints: (builder) => ({
        getTags: builder.query<string[], void>({
            query: () => '/tags'
        }),
        getFiles: builder.query<Metadata[], void>({
            query: () => '/files'
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

export const { useGetTagsQuery, useGetFilesQuery, useGetFilesByTypeQuery, useGetFilesByConditionQuery } = apiSlice;
