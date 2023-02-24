import { StatusBar } from 'expo-status-bar';
import { ReactElement, useState } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, Platform } from 'react-native';
import OtherFiles from './Components/OtherFiles';
import { getFiles, Metadata } from './services';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar />
      <OtherFiles />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});
