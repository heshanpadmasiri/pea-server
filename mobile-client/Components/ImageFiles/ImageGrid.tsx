import { View, Text, FlatList } from "react-native";
import { fileContentUrl, Metadata } from "../../utils/services"

export type ImageGridProps = {
    imageFiles: Metadata[];
}

const ImageGrid = (props: ImageGridProps) => {
    const { imageFiles } = props;
    const data = imageFiles.map((file: Metadata) => {
        return { key: file.name };
    })
    return (
        <View>
            <FlatList data={data} renderItem={({ item }) => <Text>{item.key}</Text>} />
        </View>
    )
}

export default ImageGrid;
