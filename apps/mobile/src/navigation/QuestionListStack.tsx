import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QuestionListScreen from '@screens/QuestionList/QuestionListScreen';
import QuestionSelectScreen from '@screens/QuestionList/QuestionSelectScreen';
import QuestionResultScreen from '@screens/QuestionList/QuestionResultScreen';

export type QuestionListStackParamList = {
  QuestionList: undefined;
  QuestionSelect: undefined;
  QuestionResult: undefined;
};

const Stack = createNativeStackNavigator<QuestionListStackParamList>();

const QuestionListStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="QuestionList" component={QuestionListScreen} />
    <Stack.Screen name="QuestionSelect" component={QuestionSelectScreen} />
    <Stack.Screen name="QuestionResult" component={QuestionResultScreen} />
  </Stack.Navigator>
);
  
export default QuestionListStack;