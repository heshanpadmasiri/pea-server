import { SafeAreaView } from 'react-native';
import styles from '../../utils/styles';
import ImageGrid from './ImageGrid';
import TagSelector from '../TagSelector';
import { SearchBar } from '../SearchBar';

export default function ImageFiles() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <SearchBar/>
            <TagSelector />
            <ImageGrid />
        </SafeAreaView>
    )
}
