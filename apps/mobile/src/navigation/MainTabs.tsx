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
          <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <View style={styles.bar}>
            {state.routes.map((item, index) => {
              const on = state.index === index;
              const label = item.name === "Questions" ? "질문" : item.name === "Suggest" ? "제안" : "마이";
              const color = on ? "#7A5C78" : palette.muted;
              return (
                <Pressable key={item.key} onPress={() => navigation.navigate(item.name as keyof MainTabParamList)} style={[styles.item, on && styles.itemOn]}>
                  <TabMark name={item.name} color={color} />
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

function TabMark({ name, color }: { name: string; color: string }) {
  if (name === "Questions") {
    return (
      <View style={[styles.markCircle, { borderColor: color }]}>
        <Text style={[styles.markQuestion, { color }]}>?</Text>
      </View>
    );
  }
  if (name === "Suggest") {
    return (
      <View style={styles.bulb}>
        <View style={[styles.bulbGlass, { borderColor: color }]} />
        <View style={[styles.bulbNeck, { backgroundColor: color }]} />
      </View>
    );
  }
  return (
    <View style={styles.tabPerson}>
      <View style={[styles.tabHead, { backgroundColor: color }]} />
      <View style={[styles.tabBody, { backgroundColor: color }]} />
    </View>
  );
}

export default MainTabs;

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 4,
    paddingHorizontal: 28,
    backgroundColor: palette.background,
  },
  bar: {
    backgroundColor: "#fff",
    borderRadius: 999,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  item: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  itemOn: { backgroundColor: "#EDE4F6" },
  label: { color: palette.muted, fontWeight: "700", fontSize: 13 },
  labelOn: { color: "#7A5C78" },
  markCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  markQuestion: { fontSize: 11, fontWeight: "800", lineHeight: 13 },
  bulb: { width: 14, height: 16, alignItems: "center" },
  bulbGlass: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  bulbNeck: { width: 6, height: 2, borderRadius: 1, marginTop: 1 },
  tabPerson: { width: 12, height: 14, alignItems: "center" },
  tabHead: { width: 5, height: 5, borderRadius: 3 },
  tabBody: { width: 10, height: 6, borderTopLeftRadius: 5, borderTopRightRadius: 5, marginTop: 1 },
});
