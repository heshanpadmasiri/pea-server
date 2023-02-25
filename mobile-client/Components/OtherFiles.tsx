import { useState } from "react";
import { Text, View, FlatList, SafeAreaView } from 'react-native';
import { getFiles, Metadata } from "../utils/services";
import { get_file_data_and_update_state } from "../utils/states";
import styles from "../utils/styles";

export default function OtherFiles() {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [files, setFiles] = useState<Metadata[]>([]);

    get_file_data_and_update_state(getFiles, setFiles, setIsLoading, setIsError);

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
