import { useSelector } from 'react-redux';
import { QueryResult, useGetFilesQuery } from './apiSlice';
import { RootState } from './store';
import { useGetFilesByConditionQuery, useGetFilesByTypeQuery } from './apiSlice';

export function getFilesByType(type: string): QueryResult {
    const selectedTags = useSelector((state: RootState) => state.tags.selectedTags);
    if (selectedTags.length > 0) {
        return useGetFilesByConditionQuery({ type, tags: selectedTags }) as QueryResult;
    }
    else {
        return useGetFilesByTypeQuery(type) as QueryResult;
    }
}

export function getFilesByTypes(types: string[]): QueryResult[] {
    return types.map((type) => getFilesByType(type))
}

export function getAllFiles(): QueryResult {
    const selectedTags = useSelector((state: RootState) => state.tags.selectedTags);
    if (selectedTags.length > 0) {
        return useGetFilesByConditionQuery({ type: '', tags: selectedTags }) as QueryResult;
    }
    else {
        return useGetFilesQuery() as QueryResult;
    }
}
