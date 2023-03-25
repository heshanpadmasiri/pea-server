import { useEffect, useState } from 'react';
import { View, FlatList, Image, TouchableOpacity, Text, Modal, Pressable, Dimensions } from 'react-native';
import { fileContentUrl, Metadata } from '../../utils/apiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../utils/store';
import { endSlideShow, setCurrentIndex, setMaxIndex, setTouchPoint, startSlideShow } from '../../utils/slideShowSlice';
import { getFilesByTypes } from '../../utils/fileFiltering';

const ImageGrid = () => {
    const SLIDE_SHOW_INTERVAL = 30000;
    const inSlideShow = useSelector((state: RootState) => state.slideShow.inSlideShow);
    const lastTouchX = useSelector((state: RootState) => state.slideShow.lastTouchX);
    const slideShowIndex = useSelector((state: RootState) => state.slideShow.currentIndex);
    const maxIndex = useSelector((state: RootState) => state.slideShow.maxIndex);
    const dispatch = useDispatch();
    const maxWidth = Dimensions.get('window').width;
    const maxHeight = Dimensions.get('window').height;
    const IMAGE_TYPES = ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'svg', 'webp'];
    const resultArray = getFilesByTypes(IMAGE_TYPES);

    useEffect(() => {
        if (!inSlideShow) {
            return;
        }
        const startIndex = slideShowIndex;
        setTimeout(() => {
            if (slideShowIndex != startIndex) {
                return;
            }
            dispatch(setCurrentIndex((slideShowIndex + 1) % maxIndex));
        }, SLIDE_SHOW_INTERVAL);
    }, [inSlideShow, slideShowIndex]);

    useEffect(() => {
        if (resultArray.every((each) => each.isSuccess)) {
            const newMaxIndex = resultArray.length;
            if (newMaxIndex != maxIndex) {
                dispatch(setMaxIndex(resultArray.length));
            }
        }
    }, [resultArray]);

    let content;
    if (resultArray.some((each) => each.isLoading)) {
        content = (<Text>Loading...</Text>);
    }
    else if (resultArray.some((each) => each.isError)) {
        resultArray.filter((each) => each.isError).forEach((each) => console.error(each.error));
        content = (<Text>Error!</Text>);
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
                index,
                maxWidth
            }
        });

        content = (
            <View>
                <Modal
                    animationType="slide"
                    transparent={false}
                    statusBarTranslucent={true}
                    visible={inSlideShow}
                    onRequestClose={() => {
                        dispatch(endSlideShow());
                    }}>
                    <View style={{ backgroundColor: 'black' }}>
                        <Pressable
                            onLongPress={() => {
                                dispatch(endSlideShow());
                            }}
                            onPressIn={(event) => {
                                dispatch(setTouchPoint(event.nativeEvent.locationX));
                            }}
                            onPressOut={(event) => {
                                const diff = event.nativeEvent.locationX - lastTouchX;
                                if (diff > 50) {
                                    dispatch(setCurrentIndex((slideShowIndex + 1) % imageFiles.length));
                                }
                                else if (diff < -50) {
                                    dispatch(setCurrentIndex((slideShowIndex - 1 + imageFiles.length) % imageFiles.length));
                                }
                                else {
                                    dispatch(setTouchPoint(event.nativeEvent.locationX));
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

    return (
        <View style={{ flex: 5 }}>
            {content}
        </View>
    )
}

type ImageProps = {
    uri: string,
    index: number,
    maxWidth: number;
}

function GridImage(props: ImageProps) {
    const { uri, index, maxWidth } = props;
    const [width, setWidth] = useState(300);
    const [height, setHeight] = useState(300);
    const dispatch = useDispatch();
    Image.getSize(uri, (width, height) => {
        setWidth(Math.min(width, maxWidth));
        setHeight(height);
    });

    const showFullScreen = () => {
        dispatch(setCurrentIndex(index));
        dispatch(startSlideShow());
    }

    return (
        <View style={{ flex: 1, alignSelf: 'center' }} key={uri}>
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
        <Image style={{ height, width, resizeMode: 'contain' }} source={{ uri }} />
    );
}

export default ImageGrid;
