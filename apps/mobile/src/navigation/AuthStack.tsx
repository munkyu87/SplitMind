import React from "react";
import LoginScreen from "@screens/Auth/LoginScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HtmlWebViewScreen from "@components/HtmlWebViewScreen";

export type AuthStackParamList = {
  Login: undefined;
  HtmlWebView: { title?: string; html: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="HtmlWebView" component={HtmlWebViewScreen} options={{ headerShown: true, title: "" }} />
  </Stack.Navigator>
);

export default AuthStack;
