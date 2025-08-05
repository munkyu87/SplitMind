import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from '@navigation/MainTabs';

export type MainStackParamList = {
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
  </Stack.Navigator>
);
  
export default MainStack;