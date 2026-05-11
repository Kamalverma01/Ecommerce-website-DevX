import { useState } from "react";
import { authApi } from "../authApi";

export default function RegisterExtension() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [otpState, setOtpState] = useState({ sent: false, verified: false, otp: "", otpSessionId: "" });
  const [message, setMessage] = useState("");

  async function sendOtp() {
    const target = form.email || form.phone;
    const response = await authApi.sendOtp({ target, purpose: "register" });
    setOtpState((old) => ({ ...old, sent: true, otpSessionId: response.data.otpSessionId }));
    setMessage(response.data.message || "OTP sent");
  }

  async function verifyOtp() {
    const target = form.email || form.phone;
    await authApi.verifyOtp({ target, otp: otpState.otp, otpSessionId: otpState.otpSessionId, purpose: "register" });
    setOtpState((old) => ({ ...old, verified: true }));
    setMessage("OTP verified");
  }

  async function register() {
    if (!otpState.verified) {
      setMessage("Verify OTP first");
      return;
    }
    await authApi.register(form);
    setMessage("Registration successful");
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-3 p-4">
      <h2 className="text-2xl font-bold">Register</h2>
      <input className="h-10 w-full rounded border px-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="h-10 w-full rounded border px-3" placeholder="Email (or leave empty)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="h-10 w-full rounded border px-3" placeholder="Phone (or leave empty)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input className="h-10 w-full rounded border px-3" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <div className="flex gap-2">
        <button onClick={sendOtp} className="rounded bg-slate-900 px-4 py-2 text-white">Send OTP</button>
        <input className="h-10 flex-1 rounded border px-3" placeholder="OTP" value={otpState.otp} onChange={(e) => setOtpState({ ...otpState, otp: e.target.value })} />
        <button onClick={verifyOtp} className="rounded border px-4 py-2">Verify OTP</button>
      </div>
      <button onClick={register} className="rounded bg-emerald-600 px-4 py-2 text-white">Create account</button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
