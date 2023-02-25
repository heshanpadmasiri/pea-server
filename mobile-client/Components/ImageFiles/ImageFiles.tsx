import { useEffect, useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import { ImageGallery, ImageObject } from '@georstat/react-native-image-gallery';
import { fileContentUrl, getImages, Metadata } from '../../utils/services';
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

    const [galleryOpen, setGalleryOpen] = useState(false);
    useEffect(() => {
        if(!initialized) {
            getImageData(setImageData, setImages, setIsError, setIsLoading);
            setInitialized(true);
        }
    });

    const closeGallery = () => setGalleryOpen(false);
    const openGallery = () => setGalleryOpen(true);
    const renderHeaderComponent = (_image: ImageObject, _index: number) => {
        return <Button title='Close' onPress={closeGallery} />
    }

    const updateSelectedTags = (tags: string[]) => setSelectedTags(tags);

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
        // TODO: support refreshing by pulling down
        // TODO: support tag selection
        return (
            <SafeAreaView style={styles.safeArea}>
                <TagSelector updateSelectedTags={updateSelectedTags} selectedTags={selectedTags} />
                <Button title='Open Gallery' onPress={openGallery}/>
                <ImageGallery isOpen={galleryOpen} close={closeGallery} images={images} renderHeaderComponent={renderHeaderComponent} />
                <ImageGrid imageFiles={imageData} />
            </SafeAreaView>
        )
    }
}

function getImageData(setImageData: (value: Metadata[]) => void,
                      setImages: (value: ImageObject[]) => void,
                      setIsError: (value: boolean) => void,
                      setIsLoading: (value: boolean) => void) {
    getImages().then((files: Metadata[]) => {
        const images = files.map((file: Metadata) => {
            return { url: fileContentUrl(file)}
        });
        setImageData(files);
        setImages(images);
    }).catch((_err) => {
        setIsError(true);
    }).finally(() => {
        setIsLoading(false);
    });
}
