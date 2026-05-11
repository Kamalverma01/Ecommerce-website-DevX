import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";

import {
  loginUser,
  loginWithGoogle,
} from "@/store/auth-slice";

import {
  auth,
  googleProvider,
} from "@/config/firebase-config";

import { signInWithPopup } from "firebase/auth";

import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath =
    new URLSearchParams(location.search).get("redirect") || "/shop/home";

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: true,
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [googleLoading, setGoogleLoading] =
    useState(false);

  // EMAIL LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    if (
      !formData.identifier ||
      !formData.password
    ) {
      return toast({
        title:
          "Please fill all fields",
        variant: "destructive",
      });
    }

    try {
      setLoading(true);

      const action = await dispatch(
        loginUser(formData)
      );

      if (action?.payload?.success) {
        toast({
          title: "Login successful",
        });

        navigate(redirectPath.startsWith("/") ? redirectPath : "/shop/home", {
          replace: true,
        });
      } else {
        toast({
          title:
            action?.payload?.message ||
            "Login failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      const result =
        await signInWithPopup(
          auth,
          googleProvider
        );

      const firebaseIdToken =
        await result.user.getIdToken();

      const action = await dispatch(
        loginWithGoogle({
          firebaseIdToken,
        })
      );

      if (action?.payload?.success) {
        toast({
          title:
            "Google Login Successful",
        });

        navigate(redirectPath.startsWith("/") ? redirectPath : "/shop/home", {
          replace: true,
        });
      } else {
        toast({
          title:
            action?.payload?.message ||
            "Google Login Failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log(error);

      toast({
        title:
          error?.message ||
          "Google Sign In Failed",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-3 py-8 sm:px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black sm:text-4xl">
            Welcome Back
          </h1>

          <p className="text-gray-500 mt-3 text-sm">
            Login to continue
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5 sm:mt-10"
        >
          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Email or Phone
            </label>

            <input
              type="text"
              placeholder="Enter email or phone"
              value={formData.identifier}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  identifier:
                    e.target.value,
                })
              }
              className="mt-2 h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-black outline-none transition focus:border-black"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>

            <div className="relative mt-2">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password:
                      e.target.value,
                  })
                }
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 pr-16 text-black outline-none transition focus:border-black"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-4 top-3 text-sm text-gray-500 hover:text-black"
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          {/* REMEMBER */}
          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                checked={
                  formData.rememberMe
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rememberMe:
                      e.target.checked,
                  })
                }
              />

              Remember me
            </label>

            <Link
              to="/auth/forgot-password"
              className="text-black hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-black text-white font-semibold transition hover:bg-gray-800 disabled:opacity-70"
          >
            {loading
              ? "Signing In..."
              : "Login"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-300" />

          <span className="text-xs text-gray-400">
            OR
          </span>

          <div className="h-px flex-1 bg-gray-300" />
        </div>

        {/* GOOGLE BUTTON */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="h-12 w-full rounded-xl border border-gray-300 bg-white hover:bg-gray-100 transition flex items-center justify-center gap-3 text-black font-medium"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="google"
            className="w-5 h-5"
          />

          {googleLoading
            ? "Connecting..."
            : "Continue with Google"}
        </button>

        {/* REGISTER */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don’t have an account?

          <Link
            to="/auth/register"
            className="ml-1 font-medium text-black hover:underline"
          >
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}



// import { useEffect, useMemo, useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { motion } from "framer-motion";
// import {
//   loginUser,
//   loginWithGoogle,
//   loginWithPhone,
//   sendOtp,
//   verifyOtp,
// } from "@/store/auth-slice";
// import { useToast } from "@/components/ui/use-toast";
// import { auth, googleProvider } from "@/config/firebase-config";
// import {
//   RecaptchaVerifier,
//   signInWithPhoneNumber,
//   signInWithPopup,
// } from "firebase/auth";

// const initialEmailState = {
//   identifier: "",
//   password: "",
//   rememberMe: true,
// };

// const initialPhoneRegistrationState = {
//   userName: "",
//   email: "",
//   address: "",
// };

// function buildPhoneNumber(phone = "") {
//   const digits = String(phone).replace(/\D/g, "");
//   if (!digits) return "";
//   if (digits.startsWith("91") && digits.length === 12) {
//     return `+${digits}`;
//   }

//   return `+91${digits}`;
// }

// function getPostLoginPath(user, redirectPath = "") {
//   if (redirectPath) return redirectPath;
//   if (user?.role === "seller") return "/seller/dashboard";
//   if (user?.role === "admin" || user?.role === "super_admin") return "/admin/dashboard";
//   return "/shop/home";
// }

// function AuthLogin() {
//   const [emailForm, setEmailForm] = useState(initialEmailState);
//   const [phoneForm, setPhoneForm] = useState({
//     phone: "",
//     otp: "",
//   });
//   const [phoneRegistration, setPhoneRegistration] = useState(initialPhoneRegistrationState);
//   const [emailOtp, setEmailOtp] = useState("");
//   const [otpSessionId, setOtpSessionId] = useState("");
//   const [phoneConfirmation, setPhoneConfirmation] = useState(null);
//   const [verifiedPhoneToken, setVerifiedPhoneToken] = useState("");
//   const [phoneNeedsRegistration, setPhoneNeedsRegistration] = useState(false);
//   const [isEmailLoading, setIsEmailLoading] = useState(false);
//   const [isGoogleLoading, setIsGoogleLoading] = useState(false);
//   const [isPhoneLoading, setIsPhoneLoading] = useState(false);
//   const [isCompletingPhoneProfile, setIsCompletingPhoneProfile] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);

//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { toast } = useToast();
//   const redirectPath = useMemo(() => {
//     const params = new URLSearchParams(location.search);
//     const redirect = params.get("redirect");
//     return redirect && redirect.startsWith("/") ? redirect : "";
//   }, [location.search]);

//   useEffect(() => {
//     if (!window.loginRecaptchaVerifier) {
//       window.loginRecaptchaVerifier = new RecaptchaVerifier(
//         auth,
//         "login-recaptcha-container",
//         {
//           size: "invisible",
//         }
//       );
//     }
//   }, []);

//   const canSubmitPhoneProfile = useMemo(
//     () =>
//       Boolean(
//         verifiedPhoneToken &&
//           otpSessionId &&
//           phoneRegistration.userName &&
//           phoneRegistration.email
//       ),
//     [otpSessionId, phoneRegistration.email, phoneRegistration.userName, verifiedPhoneToken]
//   );

//   function showError(action) {
//     const message =
//       action?.payload?.message || action?.error?.message || "Something went wrong";
//     toast({
//       title: message,
//       variant: "destructive",
//     });
//   }

//   async function handleEmailLogin(event) {
//     event.preventDefault();
//     setIsEmailLoading(true);
//     const action = await dispatch(loginUser(emailForm));
//     setIsEmailLoading(false);

//     if (action.payload?.success) {
//       toast({ title: action.payload.message });
//       navigate(getPostLoginPath(action.payload.user, redirectPath));
//       return;
//     }

//     showError(action);
//   }

//   async function handleGoogleSignIn() {
//     setIsGoogleLoading(true);

//     try {
//       const result = await signInWithPopup(auth, googleProvider);
//       const firebaseIdToken = await result.user.getIdToken();
//       const action = await dispatch(loginWithGoogle({ firebaseIdToken }));

//       if (action.payload?.success) {
//         toast({ title: action.payload.message });
//         navigate(getPostLoginPath(action.payload.user, redirectPath));
//         return;
//       }

//       showError(action);
//     } catch (error) {
//       toast({
//         title: error.message || "Google sign-in failed",
//         variant: "destructive",
//       });
//     } finally {
//       setIsGoogleLoading(false);
//     }
//   }

//   async function handleSendPhoneOtp() {
//     if (!phoneForm.phone) {
//       toast({ title: "Enter your phone number", variant: "destructive" });
//       return;
//     }

//     setIsPhoneLoading(true);
//     try {
//       const appVerifier = window.loginRecaptchaVerifier;
//       const confirmation = await signInWithPhoneNumber(
//         auth,
//         buildPhoneNumber(phoneForm.phone),
//         appVerifier
//       );
//       setPhoneConfirmation(confirmation);
//       toast({ title: "OTP sent to your phone" });
//     } catch (error) {
//       toast({
//         title: error.message || "Unable to send phone OTP",
//         variant: "destructive",
//       });
//     } finally {
//       setIsPhoneLoading(false);
//     }
//   }

//   async function handleVerifyPhoneOtp() {
//     if (!phoneConfirmation) {
//       toast({ title: "Send phone OTP first", variant: "destructive" });
//       return;
//     }

//     setIsPhoneLoading(true);

//     try {
//       const credential = await phoneConfirmation.confirm(phoneForm.otp);
//       const firebaseIdToken = await credential.user.getIdToken();
//       setVerifiedPhoneToken(firebaseIdToken);

//       const action = await dispatch(loginWithPhone({ firebaseIdToken }));

//       if (action.payload?.success) {
//         toast({ title: action.payload.message });
//         navigate(getPostLoginPath(action.payload.user, redirectPath));
//         return;
//       }

//       if (action.payload?.registrationRequired) {
//         setPhoneNeedsRegistration(true);
//         toast({ title: action.payload.message });
//         return;
//       }

//       showError(action);
//     } catch (error) {
//       toast({
//         title: error.message || "Phone verification failed",
//         variant: "destructive",
//       });
//     } finally {
//       setIsPhoneLoading(false);
//     }
//   }

//   async function handleSendEmailOtp() {
//     if (!phoneRegistration.email) {
//       toast({ title: "Enter your email first", variant: "destructive" });
//       return;
//     }

//     const action = await dispatch(
//       sendOtp({
//         target: phoneRegistration.email,
//         purpose: "register",
//         channel: "email",
//       })
//     );

//     if (action.payload?.success) {
//       setOtpSessionId(action.payload.otpSessionId);
//       toast({ title: action.payload.message });
//       return;
//     }

//     showError(action);
//   }

//   async function handleVerifyEmailOtp() {
//     const action = await dispatch(
//       verifyOtp({
//         target: phoneRegistration.email,
//         otp: emailOtp,
//         purpose: "register",
//         otpSessionId,
//       })
//     );

//     if (action.payload?.success) {
//       setOtpSessionId(action.payload.otpSessionId);
//       toast({ title: "Email verified successfully" });
//       return;
//     }

//     showError(action);
//   }

//   async function handleCompletePhoneProfile(event) {
//     event.preventDefault();
//     setIsCompletingPhoneProfile(true);

//     const action = await dispatch(
//       loginWithPhone({
//         firebaseIdToken: verifiedPhoneToken,
//         email: phoneRegistration.email,
//         userName: phoneRegistration.userName,
//         address: phoneRegistration.address,
//         otpSessionId,
//       })
//     );

//     setIsCompletingPhoneProfile(false);

//     if (action.payload?.success) {
//       toast({ title: action.payload.message });
//       navigate(getPostLoginPath(action.payload.user, redirectPath));
//       return;
//     }

//     showError(action);
//   }

//   return (
//     <div className="w-full max-w-6xl">
//       <div id="login-recaptcha-container" />
//       <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
//         <motion.section
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.35 }}
//           className="rounded-[2rem] border border-white/20 bg-white/70 p-6 shadow-2xl backdrop-blur-xl dark:bg-slate-900/60 sm:p-8"
//         >
//           <div className="max-w-lg">
//             <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">
//               Welcome Back
//             </p>
//             <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
//               Premium login for shoppers, sellers, and admins.
//             </h1>
//             <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
//               Use your email and password, continue with Google, or verify your
//               phone with OTP. Sessions stay active across devices through secure
//               server-side auth.
//             </p>
//           </div>

//           <form className="mt-8 space-y-4" onSubmit={handleEmailLogin}>
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Email or Phone</label>
//               <input
//                 type="text"
//                 value={emailForm.identifier}
//                 onChange={(event) =>
//                   setEmailForm((current) => ({
//                     ...current,
//                     identifier: event.target.value,
//                   }))
//                 }
//                 placeholder="you@example.com or 9876543210"
//                 className="h-12 w-full rounded-2xl border border-slate-300 bg-white/80 px-4 text-sm outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white"
//               />
//             </div>
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Password</label>
//               <input
//                 type={showPassword ? "text" : "password"}
//                 value={emailForm.password}
//                 onChange={(event) =>
//                   setEmailForm((current) => ({
//                     ...current,
//                     password: event.target.value,
//                   }))
//                 }
//                 placeholder="Enter your password"
//                 className="h-12 w-full rounded-2xl border border-slate-300 bg-white/80 px-4 text-sm outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white"
//               />
//             </div>
//             <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
//               <label className="inline-flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={Boolean(emailForm.rememberMe)}
//                   onChange={(event) =>
//                     setEmailForm((current) => ({
//                       ...current,
//                       rememberMe: event.target.checked,
//                     }))
//                   }
//                 />
//                 Remember me
//               </label>
//               <button
//                 type="button"
//                 className="font-semibold text-slate-900 hover:underline dark:text-slate-100"
//                 onClick={() => setShowPassword((current) => !current)}
//               >
//                 {showPassword ? "Hide" : "Show"} password
//               </button>
//             </div>

//             <button
//               type="submit"
//               disabled={isEmailLoading}
//               className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
//             >
//               {isEmailLoading ? "Signing in..." : "Sign in with Email"}
//             </button>
//           </form>

//           <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
//             <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
//             Or continue with
//             <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
//           </div>

//           <button
//             type="button"
//             onClick={handleGoogleSignIn}
//             disabled={isGoogleLoading}
//             className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 transition hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
//           >
//             <span className="text-lg">G</span>
//             {isGoogleLoading ? "Connecting..." : "Continue with Google"}
//           </button>

//           <p className="mt-8 text-sm text-slate-600 dark:text-slate-300">
//             New here?
//             <Link className="ml-2 font-semibold text-slate-950 hover:underline dark:text-slate-100" to="/auth/register">
//               Create your account
//             </Link>
//           </p>
//           <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
//             Forgot your password?
//             <Link className="ml-2 font-semibold text-slate-950 hover:underline dark:text-slate-100" to="/auth/forgot-password">
//               Reset here
//             </Link>
//           </p>
//           <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
//             Want to sell on this marketplace?
//             <Link
//               className="ml-2 font-semibold text-slate-950 hover:underline dark:text-slate-100"
//               to="/auth/login?redirect=/seller/application"
//             >
//               Sign in and apply as seller
//             </Link>
//           </p>
//         </motion.section>

//         <motion.section
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.45 }}
//           className="rounded-[2rem] border border-white/20 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-white shadow-2xl sm:p-8"
//         >
//           <div>
//             <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-400">
//               Phone OTP
//             </p>
//             <h2 className="mt-3 text-3xl font-black tracking-tight">
//               Sign in with your verified mobile number.
//             </h2>
//             <p className="mt-4 text-sm leading-6 text-slate-300">
//               Existing users can log in instantly after OTP verification. New
//               phone-only users can complete the rest of their profile here.
//             </p>
//           </div>

