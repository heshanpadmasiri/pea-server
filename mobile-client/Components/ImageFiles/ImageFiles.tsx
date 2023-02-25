import { useEffect, useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import { ImageGallery, ImageObject } from '@georstat/react-native-image-gallery';
import { fileContentUrl, getImages, getImagesWithTags, Metadata } from '../../utils/services';
import styles from '../../utils/styles';
import ImageGrid from './ImageGrid';
import TagSelector from '../TagSelector';
export default function ImageFiles() {
    const [isLoading, setIsLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [isError, setIsError] = useState(false);
    const [images, setImages] = useState<ImageObject[]>([]);
    const [imageData, setImageData] = useState<Metadata[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    useEffect(() => {
        if (!initialized) {
            getImageData(selectedTags, setImageData, setImages, setIsError, setIsLoading);
            setInitialized(true);
        }
    });

    const updateSelectedTags = (tags: string[]) => {
        console.log("update tags: " + tags.toString())
        setSelectedTags(tags)
        getImageData(tags, setImageData, setImages, setIsError, setIsLoading);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <TagSelector updateSelectedTags={updateSelectedTags} selectedTags={selectedTags} />
            <ImageBody isLoading={isLoading} isError={isError} images={images} imageData={imageData} />
        </SafeAreaView>
    )
}

type ImageBodyProps = {
    isLoading: boolean,
    isError: boolean,
    images: ImageObject[],
    imageData: Metadata[],
}

function ImageBody(props: ImageBodyProps) {
    const { isLoading, isError, images, imageData } = props;
    const [galleryOpen, setGalleryOpen] = useState(false);
    const closeGallery = () => setGalleryOpen(false);
    const openGallery = () => setGalleryOpen(true);
    const renderHeaderComponent = (_image: ImageObject, _index: number) => {
        return <Button title='Close' onPress={closeGallery} />
    }
    if (isLoading) {
        return (
            <Text>Loading...</Text>
        );
    }
    else if (isError) {
        return (
            <Text>Error!</Text>
        )
    }
    else {
        return (
            <View style={styles.safeArea}>
                <Button title='Open Gallery' onPress={openGallery} />
                <ImageGallery isOpen={galleryOpen} close={closeGallery} images={images} renderHeaderComponent={renderHeaderComponent} />
                <ImageGrid imageFiles={imageData} />
            </View>
        )
    }
}

function getImageData(selectedTags: string[],
                      setImageData: (value: Metadata[]) => void,
                      setImages: (value: ImageObject[]) => void,
                      setIsError: (value: boolean) => void,
                      setIsLoading: (value: boolean) => void) {
    setIsLoading(true);
    const imageGetter = selectedTags.length > 0 ? getImagesWithTags(selectedTags) : getImages();
    console.log(selectedTags);
    imageGetter.then((files: Metadata[]) => {
        const images = files.map((file: Metadata) => {
            return { url: fileContentUrl(file) }
        });
        setImageData(files);
        setImages(images);
    }).catch((err) => {
        console.error(err);
        setIsError(true);
    }).finally(() => {
        setIsLoading(false);
    });
}
