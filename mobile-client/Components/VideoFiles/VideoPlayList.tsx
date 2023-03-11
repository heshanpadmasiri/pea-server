import { FlatList, Image, Text, TouchableHighlight, View } from 'react-native';
import { fileContentUrl, Metadata } from '../../utils/services';
import styles from '../../utils/styles';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { AsyncState } from '../../utils/states';
import { useNavigation } from '@react-navigation/native';
import { VideoRouteParamList } from './VideoFiles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGetFilesByTypeQuery } from '../../utils/apiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../utils/store';
import { initializeThumbnailProps, Thumbnail, updateThumbnailProp } from '../../utils/videoSlice';

export default function VideoPlayList() {
    const result = useGetFilesByTypeQuery("mp4");
    const thumbnailProps = useSelector((state: RootState) => state.video.thumbnailProps);
    const initialized = useSelector((state: RootState) => state.video.initialized);

    const dispatch = useDispatch();

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
        if (!initialized) {
            const thumbnails = result.data.map((file: Metadata, index: number) => {
                return {
                    index,
                    id: file.id,
                    url: fileContentUrl(file),
                    thumbnail: AsyncState.loading,
                    title: file.name,
                }
            });
            dispatch(initializeThumbnailProps(thumbnails));
        }
        content = (
            <FlatList data={thumbnailProps} renderItem={({ item }) => <ThumbnailCard {...item} />} />
        )
    }
    return (
        <View style={styles.safeArea}>
            {content}
        </View>
    )
}


const generateThumbnail = (url: string): Promise<Thumbnail> => {
    return new Promise((resolve, _) => {
        VideoThumbnails.getThumbnailAsync(url, ThumbnailOptions)
            .then((result) => {
                resolve({ uri: result.uri });
            }).catch((err) => {
                console.error(err);
                resolve(AsyncState.error);
            });

    });
}

type ThumbnailCardProps = {
    index: number;
    title: string
    url: string,
    thumbnail: Thumbnail
};

type NavigationType = NativeStackScreenProps<VideoRouteParamList, 'Selector'>['navigation'];

function ThumbnailCard(props: ThumbnailCardProps) {
    const dispatch = useDispatch();
    const { index, title, url } = props;
    const navigation = useNavigation<NavigationType>();

    if (props.thumbnail == AsyncState.loading) {
        generateThumbnail(url).then((thumbnail) => {
            dispatch(updateThumbnailProp({ index, thumbnail }));
        });
    }

    return (
        <TouchableHighlight onPress={() => {navigation.navigate('Player', {url});}}>
            <View style={styles.thumbnailCard}>
                <Text style={styles.thumbnailHeading}>{title}</Text>
                <ThumbnailImage {...props} />
            </View>
        </TouchableHighlight>
    );
}

const ThumbnailOptions = {
    quality: 0.8,
    time: 1000
}

type ThumbnailImageProps = {
    thumbnail: Thumbnail
}

function ThumbnailImage(props: ThumbnailImageProps) {
    let { thumbnail } = props;
    if (thumbnail == AsyncState.loading) {
        return (
            <View>
                <Text>Loading...</Text>
            </View>
        )
    }
    else if (thumbnail == AsyncState.error) {
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
