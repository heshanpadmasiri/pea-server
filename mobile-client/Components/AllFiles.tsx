import { Text, FlatList, SafeAreaView } from 'react-native';
import { useSelector } from "react-redux";
import { QueryResult, useGetFilesByConditionQuery, useGetFilesQuery } from "../utils/apiSlice";
import { RootState } from "../utils/store";
import styles from "../utils/styles";
import TagSelector from "./TagSelector";

export default function AllFiles() {
    const selectedTags = useSelector((state: RootState) => state.tages.selectedTags);
    let result: QueryResult;
    if (selectedTags.length > 0) {
        result = useGetFilesByConditionQuery({ type: "", tags: selectedTags }) as QueryResult;
    }
    else {
        result = useGetFilesQuery() as QueryResult;
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
