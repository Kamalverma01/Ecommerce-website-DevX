import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Save,
  User,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { checkAuth, logoutUser } from "@/store/auth-slice";

const API_BASE = "/api/marketplace";

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
    </div>
  );
}

function InfoCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-slate-500" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 break-words text-lg font-bold text-slate-950">{value || "-"}</p>
    </div>
  );
}

function money(value = 0) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function StaffProfile({ role = "seller" }) {
  const { user } = useSelector((state) => state.auth);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    userName: "",
    email: "",
    phone: "",
    businessName: "",
    supportEmail: "",
    businessType: "",
    address: "",
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  async function request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: "include",
      headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      ...options,
    });
    const data = await response.json().catch(() => ({ success: false, message: "No response" }));
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  }

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await request("/profile/me", { method: "GET" });
      setProfile(data.data);
      setForm({
        userName: data.data?.user?.userName || "",
        email: data.data?.user?.email || "",
        phone: data.data?.user?.phone || "",
        businessName: data.data?.seller?.businessName || "",
        supportEmail: data.data?.seller?.supportEmail || "",
        businessType: data.data?.seller?.businessType || "",
        address: data.data?.seller?.address || "",
      });
    } catch (error) {
      toast({ title: error.message || "Unable to load profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await request("/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          userName: form.userName,
          email: form.email,
          phone: form.phone,
          seller:
            role === "seller"
              ? {
                  businessName: form.businessName,
                  supportEmail: form.supportEmail,
                  businessType: form.businessType,
                  phone: form.phone,
                  address: form.address,
                }
              : undefined,
        }),
      });
      await dispatch(checkAuth());
      await loadProfile();
      toast({ title: "Profile updated successfully" });
    } catch (error) {
      toast({ title: error.message || "Unable to update profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await dispatch(logoutUser());
    navigate("/auth/login");
  }

  useEffect(() => {
    if (!isAuthenticated) {
      toast({ title: "Please login first", variant: "destructive" });
      return;
    }
    loadProfile();
  }, [isAuthenticated]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge className="bg-emerald-600">{role === "admin" ? "Admin Profile" : "Seller Profile"}</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Manage your account
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Change your name, email, phone number, and {role === "seller" ? "business details" : "admin contact details"}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadProfile} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <InfoCard label="Name" value={profile?.user?.userName || user?.userName} icon={User} />
        <InfoCard label="Email" value={profile?.user?.email || user?.email} icon={Mail} />
        <InfoCard label="Phone" value={profile?.user?.phone || user?.phone} icon={Phone} />
        <InfoCard
          label={role === "seller" ? "Balance" : "Role"}
          value={role === "seller" ? money(profile?.wallet?.availableBalance) : profile?.user?.role || user?.role}
          icon={role === "seller" ? Wallet : BadgeCheck}
        />
      </div>

      <form onSubmit={saveProfile} className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <User className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-950">Personal details</h2>
            <p className="text-sm text-slate-500">Email and phone update immediately for this account.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Full name">
            <Input value={form.userName} onChange={(event) => setForm({ ...form, userName: event.target.value })} />
          </Field>
          <Field label="Email address">
            <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Field label="Phone number">
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
        </div>

        {role === "seller" ? (
          <div className="mt-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-950">Business profile</h2>
                <p className="text-sm text-slate-500">These details are visible to admin and used for seller operations.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Business name">
                <Input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} />
              </Field>
              <Field label="Support email">
                <Input value={form.supportEmail} onChange={(event) => setForm({ ...form, supportEmail: event.target.value })} />
              </Field>
              <Field label="Business type">
                <Input value={form.businessType} onChange={(event) => setForm({ ...form, businessType: event.target.value })} />
              </Field>
              <div className="md:col-span-3">
                <Field label="Business address">
                  <Textarea rows={4} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
                </Field>
              </div>
            </div>
          </div>
        ) : null}

        <Button type="submit" className="mt-6" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </form>
    </div>
  );
}

export default StaffProfile;
