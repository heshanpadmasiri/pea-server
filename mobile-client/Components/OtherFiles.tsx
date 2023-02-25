import { useEffect, useState } from "react";
import { Text, View, FlatList, SafeAreaView } from 'react-native';
import { getFiles, isImage, isPdf, isVideo, Metadata } from "../utils/services";
import { get_file_data_and_update_state } from "../utils/states";
import styles from "../utils/styles";

export default function OtherFiles() {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [files, setFiles] = useState<Metadata[]>([]);
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        if (!initialized) {
            get_file_data_and_update_state<Metadata>(getOtherFiles, setFiles, setIsLoading, setIsError);
            setInitialized(true);
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
        return (
            <SafeAreaView style={styles.safeArea}>
                <FlatList data={data} renderItem={({ item }) => <Text>{item.key}</Text>} />
            </SafeAreaView>
        )
    }
}

function getOtherFiles(): Promise<Metadata[]> {
    return new Promise((resolve, reject) => {
        getFiles().then((files: Metadata[]) => {
            const other_files: Metadata[] = [];
            for (const file of files) {
                if (!isImage(file) && !isPdf(file) && !isVideo(file)) {
                    other_files.push(file);
                }
            }
            resolve(other_files);
        }).catch((err) => {
            reject(err);
        })
    });
}
