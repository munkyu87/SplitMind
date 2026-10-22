import QuestionListScreen from "@screens/QuestionList/QuestionListScreen";
import QuestionResultScreen from "@screens/QuestionList/QuestionResultScreen";
import QuestionSelectScreen from "@screens/QuestionList/QuestionSelectScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

export type QuestionListStackParamList = {
  QuestionList: undefined;
  QuestionSelect: { questionId: string };
  QuestionResult: { questionId: string };
};

const Stack = createNativeStackNavigator<QuestionListStackParamList>();

const QuestionListStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="QuestionList" component={QuestionListScreen} />
    <Stack.Screen name="QuestionSelect" component={QuestionSelectScreen} />
    <Stack.Screen name="QuestionResult" component={QuestionResultScreen} />
  </Stack.Navigator>
);

export default QuestionListStack;
