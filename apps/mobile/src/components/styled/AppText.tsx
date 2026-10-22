import React from 'react';
import { Text, TextProps, TextStyle, StyleSheet } from 'react-native';
import { TypographyScale, LineHeights } from '@utils/scale';
import { isAndroid } from '@utils/platform';
import { useAppTheme } from '@themes/ThemeProvider';

type TypographyKey = keyof typeof TypographyScale;

interface AppTextProps extends TextProps {
  size?: TypographyKey;
  isBold?: boolean;
  center?: boolean;
  color?: string;
}

const AppText = ({
  size = 'body',
  isBold = false,
  center = false,
  color,
  style,
  ...props
}: AppTextProps) => {
  const { theme } = useAppTheme();
  
  const fontStyle: TextStyle = {
    fontFamily: isBold ? 'NotoSansKR-Bold' : 'NotoSansKR-Regular',
    fontSize: TypographyScale[size],
    lineHeight: LineHeights[size],
    color: color ?? theme.text,
  };

  return (
    <Text
      {...props}
      allowFontScaling={false}
      style={[
        isAndroid && { includeFontPadding: false },
        center && { textAlign: 'center' },
        fontStyle,
        style,
      ]}
    />
  );
};

export default AppText;