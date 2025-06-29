import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { store } from "./store/store.ts";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { GoogleOAuthProvider } from "@react-oauth/google";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
        <BrowserRouter>
          <App />
          <ToastContainer
            theme="dark"
            position="top-right"
            autoClose={4000}
            hideProgressBar={true}
            pauseOnHover={false}
          />
        </BrowserRouter>
      </GoogleOAuthProvider>
    </Provider>
  </StrictMode>
);
