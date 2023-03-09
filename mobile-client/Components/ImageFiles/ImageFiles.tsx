import { useEffect, useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { getImages, getImagesWithTags, Metadata } from '../../utils/services';
import styles from '../../utils/styles';
import ImageGrid from './ImageGrid';
import TagSelector from '../TagSelector';
export default function ImageFiles() {
    const [isLoading, setIsLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [isError, setIsError] = useState(false);
    const [imageData, setImageData] = useState<Metadata[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    useEffect(() => {
        if (!initialized) {
            getImageData(selectedTags, setImageData, setIsError, setIsLoading);
            setInitialized(true);
        }
    });

    const updateSelectedTags = (tags: string[]) => {
        setSelectedTags(tags)
        getImageData(tags, setImageData, setIsError, setIsLoading);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <TagSelector updateSelectedTags={updateSelectedTags} selectedTags={selectedTags} />
            <ImageBody isLoading={isLoading} isError={isError} imageData={imageData} />
        </SafeAreaView>
    )
}

type ImageBodyProps = {
    isLoading: boolean,
    isError: boolean,
    imageData: Metadata[],
}

function ImageBody(props: ImageBodyProps) {
    const { isLoading, isError, imageData } = props;
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
                <ImageGrid imageFiles={imageData} />
            </View>
        )
    }
}

function getImageData(selectedTags: string[],
                      setImageData: (value: Metadata[]) => void,
                      setIsError: (value: boolean) => void,
                      setIsLoading: (value: boolean) => void) {
    setIsLoading(true);
    const imageGetter = selectedTags.length > 0 ? getImagesWithTags(selectedTags) : getImages();
    imageGetter.then((files: Metadata[]) => {
        setImageData(files);
    }).catch((err) => {
        console.error(err);
        setIsError(true);
    }).finally(() => {
        setIsLoading(false);
    });
}
