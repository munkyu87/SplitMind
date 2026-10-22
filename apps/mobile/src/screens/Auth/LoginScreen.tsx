import { PRIVACY_HTML_KO, TERMS_HTML_KO } from "@assets/legal/legalHtml";
import { imageMap } from "@assets/images/imageMap";
import { LogoMark, Screen } from "@components/ui";
import { useSession } from "@session/SessionProvider";
import { palette } from "@themes/palette";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AuthStackParamList } from "@navigation/AuthStack";

const buttons = [
  { provider: "kakao" as const, label: "카카오로 계속하기", color: palette.kakao, icon: imageMap.kakaoDark, dark: true },
  { provider: "naver" as const, label: "네이버로 계속하기", color: palette.naver, icon: imageMap.naver, dark: false },
  { provider: "google" as const, label: "구글로 계속하기", color: "#fff", icon: imageMap.googleNatural, dark: true },
];

const LoginScreen = () => {
  const { loginDev } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const enter = async (provider: "kakao" | "naver" | "google") => {
    setBusy(provider);
    setError("");
    try {
      await loginDev(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <View style={styles.body}>
        <LogoMark size={28} />
        <Text style={styles.brand}>SplitMind</Text>
        <Text style={styles.slogan}>Life = Choices.</Text>
        <Text style={styles.headline}>{"곤란한 선택,\n같이 갈라보자."}</Text>
        <Text style={styles.sub}>로그인하고, 고민되는 선택에 투표해보세요.{"\n"}사람들은 어떻게 갈라졌는지 바로 볼 수 있어요.</Text>
        <View style={styles.buttons}>
          {buttons.map((button) => (
            <Pressable
              key={button.provider}
              style={[styles.social, { backgroundColor: button.color }, button.provider === "google" && styles.google]}
              onPress={() => enter(button.provider)}
              disabled={busy !== null}
            >
              {busy === button.provider ? (
                <ActivityIndicator color={palette.text} />
              ) : (
                <>
                  <Image source={button.icon} style={styles.icon} />
                  <Text style={[styles.socialText, { color: button.dark ? palette.text : "#fff" }]}>{button.label}</Text>
                </>
              )}
            </Pressable>
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.legal}>
          <Pressable onPress={() => navigation.navigate("HtmlWebView", { title: "이용약관", html: TERMS_HTML_KO })}>
            <Text style={styles.legalText}>이용약관</Text>
          </Pressable>
          <Text style={styles.legalText}> · </Text>
          <Pressable onPress={() => navigation.navigate("HtmlWebView", { title: "개인정보", html: PRIVACY_HTML_KO })}>
            <Text style={styles.legalText}>개인정보</Text>
          </Pressable>
        </View>
        <Text style={styles.agree}>계속하면 이용약관과 개인정보 처리에 동의합니다.</Text>
      </View>
    </Screen>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  brand: { marginTop: 10, fontSize: 18, fontWeight: "800", color: palette.text },
  slogan: { marginTop: 2, color: palette.muted, fontSize: 13 },
  headline: { marginTop: 28, fontSize: 32, lineHeight: 40, fontWeight: "800", color: palette.text, textAlign: "center" },
  sub: { marginTop: 12, color: palette.muted, textAlign: "center", lineHeight: 20 },
  buttons: { marginTop: 28, alignSelf: "stretch", gap: 10 },
  social: { minHeight: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  google: { borderWidth: 1, borderColor: palette.line },
  icon: { width: 22, height: 22, resizeMode: "contain" },
  socialText: { fontSize: 16, fontWeight: "700" },
  error: { marginTop: 12, color: "#B42318" },
  legal: { marginTop: 22, flexDirection: "row" },
  legalText: { color: palette.muted, fontSize: 13 },
  agree: { marginTop: 8, color: palette.muted, fontSize: 12, textAlign: "center" },
});
