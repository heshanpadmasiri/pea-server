import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, Text, View } from 'react-native';
import { getVideos, getVideosWithTags, Metadata } from '../../utils/services';
import styles from '../../utils/styles';
import TagSelector from '../TagSelector';
export default function VideoFiles() {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [files, setFiles] = useState<Metadata[]>([]);
    const [initialized, setInitialized] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    useEffect(() => {
        if (!initialized) {
            getVideosData(selectedTags, setFiles, setIsError, setIsLoading);
            setInitialized(true)
        }
    });

    const updateSelectedTags = (tags: string[]) => {
        setSelectedTags(tags)
        getVideosData(tags, setFiles, setIsError, setIsLoading);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <TagSelector updateSelectedTags={updateSelectedTags} selectedTags={selectedTags} />
            <VideoBody isLoading={isLoading} isError={isError} videos={files} />
        </SafeAreaView>
    )

}

function getVideosData(selectedTags: string[],
                       setVideoData: (videoData: Metadata[]) => void,
                       setIsError: (isError: boolean) => void,
                       setIsLoading: (isLoading: boolean) => void) {
    setIsLoading(true);
    const getter = selectedTags.length > 0 ? getVideosWithTags(selectedTags) : getVideos();
    getter.then((files) => {
        setVideoData(files);
    }).catch((err) => {
        console.error(err);
        setIsError(true);
    }).finally(() => {
        setIsLoading(false);
    });
}

type VideoBodyProps = {
    isLoading: boolean,
    isError: boolean,
    videos: Metadata[]
}

function VideoBody(props: VideoBodyProps) {
    const { isLoading, isError, videos } = props;
    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }
    else if (isError) {
        return (
            <View style={styles.container}>
                <Text>Error!</Text>
            </View>
        )
    }
    else {
        const data = videos.map((file: Metadata) => {
            return { key: file.name };
        });
        return (
            <View style={styles.safeArea}>
                <FlatList data={data} renderItem={({ item }) => <Text>{item.key}</Text>} />
            </View>
        )
    }
}
