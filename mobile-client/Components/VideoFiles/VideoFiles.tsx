import { SafeAreaView } from 'react-native';
import styles from '../../utils/styles';
import TagSelector from '../TagSelector';
import VideoPlayList from './VideoPlayList';
import React from 'react';

export default function VideoFiles() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <TagSelector/>
            <VideoPlayList/>
        </SafeAreaView>
    )
}
