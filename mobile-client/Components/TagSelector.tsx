import { useEffect, useState } from "react";
import { View, Text, Switch, ScrollView } from "react-native";
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
        if (!initialized) {
            get_data_and_update_state<string>(getTags, setTags, setIsLoading, setIsError);
            setInitialized(true);
        }
    });


    const selectorToggleFunction = (tag: string) => {
        return (val: boolean) => {
            if (!val) {
                setSelectedTags(selectedTags.filter((selectedTag) => selectedTag !== tag));
            }
            else {
                setSelectedTags([...selectedTags, tag]);
            }
            props.updateSelectedTags(selectedTags);
        }
    }

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
        const selectors = tags.map((tag) => {
            return (
                <Selector
                    key={tag}
                    tag={tag}
                    selected={selectedTags.includes(tag)}
                    toggleFunction={selectorToggleFunction(tag)}
                />
            )
        })
        return (<ScrollView>{selectors}</ScrollView>);
    }
}

export default TagSelector

type SelectorProps = {
    tag: string;
    selected: boolean;
    toggleFunction: (val: boolean) => void;
}

const Selector = (props: SelectorProps) => {
    const enabled = props.selected;
    const toggleSwitch = props.toggleFunction;
    return (
        <View style={styles.switch_container}>
            <Text>{props.tag}</Text>
            <Switch
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={enabled ? '#f5dd4b' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={enabled}
            />
        </View>
    )
}
