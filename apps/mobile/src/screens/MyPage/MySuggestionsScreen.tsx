import { Suggestion } from "@api/types";
import { CategoryPill, Screen } from "@components/ui";
import { MyStackParamList } from "@navigation/MyStack";
import { mediaUri, useSession } from "@session/SessionProvider";
import { formatDate, palette } from "@themes/palette";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const statusLabel = { pending: "대기", approved: "승인", rejected: "거절" } as const;

const filters = [
  { id: "all", label: "전체" },
  { id: "pending", label: "대기" },
  { id: "approved", label: "승인" },
  { id: "rejected", label: "거절" },
] as const;

const MySuggestionsScreen = () => {
  const { request } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [openId, setOpenId] = useState<string>();
  const suggestions = useQuery({
    queryKey: ["my-suggestions"],
    queryFn: () => request<Suggestion[]>("/me/suggestions"),
  });
  const items = (suggestions.data ?? []).filter((item) => filter === "all" || item.status === filter);

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>내 제안</Text>
        <Text style={styles.help}>내가 제안한 질문들의 상태를 확인해보세요.</Text>
        <View style={styles.filters}>
          {filters.map((item) => (
            <Pressable key={item.id} onPress={() => setFilter(item.id)} style={[styles.filter, filter === item.id && styles.filterOn]}>
              <Text style={[styles.filterText, filter === item.id && styles.filterTextOn]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        {items.map((item) => {
          const open = openId === item.id;
          return (
          <View key={item.id} style={styles.card}>
            <Pressable onPress={() => setOpenId(open ? undefined : item.id)}>
              <View style={styles.row}>
                <CategoryPill slug={item.category.slug} name={item.category.name} />
                <Text style={[styles.status, styles[item.status]]}>{statusLabel[item.status]}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.date}>{formatDate(item.createdAt)} 제안</Text>
            </Pressable>
            {open ? (
              <View style={styles.choices}>
                {item.choices.map((choice, index) => (
                  <View key={`${item.id}-${index}`} style={styles.choiceRow}>
                    <Text style={styles.choiceIndex}>{index + 1}</Text>
                    <Text style={styles.choiceText}>{choice.content}</Text>
                    {choice.imageUrl ? <Image source={{ uri: mediaUri(choice.imageUrl) }} style={styles.thumb} /> : null}
                  </View>
                ))}
              </View>
            ) : null}
            {item.status === "approved" && item.questionId ? (
              <Pressable
                onPress={() =>
                  navigation.getParent()?.navigate("Questions", {
                    screen: "QuestionResult",
                    params: { questionId: item.questionId },
                  })
                }
              >
                <Text style={styles.link}>공개된 질문 보기</Text>
              </Pressable>
            ) : null}
            {item.status === "rejected" && item.reviewReason ? <Text style={styles.reason}>거절 사유 {item.reviewReason}</Text> : null}
          </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
};

export default MySuggestionsScreen;

const styles = StyleSheet.create({
  back: { paddingHorizontal: 20 },
  backText: { fontSize: 32, color: palette.text },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "800", color: palette.text },
  help: { marginTop: 4, marginBottom: 12, color: palette.muted },
  filters: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filter: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#fff" },
  filterOn: { backgroundColor: "#E4D7FB" },
  filterText: { color: palette.muted, fontWeight: "700" },
  filterTextOn: { color: "#7A5C78" },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  status: { fontWeight: "800", fontSize: 13 },
  pending: { color: palette.muted },
  approved: { color: "#2F6F6A" },
  rejected: { color: "#B42318" },
  cardTitle: { marginTop: 8, fontSize: 16, fontWeight: "800", color: palette.text },
  date: { marginTop: 4, color: palette.muted, fontSize: 12 },
  choices: { marginTop: 12, gap: 8 },
  choiceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  choiceIndex: { width: 16, fontWeight: "800", color: palette.muted },
  choiceText: { flex: 1, color: palette.text, lineHeight: 20 },
  thumb: { width: 36, height: 36, borderRadius: 8 },
  link: { marginTop: 8, color: "#2F6F6A", fontWeight: "700" },
  reason: { marginTop: 8, color: "#B42318" },
});
