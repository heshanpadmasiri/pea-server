import { useEffect, useState } from "react";
import { View, FlatList, Image, TouchableOpacity, Text, Modal, Alert, Button, Pressable } from "react-native";
import { fileContentUrl, Metadata } from "../../utils/services"

export type ImageGridProps = {
    imageFiles: Metadata[];
}

const ImageGrid = (props: ImageGridProps) => {
    const { imageFiles } = props;
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fullScreenIndex, setFullScreenIndex] = useState(0);

    const showFullScreenCallback = (index: number) => {
        return () => {
            if (isFullScreen) {
                return;
            }
            setFullScreenIndex(index);
            setIsFullScreen(true);
        }
    }

    useEffect(() => {
        console.log({ isFullScreen, fullScreenIndex });
    }, [isFullScreen, fullScreenIndex]);

    const imageProps = imageFiles.map((each, index) => {
        return {
            uri: fileContentUrl(each),
            showFullScreen: showFullScreenCallback(index),
        }
    });
    return (
        <View style={{ flex: 5 }}>
            <Modal
                animationType="slide"
                transparent={false}
                visible={isFullScreen}
                onRequestClose={() => {
                    setIsFullScreen(false);
                }}>
                <View>
                    <Pressable onLongPress={() => {setIsFullScreen(false);}}>
                        <SlideShow imageFiles={imageFiles} staringIndex={fullScreenIndex} />
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
}

function GridImage(props: ImageProps) {
    const { uri, showFullScreen } = props;
    const [width, setWidth] = useState(300);
    const [height, setHeight] = useState(300);
    Image.getSize(uri, (width, height) => {
        setWidth(width);
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
    imageFiles: Metadata[];
    staringIndex: number;
}

function SlideShow(props: SlideShowProps) {
    const [width, setWidth] = useState(300);
    const [height, setHeight] = useState(300);
    const [image, setImage] = useState(props.imageFiles[props.staringIndex]);
    const [uri, setUri] = useState(fileContentUrl(image));
    useEffect(() => {
        setUri(fileContentUrl(image));
    }, [image]);

    useEffect(() => {
        Image.getSize(uri, (width, height) => {
            setWidth(width);
            setHeight(height);
        });
    }, [uri]);
    return (
        <View style={{ flex: 1, alignSelf: "center" }} key={image.id}>
            <Image style={{ height, width }} source={{ uri }} />
        </View>

    );
}

export default ImageGrid;
