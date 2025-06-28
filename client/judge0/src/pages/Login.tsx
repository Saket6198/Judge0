import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginUser, googleLogin } from "../authSlice";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";

// Zod schema
const signUpSchema = z.object({
  emailId: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password should be at least 8 characters")
    .max(24, "Password should not be more than 24 characters"),
});

type SignUpData = z.infer<typeof signUpSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { authenticated, loading, error } = useAppSelector(
    (state) => state.auth
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  });
  const onSubmit = (data: SignUpData) => {
    // Note: Backend expects emailId field
    dispatch(
      loginUser({
        emailId: data.emailId,
        password: data.password,
      })
    );
  };

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      dispatch(googleLogin(credentialResponse.credential));
    } else {
      toast.error("Google login failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login failed. Please try again.");
  };

  useEffect(() => {
    if (error) {
      const toastId = error; // Use error message as ID
      // Prevent duplicate toasts with the same message
      toast.error(error, {
        toastId,
      });
    }
    if (authenticated) navigate("/");
  }, [authenticated, error, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-100">
      <div className="w-full max-w-md">
        {/* Hero section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-4">
              <svg
                className="w-8 h-8 text-primary-content"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-base-content mb-2">
            Welcome to Judge0
          </h1>
          <p className="text-base-content/70">
            Create your account to get started
          </p>
        </div>

        {/* Form card */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email Address</span>
                </label>
                <input
                  {...register("emailId")}
                  type="email"
                  placeholder="Enter your email"
                  className={`input input-bordered w-full ${
                    errors.emailId ? "input-error" : "input-primary"
                  }`}
                />
                {errors.emailId && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.emailId.message}
                    </span>
                  </label>
                )}
              </div>

              {/* Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Password</span>
                </label>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="●●●●●●●●●"
                  className={`input input-bordered w-full ${
                    errors.password ? "input-error" : "input-primary"
                  }`}
                  minLength={8}
                  maxLength={24}
                />
                {errors.password && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.password.message}
                    </span>
                  </label>
                )}
              </div>

              {/* Submit */}
              <div className="form-control mt-4">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  )}
                  Login
                </button>
              </div>
            </form>

            {/* Divider and Socials */}
            <div className="divider">OR</div>
            <div className="space-y-3">
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  auto_select={false}
                  theme="outline"
                  size="large"
                  width="400"
                />
              </div>
            </div>

            {/* Sign in link */}
            <div className="text-center mt-6">
              <p className="text-base-content/70">
                Don't have an account?{" "}
                <a href="/signup" className="link link-primary font-medium">
                  Register here
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-base-content/50">
          <p className="text-sm">© 2025 Saket Singh. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
