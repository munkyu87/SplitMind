import { Category, Suggestion } from "@api/types";
import { CategoryPill, LogoMark, Screen } from "@components/ui";
import { ApiError, useSession } from "@session/SessionProvider";
import { palette } from "@themes/palette";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Image, Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DraftChoice = { content: string };

const QuestionWriteScreen = () => {
  const { request } = useSession();
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [choices, setChoices] = useState<DraftChoice[]>([{ content: "" }, { content: "" }]);
  const [categoryId, setCategoryId] = useState<string>();
  const [message, setMessage] = useState("");
  const [confirmSend, setConfirmSend] = useState(false);
  const [keyboardLift, setKeyboardLift] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fieldRefs = useRef<Record<string, View | null>>({});
  const focusedKey = useRef<string | null>(null);
  const scrollOffset = useRef(0);
  const keyboardTop = useRef(0);
  const insets = useSafeAreaInsets();
  const insetTop = useRef(0);
  insetTop.current = insets.top;

  const revealField = (key: string) => {
    const top = keyboardTop.current - insetTop.current;
    const node = fieldRefs.current[key];
    if (keyboardTop.current <= 0 || !node) return;
    node.measureInWindow((_x, y, _width, height) => {
      const overflow = y + height + 12 - top;
      if (overflow <= 0) return;
      scrollRef.current?.scrollTo({ y: scrollOffset.current + overflow, animated: true });
    });
  };
  const revealRef = useRef(revealField);
  revealRef.current = revealField;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardLift(Math.max(0, Dimensions.get("screen").height - event.endCoordinates.screenY));
      const key = focusedKey.current;
      if (!key || key === "title") return;
      setTimeout(() => revealRef.current(key), 60);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardTop.current = 0;
      setKeyboardLift(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => request<Category[]>("/categories"),
  });

  const send = useMutation({
    mutationFn: async (id: string) => {
      const payload = choices.map((choice) => choice.content.trim()).filter(Boolean).map((content) => ({ content }));
      const background = description.trim();
      let imageUrl: string | undefined;
      if (photo) {
        const body = new FormData();
        body.append("file", { uri: photo, name: "question.jpg", type: "image/jpeg" } as unknown as Blob);
        const uploaded = await request<{ path: string }>("/media", { method: "POST", body });
        imageUrl = uploaded.path;
      }
      return request<Suggestion>("/suggestions", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          categoryId: id,
          choices: payload,
          imageUrl,
          ...(background ? { description: background } : {}),
        }),
      });
    },
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setPhoto(undefined);
      setChoices([{ content: "" }, { content: "" }]);
      setMessage("대기 목록으로 보냈습니다.");
      await client.invalidateQueries({ queryKey: ["my-suggestions"] });
    },
    onError: (err) => setMessage(err instanceof ApiError ? err.message : "보내지 못했습니다."),
  });

  const visible = (categories.data ?? []).filter((item) => !item.requiresAdult);
  const selected = categoryId ?? visible[0]?.id;
  const filledChoices = choices.filter((item) => item.content.trim()).length;
  const ready = title.trim().length > 0 && filledChoices >= 2 && Boolean(selected);

  const pickPhoto = async () => {
    const result = await launchImageLibrary({ mediaType: "photo", selectionLimit: 1 });
    const uri = result.assets?.[0]?.uri;
    if (uri) setPhoto(uri);
  };

  const focusField = (key: string) => {
    focusedKey.current = key;
    if (key === "title") return;
    revealField(key);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <LogoMark />
        <Text style={styles.headerText}>밸런스 게임 제안하기</Text>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 108 + keyboardLift }]}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollOffset.current = event.nativeEvent.contentOffset.y;
        }}
      >
        <View style={styles.banner}>
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerTitle}>둘 중 하나를 고르는</Text>
            <Text style={styles.bannerTitle}>재미있는 질문을 제안해 주세요!</Text>
            <Text style={styles.bannerBody}>여러분의 기발한 밸런스 게임 질문이 다른 사람들에게 즐거운 대화거리가 될 수 있어요.</Text>
          </View>
          <SuggestMark />
        </View>

        <Text style={styles.label}>카테고리</Text>
        <View style={styles.chips}>
          {visible.map((item) => (
            <Pressable key={item.id} onPress={() => setCategoryId(item.id)}>
              <CategoryPill slug={item.slug} name={item.name} look={selected === item.id ? "fill" : "outline"} compact />
            </Pressable>
          ))}
        </View>

        <View style={styles.labelRow}>
          <Text style={styles.labelTight}>
            질문 제목 <Text style={styles.star}>*</Text>
          </Text>
        </View>
        <View
          ref={(node) => {
            fieldRefs.current.title = node;
          }}
          style={styles.field}
        >
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="궁금한 상황을 한 문장으로 적어 주세요"
            placeholderTextColor={palette.muted}
            style={styles.single}
            maxLength={50}
            onFocus={() => focusField("title")}
          />
        </View>
        <Text style={styles.count}>{title.trim().length}/50</Text>

        <Text style={styles.label}>배경 설명 (선택)</Text>
        <View
          ref={(node) => {
            fieldRefs.current.background = node;
          }}
          style={styles.box}
        >
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="상황에 대한 추가 설명이 있다면 적어 주세요 (선택사항이에요)"
            placeholderTextColor={palette.muted}
            style={styles.multi}
            multiline
            textAlignVertical="top"
            maxLength={500}
            onFocus={() => focusField("background")}
          />
        </View>
        <Text style={styles.count}>{description.trim().length}/500</Text>

        <View style={styles.example}>
          <View style={styles.exampleMark}>
            <Text style={styles.exampleLabel}>예시</Text>
          </View>
          <Text style={styles.exampleTitle}>평생 해외여행만 가기 vs 평생 국내여행만 가기?</Text>
          <Text style={styles.exampleBody}>이런 식으로 둘 중 하나(또는 여러 개) 중에서 고르는 재미있는 질문을 자유롭게 제안해 주세요!</Text>
        </View>

        <Text style={styles.label}>사진 (선택)</Text>
        <Pressable onPress={pickPhoto} style={styles.drop}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.preview} />
          ) : (
            <View style={styles.dropCopy}>
              <View style={styles.frame}>
                <View style={styles.frameHill} />
              </View>
              <Text style={styles.dropTitle}>사진 추가하기</Text>
              <Text style={styles.dropHint}>최대 1장까지 업로드할 수 있어요.</Text>
            </View>
          )}
        </Pressable>
        {photo ? (
          <Pressable onPress={() => setPhoto(undefined)} style={styles.clearPhoto} hitSlop={8}>
            <Text style={styles.clearPhotoText}>사진 빼기</Text>
          </Pressable>
        ) : null}

        <View style={styles.labelRow}>
          <Text style={styles.labelTight}>선택지 (최대 4개)</Text>
          <Text style={styles.tally}>
            {choices.length}/4
          </Text>
        </View>
        {choices.map((choice, index) => (
          <View
            key={index}
            ref={(node) => {
              fieldRefs.current[`choice-${index}`] = node;
            }}
            style={styles.choiceRow}
          >
            <View style={styles.index}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <TextInput
              value={choice.content}
              onChangeText={(value) => setChoices((prev) => prev.map((item, i) => (i === index ? { ...item, content: value } : item)))}
              placeholder="선택지를 입력해 주세요"
              placeholderTextColor={palette.muted}
              style={styles.choiceInput}
              maxLength={255}
              onFocus={() => focusField(`choice-${index}`)}
            />
            {choices.length > 2 ? (
              <Pressable
                onPress={() => setChoices((prev) => prev.filter((_, i) => i !== index))}
                hitSlop={8}
                accessibilityLabel="선택지 빼기"
                style={styles.remove}
              >
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        <Pressable
          onPress={() => setChoices((prev) => [...prev, { content: "" }])}
          disabled={choices.length >= 4}
          style={[styles.add, choices.length >= 4 && styles.addOff]}
        >
          <Text style={styles.addText}>+ 선택지 추가 (최대 4개)</Text>
        </Pressable>

        <Pressable
          onPress={() => setConfirmSend(true)}
          disabled={!ready || send.isPending}
          style={[styles.send, ready && !send.isPending && styles.sendOn]}
        >
          <Text style={[styles.sendText, ready && !send.isPending && styles.sendTextOn]}>{send.isPending ? "보내는 중" : "제안 보내기"}</Text>
        </Pressable>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
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

function SuggestMark() {
  return (
    <View style={styles.mark}>
      <View style={[styles.bubble, styles.bubbleA]}>
        <Text style={styles.bubbleText}>A?</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleB]}>
        <Text style={styles.bubbleText}>B?</Text>
      </View>
      <View style={styles.face}>
        <View style={styles.eyes}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <View style={styles.smile} />
      </View>
    </View>
  );
}

export default QuestionWriteScreen;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 },
  headerText: { fontSize: 18, fontWeight: "800", color: palette.text },
  banner: { flexDirection: "row", alignItems: "center", backgroundColor: "#F6F0FC", borderRadius: 18, padding: 16, gap: 8 },
  bannerCopy: { flex: 1 },
  bannerTitle: { color: "#7A5C78", fontWeight: "800", fontSize: 16, lineHeight: 22 },
  bannerBody: { marginTop: 6, color: palette.muted, fontSize: 12, lineHeight: 18 },
  mark: { width: 86, height: 78 },
  bubble: { position: "absolute", width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  bubbleA: { left: 0, top: 0, backgroundColor: "#E4D7FB" },
  bubbleB: { right: 0, top: 8, backgroundColor: "#F8D5E0" },
  bubbleText: { fontSize: 12, fontWeight: "800", color: "#7A5C78" },
  face: { position: "absolute", left: 22, top: 28, width: 42, height: 42, borderRadius: 21, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  eyes: { flexDirection: "row", gap: 8 },
  eye: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#3A3A3A" },
  smile: { marginTop: 4, width: 12, height: 6, borderBottomWidth: 1.5, borderColor: "#E7A8B8", borderRadius: 6 },
  label: { marginTop: 18, marginBottom: 8, fontWeight: "800", color: palette.text },
  labelRow: { marginTop: 18, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  labelTight: { fontWeight: "800", color: palette.text },
  star: { color: "#E989A4" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  field: { backgroundColor: "#fff", borderRadius: 14, minHeight: 48, paddingHorizontal: 14, justifyContent: "center" },
  single: { minHeight: 48, color: palette.text },
  box: { backgroundColor: "#fff", borderRadius: 14, minHeight: 96, paddingHorizontal: 14, paddingVertical: 12 },
  multi: { minHeight: 72, lineHeight: 22, color: palette.text },
  count: { alignSelf: "flex-end", color: palette.muted, fontSize: 12, marginTop: 4 },
  example: { marginTop: 14, backgroundColor: "#F6F0FC", borderRadius: 16, padding: 14 },
  exampleMark: { alignSelf: "flex-start", backgroundColor: "#E4D7FB", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  exampleLabel: { color: "#7A5C78", fontWeight: "800", fontSize: 12 },
  exampleTitle: { fontWeight: "800", color: palette.text, lineHeight: 20 },
  exampleBody: { marginTop: 4, color: palette.muted, fontSize: 13, lineHeight: 18 },
  drop: { minHeight: 132, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#D9C8F2", backgroundColor: "#FBF8FE", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  dropCopy: { alignItems: "center" },
  frame: { width: 36, height: 28, borderRadius: 6, borderWidth: 1.5, borderColor: "#C4B5E8", marginBottom: 8, justifyContent: "flex-end", overflow: "hidden" },
  frameHill: { height: 12, backgroundColor: "#E4D7FB", borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  dropTitle: { fontWeight: "800", color: "#7A5C78" },
  dropHint: { marginTop: 2, color: palette.muted, fontSize: 12 },
  preview: { width: "100%", height: 180 },
  clearPhoto: { alignSelf: "flex-end", marginTop: 6 },
  clearPhotoText: { color: palette.muted, fontWeight: "700" },
  tally: { color: palette.muted, fontWeight: "700" },
  choiceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  index: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F3E8F4", alignItems: "center", justifyContent: "center" },
  indexText: { fontWeight: "800", color: "#7A5C78" },
  choiceInput: { flex: 1, minHeight: 48, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, color: palette.text },
  remove: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  removeText: { color: palette.muted, fontSize: 18, fontWeight: "700" },
  add: { minHeight: 48, borderRadius: 14, backgroundColor: "#F3E8F4", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  addOff: { opacity: 0.4 },
  addText: { color: "#7A5C78", fontWeight: "800" },
  send: { minHeight: 52, borderRadius: 16, backgroundColor: "#E7E0D8", alignItems: "center", justifyContent: "center" },
  sendOn: { backgroundColor: palette.yellow },
  sendText: { fontWeight: "800", color: palette.muted },
  sendTextOn: { color: palette.text },
  message: { marginTop: 10, color: palette.text },
  dim: { flex: 1, backgroundColor: "rgba(40,32,36,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  sheetTitle: { fontSize: 20, fontWeight: "800", textAlign: "center", color: palette.text, lineHeight: 28 },
  sheetRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  ghost: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  ghostText: { fontWeight: "700", color: palette.text },
  confirm: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center" },
  confirmText: { fontWeight: "800", color: palette.text },
});
