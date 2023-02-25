import { useEffect, useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import { ImageGallery, ImageObject } from '@georstat/react-native-image-gallery';
import { fileContentUrl, getImages, Metadata } from '../utils/services';
import { get_file_data_and_update_state } from '../utils/states';
import styles from '../utils/styles';
export default function ImageFiles() {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [images, setImages] = useState<ImageObject[]>([]);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const closeGallery = () => setGalleryOpen(false);
    const openGallery = () => setGalleryOpen(true);

    const renderHeaderComponent = (_image: ImageObject, _index: number) => {
        return <Button title='Close' onPress={closeGallery} />
    }
    useEffect(() => {
        get_file_data_and_update_state<ImageObject>(getImageObjs, setImages, setIsLoading, setIsError);
    });
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
        return (
            <SafeAreaView style={styles.safeArea}>
                <Button title='Open Gallery' onPress={openGallery}/>
                <ImageGallery isOpen={galleryOpen} close={closeGallery} images={images} renderHeaderComponent={renderHeaderComponent} />
            </SafeAreaView>
        )
    }
}

function getImageObjs(): Promise<ImageObject[]> {
    return new Promise((resolve, reject) => {
        getImages().then((files: Metadata[]) => {
            const images = files.map((file: Metadata) => {
                return { url: fileContentUrl(file)}
            });
            resolve(images);
        }).catch((err) => {
            reject(err);
        })
    });
}
