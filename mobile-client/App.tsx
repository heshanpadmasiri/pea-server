import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OtherFiles from './Components/OtherFiles';
import styles from './utils/styles';
import VideoFiles from './Components/VideoFiles';
import ImageFiles from './Components/ImageFiles';
import PdfFiles from './Components/PdfFiles';

export default function App() {
  const Tab = createBottomTabNavigator();
  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Tab.Navigator initialRouteName="Videos" screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Videos') {
                  iconName = focused ? 'tv' : 'tv-outline';
                } else if (route.name === 'Images') {
                  iconName = focused ? 'image' : 'image-outline';
                } else if (route.name === 'PDF') {
                  iconName = focused ? 'book' : 'book-outline';
                } else {
                  iconName = focused ? 'document' : 'document-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: 'tomato',
            tabBarInactiveTintColor: 'gray',
        })}>
          <Tab.Screen name="Videos" component={VideoFiles} />
          <Tab.Screen name="Images" component={ImageFiles} />
          <Tab.Screen name="PDF" component={PdfFiles} />
          <Tab.Screen name="Other" component={OtherFiles} />
        </Tab.Navigator>
      </View>
    </NavigationContainer>
  );
}
