import { chipTone, palette, toneFor } from "@themes/palette";
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

function CategoryIcon({ slug, color }: { slug?: string; color: string }) {
  if (slug === "love") {
    return (
      <View style={styles.heart}>
        <View style={[styles.heartLobe, { backgroundColor: color, left: 0 }]} />
        <View style={[styles.heartLobe, { backgroundColor: color, right: 0 }]} />
        <View style={[styles.heartTip, { backgroundColor: color }]} />
      </View>
    );
  }
  if (slug === "friendship") {
    return (
      <View style={styles.pair}>
        <Person color={color} />
        <Person color={color} />
      </View>
    );
  }
  if (slug === "work") {
    return (
      <View style={styles.case}>
        <View style={[styles.caseHandle, { borderColor: color }]} />
        <View style={[styles.caseBody, { backgroundColor: color }]} />
      </View>
    );
  }
  if (slug === "daily") {
    return (
      <View style={styles.house}>
        <View style={[styles.roof, { borderBottomColor: color }]} />
        <View style={[styles.houseBody, { backgroundColor: color }]} />
      </View>
    );
  }
  if (slug === "moral") {
    return (
      <View style={styles.scales}>
        <View style={[styles.scaleBeam, { backgroundColor: color }]} />
        <View style={[styles.scalePost, { backgroundColor: color }]} />
        <View style={[styles.scalePan, { borderColor: color, left: 0 }]} />
        <View style={[styles.scalePan, { borderColor: color, right: 0 }]} />
      </View>
    );
  }
  if (slug === "society") {
    return (
      <View style={[styles.globe, { borderColor: color }]}>
        <View style={[styles.globeLine, { backgroundColor: color }]} />
        <View style={[styles.globeMeridian, { borderColor: color }]} />
      </View>
    );
  }
  return null;
}

function Person({ color }: { color: string }) {
  return (
    <View style={styles.person}>
      <View style={[styles.personHead, { backgroundColor: color }]} />
      <View style={[styles.personBody, { backgroundColor: color }]} />
    </View>
  );
}

export function CategoryPill({
  slug,
  name,
  filled = true,
  soft = false,
  look,
  compact = false,
}: {
  slug?: string;
  name: string;
  filled?: boolean;
  soft?: boolean;
  look?: "label" | "outline" | "soft" | "fill";
  compact?: boolean;
}) {
  const tone = toneFor(slug);
  const chip = chipTone(slug);
  const mode = look ?? (filled ? "label" : soft ? "soft" : "outline");
  const background = mode === "outline" ? "#fff" : mode === "soft" ? chip.wash : mode === "fill" ? chip.ink : tone.label;
  const color = mode === "label" || mode === "fill" ? "#fff" : chip.ink;
  const borderColor = mode === "outline" ? chip.ink : background;
  return (
    <View style={[styles.pill, mode === "outline" && styles.pillOutline, compact && styles.pillCompact, { backgroundColor: background, borderColor }]}>
      {compact ? (
        <View style={styles.iconCompact}>
          <View style={styles.iconCompactScale}>
            <CategoryIcon slug={slug} color={color} />
          </View>
        </View>
      ) : (
        <CategoryIcon slug={slug} color={color} />
      )}
      <Text style={[styles.pillText, mode === "outline" && styles.pillTextOutline, compact && styles.pillTextCompact, { color }]}>{name}</Text>
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
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  pillOutline: { paddingHorizontal: 6, paddingVertical: 3 },
  pillCompact: { paddingHorizontal: 6, paddingVertical: 1, gap: 3 },
  pillText: { fontSize: 12, fontWeight: "700" },
  pillTextOutline: { fontSize: 11 },
  pillTextCompact: { fontSize: 11, lineHeight: 14 },
  iconCompact: { width: 12, height: 10, alignItems: "center", justifyContent: "center" },
  iconCompactScale: { position: "absolute", transform: [{ scale: 0.82 }] },
  heart: { width: 12, height: 11 },
  heartLobe: { position: "absolute", width: 7, height: 7, borderRadius: 4, top: 0 },
  heartTip: { position: "absolute", width: 8, height: 8, top: 3, left: 2, transform: [{ rotate: "45deg" }] },
  pair: { width: 14, height: 12, flexDirection: "row", justifyContent: "space-between" },
  person: { width: 7, height: 12, alignItems: "center" },
  personHead: { width: 4, height: 4, borderRadius: 2 },
  personBody: { width: 7, height: 5, borderTopLeftRadius: 4, borderTopRightRadius: 4, marginTop: 1 },
  case: { width: 13, height: 11, alignItems: "center" },
  caseHandle: { width: 6, height: 3, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderWidth: 1.5, borderBottomWidth: 0 },
  caseBody: { width: 13, height: 7, borderRadius: 2, marginTop: -1 },
  house: { width: 12, height: 11, alignItems: "center" },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  houseBody: { width: 8, height: 6, marginTop: -1 },
  scales: { width: 14, height: 12 },
  scaleBeam: { position: "absolute", top: 2, left: 0, width: 14, height: 1.4, borderRadius: 1 },
  scalePost: { position: "absolute", top: 0, left: 6.3, width: 1.4, height: 8, borderRadius: 1 },
  scalePan: { position: "absolute", top: 5, width: 5, height: 5, borderRadius: 3, borderWidth: 1.3 },
  globe: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.3, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  globeLine: { position: "absolute", width: 12, height: 1.2 },
  globeMeridian: { width: 5, height: 12, borderRadius: 3, borderWidth: 1.2 },
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
