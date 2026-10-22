import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "@session/SessionProvider";
import AuthStack from "@navigation/AuthStack";
import MainStack from "@navigation/MainStack";
import { palette } from "@themes/palette";

const RootNavigator = () => {
  const { user, ready } = useSession();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.ink} />
      </View>
    );
  }
  return user ? <MainStack /> : <AuthStack />;
};

export default RootNavigator;
