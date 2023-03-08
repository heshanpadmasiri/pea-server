import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
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
    thumbnailCard: {
        alignItems: 'center',
        backgroundColor: 'white',
        marginBottom: 10,
        height: 220,
    },
    thumbnailHeading: {
        flex: 1
    },
    thumbnail: {
        height: 200,
        width: 200
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#ecf0f1',
    },
    video: {
        alignSelf: 'center',
        width: 320,
        height: 200,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});


export default styles;
