import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RootNavigator from "@navigation/RootNavigator";
import { ApiError, SessionProvider } from "@session/SessionProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) => {
        if (error instanceof ApiError && error.status < 500) return false;
        return count < 1;
      },
    },
  },
});

const AppProvider = () => (
  <SafeAreaProvider>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SessionProvider>
    </QueryClientProvider>
  </SafeAreaProvider>
);

export default AppProvider;
