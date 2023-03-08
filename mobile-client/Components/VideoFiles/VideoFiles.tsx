import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Video } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { getVideos, getVideosWithTags } from '../../utils/services';
import { AsyncState, MetadataState } from '../../utils/states';
import styles from '../../utils/styles';
import TagSelector from '../TagSelector';
import VideoPlayList from './VideoPlayList';

export default function VideoFiles() {
    const Stack = createNativeStackNavigator();
    return (
        <NavigationContainer independent={true}>
            <Stack.Navigator>
                <Stack.Screen name="Selector" component={VideoSelector} />
                <Stack.Screen name="Player" component={VideoPlayer} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

function VideoSelector() {
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

function VideoPlayer({ route }) {
    const uri = route.params.url;
    const video = React.useRef(null);
    return (
        <View style={styles.container}>
            <Video
                ref={video}
                style={styles.video}
                source={{
                    uri,
                }}
                useNativeControls
                resizeMode="contain"
                isLooping
            />
        </View>
    );
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
