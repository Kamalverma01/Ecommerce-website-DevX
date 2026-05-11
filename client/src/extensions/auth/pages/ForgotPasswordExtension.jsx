import { useState } from "react";
import { authApi } from "../authApi";

export default function ForgotPasswordExtension() {
  const [identifier, setIdentifier] = useState("");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  async function requestOtp() {
    const response = await authApi.forgotPassword({ identifier });
    setOtpSessionId(response.data.otpSessionId);
    setMessage("OTP sent for password reset");
  }

  async function resetPassword() {
    await authApi.resetPassword({ identifier, otp, otpSessionId, newPassword });
    setMessage("Password updated");
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-3 p-4">
      <h2 className="text-xl font-bold">Forgot Password</h2>
      <input className="h-10 w-full rounded border px-3" placeholder="Email or phone" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
      <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={requestOtp}>Send OTP</button>
      <input className="h-10 w-full rounded border px-3" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
      <input className="h-10 w-full rounded border px-3" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      <button className="rounded bg-emerald-600 px-4 py-2 text-white" onClick={resetPassword}>Reset Password</button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
