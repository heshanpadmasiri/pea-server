import { StyleSheet, Platform } from 'react-native';
const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: 10,
        paddingTop: Platform.OS === "android" ? 25 : 0,
    },
    gallery: {
        flex: 1,
        backgroundColor: 'black'
    }
});


export default styles;
