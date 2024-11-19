import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";

export const customer_register = createAsyncThunk(
  "auth/customer_register",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post("/customer/customer-register", info);
      localStorage.setItem("customerToken", data.token);
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const google_register = createAsyncThunk(
  "auth/google_register",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      // You might want to call your backend to register the user or just store user info
      const { data } = await api.post("/google", info); // Backend route for Google login
      console.log(data);
      localStorage.setItem("customerToken", data.token);
      return fulfillWithValue(data); // Return data containing token and user info
    } catch (error) {
      console.error("Google register error:", error); // Log error for debugging
      return rejectWithValue(
        error.response ? error.response.data : "Unknown error"
      );
    }
  }
);

export const customer_login = createAsyncThunk(
  "auth/customer_login",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post("/customer/customer-login", info);
      localStorage.setItem("customerToken", data.token);

      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

function decodeToken(token) {
  try {
    const base64Url = token.split(".")[1]; // Get payload part of the JWT
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

export const authReducer = createSlice({
  name: "auth",
  initialState: {
    loader: false,
    userInfo: localStorage.getItem("customerToken")
      ? decodeToken(localStorage.getItem("customerToken"))
      : null,
    errorMessage: "",
    successMessage: "",
  },
  reducers: {
    messageClear: (state, _) => {
      state.errorMessage = "";
      state.successMessage = "";
    },
    user_reset: (state, _) => {
      state.userInfo = "";
    },
  },
  extraReducers: {
    [customer_register.pending]: (state, _) => {
      state.loader = true;
    },
    [customer_register.rejected]: (state, { payload }) => {
      state.errorMessage = payload.error;
      state.loader = false;
    },
    [customer_register.fulfilled]: (state, { payload }) => {
      state.successMessage = payload.message;
      state.loader = false;
      state.userInfo = decodeToken(payload.token);
    },

    [google_register.pending]: (state, _) => {
      state.loader = true;
    },
    [google_register.rejected]: (state, { payload }) => {
      state.errorMessage = payload.error;
      state.loader = false;
    },
    [google_register.fulfilled]: (state, { payload }) => {
      state.successMessage = payload.message;
      state.loader = false;
      state.userInfo = decodeToken(payload.token);
    },
    [customer_login.pending]: (state, _) => {
      state.loader = true;
    },
    [customer_login.rejected]: (state, { payload }) => {
      state.errorMessage = payload.error;
      state.loader = false;
    },
    [customer_login.fulfilled]: (state, { payload }) => {
      state.successMessage = payload.message;
      state.loader = false;
      state.userInfo = decodeToken(payload.token);
    },
  },
});

export const { messageClear, user_reset } = authReducer.actions;
export default authReducer.reducer;
