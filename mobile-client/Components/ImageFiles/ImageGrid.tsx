import { View, Text, FlatList, Image, ScrollView } from "react-native";
import { fileContentUrl, Metadata } from "../../utils/services"
import styles from "../../utils/styles";

export type ImageGridProps = {
    imageFiles: Metadata[];
}

const ImageGrid = (props: ImageGridProps) => {
    const { imageFiles } = props;
    return (
            <FlatList
                contentContainerStyle={{ alignSelf: 'flex-start' }}
                numColumns={4}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false} data={imageFiles}
                renderItem={({ item }) => imageGridItem(item)}
                keyExtractor={item => item.id}
            />
    )
}

const imageGridItem = (file: Metadata) => {
    return (
        <View key={file.id}>
            <Image style={styles.grid_image} source={{ uri: fileContentUrl(file) }} />
        </View>
    );
}

export default ImageGrid;
