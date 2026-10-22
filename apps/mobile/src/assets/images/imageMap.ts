export const imageMap = {
  // images
  splitMind: require('@assets/images/image/splitMind.png'),
  splitMindText: require('@assets/images/image/splitMindText.png'),
  sun: require('@assets/images/image/sun.png'),
  moon: require('@assets/images/image/moon.png'),
  star: require('@assets/images/image/star.png'),

  // icons
  googleLight: require('@assets/images/icons/googleLight.png'),
  googleDark: require('@assets/images/icons/googleDark.png'),
  googleNatural: require('@assets/images/icons/googleNatural.png'),
  kakao: require('@assets/images/icons/kakao.png'),
  kakaoDark: require('@assets/images/icons/kakaoDark.png'),
  kakaoShadow: require('@assets/images/icons/kakaoShadow.png'),
  naver: require('@assets/images/icons/naver.png'),
  naverDark: require('@assets/images/icons/naverDark.png'),
  naverLight: require('@assets/images/icons/naverLight.png'),
} as const;

export type ImageName = keyof typeof imageMap;
