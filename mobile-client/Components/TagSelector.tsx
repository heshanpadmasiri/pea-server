import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { getTags } from "../utils/services";
import { get_data_and_update_state } from "../utils/states";
import styles from "../utils/styles";

export type TagSelectorProps = {
    updateSelectedTags: (tags: string[]) => void;
    selectedTags: string[];
}

const TagSelector = (props: TagSelectorProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [isError, setIsError] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>(props.selectedTags);
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        if(!initialized) {
            get_data_and_update_state<string>(getTags, setTags, setIsLoading, setIsError);
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
        );
    }
    else {
        return (<Text>Tag selector</Text>);
    }
}

export default TagSelector
