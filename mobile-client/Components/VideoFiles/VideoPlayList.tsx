import { useEffect, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import { fileContentUrl, Metadata } from '../../utils/services';
import styles from '../../utils/styles';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { MetadataState } from '../../utils/states';

export type VideoBodyProps = {
    videos: MetadataState
}

export default function VideoPlayList(props: VideoBodyProps) {
    const { videos } = props;
    const [unmounted, setUnmounted] = useState(false);
    const [loadingThumbnails, setLoadingThumbnails] = useState<ThumbnailCardProps[]>([]);
    const [thumbnails, setThumbnails] = useState<ThumbnailCardProps[]>([]);
    const [thumbnailsReady, setThumbnailsReady] = useState(false);

    const createThumbnailsInBackground = async () => {
        let renderedThumbnails = [];
        for (let index = 0; index < loadingThumbnails.length; index++) {
            const thumbnail = await generateThumbnail(loadingThumbnails[index].url);
            const newThumbnailProp = { ...loadingThumbnails[index], thumbnail };
            renderedThumbnails.push(newThumbnailProp);
            if (unmounted) {
                return;
            }
            const newThumbnails = [...renderedThumbnails, ...loadingThumbnails.slice(index + 1)];
            setThumbnails(newThumbnails);
            setThumbnailsReady(true);
        }
    }

    const generateLoadingThumbnails = (videos: Metadata[]) => {
        setLoadingThumbnails(videos.map((file: Metadata) => {
            return { key: file.id, fileName: file.name, url: fileContentUrl(file), thumbnail: AsyncState.loading };
        }))
    }

    useEffect(() => {
        if (videos == "loading" || videos == "error") {
            return;
        }
        generateLoadingThumbnails(videos);
    }, [videos]);

    useEffect(() => {
        createThumbnailsInBackground();
        return () => {
            setUnmounted(true);
            setThumbnailsReady(false)
        }
    }, [loadingThumbnails]);

    if (videos == "loading") {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }
    else if (videos == "error") {
        return (
            <View style={styles.container}>
                <Text>Error!</Text>
            </View>
        )
    }
    else if (!thumbnailsReady) {
        return (
            <View style={styles.safeArea}>
                <FlatList data={loadingThumbnails} renderItem={({ item }) => <ThumbnailCard key={item.key} fileName={item.fileName} url={item.url} thumbnail={item.thumbnail} />} />
            </View>
        )
    }
    else {
        return (
            <View style={styles.safeArea}>
                <FlatList extraData={thumbnails} data={thumbnails} renderItem={({ item }) => <ThumbnailCard key={item.key} fileName={item.fileName} url={item.url} thumbnail={item.thumbnail} />} />
            </View>
        )
    }
}
const generateThumbnail = (url: string): Promise<Thumbnail> => {
    return new Promise((resolve, _) => {
        VideoThumbnails.getThumbnailAsync(url, ThumbnailOptions)
            .then((result) => {
                resolve({ uri: result.uri });
            }).catch((err) => {
                resolve(AsyncState.error);
            });

    });
}

type ThumbnailCardProps = {
    fileName: string,
    url: string,
    thumbnail: Thumbnail,
    key: string,
}

type Thumbnail = AsyncState | { uri: string }
enum AsyncState {
    loading = "loading",
    error = "error"
};

function ThumbnailCard(props: ThumbnailCardProps) {
    const { fileName, url, thumbnail } = props;
    return (
        <View style={styles.thumbnailCard}>
            <Text style={styles.thumbnailHeading}>{fileName}</Text>
            <Thumbnail thumbnail={thumbnail} />
        </View>
    );
}

type ThumbnailProps = {
    thumbnail: Thumbnail
}

const ThumbnailOptions = {
    quality: 0.8,
    time: 1000
}

function Thumbnail(props: ThumbnailProps) {
    let { thumbnail } = props;
    if (thumbnail == "loading") {
        return (
            <View>
                <Text>Loading...</Text>
            </View>
        )
    }
    else if (thumbnail == "error") {
        return (
            <View>
                <Text>Error loading thumbnail!</Text>
            </View>
        )
    }
    else {
        return (
            <View>
                <Image source={thumbnail} style={styles.thumbnail} />
            </View>
        )
    }

}
