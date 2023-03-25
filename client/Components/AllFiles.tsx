import { Text, FlatList, SafeAreaView } from 'react-native';
import { getAllFiles } from '../utils/fileFiltering';
import styles from '../utils/styles';
import TagSelector from './TagSelector';

export default function AllFiles() {
    let result = getAllFiles();
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
