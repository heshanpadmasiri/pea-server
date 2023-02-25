import { useEffect, useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { ImageGallery } from '@georstat/react-native-image-gallery';
import { fileContentUrl, getImages, Metadata } from '../utils/services';
import { get_file_data_and_update_state } from '../utils/states';
import styles from '../utils/styles';
export default function ImageFiles() {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [files, setFiles] = useState<Metadata[]>([]);
    const [galleryOpen, setGalleryOpen] = useState(true);
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
        const closeGallery = () => setGalleryOpen(false);
        const images = files.map((file: Metadata) => {
            return { url: fileContentUrl(file)}
        });
        // TODO: properly render images
        return (
            <SafeAreaView style={styles.safeArea}>
                <ImageGallery isOpen={galleryOpen} close={closeGallery} images={images} />
            </SafeAreaView>
        )
    }
}
