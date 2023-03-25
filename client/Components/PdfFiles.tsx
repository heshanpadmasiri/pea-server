import { FlatList, SafeAreaView, Text } from 'react-native';
import { getFilesByType } from '../utils/fileFiltering';
import styles from '../utils/styles';
import TagSelector from './TagSelector';
export default function PdfFiles() {
    const result = getFilesByType('pdf');
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
