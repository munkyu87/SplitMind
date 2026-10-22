import MyStack from "@navigation/MyStack";
import QuestionListStack from "@navigation/QuestionListStack";
import QuestionWriteScreen from "@screens/QuestionWrite/QuestionWriteScreen";
import { palette } from "@themes/palette";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute, NavigatorScreenParams } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MyStackParamList } from "@navigation/MyStack";
import { QuestionListStackParamList } from "@navigation/QuestionListStack";

export type MainTabParamList = {
  Questions: NavigatorScreenParams<QuestionListStackParamList>;
  Suggest: undefined;
  My: NavigatorScreenParams<MyStackParamList>;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function hidden(routeName: string, focused?: string) {
  if (routeName === "Questions") return focused != null && focused !== "QuestionList";
  if (routeName === "My") return focused != null && focused !== "MyHome";
  return false;
}

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => {
        const route = state.routes[state.index];
        if (hidden(route.name, getFocusedRouteNameFromRoute(route))) return null;
        return (
          <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.bar}>
            {state.routes.map((item, index) => {
              const on = state.index === index;
              const label = item.name === "Questions" ? "질문" : item.name === "Suggest" ? "제안" : "마이";
              return (
                <Pressable key={item.key} onPress={() => navigation.navigate(item.name as keyof MainTabParamList)} style={styles.item}>
                  <Text style={[styles.label, on && styles.labelOn]}>{label}</Text>
                </Pressable>
              );
            })}
            </View>
          </View>
        );
      }}
    >
      <Tab.Screen name="Questions" component={QuestionListStack} />
      <Tab.Screen name="Suggest" component={QuestionWriteScreen} />
      <Tab.Screen name="My" component={MyStack} />
    </Tab.Navigator>
  );
};

export default MainTabs;

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    paddingHorizontal: 48,
    backgroundColor: palette.background,
  },
  bar: {
    backgroundColor: "#fff",
    borderRadius: 999,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  item: { paddingVertical: 10, paddingHorizontal: 8 },
  label: { color: palette.muted, fontWeight: "700" },
  labelOn: { color: palette.text, textDecorationLine: "underline" },
});
