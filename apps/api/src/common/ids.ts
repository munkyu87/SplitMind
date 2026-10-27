export function encodeOffset(offset: number) {
  return Buffer.from(String(offset)).toString("base64url");
}

export function decodeOffset(cursor?: string) {
  if (!cursor) return 0;
  const value = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  if (!Number.isInteger(value) || value < 0) return -1;
  return value;
}
