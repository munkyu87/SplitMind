import { AiSetting, ReportRow, Suggestion } from "@api/types";
import { CategoryPill, Screen, YellowButton } from "@components/ui";
import { MyStackParamList } from "@navigation/MyStack";
import { ApiError, useSession } from "@session/SessionProvider";
import { formatDate, palette } from "@themes/palette";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const tabs = ["대기", "신고", "AI"] as const;

const AdminScreen = () => {
  const { request } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const client = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]>("대기");
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const pending = useQuery({
    queryKey: ["admin-pending"],
    queryFn: () => request<Suggestion[]>("/admin/suggestions"),
  });
  const reports = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => request<ReportRow[]>("/admin/reports"),
  });
  const setting = useQuery({
    queryKey: ["admin-ai"],
    queryFn: () => request<AiSetting>("/admin/ai/settings"),
  });

  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["admin-pending"] });
    await client.invalidateQueries({ queryKey: ["admin-reports"] });
    await client.invalidateQueries({ queryKey: ["questions"] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => request(`/admin/suggestions/${id}/approve`, { method: "POST" }),
    onSuccess: refresh,
    onError: (err) => setMessage(err instanceof ApiError ? err.message : "승인에 실패했습니다."),
  });
  const reject = useMutation({
    mutationFn: (id: string) =>
      request(`/admin/suggestions/${id}/reject`, { method: "POST", body: JSON.stringify({ reason: reason.trim() }) }),
    onSuccess: async () => {
      setTarget(null);
      setReason("");
      await refresh();
    },
    onError: (err) => setMessage(err instanceof ApiError ? err.message : "거절에 실패했습니다."),
  });
  const removeComment = useMutation({
    mutationFn: (id: string) => request(`/comments/${id}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin-reports"] }),
  });
  const saveAi = useMutation({
    mutationFn: (body: Pick<AiSetting, "enabled" | "cadence" | "prompt">) =>
      request("/admin/ai/settings", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin-ai"] }),
  });
  const generate = useMutation({
    mutationFn: () => request("/admin/ai/generate", { method: "POST" }),
    onSuccess: async () => {
      setMessage("초안을 대기열에 넣었습니다.");
      await client.invalidateQueries({ queryKey: ["admin-pending"] });
    },
    onError: (err) => setMessage(err instanceof ApiError ? err.message : "생성에 실패했습니다."),
  });

  const ai = setting.data;

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{tab === "AI" ? "AI 설정" : tab === "신고" ? "신고 관리" : "승인 대기"}</Text>
        <View style={styles.back} />
      </View>
      <View style={styles.tabs}>
        {tabs.map((item) => {
          const count = item === "대기" ? pending.data?.length : item === "신고" ? reports.data?.length : undefined;
          return (
            <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabOn]}>
              <Text style={[styles.tabText, tab === item && styles.tabTextOn]}>{item}</Text>
              {count != null ? (
                <View style={[styles.count, tab === item && styles.countOn]}>
                  <Text style={[styles.countText, tab === item && styles.countTextOn]}>{count}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {tab === "대기"
          ? (pending.data ?? []).map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHead}>
                  <CategoryPill slug={item.category.slug} name={item.category.name} look="soft" compact />
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.choices.map((choice) => (
                  <Text key={choice.content} style={styles.choice}>
                    {choice.content}
                  </Text>
                ))}
                <View style={styles.row}>
                  <Pressable style={styles.approve} onPress={() => approve.mutate(item.id)}>
                    <Text style={styles.approveText}>승인</Text>
                  </Pressable>
                  <Pressable style={styles.reject} onPress={() => setTarget(item.id)}>
                    <Text style={styles.rejectText}>거절</Text>
                  </Pressable>
                </View>
                {target === item.id ? (
                  <View>
                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder="거절 사유"
                      placeholderTextColor={palette.muted}
                      style={styles.input}
                    />
                    <Pressable style={styles.reject} onPress={() => reason.trim() && reject.mutate(item.id)}>
                      <Text style={styles.rejectText}>사유와 함께 거절</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))
          : null}
        {tab === "신고"
          ? (reports.data ?? []).map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={styles.reasonPill}>
                    <Text style={styles.reasonText}>{item.reason}</Text>
                  </View>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.content || "삭제된 댓글"}</Text>
                <Pressable disabled={item.deleted} onPress={() => removeComment.mutate(item.commentId)} style={[styles.delete, item.deleted && styles.deleteOff]}>
                  <Text style={styles.deleteText}>{item.deleted ? "삭제됨" : "댓글 삭제"}</Text>
                </Pressable>
              </View>
            ))
          : null}
        {tab === "AI" && ai ? (
          <View style={styles.card}>
            <Pressable
              onPress={() => saveAi.mutate({ enabled: !ai.enabled, cadence: ai.cadence, prompt: ai.prompt })}
            >
              <Text style={styles.cardTitle}>AI 초안 생성 {ai.enabled ? "사용" : "꺼짐"}</Text>
            </Pressable>
            <View style={styles.row}>
              {(["manual", "daily", "weekly"] as const).map((cadence) => (
                <Pressable
                  key={cadence}
                  style={[styles.tab, ai.cadence === cadence && styles.tabOn]}
                  onPress={() => saveAi.mutate({ enabled: ai.enabled, cadence, prompt: ai.prompt })}
                >
                  <Text style={styles.tabText}>{cadence === "manual" ? "수동" : cadence === "daily" ? "매일" : "매주"}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.note}>19금 카테고리는 AI 추천 후보에서 제외됩니다.</Text>
            <YellowButton label={generate.isPending ? "만드는 중" : "지금 만들기"} onPress={() => generate.mutate()} />
          </View>
        ) : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </Screen>
  );
};

export default AdminScreen;

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, minHeight: 44 },
  back: { width: 44, height: 40, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 32, lineHeight: 32, color: palette.text },
  title: { fontSize: 22, fontWeight: "800", color: palette.text },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#fff" },
  tabOn: { backgroundColor: "#C9B6F2" },
  tabText: { fontWeight: "800", color: palette.text },
  tabTextOn: { color: "#fff" },
  count: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#F3EEE8", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  countOn: { backgroundColor: "#fff" },
  countText: { fontSize: 11, fontWeight: "800", color: palette.muted },
  countTextOn: { color: "#7A5C78" },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  date: { color: palette.muted, fontSize: 12 },
  reasonPill: { backgroundColor: "#FDE8EA", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  reasonText: { color: "#C45B6A", fontWeight: "800", fontSize: 12 },
  delete: { marginTop: 4, backgroundColor: "#7A5C78", borderRadius: 14, minHeight: 44, alignItems: "center", justifyContent: "center" },
  deleteOff: { backgroundColor: "#E7E0D8" },
  deleteText: { color: "#fff", fontWeight: "800" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: palette.text },
  choice: { color: palette.text },
  row: { flexDirection: "row", gap: 8 },
  approve: { flex: 1, backgroundColor: palette.yellow, borderRadius: 14, minHeight: 48, alignItems: "center", justifyContent: "center" },
  approveText: { color: palette.text, fontWeight: "800" },
  reject: { flex: 1, borderWidth: 1.5, borderColor: "#7A5C78", borderRadius: 14, minHeight: 48, alignItems: "center", justifyContent: "center" },
  rejectText: { color: "#7A5C78", fontWeight: "800" },
  input: { backgroundColor: palette.background, borderRadius: 12, minHeight: 44, paddingHorizontal: 12, color: palette.text },
  link: { color: "#7A5C78", fontWeight: "700" },
  note: { color: palette.muted, fontSize: 12 },
  message: { color: palette.text },
});
