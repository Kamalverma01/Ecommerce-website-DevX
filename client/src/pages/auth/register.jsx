import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import {
  loginWithGoogle,
  checkAuth,
  registerUser,
  sendOtp,
  verifyOtp,
} from "@/store/auth-slice";

import { useToast } from "@/components/ui/use-toast";

import {
  auth,
  googleProvider,
} from "@/config/firebase-config";

import {
  signInWithPopup,
} from "firebase/auth";

const initialRegisterState = {
  userName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
};

function AuthRegister() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const redirectPath =
    new URLSearchParams(location.search).get("redirect") || "/shop/home";
  const safeRedirectPath = redirectPath.startsWith("/")
    ? redirectPath
    : "/shop/home";

  const [formData, setFormData] = useState(
    initialRegisterState
  );

  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");

  const [otpSessionId, setOtpSessionId] =
    useState("");
  const [phoneOtpSessionId, setPhoneOtpSessionId] =
    useState("");

  const [verificationStatus, setVerificationStatus] =
    useState({
      email: false,
      phone: false,
    });

  // GOOGLE
  const [showGoogleCompletion, setShowGoogleCompletion] =
    useState(false);

  const [googleProfile, setGoogleProfile] =
    useState({
      userName: "",
      email: "",
      phone: "",
    });

  const [pendingGoogleToken, setPendingGoogleToken] =
    useState("");

  const [googlePhoneOtp, setGooglePhoneOtp] =
    useState("");

  const [googlePhoneOtpSessionId, setGooglePhoneOtpSessionId] =
    useState("");

  const [googlePhoneVerified, setGooglePhoneVerified] =
    useState(false);

  const [isManualLoading, setIsManualLoading] =
    useState(false);

  const [isGoogleLoading, setIsGoogleLoading] =
    useState(false);

  const [isGoogleCompleteLoading, setIsGoogleCompleteLoading] =
    useState(false);

  const canSubmitManualRegistration =
    useMemo(
      () =>
        Boolean(
          formData.userName &&
            formData.email &&
            formData.password &&
            formData.password ===
              formData.confirmPassword &&
            verificationStatus.email &&
            verificationStatus.phone
        ),
      [formData, verificationStatus]
    );

  const showError = (message) => {
    toast({
      title: message,
      variant: "destructive",
    });
  };

  async function completeGoogleSignup(
    verifiedPhoneOtpSessionId = googlePhoneOtpSessionId
  ) {
    if (!googleProfile.userName.trim()) {
      showError("Enter your full name");
      return false;
    }

    if (!googleProfile.phone) {
      showError("Enter phone number");
      return false;
    }

    try {
      setIsGoogleCompleteLoading(true);

      const action = await dispatch(
        loginWithGoogle({
          firebaseIdToken:
            pendingGoogleToken,

          userName:
            googleProfile.userName,

          phone:
            googleProfile.phone,

          phoneOtpSessionId:
            verifiedPhoneOtpSessionId,
        })
      );

      if (action?.payload?.success) {
        toast({
          title:
            "Google signup completed",
        });

        await dispatch(checkAuth());
        navigate(safeRedirectPath, { replace: true });
        return true;
      }

      showError(
        action?.payload?.message ||
          "Signup failed"
      );
      return false;
    } catch (e) {
      showError("Signup failed");
      return false;
    } finally {
      setIsGoogleCompleteLoading(false);
    }
  }

  // EMAIL OTP
  async function handleSendEmailOtp() {
    if (!formData.email) {
      return showError("Enter email first");
    }

    const action = await dispatch(
      sendOtp({
        target: formData.email,
        purpose: "register",
        channel: "email",
      })
    );

    if (action?.payload?.success) {
      setOtpSessionId(
        action.payload.otpSessionId
      );

      toast({
        title: "Email OTP Sent",
      });
    } else {
      showError(
        action?.payload?.message ||
          "Failed to send OTP"
      );
    }
  }

  async function handleVerifyEmailOtp() {
    const action = await dispatch(
      verifyOtp({
        target: formData.email,
        otp: emailOtp,
        purpose: "register",
        otpSessionId,
      })
    );

    if (action?.payload?.success) {
      setVerificationStatus((prev) => ({
        ...prev,
        email: true,
      }));

      toast({
        title: "Email Verified",
      });
    } else {
      showError(
        action?.payload?.message ||
          "Invalid OTP"
      );
    }
  }

  // PHONE OTP
  async function handleSendPhoneOtp() {
    if (!formData.phone) {
      return showError(
        "Enter phone number"
      );
    }

    const action = await dispatch(
      sendOtp({
        target: formData.phone,
        purpose: "register",
        channel: "sms",
      })
    );

    if (action?.payload?.success) {
      setPhoneOtpSessionId(
        action.payload.otpSessionId
      );
      toast({
        title: "SMS OTP Sent",
      });
    } else {
      showError(
        action?.payload?.message ||
          "Failed to send phone OTP"
      );
    }
  }

  async function handleVerifyPhoneOtp() {
    const action = await dispatch(
      verifyOtp({
        target: formData.phone,
        otp: phoneOtp,
        purpose: "register",
        otpSessionId: phoneOtpSessionId,
      })
    );

    if (action?.payload?.success) {
      setVerificationStatus((prev) => ({
        ...prev,
        phone: true,
      }));

      toast({
        title: "Phone Verified",
      });
    } else {
      showError(
        action?.payload?.message ||
          "Invalid OTP"
      );
    }
  }

  // MANUAL REGISTER
  async function handleManualRegistration(
    e
  ) {
    e.preventDefault();

    setIsManualLoading(true);

    const action = await dispatch(
      registerUser({
        ...formData,
        otpSessionId,
        phoneOtpSessionId,
      })
    );

    setIsManualLoading(false);

    if (action?.payload?.success) {
      toast({
        title:
          "Account created successfully",
      });

      navigate("/auth/login");
    } else {
      showError(
        action?.payload?.message ||
          "Registration failed"
      );
    }
  }

  // GOOGLE SIGNUP
  async function handleGoogleStart() {
    try {
      setIsGoogleLoading(true);

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

      // EXISTING USER
      if (action?.payload?.success) {
        toast({
          title: "Login successful",
        });

        await dispatch(checkAuth());
        navigate(safeRedirectPath, { replace: true });

        return;
      }

      // NEW USER
      if (
        action?.payload
          ?.profileCompletionRequired
      ) {
        const profile =
          action.payload.profile || {};

        setPendingGoogleToken(
          firebaseIdToken
        );

        setGoogleProfile({
          userName:
            profile.userName ||
            result.user.displayName ||
            "",
          email:
            profile.email ||
            result.user.email ||
            "",
          phone: profile.phone || "",
        });

        setShowGoogleCompletion(true);

        return;
      }

      showError(
        action?.payload?.message ||
          "Google authentication failed"
      );
    } catch (error) {
      showError(
        error.message ||
          "Google Sign In Failed"
      );
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handleSendGooglePhoneOtp() {
    if (!googleProfile.phone) {
      return showError(
        "Enter phone number"
      );
    }

    const action = await dispatch(
      sendOtp({
        target: googleProfile.phone,
        purpose: "register",
        channel: "sms",
      })
    );

    if (action?.payload?.success) {
      setGooglePhoneOtpSessionId(
        action.payload.otpSessionId
      );

      toast({
        title: "SMS OTP Sent",
      });
    } else {
      showError(
        action?.payload?.message ||
          "Failed to send phone OTP"
      );
    }
  }

  async function handleVerifyGooglePhoneOtp() {
    const action = await dispatch(
      verifyOtp({
        target: googleProfile.phone,
        otp: googlePhoneOtp,
        purpose: "register",
        otpSessionId: googlePhoneOtpSessionId,
      })
    );

    if (action?.payload?.success) {
      setGooglePhoneVerified(true);
      const verifiedSessionId =
        action.payload.otpSessionId ||
        googlePhoneOtpSessionId;
      setGooglePhoneOtpSessionId(
        verifiedSessionId
      );
      toast({
        title: "Phone Verified",
      });

      await completeGoogleSignup(
        verifiedSessionId
      );
    } else {
      showError(
        action?.payload?.message ||
          "Invalid OTP"
      );
    }
  }

  async function handleCompleteGoogleSignup() {
    await completeGoogleSignup();
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-3 py-8 sm:px-4 sm:py-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-black sm:text-4xl">
            {showGoogleCompletion
              ? "Verify Phone"
              : "Create Account"}
          </h1>

          <p className="text-gray-500 mt-2 text-sm">
            {showGoogleCompletion
              ? "Confirm your name and phone to continue"
              : "Join our community today"}
          </p>
        </div>

        {/* GOOGLE */}
        <div className="space-y-4 mb-8">
          <button
            onClick={handleGoogleStart}
            disabled={isGoogleLoading}
            className="w-full h-12 border border-gray-300 rounded-xl bg-white hover:bg-gray-100 transition flex items-center justify-center gap-3 text-black font-medium"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              className="w-5 h-5"
              alt="Google"
            />

            {isGoogleLoading
              ? "Connecting..."
              : "Continue with Google"}
          </button>

          <AnimatePresence>
            {showGoogleCompletion && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                className="space-y-4 border border-gray-200 rounded-2xl p-5"
              >
                <InputGroup
                  label="Full Name"
                  value={
                    googleProfile.userName
                  }
                  onChange={(v) =>
                    setGoogleProfile({
                      ...googleProfile,
                      userName: v,
                    })
                  }
                  placeholder="Your Name"
                />

                <InputGroup
                  label="Phone Number"
                  value={
                    googleProfile.phone
                  }
                  onChange={(v) =>
                    {
                      setGoogleProfile({
                        ...googleProfile,
                        phone: v,
                      });
                      setGooglePhoneVerified(false);
                      setGooglePhoneOtpSessionId("");
                    }
                  }
                  placeholder="9876543210"
                />

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="OTP"
                    value={googlePhoneOtp}
                    onChange={(e) =>
                      setGooglePhoneOtp(
                        e.target.value
                      )
                    }
                    className="flex-1 h-11 px-4 border border-gray-300 rounded-xl bg-white text-black placeholder:text-gray-400 outline-none"
                  />

                  <button
                    type="button"
                    onClick={
                      handleSendGooglePhoneOtp
                    }
                    className="px-4 text-sm text-black"
                  >
                    Send
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleVerifyGooglePhoneOtp
                    }
                    disabled={
                      isGoogleCompleteLoading
                    }
                    className="px-4 bg-black text-white rounded-xl text-sm"
                  >
                    {isGoogleCompleteLoading
                      ? "Wait"
                      : "Verify"}
                  </button>
                </div>

                <button
                  onClick={
                    handleCompleteGoogleSignup
                  }
                  disabled={
                    !googleProfile.userName ||
                    !googlePhoneVerified ||
                    isGoogleCompleteLoading
                  }
                  className="w-full h-11 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition"
                >
                  {isGoogleCompleteLoading
                    ? "Processing..."
                    : "Finish Signup"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!showGoogleCompletion && (
          <>
            {/* DIVIDER */}
            <div className="my-6 flex items-center gap-3 sm:my-8">
              <div className="h-px flex-1 bg-gray-300" />

              <span className="text-xs text-gray-400">
                OR
              </span>

              <div className="h-px flex-1 bg-gray-300" />
            </div>

            {/* FORM */}
            <form
              onSubmit={
                handleManualRegistration
              }
              className="space-y-4 sm:space-y-5"
            >
          <InputGroup
            label="Full Name"
            value={formData.userName}
            onChange={(v) =>
              setFormData({
                ...formData,
                userName: v,
              })
            }
            placeholder="Your Name"
          />

          <InputGroup
            label="Email"
            type="email"
            value={formData.email}
            onChange={(v) =>
              setFormData({
                ...formData,
                email: v,
              })
            }
            placeholder="email@example.com"
          />

          <InputGroup
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(v) =>
              setFormData({
                ...formData,
                phone: v,
              })
            }
            placeholder="9876543210"
          />

          <InputGroup
            label="Password"
            type="password"
            value={formData.password}
            onChange={(v) =>
              setFormData({
                ...formData,
                password: v,
              })
            }
            placeholder="Enter password"
          />

          <InputGroup
            label="Confirm Password"
            type="password"
            value={
              formData.confirmPassword
            }
            onChange={(v) =>
              setFormData({
                ...formData,
                confirmPassword: v,
              })
            }
            placeholder="Confirm password"
          />

          <div className="space-y-4">
            <VerificationBox
              placeholder="Email OTP"
              value={emailOtp}
              onChange={setEmailOtp}
              onSend={handleSendEmailOtp}
              onVerify={
                handleVerifyEmailOtp
              }
              isVerified={
                verificationStatus.email
              }
              disabledSend={!formData.email}
            />

            <VerificationBox
              placeholder="Phone OTP"
              value={phoneOtp}
              onChange={setPhoneOtp}
              onSend={handleSendPhoneOtp}
              onVerify={
                handleVerifyPhoneOtp
              }
              isVerified={
                verificationStatus.phone
              }
              disabledSend={!formData.phone}
            />
          </div>

          <button
            type="submit"
            disabled={
              !canSubmitManualRegistration ||
              isManualLoading
            }
            className="w-full h-12 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {isManualLoading
              ? "Creating..."
              : "Create Account"}
          </button>
            </form>
          </>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?
          <Link
            to="/auth/login"
            className="ml-1 text-black font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function InputGroup({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-white text-black outline-none focus:border-black transition"
      />
    </div>
  );
}

function VerificationBox({
  placeholder,
  value,
  onChange,
  onSend,
  onVerify,
  isVerified,
  disabledSend,
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        disabled={isVerified}
        className="flex-1 h-11 px-4 border border-gray-300 rounded-xl bg-white text-black placeholder:text-gray-400 outline-none disabled:bg-gray-50 disabled:text-gray-500"
      />

      {!isVerified && (
        <>
          <button
            type="button"
            onClick={onSend}
            disabled={disabledSend}
            className="px-4 text-sm text-black"
          >
            Send
          </button>

          <button
            type="button"
            onClick={onVerify}
            className="px-4 bg-black text-white rounded-xl text-sm"
          >
            Verify
          </button>
        </>
      )}

      {isVerified && (
        <div className="flex items-center px-4 text-green-600 text-sm font-medium">
          Verified
        </div>
      )}
    </div>
  );
}

export default AuthRegister;












// import { useEffect, useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { motion } from "framer-motion";
// import { loginWithGoogle, registerUser, sendOtp, verifyOtp } from "@/store/auth-slice";
// import { useToast } from "@/components/ui/use-toast";
// import { auth, googleProvider } from "@/config/firebase-config";
// import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";

// const initialRegisterState = {
//   userName: "",
//   email: "",
//   password: "",
//   confirmPassword: "",
//   phone: "",
//   address: "",
// };

// const initialGoogleCompletionState = {
//   userName: "",
//   email: "",
//   phone: "",
//   address: "",
// };

// function buildPhoneNumber(phone = "") {
//   const digits = String(phone).replace(/\D/g, "");
//   if (digits.length < 10) return "";
//   return digits.length === 10 ? `+91${digits}` : `+${digits}`;
// }

// function AuthRegister() {
//   const [formData, setFormData] = useState(initialRegisterState);
//   const [emailOtp, setEmailOtp] = useState("");
//   const [phoneOtp, setPhoneOtp] = useState("");
//   const [otpSessionId, setOtpSessionId] = useState("");
//   const [phoneConfirmation, setPhoneConfirmation] = useState(null);
//   const [verifiedPhoneToken, setVerifiedPhoneToken] = useState("");
//   const [verificationStatus, setVerificationStatus] = useState({ email: false, phone: false });
  
//   const [showGoogleCompletion, setShowGoogleCompletion] = useState(false);
//   const [googleProfile, setGoogleProfile] = useState(initialGoogleCompletionState);
//   const [pendingGoogleToken, setPendingGoogleToken] = useState("");
//   const [googlePhoneConfirmation, setGooglePhoneConfirmation] = useState(null);
//   const [googlePhoneOtp, setGooglePhoneOtp] = useState("");
//   const [googlePhoneToken, setGooglePhoneToken] = useState("");

//   const [isManualLoading, setIsManualLoading] = useState(false);
//   const [isGoogleLoading, setIsGoogleLoading] = useState(false);
//   const [isGoogleCompleteLoading, setIsGoogleCompleteLoading] = useState(false);

//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   // Initialize and Cleanup Recaptcha
//   useEffect(() => {
//     const initRecaptcha = (id) => {
//       return new RecaptchaVerifier(auth, id, { size: "invisible" });
//     };

//     if (!window.registerRecaptchaVerifier) {
//       window.registerRecaptchaVerifier = initRecaptcha("register-recaptcha-container");
//     }
//     if (!window.googleRegisterRecaptchaVerifier) {
//       window.googleRegisterRecaptchaVerifier = initRecaptcha("google-register-recaptcha-container");
//     }

//     return () => {
//       if (window.registerRecaptchaVerifier) {
//         window.registerRecaptchaVerifier.clear();
//         window.registerRecaptchaVerifier = null;
//       }
//       if (window.googleRegisterRecaptchaVerifier) {
//         window.googleRegisterRecaptchaVerifier.clear();
//         window.googleRegisterRecaptchaVerifier = null;
//       }
//     };
//   }, []);

//   const canSubmitManualRegistration = useMemo(() => 
//     Boolean(
//       formData.userName && 
//       formData.email && 
//       formData.password && 
//       formData.password === formData.confirmPassword && 
//       verificationStatus.email && 
//       verificationStatus.phone && 
//       verifiedPhoneToken
//     ), [formData, verificationStatus, verifiedPhoneToken]
//   );

//   const passwordStrength = useMemo(() => {
//     const value = formData.password || "";
//     let score = 0;
//     if (value.length >= 8) score++;
//     if (/[A-Z]/.test(value)) score++;
//     if (/[0-9]/.test(value)) score++;
//     if (/[^A-Za-z0-9]/.test(value)) score++;
//     if (score <= 1) return { label: "Weak", width: "25%", color: "bg-rose-500" };
//     if (score <= 3) return { label: "Medium", width: "65%", color: "bg-amber-500" };
//     return { label: "Strong", width: "100%", color: "bg-emerald-500" };
//   }, [formData.password]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   /** --- MANUAL REGISTRATION LOGIC --- **/

//   async function handleSendEmailOtp() {
//     if (!formData.email.includes("@")) return toast({ title: "Valid email required", variant: "destructive" });
//     const action = await dispatch(sendOtp({ target: formData.email, purpose: "register", channel: "email" }));
//     if (action.payload?.success) {
//       setOtpSessionId(action.payload.otpSessionId);
//       toast({ title: "Email OTP Sent" });
//     } else {
//       toast({ title: action.payload?.message || "Failed to send email OTP", variant: "destructive" });
//     }
//   }

//   async function handleVerifyEmailOtp() {
//     const action = await dispatch(verifyOtp({ target: formData.email, otp: emailOtp, purpose: "register", otpSessionId }));
//     if (action.payload?.success) {
//       setVerificationStatus(curr => ({ ...curr, email: true }));
//       toast({ title: "Email Verified" });
//     } else {
//       toast({ title: "Invalid Email OTP", variant: "destructive" });
//     }
//   }

//   async function handleSendPhoneOtp() {
//     const formatted = buildPhoneNumber(formData.phone);
//     if (!formatted) return toast({ title: "Valid 10-digit phone required", variant: "destructive" });
//     try {
//       const confirmation = await signInWithPhoneNumber(auth, formatted, window.registerRecaptchaVerifier);
//       setPhoneConfirmation(confirmation);
//       toast({ title: "Phone OTP Sent" });
//     } catch (error) {
//       toast({ title: "Phone OTP Error", description: error.message, variant: "destructive" });
//     }
//   }

//   async function handleVerifyPhoneOtp() {
//     try {
//       const credential = await phoneConfirmation.confirm(phoneOtp);
//       const token = await credential.user.getIdToken();
//       setVerifiedPhoneToken(token);
//       setVerificationStatus(curr => ({ ...curr, phone: true }));
//       toast({ title: "Phone Verified" });
//     } catch (error) {
//       toast({ title: "Invalid Phone OTP", variant: "destructive" });
//     }
//   }

//   async function handleManualRegistration(e) {
//     e.preventDefault();
//     setIsManualLoading(true);
//     const action = await dispatch(registerUser({ ...formData, otpSessionId, firebaseIdToken: verifiedPhoneToken }));
//     setIsManualLoading(false);
//     if (action.payload?.success) {
//       toast({ title: "Registration Successful" });
//       navigate("/auth/login");
//     } else {
//       toast({ title: action.payload?.message || "Registration Failed", variant: "destructive" });
//     }
//   }

//   /** --- GOOGLE REGISTRATION LOGIC --- **/

//   async function handleGoogleStart() {
//     setIsGoogleLoading(true);
//     try {
//       const result = await signInWithPopup(auth, googleProvider);
//       const firebaseIdToken = await result.user.getIdToken();
//       const action = await dispatch(loginWithGoogle({ firebaseIdToken }));

//       if (action.payload?.success) {
//         navigate("/shop/home");
//       } else if (action.payload?.profileCompletionRequired) {
//         setPendingGoogleToken(firebaseIdToken);
//         setGoogleProfile(prev => ({
//           ...prev,
//           userName: action.payload.profile?.userName || "",
//           email: action.payload.profile?.email || "",
//         }));
//         setShowGoogleCompletion(true);
//       }
//     } catch (error) {
//       toast({ title: "Google Auth Failed", variant: "destructive" });
//     } finally {
//       setIsGoogleLoading(false);
//     }
//   }

//   return (
//     <div className="w-full max-w-6xl mx-auto p-4">
//       <div id="register-recaptcha-container" />
//       <div id="google-register-recaptcha-container" />
      
//       <div className="grid gap-8 lg:grid-cols-2">
//         {/* LEFT COLUMN: MANUAL */}
//         <motion.section 
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="rounded-[2.5rem] bg-white p-8 shadow-2xl border border-slate-100"
//         >
//           <header className="mb-8">
//             <h1 className="text-4xl font-black text-slate-900">Get Started.</h1>
//             <p className="text-slate-500 mt-2 font-medium">Verify your credentials to secure your account.</p>
//           </header>

//           <form className="space-y-4" onSubmit={handleManualRegistration}>
//             <div className="grid gap-4 sm:grid-cols-2">
//               <div className="space-y-1">
//                 <label className="text-xs font-bold uppercase text-slate-400 ml-1">Username</label>
//                 <input name="userName" value={formData.userName} onChange={handleInputChange} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none focus:border-cyan-500" required />
//               </div>
//               <div className="space-y-1">
//                 <label className="text-xs font-bold uppercase text-slate-400 ml-1">Phone</label>
//                 <input name="phone" value={formData.phone} onChange={handleInputChange} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none focus:border-cyan-500" required />
//               </div>
//             </div>

//             <div className="space-y-1">
//               <label className="text-xs font-bold uppercase text-slate-400 ml-1">Email</label>
//               <input name="email" value={formData.email} onChange={handleInputChange} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none focus:border-cyan-500" required />
//             </div>

//             <div className="grid gap-4 sm:grid-cols-2">
//               <div className="space-y-1">
//                 <label className="text-xs font-bold uppercase text-slate-400 ml-1">Password</label>
//                 <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none focus:border-cyan-500" required />
//                 <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
//                    <div className={`h-full transition-all ${passwordStrength.color}`} style={{ width: passwordStrength.width }} />
//                 </div>
//               </div>
//               <div className="space-y-1">
//                 <label className="text-xs font-bold uppercase text-slate-400 ml-1">Confirm</label>
//                 <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none focus:border-cyan-500" required />
//               </div>
//             </div>

//             {/* Verification Section */}
//             <div className="p-4 rounded-3xl bg-cyan-50/50 border border-cyan-100 space-y-4">
//               <div className="flex gap-2">
//                 <input placeholder="Email OTP" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} className="h-10 flex-1 rounded-xl border border-white px-3 text-sm" />
//                 <button type="button" onClick={handleSendEmailOtp} className="h-10 px-4 bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider">Send</button>
//                 <button type="button" onClick={handleVerifyEmailOtp} className="h-10 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider">Verify</button>
//               </div>
//               <div className="flex gap-2">
//                 <input placeholder="Phone OTP" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} className="h-10 flex-1 rounded-xl border border-white px-3 text-sm" />
//                 <button type="button" onClick={handleSendPhoneOtp} className="h-10 px-4 bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider">Send</button>
//                 <button type="button" onClick={handleVerifyPhoneOtp} className="h-10 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider">Verify</button>
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={!canSubmitManualRegistration || isManualLoading}
//               className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all disabled:opacity-50"
//             >
//               {isManualLoading ? "Processing..." : "Create Account"}
//             </button>
//           </form>
//         </motion.section>

//         {/* RIGHT COLUMN: GOOGLE */}
//         <motion.section
//           initial={{ opacity: 0, x: 20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl"
//         >
//           <header className="mb-8">
//             <h2 className="text-3xl font-black italic">Social Signup</h2>
//             <p className="text-slate-400 mt-2">Skip the password. Link your Google account instantly.</p>
//           </header>

//           <button
//             onClick={handleGoogleStart}
//             disabled={isGoogleLoading}
//             className="w-full h-14 bg-white text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-all disabled:opacity-50"
//           >
//             <span className="text-xl font-black">G</span>
//             {isGoogleLoading ? "Connecting..." : "Continue with Google"}
//           </button>

//           {showGoogleCompletion && (
//             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10">
//               <h3 className="text-lg font-bold mb-4">Almost there...</h3>
//               <div className="space-y-4">
//                 <input placeholder="Phone Number" className="h-12 w-full bg-white/10 rounded-xl px-4 outline-none border border-white/10" value={googleProfile.phone} onChange={(e) => setGoogleProfile({...googleProfile, phone: e.target.value})} />
//                 <div className="flex gap-2">
//                   <input placeholder="OTP" className="h-12 flex-1 bg-white/10 rounded-xl px-4 outline-none border border-white/10" value={googlePhoneOtp} onChange={(e) => setGooglePhoneOtp(e.target.value)} />
//                   <button onClick={handleSendGooglePhoneOtp} className="h-12 px-4 bg-amber-400 text-slate-900 font-bold rounded-xl text-xs uppercase">Get OTP</button>
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </motion.section>
//       </div>
//     </div>
//   );
// }

// export default AuthRegister;
