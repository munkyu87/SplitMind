import { createSlice } from "@reduxjs/toolkit";

type AuthState = {
    isLoggedIn: boolean;
    user: null | { id: string; nickname: string };
}

const initialState: AuthState = {
    isLoggedIn: false,
    user: null
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login(state, action) {
            state.isLoggedIn = true;
            state.user = action.payload;
        },
        logout(state) {
            state.isLoggedIn = false;
            state.user = null;
        }
    }
});

export const {login, logout} = authSlice.actions;
export default authSlice.reducer;