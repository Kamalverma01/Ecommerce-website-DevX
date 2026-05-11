import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  changeEmail,
  changePhone,
  logoutUser,
  sendOtp,
  updateProfile,
  verifyOtp,
} from "@/store/auth-slice";
import { useToast } from "@/components/ui/use-toast";
import Address from "@/components/shopping-view/address";
import ShoppingOrders from "@/components/shopping-view/orders";
import UserSupportTracker from "@/components/shopping-view/UserSupportTracker";
import AuthRequiredPanel from "@/components/auth/AuthRequiredPanel";

function ShoppingAccount() {
  const { user } = useSelector((state) => state.auth);
  const [profileForm, setProfileForm] = useState({
    userName: "",
    address: "",
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    otp: "",
    otpSessionId: "",
  });
  const [phoneForm, setPhoneForm] = useState({
    newPhone: "",
    otp: "",
    otpSessionId: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setProfileForm({
      userName: user?.userName || "",
      address: user?.address || "",
    });
    setEmailForm((current) => ({
      ...current,
      newEmail: user?.email || "",
    }));
    setPhoneForm((current) => ({
      ...current,
      newPhone: user?.phone || "",
    }));
  }, [user]);

  const profileDirty = useMemo(
    () =>
      profileForm.userName !== (user?.userName || "") ||
      profileForm.address !== (user?.address || ""),
    [profileForm, user?.address, user?.userName]
  );

  function handleLogout() {
    dispatch(logoutUser()).then(() => {
      navigate("/auth/login");
    });
  }

  function showError(action) {
    const message =
      action?.payload?.message || action?.error?.message || "Something went wrong";
    toast({
      title: message,
      variant: "destructive",
    });
  }

  if (!user?.id) {
    return (
      <AuthRequiredPanel
        title="Login to view profile"
        description="Manage your profile, addresses, orders, and support tickets after signing in."
        redirectTo="/shop/account"
      />
    );
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    const action = await dispatch(updateProfile(profileForm));

    if (action.payload?.success) {
      toast({ title: action.payload.message });
      return;
    }

    showError(action);
  }

  async function handleSendEmailOtp() {
    const action = await dispatch(
      sendOtp({
        target: emailForm.newEmail,
        purpose: "change-email",
        channel: "email",
      })
    );

    if (action.payload?.success) {
      setEmailForm((current) => ({
        ...current,
        otpSessionId: action.payload.otpSessionId,
      }));
      toast({ title: action.payload.message });
      return;
    }

    showError(action);
  }

  async function handleVerifyAndChangeEmail() {
    const verifyAction = await dispatch(
      verifyOtp({
        target: emailForm.newEmail,
        otp: emailForm.otp,
        purpose: "change-email",
        otpSessionId: emailForm.otpSessionId,
      })
    );

    if (!verifyAction.payload?.success) {
      showError(verifyAction);
      return;
    }

    const changeAction = await dispatch(
      changeEmail({
        newEmail: emailForm.newEmail,
        otpSessionId: emailForm.otpSessionId,
      })
    );

    if (changeAction.payload?.success) {
      toast({ title: changeAction.payload.message });
      return;
    }

    showError(changeAction);
  }

  async function handleSendPhoneOtp() {
    const action = await dispatch(
      sendOtp({
        target: phoneForm.newPhone,
        purpose: "change-phone",
        channel: "sms",
      })
    );

    if (action.payload?.success) {
      setPhoneForm((current) => ({
        ...current,
        otpSessionId: action.payload.otpSessionId,
      }));
      toast({ title: "SMS OTP sent" });
      return;
    }

    showError(action);
  }

  async function handleVerifyAndChangePhone() {
    const verifyAction = await dispatch(
      verifyOtp({
        target: phoneForm.newPhone,
        otp: phoneForm.otp,
        purpose: "change-phone",
        otpSessionId: phoneForm.otpSessionId,
      })
    );

    if (!verifyAction.payload?.success) {
      showError(verifyAction);
      return;
    }

    const action = await dispatch(
      changePhone({
        newPhone: phoneForm.newPhone,
        otpSessionId: phoneForm.otpSessionId,
      })
    );

    if (action.payload?.success) {
      toast({ title: action.payload.message });
      return;
    }

    showError(action);
  }

  return (
    <main className="min-h-screen bg-slate-50 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:mb-8 sm:p-6 md:flex-row md:items-center md:justify-between lg:p-8">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">My Profile</p>
            <h1 className="mt-3 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
              Welcome back, {user?.userName || "valued shopper"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Manage your profile, verified contact details, recent purchases,
              addresses, and support tickets from one place.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:bg-slate-900"
          >
            Logout
          </button>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          {/* <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Auth Method</p>
            <p className="mt-3 text-xl font-black capitalize text-slate-950 sm:text-2xl">
              {user?.authProvider || "email"}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Phone verification is mandatory and stays attached to your account
              across sessions.
            </p>
          </div> */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Email Status</p>
            <p className="mt-3 text-xl font-black text-slate-950 sm:text-2xl">
              {user?.emailVerified ? "Verified" : "Pending"}
            </p>
            <p className="mt-3 text-sm text-slate-600">{user?.email || "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Phone Status</p>
            <p className="mt-3 text-xl font-black text-slate-950 sm:text-2xl">
              {user?.phoneVerified ? "Verified" : "Pending"}
            </p>
            <p className="mt-3 text-sm text-slate-600">{user?.phone || "-"}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <section className="min-w-0 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
              <h2 className="mb-4 text-xl font-black text-slate-950 sm:text-2xl">Profile Summary</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl bg-slate-50 p-4 sm:p-6">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Name</p>
                  <p className="mt-3 break-words text-base font-semibold text-slate-900 sm:text-lg">{user?.userName || "-"}</p>
                </div>
                <div className="min-w-0 rounded-2xl bg-slate-50 p-4 sm:p-6">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Email</p>
                  <p className="mt-3 break-words text-base font-semibold text-slate-900 sm:text-lg">{user?.email || "-"}</p>
                </div>
                {/* <div className="min-w-0 rounded-2xl bg-slate-50 p-4 sm:p-6">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Role</p>
                  <p className="mt-3 text-lg font-semibold capitalize text-slate-900">{user?.role || "customer"}</p>
                </div> */}
                <div className="min-w-0 rounded-2xl bg-slate-50 p-4 sm:p-6">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Member ID</p>
                  <p className="mt-3 break-all text-lg font-semibold text-slate-900">{user?.id || user?._id || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* <form
              onSubmit={handleSaveProfile}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8"
            > */}
              {/* <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Profile Management</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Edit your account details</h2>
              </div> */}

              {/* <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.userName}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        userName: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Primary Address</label>
                  <textarea
                    rows={4}
                    value={profileForm.address}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!profileDirty}
                className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Save Profile
              </button>
            </form> */}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6">
                  <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Email Security</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">Change email with OTP</h2>
                </div>

                <div className="space-y-3">
                  <input
                    type="email"
                    value={emailForm.newEmail}
                    onChange={(event) =>
                      setEmailForm((current) => ({
                        ...current,
                        newEmail: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-900"
                  />
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <input
                      type="text"
                      value={emailForm.otp}
                      onChange={(event) =>
                        setEmailForm((current) => ({
                          ...current,
                          otp: event.target.value,
                        }))
                      }
                      placeholder="Enter email OTP"
                      className="h-12 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 px-4 text-sm font-semibold transition hover:border-slate-900"
                    >
                      Send OTP
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyAndChangeEmail}
                      disabled={!emailForm.otpSessionId}
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6">
                  <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Phone Security</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">Change phone with OTP</h2>
                </div>

                <div className="space-y-3">
                  <input
                    type="tel"
                    value={phoneForm.newPhone}
                    onChange={(event) =>
                      setPhoneForm((current) => ({
                        ...current,
                        newPhone: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-900"
                  />
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <input
                      type="text"
                      value={phoneForm.otp}
                      onChange={(event) =>
                        setPhoneForm((current) => ({
                          ...current,
                          otp: event.target.value,
                        }))
                      }
                      placeholder="Enter phone OTP"
                      className="h-12 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 px-4 text-sm font-semibold transition hover:border-slate-900"
                    >
                      Send OTP
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyAndChangePhone}
                      disabled={!phoneForm.otpSessionId}
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
              <ShoppingOrders />
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
              <UserSupportTracker userId={user?.id || user?._id} />
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Delivery</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Your Addresses</h2>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white">
                  {user?.userName?.slice(0, 1)?.toUpperCase() || "U"}
                </span>
              </div>
              <Address />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default ShoppingAccount;
