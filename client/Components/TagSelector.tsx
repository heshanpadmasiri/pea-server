import { useMemo } from 'react';
import { View, Text, Switch, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../utils/store';
import styles from '../utils/styles';
import { selectTag, unselectTag } from '../utils/tagSlice';
import { useGetTagsQuery } from '../utils/apiSlice';

const TagSelector = () => {
    const result = useGetTagsQuery();
    const tags = result.data;
    const sortedTags = useMemo(() => {
        const sortedTags = tags?.slice()
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
        content = (<ScrollView testID='received-tag' style={styles.tag_selector}>{selectors}</ScrollView>);
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
    const { tag } = props;
    const enabled = useSelector((state: RootState) => state.tags.selectedTags.includes(tag));
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
            <Text>{tag}</Text>
            <Switch
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={enabled ? '#f5dd4b' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={enabled}
                testID={`switch-${tag}`}
            />
        </View>
    )
}
