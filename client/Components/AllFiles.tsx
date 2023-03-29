import { Text, FlatList, SafeAreaView } from 'react-native';
import { SearchBar } from './SearchBar';
import { getAllFiles } from '../utils/fileFiltering';
import styles from '../utils/styles';
import TagSelector from './TagSelector';

export default function AllFiles() {
    const result = getAllFiles();
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
            <FlatList testID='received-files' style={styles.safeArea} data={result.data} renderItem={({ item }) => <Text>{item.name}</Text>} />
        )
    }
    return (
        <SafeAreaView style={styles.safeArea}>
            <SearchBar/>
            <TagSelector />
            {content}
        </SafeAreaView>
    )
}
