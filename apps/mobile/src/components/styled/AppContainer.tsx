import React from 'react';
import { Text, TextProps, TextStyle, StyleSheet, View } from 'react-native';
import { TypographyScale, LineHeights } from '@utils/scale';
import { isAndroid } from '@utils/platform';
import { useAppTheme } from '@themes/ThemeProvider';
import Starfield from '@components/themeField/Starfield';

interface AppContainerProps extends TextProps {
  isCentered?: boolean;
  isRowCentered?: boolean;
}

const AppContainer: React.FC<AppContainerProps> = ({
  isCentered,
  isRowCentered,
  style,
  children,
  ...props
}) => {
  const { mode, theme } = useAppTheme();
  
  return (
    <View
      style={[
        {flex: 1, backgroundColor: theme.background},
        isCentered && {alignItems: 'center', justifyContent: 'center'},
        isRowCentered && { alignItems: 'center' },
        style,
      ]}
      {...props}
    >
      {mode === 'star' && <Starfield active />}
      {children}
    </View>
  );
};

export default AppContainer;