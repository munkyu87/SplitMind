import { Category, Suggestion } from "@api/types";
import { CategoryPill, Screen, ScreenTitle, YellowButton } from "@components/ui";
import { ApiError, useSession } from "@session/SessionProvider";
import { palette } from "@themes/palette";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { launchImageLibrary } from "react-native-image-picker";

type DraftChoice = { content: string; photo?: string };

const QuestionWriteScreen = () => {
  const { request } = useSession();
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [choices, setChoices] = useState<DraftChoice[]>([{ content: "" }, { content: "" }]);
  const [categoryId, setCategoryId] = useState<string>();
  const [message, setMessage] = useState("");
  const [confirmSend, setConfirmSend] = useState(false);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => request<Category[]>("/categories"),
  });

  const send = useMutation({
    mutationFn: async (id: string) => {
      const payload: { content: string; imageUrl?: string }[] = [];
      for (const choice of choices) {
        const content = choice.content.trim();
        if (!content) continue;
        let imageUrl: string | undefined;
        if (choice.photo) {
          const body = new FormData();
          body.append("file", { uri: choice.photo, name: "choice.jpg", type: "image/jpeg" } as unknown as Blob);
          const uploaded = await request<{ path: string }>("/media", { method: "POST", body });
          imageUrl = uploaded.path;
        }
        payload.push(imageUrl ? { content, imageUrl } : { content });
      }
      return request<Suggestion>("/suggestions", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), categoryId: id, choices: payload }),
      });
    },
    onSuccess: async () => {
      setTitle("");
      setChoices([{ content: "" }, { content: "" }]);
      setMessage("대기 목록으로 보냈습니다.");
      await client.invalidateQueries({ queryKey: ["my-suggestions"] });
    },
    onError: (err) => setMessage(err instanceof ApiError ? err.message : "보내지 못했습니다."),
  });

  const visible = (categories.data ?? []).filter((item) => !item.requiresAdult);
  const selected = categoryId ?? visible[0]?.id;

  const pickPhoto = async (index: number) => {
    const result = await launchImageLibrary({ mediaType: "photo", selectionLimit: 1 });
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    setChoices((prev) => prev.map((item, i) => (i === index ? { ...item, photo: uri } : item)));
  };

  return (
    <Screen>
      <ScreenTitle name="제안" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>카테고리</Text>
        <View style={styles.chips}>
          {visible.map((item) => (
            <Pressable key={item.id} onPress={() => setCategoryId(item.id)}>
              <CategoryPill slug={item.slug} name={item.name} filled={selected === item.id} />
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>질문</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="질문을 적어 주세요"
          placeholderTextColor={palette.muted}
          style={styles.input}
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.count}>{title.trim().length}/500</Text>
        <Text style={styles.label}>선택지</Text>
        {choices.map((choice, index) => (
          <View key={index} style={styles.choiceBlock}>
            <View style={styles.choiceRow}>
              <Text style={styles.index}>{index + 1}</Text>
              <View style={styles.field}>
                <TextInput
                  value={choice.content}
                  onChangeText={(value) => setChoices((prev) => prev.map((item, i) => (i === index ? { ...item, content: value } : item)))}
                  placeholder="선택지"
                  placeholderTextColor={palette.muted}
                  style={styles.fieldInput}
                  maxLength={255}
                />
                <Pressable onPress={() => pickPhoto(index)} style={styles.photoBtn}>
                  {choice.photo ? <Image source={{ uri: choice.photo }} style={styles.thumb} /> : <Text style={styles.photoText}>사진</Text>}
                </Pressable>
                {choice.photo ? (
                  <Pressable
                    onPress={() => setChoices((prev) => prev.map((item, i) => (i === index ? { ...item, photo: undefined } : item)))}
                    hitSlop={8}
                  >
                    <Text style={styles.remove}>×</Text>
                  </Pressable>
                ) : null}
              </View>
              {choices.length > 2 ? (
                <Pressable
                  onPress={() => setChoices((prev) => prev.filter((_, i) => i !== index))}
                  hitSlop={8}
                  accessibilityLabel="선택지 빼기"
                >
                  <Text style={styles.drop}>×</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
        {choices.length < 4 ? (
          <Pressable onPress={() => setChoices((prev) => [...prev, { content: "" }])} style={styles.add}>
            <View style={styles.addMark}>
              <Text style={styles.addPlus}>+</Text>
            </View>
            <Text style={styles.addText}>선택지 추가</Text>
          </Pressable>
        ) : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
      <View style={styles.footer}>
        <YellowButton
          label={send.isPending ? "보내는 중" : "보내기"}
          disabled={send.isPending || title.trim().length === 0 || choices.filter((item) => item.content.trim()).length < 2 || !selected}
          onPress={() => setConfirmSend(true)}
        />
      </View>
      <Modal visible={confirmSend} transparent animationType="fade" onRequestClose={() => setConfirmSend(false)}>
        <Pressable style={styles.dim} onPress={() => setConfirmSend(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>검토 후 승인되면 게시돼요.</Text>
            <View style={styles.sheetRow}>
              <Pressable style={styles.ghost} onPress={() => setConfirmSend(false)}>
                <Text style={styles.ghostText}>취소</Text>
              </Pressable>
              <Pressable
                style={styles.confirm}
                onPress={() => {
                  setConfirmSend(false);
                  if (selected) send.mutate(selected);
                }}
              >
                <Text style={styles.confirmText}>보내기</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
};

export default QuestionWriteScreen;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 16 },
  footer: { paddingHorizontal: 20, paddingBottom: 88 },
  label: { marginTop: 14, marginBottom: 8, fontWeight: "800", color: palette.text },
  dim: { flex: 1, backgroundColor: "rgba(40,32,36,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  sheetTitle: { fontSize: 20, fontWeight: "800", textAlign: "center", color: palette.text, lineHeight: 28 },
  sheetRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  ghost: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  ghostText: { fontWeight: "700", color: palette.text },
  confirm: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center" },
  confirmText: { fontWeight: "800", color: palette.text },
  input: { backgroundColor: "#fff", borderRadius: 14, minHeight: 96, paddingHorizontal: 14, paddingVertical: 12, lineHeight: 22, color: palette.text },
  count: { alignSelf: "flex-end", color: palette.muted, fontSize: 12, marginTop: 4 },
  choiceBlock: { marginBottom: 8 },
  choiceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    minHeight: 48,
    paddingLeft: 14,
    paddingRight: 8,
    gap: 6,
  },
  fieldInput: { flex: 1, minHeight: 48, color: palette.text },
  photoBtn: { backgroundColor: "#E4D7FB", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  photoText: { color: "#7A5C78", fontWeight: "700", fontSize: 12 },
  thumb: { width: 28, height: 28, borderRadius: 8 },
  remove: { color: palette.muted, fontWeight: "700", fontSize: 16, paddingHorizontal: 2 },
  drop: { color: palette.muted, fontWeight: "700", fontSize: 20, paddingHorizontal: 4 },
  index: { width: 18, fontWeight: "800", color: palette.muted },
  add: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, paddingVertical: 6 },
  addMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#7A5C78",
    alignItems: "center",
    justifyContent: "center",
  },
  addPlus: { color: "#7A5C78", fontSize: 16, fontWeight: "700", lineHeight: 18 },
  addText: { color: "#7A5C78", fontWeight: "700", fontSize: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  message: { marginBottom: 10, color: palette.text },
});
