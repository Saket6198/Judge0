import { Routes, Route, Navigate } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HomePage } from "./pages/HomePage";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { checkAuth } from "./authSlice";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import canvaSvg from "./assets/canva.svg";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/Admin";
import { ProblemPage } from "./pages/ProblemPage";

function App() {
  const dispatch = useAppDispatch();
  const { authenticated, loading, user } = useAppSelector(
    (state) => state.auth
  ); // properly typed with useAppSelector

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  if (loading) {
    return (
      <div className="min-h-screen items-center justify-center flex flex-col gap-3">
        <img
          src={canvaSvg}
          alt="judge0-loading-icon"
          width={60}
          height={60}
          className="animate-bounce"
        />
      </div>
    );
  }
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={authenticated ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={authenticated ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={authenticated ? <Navigate to="/" /> : <SignUp />}
        />
        <Route
          path="/profile"
          element={authenticated ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={
            authenticated && user.role === "admin" ? <Admin /> : <HomePage />
          }
        />
        <Route 
          path="/problem/:problemById"
          element={
            authenticated ? <ProblemPage /> : <Navigate to="/login" /> 
          }
         />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}

export default App;
