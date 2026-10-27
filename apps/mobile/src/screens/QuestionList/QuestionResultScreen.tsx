import { Comment, Page, QuestionDetail, QuestionResult } from "@api/types";
import { CategoryPill, Screen } from "@components/ui";
import { QuestionListStackParamList } from "@navigation/QuestionListStack";
import { ApiError, useSession } from "@session/SessionProvider";
import { palette, percent, toneFor } from "@themes/palette";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const reportReasons = ["욕설·비방", "개인정보", "광고·도배", "주제와 무관"];

const QuestionResultScreen = () => {
  const { questionId } = useRoute<RouteProp<QuestionListStackParamList, "QuestionResult">>().params;
  const navigation = useNavigation<NativeStackNavigationProp<QuestionListStackParamList>>();
  const { request, user } = useSession();
  const client = useQueryClient();
  const [rating, setRating] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [keyboardLift, setKeyboardLift] = useState(0);
  const [reportTarget, setReportTarget] = useState<Comment | null>(null);
  const [pickedReason, setPickedReason] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [reporting, setReporting] = useState(false);
  const commentInput = useRef<TextInput>(null);
  const reportInput = useRef<TextInput>(null);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardLift(Math.max(0, Dimensions.get("screen").height - event.endCoordinates.screenY));
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardLift(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const detail = useQuery({
    queryKey: ["question", questionId],
    queryFn: () => request<QuestionDetail>(`/questions/${questionId}`),
  });
  const result = useQuery({
    queryKey: ["result", questionId],
    queryFn: () => request<QuestionResult>(`/questions/${questionId}/results`),
    retry: false,
  });
  const comments = useQuery({
    queryKey: ["comments", questionId],
    queryFn: () => request<Page<Comment>>(`/questions/${questionId}/comments?limit=20`),
    enabled: result.isSuccess,
  });

  const category = detail.data?.categories[0];
  const tone = toneFor(category?.slug);
  const mine = result.data?.myRating ?? rating;

  const saveRating = async (value: number) => {
    setRating(value);
    await request(`/questions/${questionId}/rating`, { method: "PUT", body: JSON.stringify({ rating: value }) });
    await client.invalidateQueries({ queryKey: ["result", questionId] });
    await client.invalidateQueries({ queryKey: ["questions"] });
  };

  const sendComment = useMutation({
    mutationFn: () =>
      request(`/questions/${questionId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: content.trim() }),
      }),
    onSuccess: async () => {
      setContent("");
      await client.invalidateQueries({ queryKey: ["comments", questionId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "댓글을 남기지 못했습니다."),
  });

  const like = async (comment: Comment) => {
    await request(`/comments/${comment.id}/likes`, { method: comment.likedByMe ? "DELETE" : "POST" });
    await client.invalidateQueries({ queryKey: ["comments", questionId] });
  };

  const closeReport = () => {
    if (reporting) return;
    reportInput.current?.blur();
    Keyboard.dismiss();
    setKeyboardLift(0);
    setPickedReason(null);
    setReportNote("");
    setReportTarget(null);
  };

  const report = async (reason: string) => {
    if (!reportTarget || reporting) return;
    reportInput.current?.blur();
    Keyboard.dismiss();
    setKeyboardLift(0);
    setPickedReason(reason);
    setReporting(true);
    setError("");
    try {
      await request(`/comments/${reportTarget.id}/reports`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setReportNote("");
      setReportTarget(null);
      await client.invalidateQueries({ queryKey: ["comments", questionId] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "신고에 실패했습니다.");
    } finally {
      setReporting(false);
    }
  };

  const withdrawReport = async () => {
    if (!reportTarget || reporting) return;
    setReporting(true);
    setError("");
    try {
      await request(`/comments/${reportTarget.id}/reports`, { method: "DELETE" });
      setReportTarget(null);
      await client.invalidateQueries({ queryKey: ["comments", questionId] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "신고를 취소하지 못했습니다.");
    } finally {
      setReporting(false);
    }
  };

  if (result.isLoading || detail.isLoading) {
    return (
      <Screen>
        <ActivityIndicator style={{ marginTop: 80 }} />
      </Screen>
    );
  }

  if (result.error instanceof ApiError && result.error.code === "NOT_ANSWERED") {
    return (
      <Screen>
        <Pressable onPress={() => navigation.replace("QuestionSelect", { questionId })} style={styles.back}>
          <Text style={styles.backText}>참여한 뒤에 결과를 볼 수 있습니다.</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backMark}>‹</Text>
      </Pressable>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {category ? (
          <Text style={[styles.kicker, { color: tone.label }]}>
            {category.name} · {result.data?.total ?? 0}명
          </Text>
        ) : null}
        <Text style={styles.title}>{detail.data?.title}</Text>
        {user?.isAdmin ? (
          <Pressable
            onPress={() =>
              Alert.alert("이 질문을 비공개로 둘까요?", "목록에서 내려갑니다.", [
                { text: "취소", style: "cancel" },
                {
                  text: "비공개",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await request(`/admin/questions/${questionId}/archive`, { method: "POST" });
                      await client.invalidateQueries({ queryKey: ["questions"] });
                      navigation.popToTop();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "비공개로 바꾸지 못했습니다.");
                    }
                  },
                },
              ])
            }
          >
            <Text style={styles.archive}>이 질문 비공개</Text>
          </Pressable>
        ) : null}
        {result.data?.choices.map((choice, index) => (
          <View key={choice.choiceIndex} style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max(percent(choice.ratio), 0)}%`, backgroundColor: index % 2 === 0 ? tone.a : tone.b },
              ]}
            />
            <View style={styles.bar}>
              <Text style={styles.barLabel}>{choice.content}</Text>
              <Text style={styles.barValue}>{percent(choice.ratio)}%</Text>
              {result.data?.myChoiceIndex === choice.choiceIndex ? (
                <Text style={[styles.mine, { backgroundColor: tone.label }]}>내 선택</Text>
              ) : null}
            </View>
          </View>
        ))}
        <View style={styles.rate}>
          <Text style={styles.rateLabel}>별점 {mine ?? "-"}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => saveRating(star)} hitSlop={8} style={styles.starHit}>
                <Text style={styles.star}>{(mine ?? 0) >= star ? "★" : "☆"}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Text style={styles.section}>댓글 {comments.data?.items.length ?? 0}</Text>
        {(comments.data?.items ?? []).map((comment) => (
          <View key={comment.id} style={styles.comment}>
            <Text style={[styles.alias, { color: tone.label }]}>{comment.nickname}</Text>
            <Text style={styles.commentBody}>{comment.content}</Text>
            <View style={styles.commentRow}>
              <Pressable onPress={() => like(comment)} hitSlop={8} style={[styles.like, comment.likedByMe && styles.likeOn]}>
                <Text style={styles.thumb}>👍</Text>
                <Text style={[styles.likeCount, comment.likedByMe && styles.likeCountOn]}>{comment.likeCount}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setError("");
                  setPickedReason(null);
                  setReportNote("");
                  setReportTarget(comment);
                }}
                hitSlop={8}
                style={styles.report}
              >
                <Text style={[styles.flag, comment.reportedByMe && styles.flagOn]}>⚑</Text>
                {comment.reportedByMe ? <Text style={styles.reported}>신고함</Text> : null}
              </Pressable>
            </View>
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={[styles.composer, { marginBottom: keyboardLift }]}>
        <TextInput
          ref={commentInput}
          value={content}
          onChangeText={setContent}
          placeholder="댓글을 남겨 주세요"
          placeholderTextColor={palette.muted}
          style={styles.input}
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
        <Pressable
          style={[styles.send, !content.trim() && { opacity: 0.5 }]}
          disabled={!content.trim() || sendComment.isPending}
          onPress={() => {
            commentInput.current?.blur();
            Keyboard.dismiss();
            setKeyboardLift(0);
            sendComment.mutate();
          }}
        >
          <Text style={styles.sendText}>등록</Text>
        </Pressable>
      </View>
      <Modal visible={reportTarget != null} transparent animationType="fade" onRequestClose={closeReport}>
        <Pressable style={styles.dim} onPress={closeReport}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            {reportTarget?.reportedByMe ? (
              <>
                <Text style={styles.sheetTitle}>신고 취소</Text>
                {reportTarget.reportReason ? <Text style={styles.picked}>({reportTarget.reportReason})</Text> : null}
                <Text style={styles.sheetBody}>이 신고를 취소할까요?</Text>
                <Pressable style={styles.withdraw} disabled={reporting} onPress={withdrawReport}>
                  <Text style={styles.withdrawText}>신고 취소</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.sheetTitle}>신고</Text>
                <Text style={styles.sheetBody}>이유를 고르거나 적어 주세요.</Text>
                <ScrollView keyboardShouldPersistTaps="handled" style={[styles.reasonList, keyboardLift > 0 && styles.reasonListShort]} bounces={false}>
                  {reportReasons.map((reason) => {
                    const on = pickedReason === reason;
                    return (
                      <Pressable
                        key={reason}
                        disabled={reporting}
                        onPress={() => report(reason)}
                        style={({ pressed }) => [styles.reason, (pressed || on) && styles.reasonOn]}
                      >
                        <Text style={[styles.reasonText, on && styles.reasonTextOn]}>{reason}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <TextInput
                  ref={reportInput}
                  value={reportNote}
                  onChangeText={setReportNote}
                  placeholder="직접 적어 주세요"
                  placeholderTextColor={palette.muted}
                  style={styles.reportInput}
                  maxLength={500}
                  multiline
                />
                <Pressable
                  style={[styles.send, { marginTop: 8 }, (!reportNote.trim() || reporting) && { opacity: 0.5 }]}
                  disabled={!reportNote.trim() || reporting}
                  onPress={() => report(reportNote.trim())}
                >
                  <Text style={styles.sendText}>이 내용으로 신고</Text>
                </Pressable>
              </>
            )}
            {error ? <Text style={styles.sheetError}>{error}</Text> : null}
            <Pressable style={styles.cancel} disabled={reporting} onPress={closeReport}>
              <Text style={styles.cancelText}>{reportTarget?.reportedByMe ? "닫기" : "취소"}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
};

export default QuestionResultScreen;

const styles = StyleSheet.create({
  back: { paddingHorizontal: 20 },
  backMark: { fontSize: 32, color: palette.text },
  backText: { color: palette.text, fontWeight: "700" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  kicker: { textAlign: "center", fontWeight: "700" },
  title: { marginTop: 8, marginBottom: 16, fontSize: 26, lineHeight: 34, fontWeight: "800", textAlign: "center", color: palette.text },
  archive: { textAlign: "center", color: palette.muted, fontWeight: "700", marginTop: -8, marginBottom: 16 },
  track: { borderRadius: 16, minHeight: 56, marginBottom: 8, backgroundColor: "#fff", overflow: "hidden", justifyContent: "center" },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0 },
  bar: { minHeight: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  barLabel: { flex: 1, fontWeight: "700", color: palette.text },
  barValue: { fontWeight: "800", color: palette.text },
  mine: { marginLeft: 8, backgroundColor: "#7A5C78", color: "#fff", overflow: "hidden", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, fontWeight: "700" },
  rate: { marginTop: 8, minHeight: 48, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rateLabel: { fontWeight: "800", fontSize: 16, lineHeight: 22, includeFontPadding: false, color: palette.text },
  stars: { flexDirection: "row", alignItems: "center" },
  starHit: { height: 22, justifyContent: "center" },
  star: { fontSize: 20, lineHeight: 22, includeFontPadding: false, textAlignVertical: "center", color: "#F5C518", marginLeft: 2 },
  section: { marginTop: 18, marginBottom: 8, fontWeight: "800", color: palette.text },
  comment: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#5C4030",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  alias: { fontWeight: "800" },
  commentBody: { marginTop: 4, color: palette.text, lineHeight: 20 },
  commentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  like: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 2, paddingVertical: 2 },
  likeOn: { backgroundColor: "#F3E8F4", paddingHorizontal: 8 },
  thumb: { fontSize: 14, lineHeight: 18, includeFontPadding: false },
  likeCount: { color: palette.muted, fontSize: 12, fontWeight: "700", includeFontPadding: false },
  likeCountOn: { color: "#7A5C78" },
  report: { flexDirection: "row", alignItems: "center", gap: 4 },
  flag: { color: palette.muted, fontSize: 16, lineHeight: 18, includeFontPadding: false },
  flagOn: { color: "#B42318" },
  reported: { color: "#B42318", fontSize: 12, fontWeight: "700" },
  dim: { flex: 1, backgroundColor: "rgba(40,32,36,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  sheetTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", color: palette.text },
  sheetBody: { marginTop: 8, marginBottom: 8, textAlign: "center", color: palette.muted, lineHeight: 20 },
  reasonList: { maxHeight: 220 },
  reasonListShort: { maxHeight: 96 },
  reason: { minHeight: 48, borderRadius: 14, borderWidth: 1.5, borderColor: "transparent", backgroundColor: palette.background, alignItems: "center", justifyContent: "center", marginTop: 8 },
  reasonOn: { backgroundColor: "#E4D7FB", borderColor: "#7A5C78" },
  reasonText: { fontWeight: "700", color: palette.text },
  reasonTextOn: { color: "#7A5C78" },
  reportInput: { marginTop: 8, backgroundColor: palette.background, borderRadius: 14, borderWidth: 1.5, borderColor: "#C4B5E8", minHeight: 48, maxHeight: 96, paddingHorizontal: 14, paddingVertical: 12, color: palette.text },
  picked: { marginTop: 10, textAlign: "center", fontSize: 16, lineHeight: 22, fontWeight: "800", color: palette.text },
  sheetError: { marginTop: 8, textAlign: "center", color: "#B42318" },
  withdraw: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: "#B42318", alignItems: "center", justifyContent: "center", marginTop: 14 },
  withdrawText: { color: "#B42318", fontWeight: "800" },
  cancel: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 4 },
  cancelText: { fontWeight: "700", color: palette.muted },
  error: { color: "#B42318", marginBottom: 8 },
  composer: { paddingHorizontal: 20, paddingBottom: 12, gap: 8, backgroundColor: palette.background },
  input: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#C4B5E8", minHeight: 72, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 12, color: palette.text },
  send: { backgroundColor: palette.yellow, borderRadius: 14, minHeight: 46, alignItems: "center", justifyContent: "center" },
  sendText: { fontWeight: "800", color: palette.text },
});