//           <div className="mt-8 space-y-4 rounded-[1.5rem] bg-white/5 p-5">
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-white">Phone Number</label>
//               <input
//                 type="tel"
//                 value={phoneForm.phone}
//                 onChange={(event) =>
//                   setPhoneForm((current) => ({
//                     ...current,
//                     phone: event.target.value,
//                   }))
//                 }
//                 placeholder="10-digit mobile number"
//                 className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-amber-400"
//               />
//             </div>

//             <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
//               <input
//                 type="text"
//                 value={phoneForm.otp}
//                 onChange={(event) =>
//                   setPhoneForm((current) => ({
//                     ...current,
//                     otp: event.target.value,
//                   }))
//                 }
//                 placeholder="Enter OTP"
//                 className="h-12 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-amber-400"
//               />
//               <button
//                 type="button"
//                 onClick={handleSendPhoneOtp}
//                 disabled={isPhoneLoading}
//                 className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/15 px-5 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
//               >
//                 Send OTP
//               </button>
//             </div>

//             <button
//               type="button"
//               onClick={handleVerifyPhoneOtp}
//               disabled={isPhoneLoading || !phoneConfirmation}
//               className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-amber-400 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
//             >
//               {isPhoneLoading ? "Verifying..." : "Verify and Continue"}
//             </button>
//           </div>

