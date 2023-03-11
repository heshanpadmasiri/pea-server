import { SafeAreaView } from 'react-native';
import styles from '../../utils/styles';
import ImageGrid from './ImageGrid';
import TagSelector from '../TagSelector';

export default function ImageFiles() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <TagSelector />
            <ImageGrid />
        </SafeAreaView>
    )
}
