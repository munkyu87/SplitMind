import { avatars, AvatarId } from "../../assets/avatars";
import { MyAnswer } from "@api/types";
import { Screen, ScreenTitle } from "@components/ui";
import { MyStackParamList } from "@navigation/MyStack";
import { mediaUri, useSession } from "@session/SessionProvider";
import { formatDate, palette } from "@themes/palette";
import { localStorage } from "@utils/localStorage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { launchImageLibrary } from "react-native-image-picker";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

function isCustomPhoto(value: string | null | undefined) {
  return Boolean(value && (value.startsWith("/") || value.startsWith("file:") || value.startsWith("content:") || value.startsWith("http")));
}

function profilePhoto(value: string | null | undefined) {
  const preset = avatars.find((item) => item.id === value);
  if (preset) return preset.source;
  if (isCustomPhoto(value) && value) return { uri: value.startsWith("/") ? (mediaUri(value) ?? value) : value };
  return avatars[0].source;
}

const providers = { kakao: "카카오", naver: "네이버", google: "구글" };

const MyPageScreen = () => {
  const { request, user, logout, withdraw, applyUser } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [avatarId, setAvatarId] = useState<AvatarId>("raccoon");
  const [draftAvatar, setDraftAvatar] = useState("raccoon");
  const [picked, setPicked] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
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
  const savedAvatar = user ? localStorage.getItem(`profile-avatar:${user.id}`) : null;
  const photo = profilePhoto(savedAvatar ?? avatarId);

  const rememberAvatar = (value: string) => {
    if (user) localStorage.setItem(`profile-avatar:${user.id}`, value);
    setAvatarId(avatars.some((item) => item.id === value) ? (value as AvatarId) : "raccoon");
    setPickingPhoto(false);
    setPhotoError("");
  };

  const pickPhoto = async () => {
    const result = await launchImageLibrary({ mediaType: "photo", selectionLimit: 1 });
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    const type = asset.type === "image/png" || asset.type === "image/webp" ? asset.type : "image/jpeg";
    const name = type === "image/png" ? "profile.png" : type === "image/webp" ? "profile.webp" : "profile.jpg";
    setPicked({ uri: asset.uri, type, name });
    setDraftAvatar(asset.uri);
    setPhotoError("");
  };

  const savePhoto = async () => {
    const preset = avatars.find((item) => item.id === draftAvatar);
    if (preset) {
      setPicked(null);
      rememberAvatar(preset.id);
      return;
    }
    if (draftAvatar.startsWith("/v1/media/")) {
      rememberAvatar(draftAvatar);
      return;
    }
    if (!picked) return;
    setUploading(true);
    setPhotoError("");
    try {
      const body = new FormData();
      body.append("file", { uri: picked.uri, name: picked.name, type: picked.type } as unknown as Blob);
      const uploaded = await request<{ path: string }>("/media", { method: "POST", body });
      setPicked(null);
      rememberAvatar(uploaded.path);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "사진을 올리지 못했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <ScreenTitle name="마이" />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profile}>
            <View style={styles.identity}>
              <Pressable
                onPress={() => {
                  const current = savedAvatar ?? avatarId;
                  setDraftAvatar(avatars.some((item) => item.id === current) || isCustomPhoto(current) ? current : "raccoon");
                  setPicked(null);
                  setPhotoError("");
                  setPickingPhoto(true);
                }}
                style={styles.avatarHit}
              >
                <Image source={photo} style={styles.avatar} />
              </Pressable>
              <View style={styles.identityText}>
                <Text style={styles.name} numberOfLines={1}>
                  {user?.nickname || "닉네임 없음"}
                </Text>
                <Text style={styles.meta}>
                  {user ? `${providers[user.provider]} · ${user.createdAt ? formatDate(user.createdAt) : ""}` : ""}
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                style={styles.edit}
                onPress={() => {
                  setNickname(user?.nickname ?? "");
                  setNameError("");
                  setEditing(true);
                }}
              >
                <Text style={styles.editText}>수정</Text>
              </Pressable>
            </View>
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
            <Pressable style={styles.admin} onPress={() => navigation.navigate("Admin")}>
              <View style={styles.gear}>
                <Text style={styles.gearMark}>⚙</Text>
              </View>
              <View style={styles.adminText}>
                <Text style={styles.adminTitle}>관리자</Text>
                <Text style={styles.adminBody}>관리자 공간으로 이동합니다.</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ) : null}
        </ScrollView>
        <View style={styles.account}>
          <Pressable onPress={() => logout()} hitSlop={8}>
            <Text style={styles.accountText}>로그아웃</Text>
          </Pressable>
          <View style={styles.accountRule} />
          <Pressable onPress={() => setConfirmLeave(true)} hitSlop={8}>
            <Text style={styles.leaveText}>계정 탈퇴</Text>
          </Pressable>
        </View>
      </View>
      <Modal visible={pickingPhoto} transparent animationType="fade" onRequestClose={() => setPickingPhoto(false)}>
        <Pressable style={styles.dim} onPress={() => setPickingPhoto(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>프로필 이미지</Text>
            <Text style={styles.sheetBody}>원하는 이미지를 선택하거나 내 사진을 업로드하세요.</Text>
            <ScrollView style={styles.pickerScroll} contentContainerStyle={styles.pickerContent}>
              <Image source={profilePhoto(draftAvatar)} style={styles.preview} />
              <View style={styles.avatarGrid}>
                {avatars.map((item) => {
                  const on = draftAvatar === item.id;
                  return (
                    <Pressable key={item.id} onPress={() => setDraftAvatar(item.id)} style={[styles.avatarChoice, on && styles.avatarOn]}>
                      <Image source={item.source} style={styles.avatarOption} />
                      {on ? (
                        <View style={styles.check}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
              <Pressable style={[styles.upload, isCustomPhoto(draftAvatar) && styles.uploadOn]} onPress={pickPhoto}>
                {isCustomPhoto(draftAvatar) ? <Image source={profilePhoto(draftAvatar)} style={styles.uploadThumb} /> : <Text style={styles.uploadMark}>📷</Text>}
                <View style={styles.uploadCopy}>
                  <Text style={styles.uploadTitle}>내 사진 업로드</Text>
                  <Text style={styles.uploadBody}>내 사진으로도 프로필 이미지를 설정할 수 있어요.</Text>
                </View>
              </Pressable>
              {photoError ? <Text style={styles.leaveError}>{photoError}</Text> : null}
            </ScrollView>
            <View style={styles.sheetRow}>
              <Pressable style={styles.ghost} onPress={() => setPickingPhoto(false)} disabled={uploading}>
                <Text style={styles.ghostText}>취소</Text>
              </Pressable>
              <Pressable style={[styles.save, uploading && styles.saveOff]} disabled={uploading} onPress={savePhoto}>
                <Text style={styles.saveText}>{uploading ? "올리는 중" : "저장"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  account: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, paddingBottom: 108 },
  accountRule: { width: 1, height: 14, backgroundColor: palette.line },
  accountText: { fontWeight: "800", color: palette.text, fontSize: 15 },
  profile: {
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 16,
    shadowColor: "#5C4030",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  identity: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatarHit: { width: 72, height: 72, borderRadius: 36, overflow: "hidden", backgroundColor: "#F6EFE8" },
  avatar: { width: 72, height: 72 },
  identityText: { flex: 1 },
  name: { fontSize: 22, fontWeight: "800", color: palette.text },
  meta: { marginTop: 4, color: palette.muted, fontSize: 13 },
  edit: { backgroundColor: "#F3E8F4", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  editText: { color: "#7A5C78", fontWeight: "800", fontSize: 13 },
  pickerScroll: { maxHeight: 460 },
  pickerContent: { paddingBottom: 4 },
  preview: { width: 88, height: 88, borderRadius: 44, alignSelf: "center", marginTop: 14 },
  upload: { marginTop: 16, borderRadius: 16, backgroundColor: "#F7F1FB", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  uploadOn: { borderWidth: 2, borderColor: "#7A5C78" },
  uploadMark: { fontSize: 22 },
  uploadThumb: { width: 44, height: 44, borderRadius: 22 },
  uploadCopy: { flex: 1 },
  uploadTitle: { fontWeight: "800", color: palette.text },
  uploadBody: { marginTop: 2, color: palette.muted, fontSize: 12, lineHeight: 16 },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 18 },
  avatarChoice: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: "transparent" },
  avatarOn: { borderColor: "#7A5C78" },
  avatarOption: { width: "100%", height: "100%", borderRadius: 36 },
  check: { position: "absolute", right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: "#7A5C78", alignItems: "center", justifyContent: "center" },
  checkText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  admin: { marginTop: 12, backgroundColor: "#fff", borderRadius: 22, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  gear: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F3E8F4", alignItems: "center", justifyContent: "center" },
  gearMark: { color: "#7A5C78", fontSize: 20 },
  adminText: { flex: 1 },
  adminTitle: { fontWeight: "800", fontSize: 16, color: palette.text },
  adminBody: { marginTop: 2, color: palette.muted, fontSize: 13 },
  chevron: { color: "#C4B8B0", fontSize: 22, fontWeight: "600" },
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
