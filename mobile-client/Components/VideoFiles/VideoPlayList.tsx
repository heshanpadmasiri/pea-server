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
            return { key: file.id, fileName: file.name, url: fileContentUrl(file), thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg" };
        });
        return (
            <View style={styles.safeArea}>
                <FlatList data={data} extraData={data} renderItem={({ item }) => <ThumbnailCard fileName={item.fileName} url={item.url} thumbnailUrl={item.thumbnailUrl} />}  />
            </View>
        )
    }
}

type ThumbnailCardProps = {
    fileName: string,
    url: string,
    thumbnailUrl: string
}

function ThumbnailCard(props: ThumbnailCardProps) {
    const { fileName, url, thumbnailUrl } = props;
    return (
        <View style={styles.thumbnailCard}>
            <Text style={styles.thumbnailHeading}>{fileName}</Text>
            <Thumbnail url={url} thumbnailUrl={thumbnailUrl} />
        </View>
    );
}

type ThumbnailProps = {
    url: string
    thumbnailUrl: string
}

const ThumbnailOptions = {
    quality: 0,
    time: 1000
}

function Thumbnail(props: ThumbnailProps) {
    let { url, thumbnailUrl } = props;
    const [thumbnail, setThumbnail] = useState(thumbnailUrl);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const generateThumbnail = (url: string) => {
        setIsLoading(true);
        VideoThumbnails.getThumbnailAsync(url, ThumbnailOptions)
            .then((result) => {
                thumbnailUrl = result.uri;
                setThumbnail(thumbnailUrl);
            }).catch((err) => {
                console.error(err);
                setIsError(true);
            }).finally(() => {
                setIsLoading(false)
            });
    }

    useEffect(() => {
        if (!initialized) {
            generateThumbnail(url);
            setInitialized(true)
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
