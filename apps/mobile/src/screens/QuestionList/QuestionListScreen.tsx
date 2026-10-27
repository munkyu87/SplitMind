import { Category, Page, QuestionCard } from "@api/types";
import { CategoryPill, Screen, ScreenTitle } from "@components/ui";
import { useSession } from "@session/SessionProvider";
import { palette } from "@themes/palette";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { QuestionListStackParamList } from "@navigation/QuestionListStack";

const sorts = [
  { id: "latest", label: "최신" },
  { id: "popular", label: "많은순" },
  { id: "rating", label: "별점" },
  { id: "balance", label: "밸런스" },
] as const;

const mineFilters = [
  { id: "answered", label: "참여" },
  { id: "open", label: "미참여" },
] as const;

const QuestionListScreen = () => {
  const { request } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<QuestionListStackParamList>>();
  const [category, setCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<(typeof sorts)[number]["id"]>("latest");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [mine, setMine] = useState<(typeof mineFilters)[number]["id"] | undefined>();

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => request<Category[]>("/categories"),
  });
  const questions = useInfiniteQuery({
    queryKey: ["questions", category, sort, search, mine],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "20", sort });
      if (category) params.set("category", category);
      if (search) params.set("q", search);
      if (mine === "answered") params.set("answered", "true");
      if (mine === "open") params.set("unanswered", "true");
      if (pageParam) params.set("cursor", pageParam);
      return request<Page<QuestionCard>>(`/questions?${params.toString()}`);
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const items = questions.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Screen>
      <ScreenTitle name="질문" />
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
        <View style={styles.mine}>
          {mineFilters.map((item) => {
            const on = mine === item.id;
            return (
              <Pressable key={item.id} onPress={() => setMine(on ? undefined : item.id)} style={[styles.miss, on && styles.missOn]}>
                <Text style={[styles.missText, on && styles.missTextOn]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {questions.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={palette.ink} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120, gap: 18 }}
          onEndReached={() => {
            if (questions.hasNextPage && !questions.isFetchingNextPage) questions.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={questions.isFetchingNextPage ? <ActivityIndicator color={palette.ink} /> : null}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {mine === "open" ? "아직 안 고른 질문이 없습니다." : mine === "answered" ? "참여한 질문이 없습니다." : "질문이 없습니다."}
            </Text>
          }
          renderItem={({ item }) => {
            const cat = item.categories[0];
            return (
              <Pressable
                style={styles.cardWrap}
                onPress={() =>
                  navigation.navigate(item.answered ? "QuestionResult" : "QuestionSelect", { questionId: item.id })
                }
              >
                <View style={styles.card}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.answered ? (
                      <Text style={styles.done} accessibilityLabel="참여완료">
                        ✓
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>{item.participantCount}명</Text>
                    {item.averageRating != null ? (
                      <Text style={styles.rating}>
                        <Text style={styles.star}>★</Text> {item.averageRating.toFixed(1)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {cat ? (
                  <View style={styles.tag} pointerEvents="none">
                    <CategoryPill slug={cat.slug} name={cat.name} />
                  </View>
                ) : null}
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
  mine: { marginLeft: "auto", flexDirection: "row", gap: 6 },
  miss: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#EDE4F6" },
  missOn: { backgroundColor: "#7A5C78" },
  missText: { color: "#7A5C78", fontWeight: "700", fontSize: 12 },
  missTextOn: { color: "#fff" },
  cardWrap: { position: "relative" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingTop: 22,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#5C4030",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  tag: { position: "absolute", top: -13, left: 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  done: { color: "#5C4560", fontSize: 18, fontWeight: "800", lineHeight: 22 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: palette.text, lineHeight: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  meta: { color: palette.muted, fontSize: 13 },
  rating: { marginLeft: "auto", color: palette.muted, fontSize: 13 },
  star: { color: "#F5C518" },
  empty: { textAlign: "center", color: palette.muted, marginTop: 40 },
});
