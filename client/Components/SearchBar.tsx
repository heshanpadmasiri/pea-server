import { TextInput, TouchableOpacity, View } from 'react-native';
import styles from '../utils/styles';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const SearchBar = () => {
    const currentText = undefined;
    const onChange = (text: string) => {
        console.log('SEARCH: ' + text);
    };
    const clearSearch = () => {
        console.log('CLEAR SEARCH');
    };
    return (<View style={styles.searchBar}>
        <TextInput
            value={currentText}
            onChangeText={onChange}
            defaultValue="search"
        />
        <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle-outline" size={24}/>
        </TouchableOpacity>
    </View>)
}

export default SearchBar;
