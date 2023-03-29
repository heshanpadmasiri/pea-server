import { TextInput, TouchableOpacity, View } from 'react-native';
import styles from '../utils/styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../utils/store';
import { clearQuery, setQuery } from '../utils/searchSlice';

export const SearchBar = () => {
    const searchValue = useSelector((state: RootState) => state.search.query);
    const dispatch = useDispatch();
    const onChange = (text: string) => {
        dispatch(setQuery(text));
    };
    const clearSearch = () => {
        dispatch(clearQuery());
    };

    return (<View style={styles.searchBar}>
        <TextInput
            value={searchValue}
            onChangeText={onChange}
            defaultValue="search"
            testID='search-text'
        />
        <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle-outline" size={24} />
        </TouchableOpacity>
    </View>)
}

export default SearchBar;
