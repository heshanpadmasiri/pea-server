import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, Text, View } from 'react-native';
import { getVideos, Metadata } from '../utils/services';
import { get_file_data_and_update_state } from '../utils/states';
import styles from '../utils/styles';
export default function VideoFiles() {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [files, setFiles] = useState<Metadata[]>([]);
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        if (!initialized) {
            get_file_data_and_update_state<Metadata>(getVideos, setFiles, setIsLoading, setIsError);
            setInitialized(true)
        }
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
        const data = files.map((file: Metadata) => {
            return { key: file.name };
        })
        // TODO: properly render images
        return (
            <SafeAreaView style={styles.safeArea}>
                <FlatList data={data} renderItem={({ item }) => <Text>{item.key}</Text>} />
            </SafeAreaView>
        )
    }

}
