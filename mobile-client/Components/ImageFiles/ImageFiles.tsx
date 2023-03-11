import { SafeAreaView, Text, View } from 'react-native';
import styles from '../../utils/styles';
import ImageGrid from './ImageGrid';
import TagSelector from '../TagSelector';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../utils/store';
import { useEffect } from 'react';
import { imagePageInitialized } from '../../utils/componentSlice';

export default function ImageFiles() {

    const initialized = useSelector((state: RootState) => state.components.imagePageInitialized);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!initialized) {
            dispatch(imagePageInitialized());
        }
    }, [initialized]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <TagSelector />
            <ImageGrid />
        </SafeAreaView>
    )
}
