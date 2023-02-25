import { useEffect, useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import { ImageGallery, ImageObject } from '@georstat/react-native-image-gallery';
import { fileContentUrl, getImages, Metadata } from '../utils/services';
import { get_file_data_and_update_state } from '../utils/states';
import styles from '../utils/styles';
export default function ImageFiles() {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [files, setFiles] = useState<Metadata[]>([]);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const closeGallery = () => setGalleryOpen(false);
    const openGallery = () => setGalleryOpen(true);

    const renderHeaderComponent = (_image: ImageObject, _index: number) => {
        return <Button title='Close' onPress={closeGallery} />
    }
    useEffect(() => {
        get_file_data_and_update_state(getImages, setFiles, setIsLoading, setIsError);
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
        const images = files.map((file: Metadata) => {
            return { url: fileContentUrl(file)}
        });
        return (
            <SafeAreaView style={styles.safeArea}>
                <Button title='Open Gallery' onPress={openGallery}/>
                <ImageGallery isOpen={galleryOpen} close={closeGallery} images={images} renderHeaderComponent={renderHeaderComponent} />
            </SafeAreaView>
        )
    }
}