//           {phoneNeedsRegistration && (
//             <form
//               className="mt-6 space-y-4 rounded-[1.5rem] bg-white p-5 text-slate-900"
//               onSubmit={handleCompletePhoneProfile}
//             >
//               <div>
//                 <h3 className="text-lg font-bold">Complete phone registration</h3>
//                 <p className="mt-1 text-sm text-slate-600">
//                   We only need your profile details and a verified email OTP.
//                 </p>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-semibold text-slate-700">Full Name</label>
//                 <input
//                   type="text"
//                   value={phoneRegistration.userName}
//                   onChange={(event) =>
//                     setPhoneRegistration((current) => ({
//                       ...current,
//                       userName: event.target.value,
//                     }))
//                   }
//                   className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-900"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-semibold text-slate-700">Email</label>
//                 <input
//                   type="email"
//                   value={phoneRegistration.email}
//                   onChange={(event) =>
//                     setPhoneRegistration((current) => ({
//                       ...current,
//                       email: event.target.value,
//                     }))
//                   }
//                   className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-900"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-semibold text-slate-700">Address</label>
//                 <textarea
//                   rows={3}
//                   value={phoneRegistration.address}
//                   onChange={(event) =>
//                     setPhoneRegistration((current) => ({
//                       ...current,
//                       address: event.target.value,
//                     }))
//                   }
//                   className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
//                   placeholder="Apartment, street, city"
//                 />
//               </div>

//               <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
//                 <input
//                   type="text"
//                   value={emailOtp}
//                   onChange={(event) => setEmailOtp(event.target.value)}
//                   placeholder="Email OTP"
//                   className="h-12 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-900"
//                 />
//                 <button
//                   type="button"
//                   onClick={handleSendEmailOtp}
//                   className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 px-4 text-sm font-semibold transition hover:border-slate-900"
//                 >
//                   Send OTP
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleVerifyEmailOtp}
//                   disabled={!otpSessionId}
//                   className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 px-4 text-sm font-semibold transition hover:border-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
//                 >
//                   Verify
//                 </button>
//               </div>

//               <button
//                 type="submit"
//                 disabled={!canSubmitPhoneProfile || isCompletingPhoneProfile}
//                 className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
//               >
//                 {isCompletingPhoneProfile ? "Saving profile..." : "Finish Phone Sign-In"}
//               </button>
//             </form>
//           )}
//         </motion.section>
//       </div>
//     </div>
//   );
// }

// export default AuthLogin;
