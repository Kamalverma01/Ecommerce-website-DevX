// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   consumeRedirectPath,
//   useAuthExtension,
// } from "../AuthContextExtension";

// export default function LoginExtension() {
//   const navigate = useNavigate();
//   const { login } = useAuthExtension();

//   const [identifier, setIdentifier] = useState("");
//   const [password, setPassword] = useState("");
//   const [rememberMe, setRememberMe] = useState(true);
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   async function onSubmit(event) {
//     event.preventDefault();

//     setLoading(true);
//     setError("");

//     try {
//       const data = await login({
//         identifier,
//         password,
//         rememberMe,
//       });

//       if (data?.success) {
//         navigate(consumeRedirectPath(), {
//           replace: true,
//         });
//       }
//     } catch (requestError) {
//       setError(
//         requestError?.response?.data?.message ||
//           "Unable to login"
//       );
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      
//       {/* BACKGROUND */}
//       <div className="absolute inset-0">
//         <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl" />

//         <div className="absolute bottom-[-120px] right-[-120px] h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
//       </div>

//       {/* MAIN CONTAINER */}
//       <div className="relative z-10 w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl">
        
//         <div className="grid lg:grid-cols-2">

//           {/* LEFT SIDE */}
//           <div className="hidden flex-col justify-between bg-gradient-to-br from-cyan-500 via-blue-600 to-slate-900 p-10 text-white lg:flex">
            
//             <div>
//               <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100">
//                 Premium Access
//               </p>

//               <h1 className="mt-5 text-5xl font-black leading-tight">
//                 Welcome back.
//               </h1>

//               <p className="mt-6 max-w-md text-base leading-7 text-cyan-50/90">
//                 Secure authentication system for customers, sellers
//                 and admins with email or phone login support.
//               </p>
//             </div>

//             <div className="space-y-4">
//               <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
//                 <p className="text-lg font-bold">
//                   Fast & Secure Login
//                 </p>

//                 <p className="mt-2 text-sm text-cyan-50/80">
//                   Protected authentication with encrypted sessions
//                   and multi-login support.
//                 </p>
//               </div>

//               <div className="flex items-center gap-3 text-sm text-cyan-100">
//                 <div className="h-3 w-3 rounded-full bg-emerald-400" />
//                 Trusted secure authentication
//               </div>
//             </div>
//           </div>

//           {/* RIGHT SIDE */}
//           <div className="bg-slate-950/60 p-6 sm:p-10">
//             <div className="mx-auto max-w-md">

//               <div className="mb-8">
//                 <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
//                   Sign In
//                 </p>

//                 <h2 className="mt-3 text-4xl font-black text-white">
//                   Login Account
//                 </h2>

//                 <p className="mt-3 text-sm leading-6 text-slate-400">
//                   Enter your email, phone number and password to
//                   access your account.
//                 </p>
//               </div>

//               <form
//                 onSubmit={onSubmit}
//                 className="space-y-5"
//               >
//                 {/* EMAIL / PHONE */}
//                 <div className="space-y-2">
//                   <label className="text-sm font-semibold text-slate-200">
//                     Email or Phone
//                   </label>

//                   <input
//                     type="text"
//                     value={identifier}
//                     onChange={(e) =>
//                       setIdentifier(e.target.value)
//                     }
//                     placeholder="you@example.com or 9876543210"
//                     className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-slate-300 outline-none backdrop-blur-md transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
//                   />
//                 </div>

//                 {/* PASSWORD */}
//                 <div className="space-y-2">
//                   <div className="flex items-center justify-between">
//                     <label className="text-sm font-semibold text-slate-200">
//                       Password
//                     </label>

//                     <Link
//                       to="/auth/forgot-password"
//                       className="text-xs font-semibold text-cyan-400 hover:underline"
//                     >
//                       Forgot Password?
//                     </Link>
//                   </div>

//                   <div className="relative">
//                     <input
//                       type={
//                         showPassword ? "text" : "password"
//                       }
//                       value={password}
//                       onChange={(e) =>
//                         setPassword(e.target.value)
//                       }
//                       placeholder="Enter your password"
//                       className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 px-4 pr-20 text-sm text-white placeholder:text-slate-300 outline-none backdrop-blur-md transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
//                     />

//                     <button
//                       type="button"
//                       onClick={() =>
//                         setShowPassword((prev) => !prev)
//                       }
//                       className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-300"
//                     >
//                       {showPassword ? "Hide" : "Show"}
//                     </button>
//                   </div>
//                 </div>

//                 {/* REMEMBER */}
//                 <label className="flex items-center gap-3 text-sm text-slate-300">
//                   <input
//                     type="checkbox"
//                     checked={rememberMe}
//                     onChange={(e) =>
//                       setRememberMe(e.target.checked)
//                     }
//                     className="h-4 w-4 rounded border-white/20 bg-white/10"
//                   />

//                   Remember me
//                 </label>

//                 {/* ERROR */}
//                 {error ? (
//                   <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
//                     {error}
//                   </div>
//                 ) : null}

//                 {/* BUTTON */}
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {loading
//                     ? "Signing in..."
//                     : "Sign In"}
//                 </button>
//               </form>

//               {/* FOOTER */}
//               <p className="mt-8 text-center text-sm text-slate-400">
//                 New user?
//                 <Link
//                   to="/auth/register"
//                   className="ml-2 font-bold text-cyan-400 hover:underline"
//                 >
//                   Create Account
//                 </Link>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }









import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { consumeRedirectPath, useAuthExtension } from "../AuthContextExtension";

export default function LoginExtension() {
  const navigate = useNavigate();
  const { login } = useAuthExtension();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login({ identifier, password, rememberMe });
      if (data?.success) {
        navigate(consumeRedirectPath(), { replace: true });
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.25),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(167,139,250,0.25),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <form onSubmit={onSubmit} className="w-full rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
          <h1 className="text-2xl font-bold text-white">Sign in</h1>
          <p className="mt-1 text-sm text-slate-300">Amazon/Flipkart style secure login</p>

          <label className="mt-4 block text-sm text-slate-200">Email or phone</label>
          <input className="mt-1 h-11 w-full rounded-xl bg-white/20 px-3 text-white placeholder:text-slate-300" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com or 9876543210" />

          <label className="mt-3 block text-sm text-slate-200">Password</label>
          <div className="mt-1 flex rounded-xl bg-white/20">
            <input className="h-11 w-full bg-transparent px-3 text-white placeholder:text-slate-300" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
            <button type="button" className="px-3 text-xs text-slate-200" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button>
          </div>

          <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Remember me
          </label>

          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

          <button disabled={loading} className="mt-4 h-11 w-full rounded-xl bg-cyan-400 font-semibold text-slate-950">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

