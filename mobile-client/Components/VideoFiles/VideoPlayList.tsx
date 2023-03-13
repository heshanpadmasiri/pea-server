import { FlatList, Text, View } from 'react-native';
import { fileContentUrl, Metadata } from '../../utils/services';
import styles from '../../utils/styles';
import { useGetFilesByTypeQuery } from '../../utils/apiSlice';
import React from 'react';
import { Video } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';

export default function VideoPlayList() {
    const result = useGetFilesByTypeQuery("mp4");
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
        const thumbnails = result.data.map((file: Metadata, index: number) => {
            return {
                index,
                id: file.id,
                url: fileContentUrl(file),
                title: file.name,
            }
        });
        content = (
            <FlatList data={thumbnails} renderItem={({ item }) => <ThumbnailCard {...item} />} />
        )
    }
    return (
        <View style={styles.safeArea}>
            {content}
        </View>
    )
}

type ThumbnailCardProps = {
    index: number;
    title: string
    url: string,
};


function ThumbnailCard(props: ThumbnailCardProps) {
    const title = props.title;
    return (
        <View style={styles.thumbnailCard}>
            <Text style={styles.thumbnailHeading}>{title}</Text>
            <VideoPlayer {...props} />
        </View>
    );
}

type VideoPlayerProps = {
    url: string;
}

function VideoPlayer(props: VideoPlayerProps) {
    let { url } = props;
    const source = { uri: url };
    const video = React.useRef<Video>(null);
    const setOrientation = () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }
    return (
        <Video
            ref={video}
            style={styles.video}
            source={source}
            useNativeControls
            isLooping
            onFullscreenUpdate={setOrientation}
        />
    );
}
