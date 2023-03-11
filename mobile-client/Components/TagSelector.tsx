import { useEffect, useMemo } from "react";
import { View, Text, Switch, ScrollView } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { tagSelectorInitialized } from "../utils/componentSlice";
import { RootState } from "../utils/store";
import styles from "../utils/styles";
import { selectTag, unselectTag } from "../utils/tagSlice";
import { useGetTagsQuery } from "../utils/apiSlice";

const TagSelector = () => {
    const result = useGetTagsQuery();
    const dispatch = useDispatch();
    const intialized = useSelector((state: RootState) => state.components.tagSelectorInitialized);

    useEffect(() => {
        if (!intialized) {
            dispatch(tagSelectorInitialized());
        }
    }, [intialized]);

    const tags = result.data;
    const sortedTags = useMemo(() => {
        const sortedTags = tags?.slice()
        // Sort posts in descending chronological order
        sortedTags?.sort()
        return sortedTags
    }, [tags])

    let content;

    if (result.isLoading) {
        content = (<Text>Loading...</Text>);
    }
    else if (result.isError) {
        console.error(result.error);
        content = (<Text>Error!</Text>);
    }
    else if (result.isSuccess) {
        const selectors = sortedTags?.map((tag) => {
            return (
                <Selector
                    key={tag}
                    tag={tag}
                />
            )
        })
        content = (<ScrollView style={styles.tag_selector}>{selectors}</ScrollView>);
    }
    return (
        <View style={styles.container}>
            {content}
        </View>
    )
}

export default TagSelector

type SelectorProps = {
    tag: string;
}

const Selector = (props: SelectorProps) => {
    const tag = props.tag;
    const enabled = useSelector((state: RootState) => state.tages.selectedTags.includes(tag));
    const dispatch = useDispatch();
    const toggleSwitch = (selected: boolean) => {
        if (selected) {
            dispatch(selectTag(tag));
        }
        else {
            dispatch(unselectTag(tag));
        }
    };
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
