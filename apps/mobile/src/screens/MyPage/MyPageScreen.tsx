import { MyAnswer } from "@api/types";
import { Screen, ScreenTitle } from "@components/ui";
import { MyStackParamList } from "@navigation/MyStack";
import { useSession } from "@session/SessionProvider";
import { formatDate, palette } from "@themes/palette";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const providers = { kakao: "카카오", naver: "네이버", google: "구글" };

const MyPageScreen = () => {
  const { request, user, logout, withdraw, applyUser } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const answers = useQuery({
    queryKey: ["my-answers"],
    queryFn: () => request<MyAnswer[]>("/me/answers"),
  });
  const suggestions = useQuery({
    queryKey: ["my-suggestions"],
    queryFn: () => request<unknown[]>("/me/suggestions"),
  });

  return (
    <Screen>
      <ScreenTitle name="마이" />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profile}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user?.nickname || "닉네임 없음"}</Text>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setNickname(user?.nickname ?? "");
                  setNameError("");
                  setEditing(true);
                }}
              >
                <Text style={styles.edit}>수정</Text>
              </Pressable>
            </View>
            <Text style={styles.meta}>
              {user ? `${providers[user.provider]} · ${user.createdAt ? formatDate(user.createdAt) : ""}` : ""}
            </Text>
            <View style={styles.summary}>
            <Pressable style={styles.stat} onPress={() => navigation.navigate("MyAnswers")}>
              <Text style={styles.summaryNum}>{answers.data?.length ?? 0}</Text>
              <Text style={styles.summaryLabel}>참여한 질문</Text>
            </Pressable>
            <View style={styles.rule} />
            <Pressable style={styles.stat} onPress={() => navigation.navigate("MySuggestions")}>
              <Text style={styles.summaryNum}>{suggestions.data?.length ?? 0}</Text>
              <Text style={styles.summaryLabel}>내 제안</Text>
            </Pressable>
            </View>
          </View>
          {user?.isAdmin ? (
            <Pressable style={styles.link} onPress={() => navigation.navigate("Admin")}>
              <Text style={styles.linkText}>관리자</Text>
            </Pressable>
          ) : null}
        </ScrollView>
        <View style={styles.account}>
          <Pressable onPress={() => logout()} hitSlop={8}>
            <Text style={styles.accountText}>로그아웃</Text>
          </Pressable>
          <Pressable onPress={() => setConfirmLeave(true)} hitSlop={8}>
            <Text style={styles.leaveText}>계정 탈퇴</Text>
          </Pressable>
        </View>
      </View>
      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <Pressable style={styles.dim} onPress={() => setEditing(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>닉네임</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="2~10자"
              placeholderTextColor={palette.muted}
              style={styles.nameInput}
              maxLength={Math.max(10, nickname.length)}
              autoFocus
            />
            <Text style={[styles.nameCount, nickname.trim().length > 10 && styles.leaveError]}>{nickname.trim().length}/10</Text>
            {nameError ? <Text style={styles.leaveError}>{nameError}</Text> : null}
            <View style={styles.sheetRow}>
              <Pressable style={styles.ghost} onPress={() => setEditing(false)}>
                <Text style={styles.ghostText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.save, (saving || nickname.trim().length < 2 || nickname.trim().length > 10) && styles.saveOff]}
                disabled={saving || nickname.trim().length < 2 || nickname.trim().length > 10}
                onPress={async () => {
                  setSaving(true);
                  setNameError("");
                  try {
                    const next = await request<NonNullable<typeof user>>("/me", {
                      method: "PATCH",
                      body: JSON.stringify({ nickname: nickname.trim() }),
                    });
                    applyUser(next);
                    setEditing(false);
                  } catch (err) {
                    setNameError(err instanceof Error ? err.message : "닉네임을 저장하지 못했습니다.");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <Text style={styles.saveText}>{saving ? "저장 중" : "저장"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={confirmLeave} transparent animationType="fade" onRequestClose={() => setConfirmLeave(false)}>
        <Pressable style={styles.dim} onPress={() => setConfirmLeave(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>계정을 탈퇴할까요?</Text>
            <Text style={styles.sheetBody}>댓글은 지워집니다. 투표 수는 남고, 다시 로그인하면 새 계정입니다.</Text>
            {leaveError ? <Text style={styles.leaveError}>{leaveError}</Text> : null}
            <View style={styles.sheetRow}>
              <Pressable style={styles.ghost} onPress={() => setConfirmLeave(false)}>
                <Text style={styles.ghostText}>취소</Text>
              </Pressable>
              <Pressable
                style={styles.danger}
                disabled={leaving}
                onPress={async () => {
                  setLeaving(true);
                  try {
                    await withdraw();
                    setConfirmLeave(false);
                  } catch (err) {
                    setLeaveError(err instanceof Error ? err.message : "탈퇴에 실패했습니다.");
                  } finally {
                    setLeaving(false);
                  }
                }}
              >
                <Text style={styles.dangerText}>{leaving ? "처리 중" : "탈퇴"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
};

export default MyPageScreen;

const styles = StyleSheet.create({
  body: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  account: { flexDirection: "row", justifyContent: "center", gap: 28, paddingBottom: 108 },
  accountText: { fontWeight: "800", color: palette.text, fontSize: 15 },
  profile: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingTop: 18,
    paddingHorizontal: 16,
    shadowColor: "#5C4030",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  name: { flex: 1, fontSize: 22, fontWeight: "800", color: palette.text },
  meta: { marginTop: 4, marginBottom: 14, color: palette.muted, fontSize: 13 },
  edit: { color: "#7A5C78", fontWeight: "800", fontSize: 15 },
  nameInput: { marginTop: 14, backgroundColor: palette.background, borderRadius: 14, minHeight: 48, paddingHorizontal: 14, color: palette.text },
  nameCount: { alignSelf: "flex-end", marginTop: 4, color: palette.muted, fontSize: 12 },
  save: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center" },
  saveOff: { opacity: 0.45 },
  saveText: { fontWeight: "800", color: palette.text },
  summary: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, marginHorizontal: -16, paddingVertical: 16, flexDirection: "row", alignItems: "stretch" },
  stat: { flex: 1, alignItems: "center", justifyContent: "center" },
  rule: { width: 1, backgroundColor: palette.line, marginVertical: 8 },
  summaryNum: { fontSize: 22, fontWeight: "800", textAlign: "center", color: palette.text },
  summaryLabel: { color: palette.muted, fontSize: 12, textAlign: "center" },
  link: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 8 },
  linkText: { fontWeight: "700", color: palette.text },
  leaveText: { fontWeight: "800", color: "#B42318", fontSize: 15 },
  dim: { flex: 1, backgroundColor: "rgba(40,32,36,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  sheetTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", color: palette.text },
  sheetBody: { marginTop: 8, textAlign: "center", color: palette.muted, lineHeight: 20 },
  leaveError: { marginTop: 8, textAlign: "center", color: "#B42318" },
  sheetRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  ghost: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  ghostText: { fontWeight: "700", color: palette.text },
  danger: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: "#B42318", alignItems: "center", justifyContent: "center" },
  dangerText: { color: "#fff", fontWeight: "800" },
});
