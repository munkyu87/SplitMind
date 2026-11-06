import { MyAnswer } from "@api/types";
import { CategoryPill, LogoMark, Screen } from "@components/ui";
import { MyStackParamList } from "@navigation/MyStack";
import { useSession } from "@session/SessionProvider";
import { formatDate, palette } from "@themes/palette";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

function CalendarMark() {
  return (
    <View style={styles.calendar}>
      <View style={styles.calendarPegLeft} />
      <View style={styles.calendarPegRight} />
      <View style={styles.calendarHead} />
    </View>
  );
}

const MyAnswersScreen = () => {
  const { request } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const answers = useQuery({
    queryKey: ["my-answers"],
    queryFn: () => request<MyAnswer[]>("/me/answers"),
  });

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.heading}>
          <LogoMark />
          <Text style={styles.title}>참여 기록</Text>
        </View>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {answers.isLoading ? <ActivityIndicator style={{ marginTop: 24 }} color={palette.ink} /> : null}
        {(answers.data ?? []).map((item) => {
          const category = item.categories[0];
          return (
            <Pressable
              key={item.questionId}
              style={styles.row}
              onPress={() => navigation.navigate("QuestionResult", { questionId: item.questionId })}
            >
              {category ? <CategoryPill slug={category.slug} name={category.name} look="soft" compact /> : null}
              <Text style={styles.rowTitle}>{item.title}</Text>
              <View style={styles.choiceRow}>
                <View style={styles.check}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
                <Text style={styles.choice}>{item.choice}</Text>
              </View>
              <View style={styles.dateRow}>
                <CalendarMark />
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
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, minHeight: 40 },
  back: { width: 44, height: 40, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 32, lineHeight: 32, color: palette.text },
  heading: { flexDirection: "row", alignItems: "center", gap: 8 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "800", color: palette.text },
  row: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 10 },
  rowTitle: { marginTop: 10, fontSize: 18, lineHeight: 24, fontWeight: "800", color: palette.text },
  choiceRow: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  check: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#F8D5E0", alignItems: "center", justifyContent: "center" },
  checkText: { color: "#7A5C78", fontSize: 11, fontWeight: "800", lineHeight: 14 },
  choice: { flex: 1, fontWeight: "800", color: palette.text, fontSize: 16 },
  dateRow: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  calendar: { width: 13, height: 12, borderWidth: 1.3, borderColor: palette.muted, borderRadius: 2 },
  calendarHead: { height: 4, backgroundColor: palette.muted },
  calendarPegLeft: { position: "absolute", top: -2, left: 2.5, width: 1.4, height: 3, borderRadius: 1, backgroundColor: palette.muted },
  calendarPegRight: { position: "absolute", top: -2, right: 2.5, width: 1.4, height: 3, borderRadius: 1, backgroundColor: palette.muted },
  date: { color: palette.muted, fontSize: 12 },
  empty: { marginTop: 24, textAlign: "center", color: palette.muted },
});
