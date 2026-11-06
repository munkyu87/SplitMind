import { Suggestion } from "@api/types";
import { CategoryPill, Screen } from "@components/ui";
import { MyStackParamList } from "@navigation/MyStack";
import { mediaUri, useSession } from "@session/SessionProvider";
import { formatDate, palette } from "@themes/palette";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { BackHandler, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
  const [detail, setDetail] = useState<Suggestion>();
  const [photo, setPhoto] = useState<string>();
  const suggestions = useQuery({
    queryKey: ["my-suggestions"],
    queryFn: () => request<Suggestion[]>("/me/suggestions"),
  });
  const items = (suggestions.data ?? []).filter((item) => filter === "all" || item.status === filter);

  useEffect(() => {
    if (!detail && !photo) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (photo) {
        setPhoto(undefined);
        return true;
      }
      setDetail(undefined);
      return true;
    });
    return () => sub.remove();
  }, [detail, photo]);

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable onPress={() => (detail ? setDetail(undefined) : navigation.goBack())} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>내 제안</Text>
        {detail ? (
          <View style={[styles.badge, styles[detail.status]]}>
            <Text style={[styles.badgeText, styles[`${detail.status}Text`]]}>{statusLabel[detail.status]}</Text>
          </View>
        ) : (
          <View style={styles.back} />
        )}
      </View>
      {detail ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>카테고리</Text>
          <CategoryPill slug={detail.category.slug} name={detail.category.name} look="soft" compact />
          <Text style={styles.label}>질문</Text>
          <View style={styles.input}>
            <Text style={styles.body}>{detail.title}</Text>
          </View>
          <Text style={styles.count}>{detail.title.trim().length}/50</Text>
          {detail.description ? (
            <>
              <Text style={styles.label}>배경 설명</Text>
              <View style={styles.input}>
                <Text style={styles.body}>{detail.description}</Text>
              </View>
            </>
          ) : null}
          {detail.imageUrl ? (
            <Pressable onPress={() => setPhoto(detail.imageUrl ?? undefined)} style={styles.photoRow} accessibilityLabel="사진 크게 보기">
              <Image source={{ uri: mediaUri(detail.imageUrl) }} style={styles.questionPhoto} />
            </Pressable>
          ) : null}
          <Text style={styles.label}>선택지</Text>
          {detail.choices.map((choice, index) => (
            <View key={`${detail.id}-${index}`} style={styles.choiceRow}>
              <Text style={styles.choiceIndex}>{index + 1}</Text>
              <View style={styles.field}>
                <Text style={styles.choiceText}>{choice.content}</Text>
                {choice.imageUrl ? (
                  <Pressable onPress={() => setPhoto(choice.imageUrl)} accessibilityLabel="사진 크게 보기">
                    <Image source={{ uri: mediaUri(choice.imageUrl) }} style={styles.thumb} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
          <Text style={styles.date}>{formatDate(detail.createdAt)}</Text>
          {detail.status === "rejected" && detail.reviewReason ? <Text style={styles.reason}>거절 사유 {detail.reviewReason}</Text> : null}
          {detail.status === "approved" && detail.questionId ? (
            <Pressable
              onPress={() =>
                navigation.getParent()?.navigate("Questions", {
                  screen: "QuestionResult",
                  params: { questionId: detail.questionId },
                })
              }
            >
              <Text style={styles.link}>공개된 질문 보기</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.filters}>
            {filters.map((item) => (
              <Pressable key={item.id} onPress={() => setFilter(item.id)} style={[styles.filter, filter === item.id && styles.filterOn]}>
                <Text style={[styles.filterText, filter === item.id && styles.filterTextOn]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          {items.map((item) => (
            <Pressable key={item.id} onPress={() => setDetail(item)} style={styles.card}>
              <View style={styles.row}>
                <CategoryPill slug={item.category.slug} name={item.category.name} look="soft" compact />
                <View style={[styles.badge, styles[item.status]]}>
                  <Text style={[styles.badgeText, styles[`${item.status}Text`]]}>{statusLabel[item.status]}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title.replace(/\s+/g, " ")}
                  </Text>
                  {item.choices.slice(0, 4).map((choice, index) => (
                    <Text key={`${item.id}-${index}`} style={styles.choiceLine} numberOfLines={1}>
                      {choice.content}
                    </Text>
                  ))}
                </View>
                {item.imageUrl ? <Image source={{ uri: mediaUri(item.imageUrl) }} style={styles.cardPhoto} /> : null}
              </View>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {photo ? (
        <Pressable style={styles.viewer} onPress={() => setPhoto(undefined)}>
          <Image source={{ uri: mediaUri(photo) }} style={styles.viewerImage} resizeMode="contain" />
        </Pressable>
      ) : null}
    </Screen>
  );
};

export default MySuggestionsScreen;

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, minHeight: 44 },
  back: { width: 44, height: 40, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 32, lineHeight: 32, color: palette.text },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "800", color: palette.text },
  filters: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filter: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#fff" },
  filterOn: { backgroundColor: "#C9B6F2" },
  filterText: { color: palette.muted, fontWeight: "700" },
  filterTextOn: { color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontWeight: "800", fontSize: 12 },
  pending: { backgroundColor: "#F8F1DE" },
  pendingText: { color: "#A7843A" },
  approved: { backgroundColor: "#E5F3E4" },
  approvedText: { color: "#3E7A4A" },
  rejected: { backgroundColor: "#FDE8EA" },
  rejectedText: { color: "#C45B6A" },
  cardBody: { flexDirection: "row", gap: 12, marginTop: 10 },
  cardCopy: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "800", color: palette.text },
  choiceLine: { marginTop: 2, color: palette.muted, fontSize: 13 },
  cardPhoto: { width: 72, height: 72, borderRadius: 12 },
  label: { marginTop: 14, marginBottom: 8, fontWeight: "800", color: palette.text },
  input: { backgroundColor: "#fff", borderRadius: 14, minHeight: 96, paddingHorizontal: 14, paddingVertical: 12 },
  body: { lineHeight: 22, color: palette.text },
  count: { alignSelf: "flex-end", color: palette.muted, fontSize: 12, marginTop: 4 },
  photoRow: { alignSelf: "flex-start", marginTop: 8 },
  questionPhoto: { width: 72, height: 72, borderRadius: 12 },
  date: { alignSelf: "flex-end", marginTop: 8, color: palette.muted, fontSize: 12 },
  choiceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  choiceIndex: { width: 18, fontWeight: "800", color: palette.muted },
  field: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, minHeight: 48, paddingHorizontal: 14, gap: 8 },
  choiceText: { flex: 1, color: palette.text, lineHeight: 20 },
  thumb: { width: 36, height: 36, borderRadius: 8 },
  link: { marginTop: 8, color: "#2F6F6A", fontWeight: "700" },
  reason: { marginTop: 8, color: "#B42318" },
  viewer: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(40,32,36,0.72)", alignItems: "center", justifyContent: "center", padding: 20 },
  viewerImage: { width: Dimensions.get("window").width - 40, height: Dimensions.get("window").height * 0.72 },
});
