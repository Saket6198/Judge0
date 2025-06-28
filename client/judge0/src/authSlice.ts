import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosClient } from "./utils/axiosClient";

const registerUser = createAsyncThunk(
  "user/register",
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/user/register", userData);
      return response.data.user; // since the response responds in the form of // {user: user, token: token} then this will return the user object
    } catch (err: any) {
      return rejectWithValue({
        message:
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Registration failed",
      });
    }
  }
);

const loginUser = createAsyncThunk(
  "/user/login",
  async (credentials: any, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/user/login", credentials);
      return response.data.user;
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.error || err.message || "Login failed",
      });
    }
  }
);

const googleLogin = createAsyncThunk(
  "user/googleLogin",
  async (credential: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/user/google-login", {
        credential,
      });
      console.log(response.data);
      return response.data.user;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err.response?.data?.error || err.message || "Google login failed",
      });
    }
  }
);

const checkAuth = createAsyncThunk(
  "user/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("/user/checkAuth");
      return response.data.user; // Make sure we're returning the user object consistently
    } catch (err: any) {
      // For auth check failures, we silently fail instead of showing errors
      // Since the user might not be logged in yet
      return rejectWithValue({
        message:
          err.response?.data?.error ||
          err.message ||
          "Authentication check failed",
      });
    }
  }
);

const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post("/user/logout");
      return null;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Logout failed",
      });
    }
  }
);
interface AuthState {
  user: any | null;
  authenticated: boolean;
  loading: boolean;
  error: any | null;
}

const initialState: AuthState = {
  user: null,
  authenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Add your reducers here
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.authenticated = !!action.payload; // if payload is not null or undefined, authenticated will be true and !! will convert to false
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload &&
          typeof action.payload === "object" &&
          "message" in action.payload
            ? action.payload.message
            : "Something went wrong";
        state.authenticated = false;
      })

      // for login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.authenticated = !!action.payload; // if payload is not null or undefined, authenticated will be false
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload &&
          typeof action.payload === "object" &&
          "message" in action.payload
            ? action.payload.message
            : "Login failed";
      })

      // for Google login
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.authenticated = !!action.payload; // if payload is not null or undefined, authenticated will be false
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload &&
          typeof action.payload === "object" &&
          "message" in action.payload
            ? action.payload.message
            : "Google login failed";
      })

      // for checkAuth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.authenticated = !!action.payload; // if payload is not null or undefined, authenticated will be false
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        // Don't set error on auth check failure - it's expected for non-logged-in users
        state.error = null;
        state.authenticated = false;
        state.user = null;
      })

      // for logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.authenticated = false; // after logout, user should not be authenticated
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.error = "Logout failed";
        state.authenticated = false; // even if logout fails, we set authenticated to false
        state.user = null; // and user to null
      });
  },
});

export { registerUser, loginUser, googleLogin, checkAuth, logoutUser };
export default authSlice.reducer;
