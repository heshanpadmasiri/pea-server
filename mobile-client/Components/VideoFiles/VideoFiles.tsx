import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { getVideos, getVideosWithTags } from '../../utils/services';
import { AsyncState, MetadataState } from '../../utils/states';
import styles from '../../utils/styles';
import TagSelector from '../TagSelector';
import VideoPlayList from './VideoPlayList';
export default function VideoFiles() {
    const [files, setFiles] = useState<MetadataState>(AsyncState.loading);
    const [initialized, setInitialized] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    useEffect(() => {
        if (!initialized) {
            getVideosData(selectedTags, setFiles);
            setInitialized(true)
        }
    });

    const updateSelectedTags = (tags: string[]) => {
        setSelectedTags(tags)
        getVideosData(tags, setFiles);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <TagSelector updateSelectedTags={updateSelectedTags} selectedTags={selectedTags} />
            <VideoPlayList videos={files} />
        </SafeAreaView>
    )

}

function getVideosData(selectedTags: string[],
                       setFiles: (state: MetadataState) => void) {
    setFiles(AsyncState.loading);
    const getter = selectedTags.length > 0 ? getVideosWithTags(selectedTags) : getVideos();
    getter.then((files) => {
        setFiles(files);
    }).catch((err) => {
        console.error(err);
        setFiles(AsyncState.error);
    });
}
