import { Category, Page, QuestionCard } from "@api/types";
import { CategoryPill, LogoMark, Screen } from "@components/ui";
import { useSession } from "@session/SessionProvider";
import { palette } from "@themes/palette";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { QuestionListStackParamList } from "@navigation/QuestionListStack";

const sorts = [
  { id: "latest", label: "최신" },
  { id: "popular", label: "참여" },
  { id: "rating", label: "별점" },
  { id: "balance", label: "밸런스" },
] as const;

const QuestionListScreen = () => {
  const { request } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<QuestionListStackParamList>>();
  const [category, setCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<(typeof sorts)[number]["id"]>("latest");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => request<Category[]>("/categories"),
  });
  const questions = useQuery({
    queryKey: ["questions", category, sort, search],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "20", sort });
      if (category) params.set("category", category);
      if (search) params.set("q", search);
      return request<Page<QuestionCard>>(`/questions?${params.toString()}`);
    },
  });

  return (
    <Screen>
      <View style={styles.header}>
        <LogoMark />
        <Text style={styles.title}>질문</Text>
      </View>
      <TextInput
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => setSearch(q.trim())}
        placeholder="제목 검색"
        placeholderTextColor={palette.muted}
        style={styles.search}
        returnKeyType="search"
      />
      <View style={styles.chips}>
        <Pressable onPress={() => setCategory(undefined)} style={[styles.chip, !category && styles.chipOn]}>
          <Text style={[styles.chipText, !category && styles.chipTextOn]}>전체</Text>
        </Pressable>
        {(categories.data ?? []).filter((item) => !item.requiresAdult).map((item) => (
          <Pressable key={item.id} onPress={() => setCategory(item.slug)}>
            <CategoryPill slug={item.slug} name={item.name} filled={category === item.slug} />
          </Pressable>
        ))}
      </View>
      <View style={styles.sorts}>
        {sorts.map((item) => (
          <Pressable key={item.id} onPress={() => setSort(item.id)}>
            <Text style={[styles.sort, sort === item.id && styles.sortOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {questions.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={palette.ink} />
      ) : (
        <FlatList
          data={questions.data?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 10 }}
          ListEmptyComponent={<Text style={styles.empty}>질문이 없습니다.</Text>}
          renderItem={({ item }) => {
            const cat = item.categories[0];
            return (
              <Pressable
                style={styles.card}
                onPress={() =>
                  navigation.navigate(item.answered ? "QuestionResult" : "QuestionSelect", { questionId: item.id })
                }
              >
                <View style={styles.cardTop}>
                  {cat ? <CategoryPill slug={cat.slug} name={cat.name} /> : null}
                  {item.answered ? <Text style={styles.done}>참여완료</Text> : null}
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.meta}>
                  {item.participantCount}명
                  {item.averageRating != null ? `  ·  ★ ${item.averageRating.toFixed(1)}` : ""}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
};

export default QuestionListScreen;

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: palette.text },
  search: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 44,
    color: palette.text,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, paddingTop: 12 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#EDE4F6" },
  chipOn: { backgroundColor: "#7A5C78" },
  chipText: { color: "#7A5C78", fontWeight: "700", fontSize: 12 },
  chipTextOn: { color: "#fff" },
  sorts: { flexDirection: "row", gap: 16, paddingHorizontal: 24, paddingVertical: 14 },
  sort: { color: palette.muted, fontWeight: "600" },
  sortOn: { color: palette.text, fontWeight: "800", textDecorationLine: "underline" },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  done: { color: "#7A5C78", fontSize: 12, fontWeight: "700" },
  cardTitle: { marginTop: 8, fontSize: 16, fontWeight: "800", color: palette.text, lineHeight: 22 },
  meta: { marginTop: 6, color: palette.muted, fontSize: 13 },
  empty: { textAlign: "center", color: palette.muted, marginTop: 40 },
});
