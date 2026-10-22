import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import QuestionListStack from '@navigation/QuestionListStack';
import QuestionWriteScreen from '@screens/QuestionWrite/QuestionWriteScreen';
import MyPageScreen from '@screens/MyPage/MyPageScreen';

export type MainTabParamList = {
  QuestionListStack: undefined;
  QuestionWrite: undefined;
  MyPage: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="QuestionListStack" component={QuestionListStack} />
    <Tab.Screen name="QuestionWrite" component={QuestionWriteScreen} />
    <Tab.Screen name="MyPage" component={MyPageScreen} />
  </Tab.Navigator>
)
  
export default MainTabs;