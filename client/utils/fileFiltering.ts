import { useSelector } from 'react-redux';
import { QueryResult, useGetFilesQuery } from './apiSlice';
import { RootState } from './store';
import { useGetFilesByConditionQuery, useGetFilesByTypeQuery } from './apiSlice';

export function getFilesByType(type: string): QueryResult {
    const selectedTags = useSelector((state: RootState) => state.tags.selectedTags);
    let queryResult: QueryResult;
    if (selectedTags.length > 0) {
        queryResult = useGetFilesByConditionQuery({ type, tags: selectedTags }) as QueryResult;
    }
    else {
        queryResult = useGetFilesByTypeQuery(type) as QueryResult;
    }
    return filterBySearchQuery(queryResult);
}

export function getFilesByTypes(types: string[]): QueryResult[] {
    return types.map((type) => getFilesByType(type))
}

export function getAllFiles(): QueryResult {
    const selectedTags = useSelector((state: RootState) => state.tags.selectedTags);
    let queryResult: QueryResult;
    if (selectedTags.length > 0) {
        queryResult = useGetFilesByConditionQuery({ type: '', tags: selectedTags }) as QueryResult;
    }
    else {
        queryResult = useGetFilesQuery() as QueryResult;
    }
    return filterBySearchQuery(queryResult);
}

function filterBySearchQuery(queryResult: QueryResult): QueryResult {
    const query = useSelector((state: RootState) => state.search.query);
    if (query === undefined) {
        return queryResult;
    }
    if (queryResult.isError || queryResult.isLoading) {
        return queryResult;
    }
    const data = queryResult.data.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()));
    return { ...queryResult, data };
}
