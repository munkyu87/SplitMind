import { Comment, Page, QuestionDetail, QuestionResult } from "@api/types";
import { CategoryPill, Screen } from "@components/ui";
import { QuestionListStackParamList } from "@navigation/QuestionListStack";
import { ApiError, mediaUri, useSession } from "@session/SessionProvider";
import { formatDate, palette, percent, toneFor } from "@themes/palette";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Dimensions, Image, Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const reportReasons = ["욕설·비방", "개인정보", "광고·도배", "주제와 무관"];

const QuestionResultScreen = () => {
  const { questionId } = useRoute<RouteProp<QuestionListStackParamList, "QuestionResult">>().params;
  const navigation = useNavigation<NativeStackNavigationProp<QuestionListStackParamList>>();
  const { request } = useSession();
  const client = useQueryClient();
  const [rating, setRating] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [keyboardLift, setKeyboardLift] = useState(0);
  const [reportTarget, setReportTarget] = useState<Comment | null>(null);
  const [pickedReason, setPickedReason] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [reporting, setReporting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [photoRatio, setPhotoRatio] = useState<number | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
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

  useEffect(() => {
    if (!photoOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setPhotoOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [photoOpen]);

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
  const paints = [
    { fill: tone.a, edge: tone.edgeA },
    { fill: "#F8D5E0", edge: "#E7A8B8" },
    { fill: "#FBF3E4", edge: "#D4C4A8" },
    { fill: "#E5F3E4", edge: "#9BB89A" },
  ];
  const image = detail.data?.imageUrl ?? null;
  const commentItems = comments.data?.items ?? [];
  const commentCount = commentItems.reduce((sum, item) => sum + 1 + (item.replies?.length ?? 0), 0);

  const startReply = (comment: Comment) => {
    setReplyTo({ id: comment.id, nickname: comment.nickname });
    setError("");
    commentInput.current?.focus();
  };

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
        body: JSON.stringify({ content: content.trim(), parentId: replyTo?.id }),
      }),
    onSuccess: async () => {
      setContent("");
      setReplyTo(null);
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
        <Pressable
          onPress={() => {
            const names = navigation.getState().routeNames as string[];
            if (names.includes("QuestionSelect")) {
              navigation.replace("QuestionSelect", { questionId });
              return;
            }
            navigation.getParent()?.navigate("Questions", { screen: "QuestionSelect", params: { questionId } });
          }}
          style={styles.blocked}
        >
          <Text style={styles.backText}>참여한 뒤에 결과를 볼 수 있습니다.</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backMark}>‹</Text>
        </Pressable>
        {category ? <CategoryPill slug={category.slug} name={category.name} look="soft" compact /> : <View />}
        <View style={styles.backSpace} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{detail.data?.title}</Text>
        {image ? (
          <Pressable onPress={() => setPhotoOpen(true)} style={styles.photoWrap}>
            <Image
              source={{ uri: mediaUri(image) ?? undefined }}
              style={[styles.photo, photoRatio ? resultPhotoSize(photoRatio) : styles.photoPending]}
              resizeMode="cover"
              onLoad={(event) => {
                const { width, height } = event.nativeEvent.source;
                if (width && height) setPhotoRatio(width / height);
              }}
            />
          </Pressable>
        ) : null}
        {detail.data?.description ? (
          <View style={styles.story}>
            <Text style={styles.storyLabel}>상황 설명</Text>
            <Text style={styles.storyBody}>{detail.data.description}</Text>
          </View>
        ) : null}
        <View style={styles.meta}>
          <View style={styles.metaLeft}>
            <PeopleMark />
            <Text style={styles.metaText}>{(result.data?.total ?? 0).toLocaleString("ko-KR")}명이 참여했어요</Text>
          </View>
          {detail.data?.publishedAt ? <Text style={styles.metaText}>투표일 {formatDate(detail.data.publishedAt)}</Text> : null}
        </View>
        <View style={styles.panel}>
          {result.data?.choices.map((choice, index) => {
            const paint = paints[choice.choiceIndex] ?? paints[0];
            const chosen = result.data?.myChoiceIndex === choice.choiceIndex;
            const ratio = Math.max(percent(choice.ratio), 0);
            const last = index === (result.data?.choices.length ?? 0) - 1;
            return (
              <View key={choice.choiceIndex} style={[styles.track, !last && styles.trackLine]}>
                <View style={styles.barHead}>
                  <View style={[styles.indexBubble, { backgroundColor: paint.fill }]}>
                    <Text style={[styles.index, { color: paint.edge }]}>{choice.choiceIndex + 1}</Text>
                  </View>
                  <Text style={styles.barLabel}>{choice.content}</Text>
                  <View style={styles.barTop}>
                    <Text style={[styles.barValue, chosen && { color: "#7A5C78" }]}>{ratio}%</Text>
                    {chosen ? <Text style={styles.mine}>내 선택</Text> : null}
                  </View>
                </View>
                <View style={styles.graphRow}>
                  <View style={styles.graphTrack}>
                    <View style={[styles.graphFill, { width: `${ratio}%`, backgroundColor: paint.edge }]} />
                  </View>
                  <Text style={styles.count}>{choice.count.toLocaleString("ko-KR")}명</Text>
                </View>
            </View>
          );
          })}
          <View style={styles.rate}>
            <Text style={styles.rateLabel}>이 질문은 어땠나요?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => saveRating(star)} hitSlop={8} style={styles.starHit}>
                  <Text style={styles.star}>{(mine ?? 0) >= star ? "★" : "☆"}</Text>
                </Pressable>
              ))}
              {mine != null ? <Text style={styles.rateScore}>{Number(mine).toFixed(1)}</Text> : null}
            </View>
          </View>
        </View>
        <Text style={styles.section}>댓글 {commentCount}</Text>
        {commentItems.map((comment) => (
          <View key={comment.id} style={styles.comment}>
            <View style={styles.commentHead}>
              <Text style={[styles.alias, { color: tone.label }]}>{comment.nickname}</Text>
              <Text style={styles.when}>{relativeTime(comment.createdAt)}</Text>
            </View>
            <Text style={styles.commentBody}>{comment.content}</Text>
            <View style={styles.commentRow}>
              <View style={styles.commentActions}>
                <Pressable onPress={() => like(comment)} hitSlop={8} style={[styles.like, comment.likedByMe && styles.likeOn]}>
                  <Text style={styles.thumb}>👍</Text>
                  <Text style={[styles.likeCount, comment.likedByMe && styles.likeCountOn]}>{comment.likeCount}</Text>
                </Pressable>
                <Pressable onPress={() => startReply(comment)} hitSlop={8}>
                  <Text style={styles.reply}>{(comment.replies?.length ?? 0) > 0 ? `답글 ${comment.replies?.length}개` : "답글"}</Text>
                </Pressable>
              </View>
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
            {(comment.replies ?? []).map((reply) => (
              <View key={reply.id} style={styles.replyCard}>
                <Text style={[styles.alias, { color: tone.label }]}>{reply.nickname}</Text>
                <Text style={styles.commentBody}>{reply.content}</Text>
                <View style={styles.replyMeta}>
                  <Text style={styles.when}>{relativeTime(reply.createdAt)}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Pressable onPress={() => like(reply)} hitSlop={6}>
                    <Text style={[styles.replyLike, reply.likedByMe && styles.likeCountOn]}>좋아요 {reply.likeCount}</Text>
                  </Pressable>
                  <Text style={styles.dot}>·</Text>
                  <Pressable
                    onPress={() => {
                      setError("");
                      setPickedReason(null);
                      setReportNote("");
                      setReportTarget(reply);
                    }}
                    hitSlop={6}
                  >
                    <Text style={[styles.replyLike, reply.reportedByMe && styles.flagOn]}>{reply.reportedByMe ? "신고함" : "신고"}</Text>
                  </Pressable>
                  <Text style={styles.dot}>·</Text>
                  <Pressable onPress={() => startReply(reply)} hitSlop={6}>
                    <Text style={styles.replyLike}>답글</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={[styles.composer, { marginBottom: keyboardLift }]}>
        {replyTo ? (
          <View style={styles.replying}>
            <Text style={styles.replyingText}>{replyTo.nickname}에게 답글</Text>
            <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
              <Text style={styles.replyingCancel}>취소</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.composerRow}>
          <TextInput
            ref={commentInput}
            value={content}
            onChangeText={setContent}
            placeholder={replyTo ? "답글을 남겨 주세요" : "댓글을 남겨주세요 (최대 500자)"}
            placeholderTextColor={palette.muted}
            style={styles.input}
            multiline
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
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
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
      {photoOpen && image ? (
        <Pressable style={styles.viewer} onPress={() => setPhotoOpen(false)}>
          <Image source={{ uri: mediaUri(image) ?? undefined }} style={styles.viewerImage} resizeMode="contain" />
        </Pressable>
      ) : null}
    </Screen>
  );
};

function resultPhotoSize(ratio: number) {
  const maxWidth = Dimensions.get("window").width - 40;
  const maxHeight = Math.round(Dimensions.get("window").height * 0.22);
  let width = maxWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  return { width, height };
}

function PeopleMark() {
  return (
    <View style={styles.people}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={[styles.person, index > 0 && styles.personOverlap]}>
          <View style={styles.personHead} />
          <View style={styles.personBody} />
        </View>
      ))}
    </View>
  );
}

export default QuestionResultScreen;

function relativeTime(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatDate(iso);
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, minHeight: 40 },
  back: { width: 44, height: 40, alignItems: "center", justifyContent: "center" },
  backMark: { fontSize: 32, lineHeight: 32, color: palette.text },
  backSpace: { width: 44 },
  backText: { color: palette.text, fontWeight: "700" },
  blocked: { paddingHorizontal: 20, marginTop: 24 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { marginTop: 4, marginBottom: 16, fontSize: 26, lineHeight: 34, fontWeight: "800", textAlign: "center", color: palette.text },
  story: { marginBottom: 16 },
  storyLabel: { marginBottom: 8, fontSize: 13, fontWeight: "800", color: palette.muted },
  storyBody: { fontSize: 16, lineHeight: 26, color: palette.text },
  photoWrap: { alignItems: "center", marginBottom: 14 },
  photo: { borderRadius: 16, backgroundColor: "#fff" },
  photoPending: { width: "100%", height: 150 },
  viewer: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(40,32,36,0.86)", alignItems: "center", justifyContent: "center", padding: 20 },
  viewerImage: { width: Dimensions.get("window").width - 32, height: Dimensions.get("window").height * 0.72 },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 },
  metaLeft: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  metaText: { color: palette.muted, fontSize: 13, fontWeight: "700" },
  people: { flexDirection: "row", alignItems: "flex-end" },
  person: { width: 12, height: 14, alignItems: "center" },
  personOverlap: { marginLeft: -4 },
  personHead: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.muted },
  personBody: { width: 10, height: 6, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: palette.muted, marginTop: 1 },
  panel: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 8 },
  track: { paddingHorizontal: 14, paddingVertical: 12 },
  trackLine: { borderBottomWidth: 1, borderBottomColor: "#F3EEE8" },
  barHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  indexBubble: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  index: { fontSize: 14, fontWeight: "800" },
  barLabel: { flex: 1, fontWeight: "800", color: palette.text, lineHeight: 20 },
  barTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  barValue: { fontWeight: "800", color: palette.text, fontSize: 16 },
  graphRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  graphTrack: { flex: 1, height: 8, borderRadius: 999, backgroundColor: "#F3EEE8", overflow: "hidden" },
  graphFill: { height: 8, borderRadius: 999 },
  count: { minWidth: 48, textAlign: "right", color: palette.muted, fontSize: 12, fontWeight: "700" },
  mine: { backgroundColor: "#F8D5E0", color: "#7A5C78", overflow: "hidden", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: "800" },
  rate: { minHeight: 52, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#F3EEE8" },
  rateLabel: { fontWeight: "800", fontSize: 16, lineHeight: 22, includeFontPadding: false, color: palette.text },
  stars: { flexDirection: "row", alignItems: "center" },
  starHit: { height: 22, justifyContent: "center" },
  star: { fontSize: 20, lineHeight: 22, includeFontPadding: false, textAlignVertical: "center", color: "#F5C518", marginLeft: 2 },
  rateScore: { marginLeft: 6, fontWeight: "800", color: palette.text },
  section: { marginTop: 18, marginBottom: 8, fontWeight: "800", color: palette.text },
  commentHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  when: { color: palette.muted, fontSize: 12 },
  commentActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  reply: { color: palette.muted, fontSize: 13, fontWeight: "700" },
  replyCard: { marginTop: 12, marginLeft: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#E7E0D8" },
  replyMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4, marginTop: 6 },
  replyLike: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  dot: { color: palette.muted, fontSize: 12 },
  replying: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  replyingText: { color: "#7A5C78", fontWeight: "700" },
  replyingCancel: { color: palette.muted, fontWeight: "700" },
  composerRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
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
  input: { flex: 1, backgroundColor: "#fff", borderRadius: 22, borderWidth: 1, borderColor: palette.line, minHeight: 44, maxHeight: 120, paddingHorizontal: 16, paddingVertical: 10, color: palette.text },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center" },
  sendText: { fontWeight: "800", fontSize: 18, color: palette.text },
});
