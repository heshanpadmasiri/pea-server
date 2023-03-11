import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Video } from 'expo-av';
import { SafeAreaView } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import styles from '../../utils/styles';
import TagSelector from '../TagSelector';
import VideoPlayList from './VideoPlayList';
import React from 'react';

export type VideoRouteParamList = {
    Selector: undefined;
    Player: { url: string };
}

export default function VideoFiles() {
    const Stack = createNativeStackNavigator<VideoRouteParamList>();
    return (
        <NavigationContainer independent={true}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Selector" component={VideoSelector} />
                <Stack.Screen name="Player" component={VideoPlayer} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

function VideoSelector() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <TagSelector/>
            <VideoPlayList/>
        </SafeAreaView>
    )
}

type VideoPlayerProps = NativeStackScreenProps<VideoRouteParamList, 'Player'>;

function VideoPlayer(props: VideoPlayerProps) {
    const uri = props.route.params.url;
    const video = React.useRef<Video>(null);
    video.current?.presentFullscreenPlayer();
    const setOrientation = () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }
    return (
            <Video
                ref={video}
                style={styles.video}
                source={{
                    uri,
                }}
                useNativeControls
                isLooping
                onFullscreenUpdate={setOrientation}
                onReadyForDisplay={() => {video.current?.presentFullscreenPlayer(); }}
            />
    );
}
