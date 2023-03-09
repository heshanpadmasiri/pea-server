import { useEffect, useState } from "react";
import { View, FlatList, Image, TouchableOpacity, Text, Modal, Alert, Button, Pressable, Dimensions } from "react-native";
import { fileContentUrl, Metadata } from "../../utils/services"

export type ImageGridProps = {
    imageFiles: Metadata[];
}

const ImageGrid = (props: ImageGridProps) => {
    const { imageFiles } = props;
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fullScreenIndex, setFullScreenIndex] = useState(0);
    const [fullScreenX, setFullScreenX] = useState(0);

    const maxWidth = Dimensions.get('window').width;
    const maxHeight = Dimensions.get('window').height;

    const showFullScreenCallback = (index: number) => {
        return () => {
            if (isFullScreen) {
                return;
            }
            setFullScreenIndex(index);
            setIsFullScreen(true);
        }
    }

    const imageProps = imageFiles.map((each, index) => {
        return {
            uri: fileContentUrl(each),
            showFullScreen: showFullScreenCallback(index),
            maxWidth
        }
    });
    return (
        <View style={{ flex: 5 }}>
            <Modal
                animationType="slide"
                transparent={false}
                statusBarTranslucent={true}
                visible={isFullScreen}
                onRequestClose={() => {
                    setIsFullScreen(false);
                }}>
                <View style={{backgroundColor: "black"}}>
                    <Pressable
                        onLongPress={() => { setIsFullScreen(false); }}
                        onPressIn={(event) => { setFullScreenX(event.nativeEvent.locationX); }}
                        onPressOut={(event) => {
                            const diff = event.nativeEvent.locationX - fullScreenX;
                            if (diff > 50) {
                                setFullScreenIndex((fullScreenIndex + 1) % imageFiles.length);
                            }
                            else if (diff < -50) {
                                setFullScreenIndex((fullScreenIndex - 1 + imageFiles.length) % imageFiles.length);
                            }
                            else {
                                setFullScreenX(event.nativeEvent.locationX);
                            }
                        }}
                    >
                        <SlideShow imageFile={imageFiles[fullScreenIndex]} maxHeight={maxHeight} maxWidth={maxWidth} />
                    </Pressable>
                </View>
            </Modal>
            <FlatList
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                data={imageProps}
                renderItem={({ item }) => <GridImage {...item} />}
                keyExtractor={item => item.uri}
            />
        </View>
    )
}

type ImageProps = {
    uri: string,
    showFullScreen: () => void,
    maxWidth: number;
}

function GridImage(props: ImageProps) {
    const { uri, showFullScreen, maxWidth } = props;
    const [width, setWidth] = useState(300);
    const [height, setHeight] = useState(300);
    Image.getSize(uri, (width, height) => {
        setWidth(Math.min(width, maxWidth));
        setHeight(height);
    });
    return (
        <View style={{ flex: 1, alignSelf: "center" }} key={uri}>
            <TouchableOpacity onPress={showFullScreen}>
                <Image style={{ height, width }} source={{ uri }} />
            </TouchableOpacity>
        </View>

    );
}

type SlideShowProps = {
    imageFile: Metadata;
    maxWidth: number;
    maxHeight: number;
}

function SlideShow(props: SlideShowProps) {
    const [width, setWidth] = useState(300);
    const [height, setHeight] = useState(300);
    const uri = fileContentUrl(props.imageFile);

    Image.getSize(uri, (width, height) => {
        setWidth(Math.min(width, props.maxWidth));
        setHeight(Math.min(height, props.maxHeight));
    });

    return (
        <Image style={{ height, width, resizeMode: "center" }} source={{ uri }} />
    );
}

export default ImageGrid;
