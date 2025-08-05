import React from 'react';
import { Text, TextProps, TextStyle, StyleSheet } from 'react-native';
import { TypographyScale, LineHeights } from '@utils/scale';
import { isAndroid } from '@utils/platform';

type TypographyKey = keyof typeof TypographyScale;

interface AppTextProps extends TextProps {
  size?: TypographyKey;
  isBold?: boolean;
}

const AppText = ({
  size = 'body',
  isBold = false,
  style,
  ...props
}: AppTextProps) => {
  const fontStyle: TextStyle = {
    fontFamily: isBold ? 'NotoSansKR-Bold' : 'NotoSansKR-Regular',
    fontSize: TypographyScale[size],
    lineHeight: LineHeights[size],
  };

  return (
    <Text
      {...props}
      allowFontScaling={false}
      style={[
        isAndroid && { includeFontPadding: false },
        fontStyle,
        style,
      ]}
    />
  );
};

export default AppText;