import { Category, Suggestion } from "@api/types";
import { CategoryPill, Screen, YellowButton } from "@components/ui";
import { ApiError, useSession } from "@session/SessionProvider";
import { palette } from "@themes/palette";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { launchImageLibrary } from "react-native-image-picker";

type DraftChoice = { content: string; photo?: string };

const QuestionWriteScreen = () => {
  const { request } = useSession();
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [choices, setChoices] = useState<DraftChoice[]>([{ content: "" }, { content: "" }]);
  const [categoryId, setCategoryId] = useState<string>();
  const [message, setMessage] = useState("");

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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>제안</Text>
        <Text style={styles.help}>보내주신 질문은 운영팀의 검토 후{"\n"}승인되면 서비스에 게시돼요.</Text>
        <Text style={styles.label}>질문</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="질문을 적어 주세요"
          placeholderTextColor={palette.muted}
          style={styles.input}
          maxLength={500}
        />
        <Text style={styles.count}>{title.trim().length}/500</Text>
        <Text style={styles.label}>선택지</Text>
        {choices.map((choice, index) => (
          <View key={index} style={styles.choiceBlock}>
            <View style={styles.choiceRow}>
              <Text style={styles.index}>{index + 1}</Text>
              <TextInput
                value={choice.content}
                onChangeText={(value) => setChoices((prev) => prev.map((item, i) => (i === index ? { ...item, content: value } : item)))}
                placeholder="선택지"
                placeholderTextColor={palette.muted}
                style={[styles.input, { flex: 1 }]}
                maxLength={255}
              />
            </View>
            <View style={styles.photoRow}>
              <Pressable onPress={() => pickPhoto(index)} style={styles.add}>
                <Text style={styles.addText}>{choice.photo ? "사진 바꾸기" : "사진"}</Text>
              </Pressable>
              {choice.photo ? (
                <>
                  <Image source={{ uri: choice.photo }} style={styles.thumb} />
                  <Pressable onPress={() => setChoices((prev) => prev.map((item, i) => (i === index ? { ...item, photo: undefined } : item)))}>
                    <Text style={styles.remove}>빼기</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>
        ))}
        {choices.length < 4 ? (
          <Pressable onPress={() => setChoices((prev) => [...prev, { content: "" }])} style={styles.add}>
            <Text style={styles.addText}>선택지 추가</Text>
          </Pressable>
        ) : null}
        <Text style={styles.label}>카테고리</Text>
        <View style={styles.chips}>
          {visible.map((item) => (
            <Pressable key={item.id} onPress={() => setCategoryId(item.id)}>
              <CategoryPill slug={item.slug} name={item.name} filled={selected === item.id} />
            </Pressable>
          ))}
        </View>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
      <View style={styles.footer}>
        <YellowButton
          label={send.isPending ? "보내는 중" : "보내기"}
          disabled={send.isPending || title.trim().length === 0 || choices.filter((item) => item.content.trim()).length < 2 || !selected}
          onPress={() => selected && send.mutate(selected)}
        />
      </View>
    </Screen>
  );
};

export default QuestionWriteScreen;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 16 },
  footer: { paddingHorizontal: 20, paddingBottom: 88 },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center", color: palette.text },
  help: { marginTop: 8, marginBottom: 16, textAlign: "center", color: palette.muted, lineHeight: 20 },
  label: { marginTop: 14, marginBottom: 8, fontWeight: "800", color: palette.text },
  input: { backgroundColor: "#fff", borderRadius: 14, minHeight: 48, paddingHorizontal: 14, color: palette.text },
  count: { alignSelf: "flex-end", color: palette.muted, fontSize: 12, marginTop: 4 },
  choiceBlock: { marginBottom: 8 },
  choiceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, marginLeft: 26 },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  remove: { color: palette.muted, fontWeight: "700" },
  index: { width: 18, fontWeight: "800", color: palette.muted },
  add: { alignSelf: "flex-start", backgroundColor: "#E4D7FB", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  addText: { color: "#7A5C78", fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  message: { marginBottom: 10, color: palette.text },
});
