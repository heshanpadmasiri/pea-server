import { StatusBar } from 'expo-status-bar';
import { ReactElement, useState } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { getFiles, Metadata } from './services';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [files, setFiles] = useState<Metadata[]>([]);

  const get_data = (setLoading: (value: boolean) => void,
    setError: (value: boolean) => void, setFiles: (value: Metadata[]) => void) => {
    getFiles().then((files) => {
      setFiles(files);
    }).catch((err) => {
      console.error(err);
      setError(true);
    }).finally(() => {
      setLoading(false);
    })
  }

  get_data(setIsLoading, setIsError, setFiles);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }
  else if (isError) {
    return (
      <View style={styles.container}>
        <Text>Error!</Text>
        <StatusBar style="auto" />
      </View>
    )
  }
  else {
    const data = files.map((file: Metadata) => {
      return { key: file.name };
    })
    return (
      <View style={styles.container}>
        <FlatList data={data} renderItem={({ item }) => <Text>{item.key}</Text>} />
        <StatusBar style="auto" />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
