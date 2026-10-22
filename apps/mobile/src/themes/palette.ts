export const palette = {
  background: "#FBF7F4",
  text: "#1A1A1A",
  muted: "#8A8178",
  yellow: "#FEE500",
  kakao: "#FEE500",
  naver: "#03C75A",
  white: "#FFFFFF",
  line: "#E7E0D8",
  blush: "#F3D5E4",
  lilac: "#E4D7FB",
  ink: "#2A2A2A",
};

export type CategoryTone = {
  label: string;
  a: string;
  b: string;
  edgeA: string;
  edgeB: string;
};

const tones: Record<string, CategoryTone> = {
  love: { label: "#7A5C78", a: "#E4D7FB", b: "#F8D5E0", edgeA: "#C4A8D8", edgeB: "#E7A8B8" },
  friendship: { label: "#4F6B52", a: "#D5E4CF", b: "#E7EBD2", edgeA: "#8EAE90", edgeB: "#C5C99A" },
  work: { label: "#2C3E66", a: "#D6E2F5", b: "#E4E8EF", edgeA: "#8AA4C8", edgeB: "#B7BCC8" },
  daily: { label: "#6B645C", a: "#E7E2DA", b: "#F3EDE4", edgeA: "#B5A89A", edgeB: "#D4C8B8" },
  moral: { label: "#2A2A2A", a: "#E2E2E6", b: "#F0EEEB", edgeA: "#8A8A90", edgeB: "#C8C4BE" },
  society: { label: "#2F6F6A", a: "#D4EBE8", b: "#E7F3F0", edgeA: "#7FB0AA", edgeB: "#B7D4CE" },
};

export function toneFor(slug?: string): CategoryTone {
  return tones[slug ?? ""] ?? tones.daily;
}

export function formatDate(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

export function percent(ratio: number) {
  return Math.round(ratio * 100);
}
