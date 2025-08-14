
import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// 현재 Figma 기기 기준
const guideLineBaseWidth = 375;
const guideLineBaseHeight = 731;

// 높이
export const hscale = (size: number) =>
  (SCREEN_WIDTH / guideLineBaseWidth) * size;

// 가로
export const vscale = (size: number) =>
  (SCREEN_HEIGHT / guideLineBaseHeight) * size;

// 폰트 사이즈 width 기준으로 변경
export const fscale = (fontSize: number) =>
  (SCREEN_WIDTH / guideLineBaseWidth) * fontSize;

export const TypographyScale = {
    appTitle: fscale(50),     // App Title
    heading: fscale(25),      // 주요 제목
    title: fscale(23),        // 중간 제목
    body: fscale(16),         // 일반 본문
    caption: fscale(14),      // 보조 설명
    footnote: fscale(12),     // 가장 작은 글자
  };
  
  export const LineHeights = {
    appTitle: vscale(55),
    heading: vscale(30),
    title: vscale(28),
    body: vscale(21),
    caption: vscale(19),
    footnote: vscale(17),
  };