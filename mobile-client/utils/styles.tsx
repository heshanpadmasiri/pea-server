import { StyleSheet, Platform } from 'react-native';
const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    safeArea: {
        flex: 2,
        paddingHorizontal: 10,
    },
    gallery: {
        flex: 1,
        backgroundColor: 'black'
    },
    grid: {
        flexDirection: 'row',
    },
    grid_image: {
        height: 100,
        width: 100
    },
    tag_selector: {
        flex: 1,
    },
    switch_container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});


export default styles;
