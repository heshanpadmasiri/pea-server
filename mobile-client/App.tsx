import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AllFiles from './Components/AllFiles';
import styles from './utils/styles';
import VideoFiles from './Components/VideoFiles/VideoFiles';
import ImageFiles from './Components/ImageFiles/ImageFiles';
import PdfFiles from './Components/PdfFiles';
import store from './utils/store';
import { Provider } from 'react-redux';

export default function App() {
    const Tab = createBottomTabNavigator();
    return (
        <Provider store={store}>
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
                        <Tab.Screen name="All" component={AllFiles} />
                    </Tab.Navigator>
                </View>
            </NavigationContainer>
        </Provider>
    );
}
