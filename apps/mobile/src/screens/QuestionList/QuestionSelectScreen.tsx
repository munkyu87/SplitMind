import { QuestionDetail, QuestionResult } from "@api/types";
import { CategoryPill, Screen } from "@components/ui";
import { QuestionListStackParamList } from "@navigation/QuestionListStack";
import { mediaUri, useSession } from "@session/SessionProvider";
import { palette, toneFor } from "@themes/palette";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const QuestionSelectScreen = () => {
  const { questionId } = useRoute<RouteProp<QuestionListStackParamList, "QuestionSelect">>().params;
  const navigation = useNavigation<NativeStackNavigationProp<QuestionListStackParamList>>();
  const { request, user } = useSession();
  const client = useQueryClient();
  const [picked, setPicked] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [archiving, setArchiving] = useState(false);

  const detail = useQuery({
    queryKey: ["question", questionId],
    queryFn: () => request<QuestionDetail>(`/questions/${questionId}`),
  });

  const question = detail.data;
  const category = question?.categories[0];
  const tone = toneFor(category?.slug);

  useEffect(() => {
    if (question?.answered) navigation.replace("QuestionResult", { questionId });
  }, [navigation, question?.answered, questionId]);

  const submit = async () => {
    if (picked == null) return;
    setBusy(true);
    setError("");
    try {
      const result = await request<QuestionResult>(`/questions/${questionId}/answers`, {
        method: "POST",
        body: JSON.stringify({ choiceIndex: picked }),
      });
      client.setQueryData(["result", questionId], result);
      await client.invalidateQueries({ queryKey: ["questions"] });
      navigation.replace("QuestionResult", { questionId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "제출에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  if (detail.isLoading || !question) {
    return (
      <Screen>
        <ActivityIndicator style={{ marginTop: 80 }} />
      </Screen>
    );
  }

  const pickedChoice = question.choices.find((choice) => choice.choiceIndex === picked);

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        {category ? (
          <View style={{ alignItems: "center" }}>
            <CategoryPill slug={category.slug} name={category.name} />
          </View>
        ) : null}
        <Text style={styles.title}>{question.title}</Text>
        <Text style={styles.help}>고르면 사람들이 어떻게 갈렸는지 보여요.</Text>
        {user?.isAdmin ? (
          <Pressable
            onPress={() =>
              Alert.alert("이 질문을 비공개로 둘까요?", "목록에서 내려갑니다.", [
                { text: "취소", style: "cancel" },
                {
                  text: "비공개",
                  style: "destructive",
                  onPress: async () => {
                    setArchiving(true);
                    try {
                      await request(`/admin/questions/${questionId}/archive`, { method: "POST" });
                      await client.invalidateQueries({ queryKey: ["questions"] });
                      navigation.popToTop();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "비공개로 바꾸지 못했습니다.");
                    } finally {
                      setArchiving(false);
                    }
                  },
                },
              ])
            }
            disabled={archiving}
          >
            <Text style={styles.archive}>{archiving ? "처리 중" : "이 질문 비공개"}</Text>
          </Pressable>
        ) : null}
        {question.choices.map((choice, index) => {
          const fill = index % 2 === 0 ? tone.a : tone.b;
          const edge = index % 2 === 0 ? tone.edgeA : tone.edgeB;
          return (
            <Pressable key={choice.choiceIndex} style={[styles.card, { backgroundColor: fill }]} onPress={() => setPicked(choice.choiceIndex)}>
              <View style={[styles.edge, { backgroundColor: edge }]} />
              <View style={styles.cardMain}>
                {choice.imageUrl ? <Image source={{ uri: mediaUri(choice.imageUrl) }} style={styles.image} /> : null}
                <View style={styles.cardBody}>
                  <Text style={styles.choice}>{choice.content}</Text>
                  <Text style={{ color: tone.label, fontSize: 18 }}>›</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
        <Text style={styles.note}>한 번 고르면 바꿀 수 없습니다.</Text>
      </ScrollView>
      <Modal visible={picked != null} transparent animationType="slide" onRequestClose={() => setPicked(null)}>
        <Pressable style={styles.dim} onPress={() => setPicked(null)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{pickedChoice?.content}</Text>
            <Text style={styles.sheetBody}>한 번 고르면 바꿀 수 없습니다.</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.sheetRow}>
              <Pressable style={styles.ghost} onPress={() => setPicked(null)}>
                <Text style={styles.ghostText}>다시 고르기</Text>
              </Pressable>
              <Pressable style={styles.submit} onPress={submit} disabled={busy}>
                <Text style={styles.submitText}>{busy ? "제출 중" : "제출"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
};

export default QuestionSelectScreen;

const styles = StyleSheet.create({
  back: { paddingHorizontal: 20, paddingVertical: 4 },
  backText: { fontSize: 32, lineHeight: 32, color: palette.text },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { marginTop: 16, fontSize: 28, lineHeight: 36, fontWeight: "800", textAlign: "center", color: palette.text },
  help: { marginTop: 8, marginBottom: 18, textAlign: "center", color: palette.muted },
  card: { borderRadius: 18, overflow: "hidden", marginBottom: 12, flexDirection: "row" },
  edge: { width: 6 },
  cardMain: { flex: 1 },
  image: { width: "100%", height: 140 },
  cardBody: { flex: 1, minHeight: 72, paddingHorizontal: 16, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  choice: { flex: 1, fontSize: 18, fontWeight: "800", color: palette.text },
  note: { textAlign: "center", color: palette.muted, marginTop: 8 },
  archive: { textAlign: "center", color: palette.muted, marginBottom: 12, fontWeight: "700" },
  dim: { flex: 1, backgroundColor: "rgba(40,32,36,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  sheetTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", color: palette.text },
  sheetBody: { marginTop: 8, textAlign: "center", color: palette.muted },
  error: { marginTop: 8, textAlign: "center", color: "#B42318" },
  sheetRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  ghost: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  ghostText: { fontWeight: "700", color: palette.text },
  submit: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: "#7A5C78", alignItems: "center", justifyContent: "center" },
  submitText: { color: "#fff", fontWeight: "800" },
});
