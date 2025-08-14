import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

type HtmlWebViewParams = {
  title?: string;
  html: string;
};

const HtmlWebViewScreen = () => {
  const route = useRoute<RouteProp<Record<string, HtmlWebViewParams>, string>>();
  const { html } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default HtmlWebViewScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
});