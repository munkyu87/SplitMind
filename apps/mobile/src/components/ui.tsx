import { palette, toneFor } from "@themes/palette";
import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      <View style={{ width: size * 0.72, height: size, borderRadius: size, backgroundColor: "#C4B5E8" }} />
      <View style={{ width: size * 0.72, height: size, borderRadius: size, backgroundColor: "#F3C3D4" }} />
    </View>
  );
}

export function ScreenTitle({ name }: { name: string }) {
  return (
    <View style={styles.screenTitle}>
      <LogoMark />
      <Text style={styles.screenTitleText}>{name}</Text>
    </View>
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }, style]}>
      <View style={[styles.blob, styles.blobLeft]} />
      <View style={[styles.blob, styles.blobRight]} />
      {children}
    </View>
  );
}

export function CategoryPill({ slug, name, filled = true }: { slug?: string; name: string; filled?: boolean }) {
  const tone = toneFor(slug);
  return (
    <View style={[styles.pill, { backgroundColor: filled ? tone.label : "#fff", borderColor: tone.label }]}>
      <Text style={[styles.pillText, { color: filled ? "#fff" : tone.label }]}>{name}</Text>
    </View>
  );
}

export function YellowButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.yellow, disabled && { opacity: 0.5 }]}>
      <Text style={styles.yellowText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenTitle: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  screenTitleText: { fontSize: 22, fontWeight: "800", color: palette.text },
  screen: { flex: 1, backgroundColor: palette.background },
  blob: { position: "absolute", width: 180, height: 180, borderRadius: 90, opacity: 0.55 },
  blobLeft: { top: -40, left: -70, backgroundColor: "#E6DDF8" },
  blobRight: { top: 80, right: -90, backgroundColor: "#F8D7E6" },
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  pillText: { fontSize: 12, fontWeight: "700" },
  yellow: {
    backgroundColor: palette.yellow,
    borderRadius: 16,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  yellowText: { color: palette.text, fontSize: 16, fontWeight: "800" },
});
