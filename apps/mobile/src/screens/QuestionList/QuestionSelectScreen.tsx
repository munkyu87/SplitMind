import { QuestionDetail, QuestionResult } from "@api/types";
import { CategoryPill, Screen } from "@components/ui";
import { QuestionListStackParamList } from "@navigation/QuestionListStack";
import { mediaUri, useSession } from "@session/SessionProvider";
import { palette, toneFor } from "@themes/palette";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const QuestionSelectScreen = () => {
  const { questionId } = useRoute<RouteProp<QuestionListStackParamList, "QuestionSelect">>().params;
  const navigation = useNavigation<NativeStackNavigationProp<QuestionListStackParamList>>();
  const { request } = useSession();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const [picked, setPicked] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [slot, setSlot] = useState({ width: 0, height: 0 });
  const [ratio, setRatio] = useState<number | null>(null);

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
  const image = question.imageUrl ?? question.choices.find((choice) => choice.imageUrl)?.imageUrl ?? null;
  const paints = [
    { fill: tone.a, edge: tone.edgeA },
    { fill: "#F8D5E0", edge: "#E7A8B8" },
    { fill: "#FBF3E4", edge: "#D4C4A8" },
    { fill: "#E5F3E4", edge: "#9BB89A" },
  ];
  const rows =
    question.choices.length >= 4
      ? [question.choices.slice(0, 2), question.choices.slice(2)]
      : question.choices.map((choice) => [choice]);

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        {category ? <CategoryPill slug={category.slug} name={category.name} look="soft" compact /> : <View />}
        <View style={styles.backSpace} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      <Text style={styles.title}>{question.title}</Text>
        {question.description ? (
          <View style={styles.story}>
            <Text style={styles.storyLabel}>상황 설명</Text>
            <Text style={styles.storyBody}>{question.description}</Text>
          </View>
        ) : null}
        {image ? (
          <View style={styles.photoSlot} onLayout={(event) => setSlot(event.nativeEvent.layout)}>
            {ratio && slot.width > 0 ? (
              <View style={[styles.photoClip, photoBox(slot.width, ratio)]}>
                <Image
                  source={{ uri: mediaUri(image) }}
                  resizeMode="cover"
                  style={StyleSheet.absoluteFill}
                  onLoad={(event) => {
                    const next = event.nativeEvent.source.width / event.nativeEvent.source.height;
                    if (next > 0) setRatio(next);
                  }}
                />
              </View>
            ) : (
              <Image
                source={{ uri: mediaUri(image) }}
                style={styles.photoProbe}
                onLoad={(event) => {
                  const next = event.nativeEvent.source.width / event.nativeEvent.source.height;
                  if (next > 0) setRatio(next);
                }}
              />
            )}
          </View>
        ) : null}
        {question.description ? <Text style={styles.pickLabel}>당신의 선택은?</Text> : null}
        <View style={styles.choices}>
          {rows.map((row) => (
            <View key={row.map((choice) => choice.choiceIndex).join("-")} style={styles.choiceRow}>
              {row.map((choice) => {
                const paint = paints[choice.choiceIndex] ?? paints[0];
                const wide = row.length === 1;
                return (
                  <Pressable
                    key={choice.choiceIndex}
                    style={[styles.card, wide ? styles.cardWide : styles.cardCell, { backgroundColor: paint.fill }]}
                    onPress={() => setPicked(choice.choiceIndex)}
                  >
                    <View style={[styles.edge, { backgroundColor: paint.edge }]} />
                    <Text style={[styles.choice, !wide && styles.choiceCell]}>{choice.content}</Text>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal visible={picked != null} transparent animationType="slide" onRequestClose={() => setPicked(null)}>
        <Pressable style={styles.dim} onPress={() => setPicked(null)}>
          <Pressable style={styles.sheet}>
            <View style={styles.plane}>
              <Text style={styles.planeMark}>✈</Text>
            </View>
            <Text style={styles.sheetTitle}>이렇게 선택하시겠어요?</Text>
            <Text style={styles.sheetBody}>한 번 고르면 바꿀 수 없습니다.</Text>
            {pickedChoice ? (
              <View style={[styles.pickedCard, { backgroundColor: (paints[pickedChoice.choiceIndex] ?? paints[0]).fill }]}>
                <View style={[styles.edge, { backgroundColor: (paints[pickedChoice.choiceIndex] ?? paints[0]).edge }]} />
                <Text style={styles.pickedText}>{pickedChoice.content}</Text>
              </View>
            ) : null}
            <View style={styles.warn}>
              <Text style={styles.warnText}>제출하면 다른 선택으로 변경할 수 없어요.{"\n"}신중하게 선택해 주세요.</Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={styles.submit} onPress={submit} disabled={busy}>
              <Text style={styles.submitText}>{busy ? "제출 중" : "제출하기"}</Text>
            </Pressable>
            <Pressable style={styles.ghost} onPress={() => setPicked(null)}>
              <Text style={styles.ghostText}>다시 고르기</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
};

function photoBox(slotWidth: number, ratio: number) {
  let height = Dimensions.get("window").height * 0.42;
  let width = height * ratio;
  const maxWidth = slotWidth * 0.92;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / ratio;
  }
  return { width, height };
}

export default QuestionSelectScreen;

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, minHeight: 40 },
  back: { width: 44, height: 40, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 32, lineHeight: 32, color: palette.text },
  backSpace: { width: 44 },
  scroll: { flex: 1 },
  title: { marginTop: 4, marginBottom: 10, paddingHorizontal: 20, fontSize: 26, lineHeight: 32, fontWeight: "800", textAlign: "center", color: palette.text },
  story: { paddingHorizontal: 20, marginBottom: 16 },
  storyLabel: { marginBottom: 8, fontSize: 13, fontWeight: "800", color: palette.muted },
  storyBody: { fontSize: 16, lineHeight: 26, color: palette.text },
  pickLabel: { marginBottom: 10, paddingHorizontal: 20, fontSize: 16, fontWeight: "800", color: palette.text },
  photoSlot: { marginHorizontal: 20, marginBottom: 16, alignItems: "center" },
  photoClip: { borderRadius: 12, overflow: "hidden" },
  photoProbe: { width: 1, height: 1, opacity: 0 },
  choices: { paddingHorizontal: 20, gap: 10 },
  choiceRow: { flexDirection: "row", gap: 10 },
  card: { borderRadius: 16, overflow: "hidden", flexDirection: "row", alignItems: "center", minHeight: 72, paddingRight: 12 },
  cardWide: { flex: 1 },
  cardCell: { flex: 1, minHeight: 88, paddingRight: 8 },
  edge: { width: 7, alignSelf: "stretch" },
  choice: { flex: 1, fontSize: 18, fontWeight: "800", color: palette.text, paddingVertical: 16, paddingLeft: 14 },
  choiceCell: { fontSize: 15, paddingVertical: 14, paddingLeft: 10 },
  chevron: { fontSize: 18, color: "#3A3A3A", fontWeight: "600", marginLeft: 4 },
  dim: { flex: 1, backgroundColor: "rgba(40,32,36,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  plane: { alignSelf: "center", width: 52, height: 52, borderRadius: 26, backgroundColor: "#F3E8F4", alignItems: "center", justifyContent: "center" },
  planeMark: { fontSize: 22, color: "#7A5C78" },
  sheetTitle: { marginTop: 12, fontSize: 22, fontWeight: "800", textAlign: "center", color: palette.text },
  sheetBody: { marginTop: 6, textAlign: "center", color: palette.muted },
  pickedCard: { marginTop: 16, minHeight: 56, borderRadius: 16, overflow: "hidden", flexDirection: "row", alignItems: "center" },
  pickedText: { flex: 1, fontSize: 18, fontWeight: "800", color: palette.text, paddingVertical: 14, paddingHorizontal: 14 },
  warn: { marginTop: 12, borderRadius: 14, backgroundColor: "#FDECEC", paddingHorizontal: 14, paddingVertical: 12 },
  warnText: { color: "#B42318", fontWeight: "700", textAlign: "center", lineHeight: 20 },
  error: { marginTop: 8, textAlign: "center", color: "#B42318" },
  submit: { marginTop: 14, minHeight: 52, borderRadius: 16, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center" },
  submitText: { color: palette.text, fontWeight: "800" },
  ghost: { marginTop: 8, minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  ghostText: { fontWeight: "700", color: palette.text },
});
