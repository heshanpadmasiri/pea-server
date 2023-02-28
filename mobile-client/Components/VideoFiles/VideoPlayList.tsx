import { useEffect, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import { fileContentUrl, Metadata } from '../../utils/services';
import styles from '../../utils/styles';
import * as VideoThumbnails from 'expo-video-thumbnails';

export type VideoBodyProps = {
    isLoading: boolean,
    isError: boolean,
    videos: Metadata[]
}

export default function VideoPlayList(props: VideoBodyProps) {
    const { isLoading, isError, videos } = props;
    const [thumbnailReady, setThumbnailReady] = useState(new Array(videos.length).fill(false));

    const notifyIthReady = (i: number) => {
        return () => {
            console.log("Thumbnail " + i + " is ready!");
            let newReady = [...thumbnailReady];
            newReady[i] = true;
            setThumbnailReady(newReady);
        }
    }

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
        const data = videos.map((file: Metadata, index: number) => {
            return { key: file.id, fileName: file.name, url: fileContentUrl(file), notifyReady: notifyIthReady(index) };
        });
        return (
            <View style={styles.safeArea}>
                <FlatList data={data} extraData={thumbnailReady} renderItem={({ item }) => <ThumbnailCard fileName={item.fileName} url={item.url} notifyReady={item.notifyReady} />}  />
            </View>
        )
    }
}

type ThumbnailCardProps = {
    fileName: string,
    url: string,
    notifyReady: () => void
}

function ThumbnailCard(props: ThumbnailCardProps) {
    const { fileName, url, notifyReady } = props;
    return (
        <View style={styles.thumbnailCard}>
            <Text style={styles.thumbnailHeading}>{fileName}</Text>
            <Thumbnail url={url} notifyReady={notifyReady} />
        </View>
    );
}

type ThumbnailProps = {
    url: string
    notifyReady: () => void
}

const ThumbnailOptions = {
    quality: 0,
    time: 1000
}

function Thumbnail(props: ThumbnailProps) {
    let { url, notifyReady } = props;
    const [thumbnail, setThumbnail] = useState("");
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [unmounted, setUnmounted] = useState(false);

    const generateThumbnail = (url: string) => {
        setIsLoading(true);
        VideoThumbnails.getThumbnailAsync(url, ThumbnailOptions)
            .then((result) => {
                if (!unmounted) {
                    setThumbnail(result.uri);
                }
            }).catch((err) => {
                console.error(err);
                setIsError(true);
            }).finally(() => {
                notifyReady();
                setIsLoading(false)
            });
    }

    useEffect(() => {
        if (!initialized) {
            generateThumbnail(url);
            setInitialized(true)
        }
        return () => {
            setUnmounted(true);
        }
    });

    if (isLoading) {
        return (
            <View>
                <Text>Loading...</Text>
            </View>
        )
    }
    else if (isError) {
        return (
            <View>
                <Text>Error loading thumbnail!</Text>
            </View>
        )
    }
    else {
        return (
            <View>
                <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
            </View>
        )
    }

}
