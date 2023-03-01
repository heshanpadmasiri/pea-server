import { useEffect, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import { fileContentUrl, Metadata } from '../../utils/services';
import styles from '../../utils/styles';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { DataState, MetadataState } from '../../utils/states';

export type VideoBodyProps = {
    videos: MetadataState
}

export default function VideoPlayList(props: VideoBodyProps) {
    const { videos } = props;
    const [initialized, setInitialized] = useState(false);
    const [unmounted, setUnmounted] = useState(false);
    const [thumbnails, setThumbnails] = useState<ThumbnailCardProps[]>([]);
    const [thumbnailCount, setThumbnailCount] = useState(0);

    const createThumbnailsInBackground = async () => {
        console.error("xx");
        for (let index = 0; index < thumbnails.length; index++) {
            console.debug(`Start creating thumbnail for ${index}`);
            const thumbnail = await generateThumbnail(thumbnails[index].url);
            console.debug(`Done creating thumbnail for ${index}`);
            const newThumbnails = [...thumbnails];
            const current = thumbnails[index];
            console.log(current);
            const newThumbnail = { thumbnail , key: current.key, fileName: current.fileName, url: current.url };
            console.log(newThumbnail);
            newThumbnails[index] = newThumbnail;
            if (unmounted) {
                return;
            }
            setThumbnails(newThumbnails);
            console.debug(`Done updating state for ${index}`);
        }
    }

    const generateInitialThumbnails = (videos: Metadata[]) => {
        setThumbnails(videos.map((file: Metadata) => {
            return { key: file.id, fileName: file.name, url: fileContentUrl(file), thumbnail: AsyncState.loading  };
        }))
    }

    useEffect(() => {
        if (!initialized) {
            if (videos == "loading" || videos == "error") {
                return;
            }
            generateInitialThumbnails(videos);
            setInitialized(true);
            () => {
                setUnmounted(true);
            }
        }
    });

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
    else {
        return (
            <View style={styles.safeArea}>
                <FlatList extraData={thumbnails} data={thumbnails} renderItem={({ item }) => <ThumbnailCard key={item.key} fileName={item.fileName} url={item.url} thumbnail={item.thumbnail} />}  />
            </View>
        )
    }
}
const generateThumbnail = (url: string): Promise<Thumbnail> => {
    return new Promise((resolve, _) => {
        VideoThumbnails.getThumbnailAsync(url, ThumbnailOptions)
            .then((result) => {
                resolve({uri: result.uri});
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
    quality: 0,
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
