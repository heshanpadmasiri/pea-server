import { useState } from "react";
import { View, FlatList, Image, TouchableOpacity, Text, Modal, Pressable, Dimensions } from "react-native";
import { fileContentUrl, Metadata } from "../../utils/services"
import { useGetFilesByTypeQuery } from "../../utils/apiSlice";

const ImageGrid = () => {
    // TODO: have a array of files
    const IMAGE_TYPES = ["jpeg", "jpg", "png", "gif", "bmp", "tiff", "tif", "svg", "webp"];
    const resultArray = IMAGE_TYPES.map((each) => { return useGetFilesByTypeQuery(each); });
    const [isSlideShow, setIsSlideShow] = useState(false);
    const [slideShowIndex, setSlideShowIndex] = useState(0);
    const [lastTouchX, setLastTouchX] = useState(0);

    const maxWidth = Dimensions.get('window').width;
    const maxHeight = Dimensions.get('window').height;

    const showFullScreenCallback = (index: number) => {
        return () => {
            if (isSlideShow) {
                return;
            }
            setSlideShowIndex(index);
            setIsSlideShow(true);
        }
    }
    let content;
    if (resultArray.some((each) => each.isLoading)) {
        content = (<Text>Loading...</Text>);
    }
    else if (resultArray.some((each) => each.isError)) {
        content = (<Text>Error</Text>);
    }
    else if (resultArray.every((each) => each.isSuccess)) {
        const imageFiles = resultArray.reduce((acc, each) => {
            // I don't think this can ever happen
            if (each.data == undefined) {
                return acc;
            }
            return acc.concat(each.data);
        }, [] as Metadata[])
        const imageProps = imageFiles.map((each, index) => {
            return {
                uri: fileContentUrl(each),
                showFullScreen: showFullScreenCallback(index),
                maxWidth
            }
        });

        content = (
            <View>
                <Modal
                    animationType="slide"
                    transparent={false}
                    statusBarTranslucent={true}
                    visible={isSlideShow}
                    onRequestClose={() => {
                        setIsSlideShow(false);
                    }}>
                    <View style={{ backgroundColor: "black" }}>
                        <Pressable
                            onLongPress={() => { setIsSlideShow(false); }}
                            onPressIn={(event) => { setLastTouchX(event.nativeEvent.locationX); }}
                            onPressOut={(event) => {
                                const diff = event.nativeEvent.locationX - lastTouchX;
                                if (diff > 50) {
                                    setSlideShowIndex((slideShowIndex + 1) % imageFiles.length);
                                }
                                else if (diff < -50) {
                                    setSlideShowIndex((slideShowIndex - 1 + imageFiles.length) % imageFiles.length);
                                }
                                else {
                                    setLastTouchX(event.nativeEvent.locationX);
                                }
                            }}
                        >
                            <SlideShow imageFile={imageFiles[slideShowIndex]} maxHeight={maxHeight} maxWidth={maxWidth} />
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

    // useEffect(() => {
    //     if (!isSlideShow) {
    //         return;
    //     }
    //     const startIndex = slideShowIndex;
    //     setTimeout(() => {
    //         if (slideShowIndex != startIndex) {
    //             return;
    //         }
    //         setSlideShowIndex((slideShowIndex + 1) % imageFiles.length);
    //     }, 60000);
    // }, [slideShowIndex]);

    return (
        <View style={{ flex: 5 }}>
            {content}
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
    const { imageFile, maxWidth: width, maxHeight: height } = props;
    const uri = fileContentUrl(imageFile);

    return (
        <Image style={{ height, width, resizeMode: "contain" }} source={{ uri }} />
    );
}

export default ImageGrid;
