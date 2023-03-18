import { FlatList, SafeAreaView, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { QueryResult, useGetFilesByConditionQuery, useGetFilesByTypeQuery } from '../utils/apiSlice';
import { RootState } from '../utils/store';
import styles from '../utils/styles';
import TagSelector from './TagSelector';
export default function PdfFiles() {
    const selectedTags = useSelector((state: RootState) => state.tages.selectedTags);
    let result: QueryResult;
    if (selectedTags.length > 0) {
        result = useGetFilesByConditionQuery({ type: 'pdf', tags: selectedTags }) as QueryResult;
    }
    else {
        result = useGetFilesByTypeQuery('pdf') as QueryResult;
    }
    let content;
    if (result.isLoading) {
        content = (
            <Text>Loading...</Text>
        );
    }
    else if (result.isError) {
        console.error(result.error);
        content = (
            <Text>Error!</Text>
        )
    }
    else if (result.isSuccess) {
        content = (
            <FlatList style={{ flex: 1 }} data={result.data} renderItem={({ item }) => <Text>{item.name}</Text>} />
        )
    }
    return (
        <SafeAreaView style={styles.safeArea}>
            <TagSelector />
            {content}
        </SafeAreaView>

    )
}
