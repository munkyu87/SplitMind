import { Category, Page, QuestionCard } from "@api/types";
import { CategoryPill, LogoMark, Screen } from "@components/ui";
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
      <View style={styles.brand}>
        <LogoMark />
        <View>
          <Text style={styles.brandName}>SplitMind</Text>
          <Text style={styles.brandSlogan}>Life = Choices</Text>
        </View>
      </View>
      <View style={styles.search}>
        <SearchMark />
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => setSearch(q.trim())}
          placeholder="질문을 검색해 보세요"
          placeholderTextColor={palette.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>
      <View style={styles.chips}>
        <Pressable onPress={() => setCategory(undefined)} style={[styles.chip, !category && styles.chipOn]}>
          <Text style={[styles.chipText, !category && styles.chipTextOn]}>전체</Text>
        </Pressable>
        {(categories.data ?? []).filter((item) => !item.requiresAdult).map((item) => (
          <Pressable key={item.id} onPress={() => setCategory(item.slug)}>
            <CategoryPill slug={item.slug} name={item.name} look={category === item.slug ? "fill" : "outline"} />
          </Pressable>
        ))}
      </View>
      <View style={styles.sorts}>
        {sorts.map((item) => (
          <Pressable key={item.id} onPress={() => setSort(item.id)}>
            <Text style={[styles.sort, sort === item.id && styles.sortOn]}>{item.label}</Text>
          </Pressable>
        ))}
        <View style={styles.rule} />
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
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 88, gap: 10 }}
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
                style={styles.card}
                onPress={() =>
                  navigation.navigate(item.answered ? "QuestionResult" : "QuestionSelect", { questionId: item.id })
                }
              >
                <View style={styles.cardTop}>
                  {cat ? <CategoryPill slug={cat.slug} name={cat.name} look="soft" compact /> : <View />}
                  {item.answered ? (
                    <Text style={styles.done} accessibilityLabel="참여완료">
                      ✓
                    </Text>
                  ) : null}
                </View>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
                <View style={styles.metaRow}>
                  <PersonMark />
                  <Text style={styles.meta}>{item.participantCount.toLocaleString("ko-KR")}명</Text>
                  <View style={styles.metaGap} />
                  {item.averageRating != null ? (
                    <Text style={styles.rating}>
                      <Text style={styles.star}>★</Text> {item.averageRating.toFixed(1)}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
};

function SearchMark() {
  return (
    <View style={styles.searchMark}>
      <View style={styles.searchRing} />
      <View style={styles.searchHandle} />
    </View>
  );
}

function PersonMark() {
  return (
    <View style={styles.countPerson}>
      <View style={styles.countHead} />
      <View style={styles.countBody} />
    </View>
  );
}

export default QuestionListScreen;

const styles = StyleSheet.create({
  search: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, color: palette.text, paddingVertical: 8 },
  searchMark: { width: 16, height: 16 },
  searchRing: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.6, borderColor: palette.muted },
  searchHandle: {
    position: "absolute",
    width: 6,
    height: 1.6,
    backgroundColor: palette.muted,
    right: 0,
    bottom: 2,
    transform: [{ rotate: "45deg" }],
  },
  brand: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  brandName: { fontSize: 18, fontWeight: "800", color: palette.text, lineHeight: 22 },
  brandSlogan: { fontSize: 11, color: palette.muted, lineHeight: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, paddingTop: 10 },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#fff", borderWidth: 1, borderColor: "#D4C6F2" },
  chipOn: { backgroundColor: "#A790E2", borderColor: "#A790E2" },
  chipText: { color: "#A790E2", fontWeight: "700", fontSize: 11 },
  chipTextOn: { color: "#fff" },
  sorts: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 8 },
  sort: { color: palette.muted, fontWeight: "600", fontSize: 14 },
  sortOn: { color: palette.text, fontWeight: "800", textDecorationLine: "underline" },
  rule: { width: 1, height: 14, backgroundColor: palette.line, marginLeft: "auto" },
  mine: { flexDirection: "row", gap: 6 },
  miss: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: palette.line,
  },
  missOn: { backgroundColor: "#EDE4F6", borderColor: "#EDE4F6" },
  missText: { color: palette.muted, fontWeight: "700", fontSize: 12 },
  missTextOn: { color: "#7A5C78" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: "#5C4030",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  done: { color: "#5C4560", fontSize: 16, fontWeight: "800" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: palette.text, lineHeight: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  countPerson: { width: 12, height: 12, alignItems: "center", marginRight: 4 },
  countHead: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.muted },
  countBody: { width: 9, height: 5, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: palette.muted, marginTop: 1 },
  meta: { color: palette.muted, fontSize: 13 },
  metaGap: { flex: 1 },
  rating: { color: palette.muted, fontSize: 13, marginRight: 6 },
  star: { color: "#F5C518" },
  chevron: { color: "#C4B8B0", fontSize: 20, fontWeight: "600", marginTop: -2 },
  empty: { textAlign: "center", color: palette.muted, marginTop: 40 },
});
