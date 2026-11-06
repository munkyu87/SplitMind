import { ImageSourcePropType } from "react-native";

export const avatars = [
  { id: "raccoon", source: require("./avatars/raccoon.jpg") as number },
  { id: "rabbit", source: require("./avatars/rabbit.jpg") as number },
  { id: "cat", source: require("./avatars/cat.jpg") as number },
  { id: "dog", source: require("./avatars/dog.jpg") as number },
  { id: "bear", source: require("./avatars/bear.jpg") as number },
  { id: "fox", source: require("./avatars/fox.jpg") as number },
  { id: "penguin", source: require("./avatars/penguin.jpg") as number },
  { id: "hamster", source: require("./avatars/hamster.jpg") as number },
  { id: "otter", source: require("./avatars/otter.jpg") as number },
  { id: "sheep", source: require("./avatars/sheep.jpg") as number },
] as const;

export type AvatarId = (typeof avatars)[number]["id"];

export function avatarSource(id: string | null | undefined): ImageSourcePropType {
  return avatars.find((item) => item.id === id)?.source ?? avatars[0].source;
}
