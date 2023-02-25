import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import OtherFiles from './Components/OtherFiles';
import styles from './utils/styles';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar />
      <OtherFiles />
    </View>
  );
}
