import React, { useEffect } from 'react';
import { useAppSelector } from '@stores/hooks';
import AuthStack from '@navigation/AuthStack';
import MainStack from '@navigation/MainStack';
import { store } from '@stores/store';

const RootNavigator = () => {
  useEffect(() => {
    console.log(store.getState());
  }, [])

  const isLoggedIn = useAppSelector(state => state.auth.isLoggedIn);
  // const isLoggedIn = false;

  return isLoggedIn ? <MainStack /> : <AuthStack />;
};
  
export default RootNavigator;