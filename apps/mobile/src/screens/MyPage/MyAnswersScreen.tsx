import { MyAnswer } from "@api/types";
import { CategoryPill, Screen } from "@components/ui";
import { MyStackParamList } from "@navigation/MyStack";
import { useSession } from "@session/SessionProvider";
import { formatDate, palette } from "@themes/palette";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const MyAnswersScreen = () => {
  const { request } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const answers = useQuery({
    queryKey: ["my-answers"],
    queryFn: () => request<MyAnswer[]>("/me/answers"),
  });

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>참여 기록</Text>
        {answers.isLoading ? <ActivityIndicator style={{ marginTop: 24 }} color={palette.ink} /> : null}
        {(answers.data ?? []).map((item) => {
          const category = item.categories[0];
          return (
            <Pressable
              key={item.questionId}
              style={styles.row}
              onPress={() =>
                navigation.getParent()?.navigate("Questions", {
                  screen: "QuestionResult",
                  params: { questionId: item.questionId },
                })
              }
            >
              {category ? <CategoryPill slug={category.slug} name={category.name} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.choice}>{item.choice}</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
            </Pressable>
          );
        })}
        {answers.data && answers.data.length === 0 ? <Text style={styles.empty}>참여한 질문이 없습니다.</Text> : null}
      </ScrollView>
    </Screen>
  );
};

export default MyAnswersScreen;

const styles = StyleSheet.create({
  back: { paddingHorizontal: 20 },
  backText: { fontSize: 32, color: palette.text },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "800", color: palette.text, marginBottom: 12 },
  row: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 8, flexDirection: "row", gap: 10 },
  rowTitle: { fontWeight: "700", color: palette.text },
  choice: { marginTop: 2, fontWeight: "800", color: palette.text },
  date: { marginTop: 2, color: palette.muted, fontSize: 12 },
  empty: { marginTop: 24, textAlign: "center", color: palette.muted },
});
