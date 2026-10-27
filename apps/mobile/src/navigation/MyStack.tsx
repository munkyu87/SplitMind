import AdminScreen from "@screens/MyPage/AdminScreen";
import MyAnswersScreen from "@screens/MyPage/MyAnswersScreen";
import MyPageScreen from "@screens/MyPage/MyPageScreen";
import MySuggestionsScreen from "@screens/MyPage/MySuggestionsScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

export type MyStackParamList = {
  MyHome: undefined;
  MyAnswers: undefined;
  MySuggestions: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<MyStackParamList>();

const MyStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyHome" component={MyPageScreen} />
    <Stack.Screen name="MyAnswers" component={MyAnswersScreen} />
    <Stack.Screen name="MySuggestions" component={MySuggestionsScreen} />
    <Stack.Screen name="Admin" component={AdminScreen} />
  </Stack.Navigator>
);

export default MyStack;
