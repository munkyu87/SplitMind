import { Comment, Page, QuestionDetail, QuestionResult } from "@api/types";
import { CategoryPill, Screen } from "@components/ui";
import { QuestionListStackParamList } from "@navigation/QuestionListStack";
import { ApiError, useSession } from "@session/SessionProvider";
import { palette, percent, toneFor } from "@themes/palette";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const QuestionResultScreen = () => {
  const { questionId } = useRoute<RouteProp<QuestionListStackParamList, "QuestionResult">>().params;
  const navigation = useNavigation<NativeStackNavigationProp<QuestionListStackParamList>>();
  const { request, user } = useSession();
  const client = useQueryClient();
  const [rating, setRating] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

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

  const report = async (comment: Comment) => {
    try {
      await request(`/comments/${comment.id}/reports`, {
        method: "POST",
        body: JSON.stringify({ reason: "신고합니다." }),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "신고에 실패했습니다.");
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
              <Pressable key={star} onPress={() => saveRating(star)}>
                <Text style={styles.star}>{(mine ?? 0) >= star ? "★" : "☆"}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.help}>이 질문이 얼마나 흥미로웠나요?</Text>
        </View>
        <Text style={styles.section}>댓글 {comments.data?.items.length ?? 0}</Text>
        {(comments.data?.items ?? []).map((comment) => (
          <View key={comment.id} style={styles.comment}>
            <Text style={[styles.alias, { color: tone.label }]}>{comment.alias}</Text>
            <Text style={styles.commentBody}>{comment.content}</Text>
            <View style={styles.commentRow}>
              <Pressable onPress={() => like(comment)}>
                <Text style={styles.action}>{comment.likedByMe ? "좋아요 취소" : "좋아요"} {comment.likeCount}</Text>
              </Pressable>
              <Pressable onPress={() => report(comment)}>
                <Text style={styles.action}>신고하기</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="댓글을 남겨 주세요"
          placeholderTextColor={palette.muted}
          style={styles.input}
          maxLength={500}
        />
        <Pressable
          style={[styles.send, !content.trim() && { opacity: 0.5 }]}
          disabled={!content.trim() || sendComment.isPending}
          onPress={() => sendComment.mutate()}
        >
          <Text style={styles.sendText}>등록</Text>
        </Pressable>
      </View>
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
  rate: { marginTop: 16, backgroundColor: "#fff", borderRadius: 18, padding: 16, alignItems: "center" },
  rateLabel: { fontWeight: "800", color: "#7A5C78" },
  stars: { flexDirection: "row", marginTop: 6 },
  star: { fontSize: 28, color: "#F5C518", marginHorizontal: 2 },
  help: { marginTop: 4, color: palette.muted, fontSize: 12 },
  section: { marginTop: 18, marginBottom: 8, fontWeight: "800", color: palette.text },
  comment: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 8 },
  alias: { fontWeight: "800" },
  commentBody: { marginTop: 4, color: palette.text, lineHeight: 20 },
  commentRow: { flexDirection: "row", gap: 14, marginTop: 8 },
  action: { color: palette.muted, fontSize: 12 },
  error: { color: "#B42318", marginBottom: 8 },
  composer: { paddingHorizontal: 20, paddingBottom: 12, gap: 8, backgroundColor: palette.background },
  input: { backgroundColor: "#fff", borderRadius: 14, minHeight: 48, paddingHorizontal: 14, color: palette.text },
  send: { backgroundColor: palette.yellow, borderRadius: 14, minHeight: 46, alignItems: "center", justifyContent: "center" },
  sendText: { fontWeight: "800", color: palette.text },
});
