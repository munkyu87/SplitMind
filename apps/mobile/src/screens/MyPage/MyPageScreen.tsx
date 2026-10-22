import { MyAnswer } from "@api/types";
import { CategoryPill, LogoMark, Screen } from "@components/ui";
import { MyStackParamList } from "@navigation/MyStack";
import { useSession } from "@session/SessionProvider";
import { formatDate, palette } from "@themes/palette";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const MyPageScreen = () => {
  const { request, user, logout, withdraw } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const answers = useQuery({
    queryKey: ["my-answers"],
    queryFn: () => request<MyAnswer[]>("/me/answers"),
  });
  const suggestions = useQuery({
    queryKey: ["my-suggestions"],
    queryFn: () => request<unknown[]>("/me/suggestions"),
  });

  return (
    <Screen>
      <View style={styles.brand}>
        <LogoMark />
        <Text style={styles.brandName}>SplitMind</Text>
        <Text style={styles.slogan}>Life = Choices.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>마이</Text>
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryNum}>{answers.data?.length ?? 0}</Text>
            <Text style={styles.summaryLabel}>참여한 질문</Text>
          </View>
          <View>
            <Text style={styles.summaryNum}>{suggestions.data?.length ?? 0}</Text>
            <Text style={styles.summaryLabel}>내 제안</Text>
          </View>
        </View>
        <Text style={styles.section}>참여 기록</Text>
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
        <Pressable style={styles.link} onPress={() => navigation.navigate("MySuggestions")}>
          <Text style={styles.linkText}>내 제안</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => logout()}>
          <Text style={styles.linkText}>로그아웃</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => setConfirmLeave(true)}>
          <Text style={styles.leaveText}>계정 탈퇴</Text>
        </Pressable>
        {user?.isAdmin ? (
          <Pressable style={styles.link} onPress={() => navigation.navigate("Admin")}>
            <Text style={styles.linkText}>관리자</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <Modal visible={confirmLeave} transparent animationType="fade" onRequestClose={() => setConfirmLeave(false)}>
        <Pressable style={styles.dim} onPress={() => setConfirmLeave(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>계정을 탈퇴할까요?</Text>
            <Text style={styles.sheetBody}>댓글은 지워집니다. 투표 수는 남고, 다시 로그인하면 새 계정입니다.</Text>
            {leaveError ? <Text style={styles.leaveError}>{leaveError}</Text> : null}
            <View style={styles.sheetRow}>
              <Pressable style={styles.ghost} onPress={() => setConfirmLeave(false)}>
                <Text style={styles.ghostText}>취소</Text>
              </Pressable>
              <Pressable
                style={styles.danger}
                disabled={leaving}
                onPress={async () => {
                  setLeaving(true);
                  try {
                    await withdraw();
                    setConfirmLeave(false);
                  } catch (err) {
                    setLeaveError(err instanceof Error ? err.message : "탈퇴에 실패했습니다.");
                  } finally {
                    setLeaving(false);
                  }
                }}
              >
                <Text style={styles.dangerText}>{leaving ? "처리 중" : "탈퇴"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
};

export default MyPageScreen;

const styles = StyleSheet.create({
  brand: { alignItems: "center" },
  brandName: { marginTop: 6, fontWeight: "800", color: palette.text },
  slogan: { color: palette.muted, fontSize: 12 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  title: { fontSize: 32, fontWeight: "800", color: palette.text, marginTop: 12 },
  summary: { marginTop: 12, backgroundColor: "#fff", borderRadius: 18, padding: 16, flexDirection: "row", justifyContent: "space-around" },
  summaryNum: { fontSize: 22, fontWeight: "800", textAlign: "center", color: palette.text },
  summaryLabel: { color: palette.muted, fontSize: 12, textAlign: "center" },
  section: { marginTop: 18, marginBottom: 8, fontWeight: "800", color: palette.text },
  row: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 8, flexDirection: "row", gap: 10 },
  rowTitle: { fontWeight: "700", color: palette.text },
  choice: { marginTop: 2, fontWeight: "800", color: palette.text },
  date: { marginTop: 2, color: palette.muted, fontSize: 12 },
  link: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 8 },
  linkText: { fontWeight: "700", color: palette.text },
  leaveText: { fontWeight: "700", color: "#B42318" },
  dim: { flex: 1, backgroundColor: "rgba(40,32,36,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  sheetTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", color: palette.text },
  sheetBody: { marginTop: 8, textAlign: "center", color: palette.muted, lineHeight: 20 },
  leaveError: { marginTop: 8, textAlign: "center", color: "#B42318" },
  sheetRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  ghost: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  ghostText: { fontWeight: "700", color: palette.text },
  danger: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: "#B42318", alignItems: "center", justifyContent: "center" },
  dangerText: { color: "#fff", fontWeight: "800" },
});
