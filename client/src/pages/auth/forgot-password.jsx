/**
 * Forgot Password Page
 * Allows users to reset their password via email OTP
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { verifyOtp } from "@/store/auth-slice";
import { useToast } from "@/components/ui/use-toast";
import * as authService from "@/services/authService";

const initialState = {
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
};

function ForgotPassword() {
  const [formData, setFormData] = useState(initialState);
  const [otpSessionId, setOtpSessionId] = useState("");
  const [step, setStep] = useState("email");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const canSendOtp = useMemo(
    () => Boolean(formData.email && formData.email.includes("@")),
    [formData.email]
  );

  const canVerifyOtp = useMemo(
    () => Boolean(formData.otp && otpSessionId),
    [formData.otp, otpSessionId]
  );

  const canResetPassword = useMemo(
    () =>
      Boolean(
        formData.newPassword &&
          formData.confirmPassword &&
          formData.newPassword === formData.confirmPassword &&
          formData.newPassword.length >= 6
      ),
    [formData.newPassword, formData.confirmPassword]
  );

  function showError(message) {
    toast({
      title: message,
      variant: "destructive",
    });
  }

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;

    const timer = setInterval(() => {
      setResendSeconds((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendSeconds]);

  async function handleSendOtp(event) {
    event.preventDefault();

    if (!canSendOtp) {
      showError("Please enter a valid email");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(formData.email);

      if (response.success) {
        setOtpSessionId(response.otpSessionId);
        setStep("otp-verification");
        setResendSeconds(30);

        toast({
          title: "OTP sent to your email",
        });
      } else {
        showError(response.message || "Failed to send OTP");
      }
    } catch (error) {
      showError(error.message || "Error sending OTP");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();

    if (!canVerifyOtp) {
      showError("Please enter a valid OTP");
      return;
    }

    setIsLoading(true);

    try {
      const action = await dispatch(
        verifyOtp({
          target: formData.email,
          otp: formData.otp,
          purpose: "forgot-password",
          otpSessionId,
        })
      );

      if (action.payload?.success) {
        setStep("password-reset");

        toast({
          title: "OTP verified successfully",
        });
      } else {
        showError(action.payload?.message || "Invalid OTP");
      }
    } catch (error) {
      showError(error.message || "Error verifying OTP");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();

    if (!canResetPassword) {
      showError("Passwords do not match or are too short");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(
        formData.email,
        formData.otp,
        formData.newPassword,
        otpSessionId
      );

      if (response.success) {
        toast({
          title: response.message,
        });

        navigate("/auth/login");
      } else {
        showError(response.message || "Failed to reset password");
      }
    } catch (error) {
      showError(error.message || "Error resetting password");
    } finally {
      setIsLoading(false);
    }
  }

  function handleBackToEmail() {
    setStep("email");

    setFormData((current) => ({
      ...current,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    }));

    setOtpSessionId("");
  }

  const inputClass =
    "h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-cyan-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="rounded-[2rem] border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
            Password Recovery
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Reset your password
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            {step === "email" &&
              "Enter your email address and we'll send you an OTP to reset your password."}

            {step === "otp-verification" &&
              "Enter the OTP we sent to your email address."}

            {step === "password-reset" &&
              "Create a new password for your account."}
          </p>
        </div>

        {/* EMAIL STEP */}
        {step === "email" && (
          <form className="space-y-4" onSubmit={handleSendOtp}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={!canSendOtp || isLoading}
              className="h-12 w-full rounded-xl bg-black text-white font-semibold transition hover:bg-black-800 disabled:opacity-70"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* OTP STEP */}
        {step === "otp-verification" && (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Verification Code
              </label>

              <p className="text-xs text-slate-500">
                Check your email for the OTP. It expires in 10 minutes.
              </p>

              <input
                type="text"
                value={formData.otp}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    otp: event.target.value,
                  }))
                }
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={!canVerifyOtp || isLoading}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              disabled={resendSeconds > 0 || isLoading}
              onClick={handleSendOtp}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 transition hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resendSeconds > 0
                ? `Resend OTP in ${resendSeconds}s`
                : "Resend OTP"}
            </button>

            <button
              type="button"
              onClick={handleBackToEmail}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 transition hover:border-slate-900"
            >
              Back to Email
            </button>
          </form>
        )}

        {/* PASSWORD RESET STEP */}
        {step === "password-reset" && (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                New Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  placeholder="Minimum 6 characters"
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Confirm Password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                placeholder="Re-enter your password"
                className={inputClass}
              />
            </div>

            {formData.newPassword &&
              formData.confirmPassword &&
              formData.newPassword !== formData.confirmPassword && (
                <p className="text-xs font-medium text-red-600">
                  Passwords do not match
                </p>
              )}

            {formData.newPassword &&
              formData.newPassword.length < 6 && (
                <p className="text-xs font-medium text-red-600">
                  Password must be at least 6 characters
                </p>
              )}

            <button
              type="submit"
              disabled={!canResetPassword || isLoading}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={handleBackToEmail}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 transition hover:border-slate-900"
            >
              Back to Email
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-600">
          Remember your password?
          <Link
            className="ml-2 font-semibold text-slate-950 hover:underline"
            to="/auth/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default ForgotPassword;