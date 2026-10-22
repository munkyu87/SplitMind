import { AiSetting, ReportRow, Suggestion } from "@api/types";
import { CategoryPill, Screen, YellowButton } from "@components/ui";
import { MyStackParamList } from "@navigation/MyStack";
import { ApiError, useSession } from "@session/SessionProvider";
import { palette } from "@themes/palette";
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
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.title}>{tab === "AI" ? "AI 설정" : "승인 대기"}</Text>
      <View style={styles.tabs}>
        {tabs.map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabOn]}>
            <Text style={[styles.tabText, tab === item && styles.tabTextOn]}>
              {item}
              {item === "대기" ? ` ${pending.data?.length ?? 0}` : ""}
              {item === "신고" ? ` ${reports.data?.length ?? 0}` : ""}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {tab === "대기"
          ? (pending.data ?? []).map((item) => (
              <View key={item.id} style={styles.card}>
                <CategoryPill slug={item.category.slug} name={item.category.name} />
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
                <Text style={styles.cardTitle}>{item.reason}</Text>
                <Text style={styles.choice}>{item.content}</Text>
                <Pressable disabled={item.deleted} onPress={() => removeComment.mutate(item.commentId)}>
                  <Text style={styles.link}>{item.deleted ? "삭제됨" : "댓글 삭제"}</Text>
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
  back: { paddingHorizontal: 20 },
  backText: { fontSize: 32, color: palette.text },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center", color: palette.text },
  tabs: { flexDirection: "row", gap: 8, justifyContent: "center", marginVertical: 12 },
  tab: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#fff" },
  tabOn: { backgroundColor: "#7A5C78" },
  tabText: { fontWeight: "700", color: palette.text },
  tabTextOn: { color: "#fff" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: palette.text },
  choice: { color: palette.text },
  row: { flexDirection: "row", gap: 8 },
  approve: { flex: 1, backgroundColor: "#7A5C78", borderRadius: 12, minHeight: 44, alignItems: "center", justifyContent: "center" },
  approveText: { color: "#fff", fontWeight: "800" },
  reject: { flex: 1, borderWidth: 1, borderColor: "#7A5C78", borderRadius: 12, minHeight: 44, alignItems: "center", justifyContent: "center" },
  rejectText: { color: "#7A5C78", fontWeight: "800" },
  input: { backgroundColor: palette.background, borderRadius: 12, minHeight: 44, paddingHorizontal: 12, color: palette.text },
  link: { color: "#7A5C78", fontWeight: "700" },
  note: { color: palette.muted, fontSize: 12 },
  message: { color: palette.text },
});
