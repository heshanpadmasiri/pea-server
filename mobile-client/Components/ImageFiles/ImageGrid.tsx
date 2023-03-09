import { useState } from "react";
import { View, FlatList, Image } from "react-native";
import { fileContentUrl, Metadata } from "../../utils/services"

export type ImageGridProps = {
    imageFiles: Metadata[];
}

const ImageGrid = (props: ImageGridProps) => {
    const { imageFiles } = props;
    return (
        <View style={{flex: 5}}>
            <FlatList
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                data={imageFiles}
                renderItem={({ item }) => <GridImage uri={fileContentUrl(item)} />}
                keyExtractor={item => item.id}
            />
        </View>
    )
}

type ImageProps = {
    uri: string,
}

function GridImage(props: ImageProps) {
    const { uri } = props;
    const [width, setWidth] = useState(300);
    const [height, setHeight] = useState(300);
    Image.getSize(uri, (width, height) => {
        setWidth(width);
        setHeight(height);
    });
    return (
        <View style={{ flex: 1, alignSelf: "center" }} key={uri}>
            <Image style={{ height, width }} source={{ uri }}/>
        </View>

    );
}

export default ImageGrid;
