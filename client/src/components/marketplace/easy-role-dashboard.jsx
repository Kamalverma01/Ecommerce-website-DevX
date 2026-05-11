import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  MessageSquareText,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Tags,
  TicketPercent,
  Truck,
  UploadCloud,
  UserCheck,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logoutUser, checkAuth } from "@/store/auth-slice";

const API_BASE = "/api/marketplace";

const roleText = {
  admin: {
    eyebrow: "Admin Control Center",
    title: "Manage sellers, catalog, orders, money, fraud, returns, and reports",
    description:
      "Everything is grouped by daily admin work. Review sellers, watch commission, check fraud, handle refunds, and generate invoices without touching technical payloads.",
  },
  seller: {
    eyebrow: "Seller Workspace",
    title: "Sell products, manage orders, stock, earnings, coupons, and customer chat",
    description:
      "Use simple forms for KYC, brands, products, inventory, order status, subscriptions, wallet, and analytics.",
  },
  customer: {
    eyebrow: "Customer Marketplace",
    title: "Shop, track orders, apply coupons, review products, return items, and chat",
    description:
      "Customer tools are grouped around buying, delivery, payment, support, and recommendations.",
  },
};

const orderSteps = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out for delivery",
  "delivered",
  "returned",
];

function Panel({ title, icon: Icon, children, action }) {
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
    </div>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-slate-500" />
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function OrderFlow() {
  return (
    <div className="grid gap-2 md:grid-cols-7">
      {orderSteps.map((step, index) => (
        <div key={step} className="rounded-md border bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase text-slate-500">{step}</p>
          <div className="mt-3 h-1.5 rounded-full bg-slate-200">
            <div
              className="h-1.5 rounded-full bg-emerald-500"
              style={{ width: `${Math.min(100, (index + 1) * 14)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultBox({ result }) {
  return (
    <div className="rounded-lg border bg-slate-950 p-4 text-sm text-white shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-semibold">Last action</p>
        <Badge variant={result.success ? "default" : "destructive"}>
          {result.success ? "Success" : "Needs attention"}
        </Badge>
      </div>
      <p className="text-slate-200">{result.message}</p>
    </div>
  );
}

function money(value = 0) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function EmptyState({ children = "No data found yet." }) {
  return (
    <div className="rounded-md border border-dashed bg-slate-50 p-5 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

function EasyMarketplaceDashboard({ role = "customer" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const copy = roleText[role] || roleText.customer;
  const [ids, setIds] = useState({ sellerId: "", productId: "", orderId: "", returnId: "" });
  const [result, setResult] = useState({
    success: true,
    message: "Ready. Fill a form and press a button.",
  });
  const [profile, setProfile] = useState(null);
  const [adminSellers, setAdminSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [commissionSummary, setCommissionSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mutationLoadingRef = useRef(false);
  const pendingRequestsRef = useRef(0);

  const [seller, setSeller] = useState({
    userName: "",
    email: "",
    phone: "",
    password: "",
    businessName: "",
    panNumber: "",
    gstNumber: "",
    bankAccountNumber: "",
    ifscCode: "",
    address: "",
  });
  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    price: "",
    stock: "",
  });
  const [brand, setBrand] = useState({ name: "" });
  const [category, setCategory] = useState({ name: "", description: "" });
  const [categoryRequest, setCategoryRequest] = useState({ name: "", reason: "" });
  const [order, setOrder] = useState({ productId: "", quantity: "1", paymentMethod: "cod" });
  const [coupon, setCoupon] = useState({ code: "SPORTS10", value: "10" });
  const [review, setReview] = useState({ productId: "", orderId: "", rating: "5", comment: "" });
  const [chat, setChat] = useState({ buyerId: "", sellerId: "", orderId: "", body: "" });
  const [orderStatus, setOrderStatus] = useState({ orderId: "", status: "packed" });
  const [inventoryUpdate, setInventoryUpdate] = useState({ productId: "", stock: "", lowStockThreshold: "" });
  const [withdrawal, setWithdrawal] = useState({ amount: "", method: "bank", reference: "" });
  const [brandLogo, setBrandLogo] = useState(null);
  const [productImages, setProductImages] = useState([]);

  async function callApi(endpoint, method = "POST", body = {}, formData = null, options = {}) {
    const isMutation = method !== "GET";
    if (isMutation && mutationLoadingRef.current) {
      setResult({ success: false, message: "Please wait for the current action to finish." });
      return null;
    }

    if (isMutation) mutationLoadingRef.current = true;
    pendingRequestsRef.current += 1;
    setIsLoading(true);
    try {
      const headers = {};
      if (!formData && method !== "GET") headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        credentials: "include",
        headers,
        body: method === "GET" ? undefined : formData || JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({ success: false, message: "No response received" }));

      if (options.onSuccess && data?.success) {
        options.onSuccess(data);
      }
      setResult({
        success: Boolean(data?.success),
        message: data?.message || "Action completed.",
      });
      return data;
    } catch (error) {
      setResult({ success: false, message: error.message || "Please login again to continue." });
      return null;
    } finally {
      if (isMutation) mutationLoadingRef.current = false;
      pendingRequestsRef.current = Math.max(0, pendingRequestsRef.current - 1);
      setIsLoading(pendingRequestsRef.current > 0);
    }
  }

  function loadProfile() {
    callApi("/profile/me", "GET", {}, null, {
      onSuccess: (data) => setProfile(data.data),
    });
  }

  function loadAdminSellers() {
    callApi("/admin/sellers", "GET", {}, null, {
      onSuccess: (data) => setAdminSellers(data.data?.sellers || []),
    });
  }

  function loadSellerDetail(sellerId) {
    if (!sellerId) return;
    setIds((current) => ({ ...current, sellerId }));
    callApi(`/admin/sellers/${sellerId}`, "GET", {}, null, {
      onSuccess: (data) => setSelectedSeller(data.data),
    });
  }

  function loadCommissionSummary() {
    callApi("/admin/commission", "GET", {}, null, {
      onSuccess: (data) => setCommissionSummary(data.data?.summary || null),
    });
  }

  function loadAnalytics(endpoint) {
    callApi(endpoint, "GET", {}, null, {
      onSuccess: (data) => setAnalytics(data.data?.overview || data.data),
    });
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setResult({ success: false, message: "Please login first. This page uses your current session." });
      return;
    }
    loadProfile();
    if (role === "admin") {
      loadAdminSellers();
      loadCommissionSummary();
      loadAnalytics("/admin/analytics");
    }
    if (role === "seller") {
      loadAnalytics("/seller/analytics");
    }
  }, [role, isAuthenticated]);

  async function handleLogout() {
    await callApi("/profile/logout", "POST", {});
    dispatch(logoutUser());
    navigate("/auth/login");
  }

  function submitSellerKyc() {
    callApi("/sellers/register", "POST", {
      userName: seller.userName,
      email: seller.email,
      phone: seller.phone,
      password: seller.password,
      businessName: seller.businessName,
      businessType: "business",
      supportEmail: seller.email,
      address: seller.address,
      kyc: {
        panNumber: seller.panNumber,
        gstNumber: seller.gstNumber,
        bankAccountNumber: seller.bankAccountNumber,
        ifscCode: seller.ifscCode,
        accountHolderName: seller.userName,
      },
    });
  }

  function submitBrand() {
    const formData = new FormData();
    formData.append("name", brand.name);
    if (brandLogo) formData.append("logo", brandLogo);
    callApi("/seller/brands", "POST", {}, formData);
  }

  function submitProduct() {
    const formData = new FormData();
    Object.entries(product).forEach(([key, value]) => formData.append(key, value));
    productImages.forEach((file) => formData.append("images", file));
    callApi("/seller/products", "POST", {}, formData);
  }

  function placeOrder() {
    callApi("/orders", "POST", {
      paymentMethod: order.paymentMethod,
      paymentProvider: order.paymentMethod === "cod" ? "cod" : "razorpay",
      items: [{ productId: order.productId, quantity: Number(order.quantity || 1) }],
      address: {
        name: "Customer",
        line1: "Saved address",
        city: "Chandigarh",
        state: "Punjab",
        pincode: "160017",
        phone: "9876543210",
      },
    });
  }

  function updateOrderStatus() {
    callApi(`/orders/${orderStatus.orderId}/status`, "PATCH", {
      status: orderStatus.status,
    });
  }

  function updateInventory() {
    callApi(`/seller/products/${inventoryUpdate.productId}`, "PATCH", {
      stock: Number(inventoryUpdate.stock || 0),
      lowStockThreshold: Number(inventoryUpdate.lowStockThreshold || 5),
    });
  }

  function requestWithdrawal() {
    callApi("/seller/wallet/withdraw", "POST", {
      amount: Number(withdrawal.amount || 0),
      method: withdrawal.method,
      reference: withdrawal.reference,
    }, null, {
      onSuccess: loadProfile,
    });
  }

  const admin = (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Revenue" value={money(analytics?.revenue?.totalRevenue)} icon={BarChart3} />
        <Stat label="Commission Earned" value={money(commissionSummary?.earned?.total)} icon={Wallet} />
        <Stat label="Fraud Logs" value={analytics?.fraud?.length || 0} icon={AlertTriangle} />
        <Stat label="Sellers" value={adminSellers.length} icon={Store} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Admin profile"
          icon={BadgeCheck}
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadProfile}>Refresh</Button>
              <Button size="sm" variant="destructive" onClick={handleLogout}>Logout</Button>
            </div>
          }
        >
          {profile?.user ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Name</p>
                <p className="font-semibold">{profile.user.userName}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Email</p>
                <p className="break-all font-semibold">{profile.user.email}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Role</p>
                <p className="font-semibold capitalize">{profile.user.role}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Phone</p>
                <p className="font-semibold">{profile.user.phone || "-"}</p>
              </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Name">
                  <Input
                    value={seller.userName}
                    onChange={(event) => setSeller({ ...seller, userName: event.target.value })}
                    placeholder={profile.user.userName}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    value={seller.email}
                    onChange={(event) => setSeller({ ...seller, email: event.target.value })}
                    placeholder={profile.user.email}
                  />
                </Field>
                <Field label="Phone number">
                  <Input
                    value={seller.phone}
                    onChange={(event) => setSeller({ ...seller, phone: event.target.value })}
                    placeholder={profile.user.phone}
                  />
                </Field>
              </div>
              <Button
                onClick={() =>
                  callApi("/profile/me", "PUT", {
                    userName: seller.userName || profile.user.userName,
                    email: seller.email || profile.user.email,
                    phone: seller.phone || profile.user.phone,
                  }).then(() => {
                    dispatch(checkAuth());
                    loadProfile();
                  })
                }
              >
                Save Admin Profile
              </Button>
            </div>
          ) : (
            <EmptyState>Login as admin to see profile.</EmptyState>
          )}
        </Panel>

        <Panel
          title="All seller details"
          icon={Store}
          action={<Button size="sm" onClick={loadAdminSellers}>Load Sellers</Button>}
        >
          <div className="space-y-3">
            {adminSellers.length ? (
              adminSellers.map((item) => (
                <button
                  type="button"
                  key={item.seller?._id}
                  onClick={() => loadSellerDetail(item.seller?._id)}
                  className="w-full rounded-md border bg-slate-50 p-4 text-left transition hover:border-slate-900 hover:bg-white"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-bold text-slate-950">{item.seller?.businessName || "Seller"}</p>
                      <p className="text-sm text-slate-500">{item.user?.email || item.seller?.supportEmail}</p>
                      <p className="text-xs text-slate-500">PAN {item.seller?.kyc?.panNumber || "-"} | GST {item.seller?.kyc?.gstNumber || "-"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="capitalize">{item.seller?.status}</Badge>
                      <Badge>{money(item.wallet?.availableBalance)}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-4">
                    <span>Orders: {item.totalOrders || 0}</span>
                    <span>Pending: {money(item.commission?.pending?.total)}</span>
                    <span>Earned: {money(item.commission?.earned?.total)}</span>
                    <span>Reversed: {money(item.commission?.reversed?.total)}</span>
                  </div>
                </button>
              ))
            ) : (
              <EmptyState>Click Load Sellers after admin login.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel title="Selected seller full detail" icon={Building2}>
          {selectedSeller?.seller ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Business</p>
                  <p className="font-semibold">{selectedSeller.seller.businessName}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Owner</p>
                  <p className="font-semibold">{selectedSeller.user?.userName || "-"}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Wallet</p>
                  <p className="font-semibold">{money(selectedSeller.wallet?.availableBalance)}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Orders</p>
                  <p className="font-semibold">{selectedSeller.orders?.length || 0}</p>
                </div>
              </div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                {selectedSeller.seller.address || "No business address saved."}
              </div>
            </div>
          ) : (
            <EmptyState>Select a seller from the list.</EmptyState>
          )}
        </Panel>

        <Panel title="Approve or reject seller" icon={UserCheck}>
          <Field label="Seller ID">
            <Input value={ids.sellerId} onChange={(event) => setIds({ ...ids, sellerId: event.target.value })} />
          </Field>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => callApi(`/admin/sellers/${ids.sellerId}/approve`, "POST", { note: "KYC approved" })}>
              Approve
            </Button>
            <Button variant="destructive" onClick={() => callApi(`/admin/sellers/${ids.sellerId}/reject`, "POST", { note: "KYC rejected" })}>
              Reject
            </Button>
          </div>
        </Panel>

        <Panel title="Create category" icon={Tags}>
          <div className="grid gap-3">
            <Field label="Category name">
              <Input value={category.name} onChange={(event) => setCategory({ ...category, name: event.target.value })} />
            </Field>
            <Field label="Description">
              <Textarea value={category.description} onChange={(event) => setCategory({ ...category, description: event.target.value })} />
            </Field>
            <Button onClick={() => callApi("/admin/categories", "POST", category)}>Create Category</Button>
          </div>
        </Panel>

        <Panel title="Money and commission" icon={Wallet}>
          <div className="mb-4">
            <Field label="Order ID for refund or invoice">
              <Input value={ids.orderId} onChange={(event) => setIds({ ...ids, orderId: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={loadCommissionSummary}>View Commission</Button>
            <Button variant="outline" onClick={() => loadAnalytics("/admin/analytics")}>View Analytics</Button>
            <Button variant="outline" onClick={() => callApi("/payments/refund", "POST", { orderId: ids.orderId, reference: "refund_reference" })}>Record Refund</Button>
            <Button variant="outline" onClick={() => callApi(`/invoices/${ids.orderId}`, "POST", {})}>Generate GST Invoice</Button>
          </div>
        </Panel>

        <Panel title="Fraud and returns" icon={ShieldCheck}>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Field label="Seller ID">
              <Input value={ids.sellerId} onChange={(event) => setIds({ ...ids, sellerId: event.target.value })} />
            </Field>
            <Field label="Return ID">
              <Input value={ids.returnId} onChange={(event) => setIds({ ...ids, returnId: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3">
            <Button variant="outline" onClick={() => callApi("/admin/fraud", "GET")}>View Fraud Logs</Button>
            <Button variant="outline" onClick={() => callApi(`/admin/fraud/sellers/${ids.sellerId}/flag`, "POST", { reason: "High return rate", score: 82 })}>Flag Seller and Freeze Wallet</Button>
            <Button variant="outline" onClick={() => callApi(`/admin/returns/${ids.returnId}/approve`, "POST", { adminNote: "Approved" })}>Approve Return</Button>
          </div>
        </Panel>
      </div>
    </div>
  );

  const sellerView = (
    <div className="space-y-6">
      {/* <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Wallet" value={money(profile?.wallet?.availableBalance)} icon={Wallet} />
        <Stat label="Orders" value="Manage status" icon={Truck} />
        <Stat label="Inventory" value="Stock control" icon={Boxes} />
        <Stat label="Plan" value={profile?.seller?.subscriptionPlan || "Basic / Pro"} icon={TicketPercent} />
      </div> */}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Seller profile"
          icon={BadgeCheck}
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadProfile}>Refresh</Button>
              <Button size="sm" variant="destructive" onClick={handleLogout}>Logout</Button>
            </div>
          }
        >
          {profile?.user ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Name</p>
                  <p className="font-semibold">{profile.user.userName}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Business</p>
                  <p className="font-semibold">{profile.seller?.businessName || "-"}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Status</p>
                  <p className="font-semibold capitalize">{profile.seller?.status || "-"}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Balance</p>
                  <p className="font-semibold">{money(profile.wallet?.availableBalance)}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input value={seller.userName} onChange={(event) => setSeller({ ...seller, userName: event.target.value })} placeholder={profile.user.userName} />
                </Field>
                <Field label="Email">
                  <Input value={seller.email} onChange={(event) => setSeller({ ...seller, email: event.target.value })} placeholder={profile.user.email} />
                </Field>
                <Field label="Phone number">
                  <Input value={seller.phone} onChange={(event) => setSeller({ ...seller, phone: event.target.value })} placeholder={profile.user.phone} />
                </Field>
                <Field label="Business name">
                  <Input value={seller.businessName} onChange={(event) => setSeller({ ...seller, businessName: event.target.value })} placeholder={profile.seller?.businessName || "Business name"} />
                </Field>
              </div>
              <Field label="Business address">
                <Textarea value={seller.address} onChange={(event) => setSeller({ ...seller, address: event.target.value })} placeholder={profile.seller?.address || "Business address"} />
              </Field>
              <Button
                onClick={() =>
                  callApi("/profile/me", "PUT", {
                    userName: seller.userName || profile.user.userName,
                    email: seller.email || profile.user.email,
                    phone: seller.phone || profile.user.phone,
                    seller: {
                      businessName: seller.businessName || profile.seller?.businessName,
                      businessType: profile.seller?.businessType,
                      supportEmail: profile.seller?.supportEmail,
                      phone: seller.phone || profile.seller?.phone,
                      address: seller.address || profile.seller?.address,
                    },
                  }).then(() => {
                    dispatch(checkAuth());
                    loadProfile();
                  })
                }
              >
                Save Profile
              </Button>
            </div>
          ) : (
            <EmptyState>Login as seller to see profile.</EmptyState>
          )}
        </Panel>

        <Panel title="Seller KYC application" icon={Building2}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name"><Input value={seller.userName} onChange={(event) => setSeller({ ...seller, userName: event.target.value })} /></Field>
            <Field label="Email"><Input value={seller.email} onChange={(event) => setSeller({ ...seller, email: event.target.value })} /></Field>
            <Field label="Phone"><Input value={seller.phone} onChange={(event) => setSeller({ ...seller, phone: event.target.value })} /></Field>
            <Field label="Password"><Input type="password" value={seller.password} onChange={(event) => setSeller({ ...seller, password: event.target.value })} /></Field>
            <Field label="Business name"><Input value={seller.businessName} onChange={(event) => setSeller({ ...seller, businessName: event.target.value })} /></Field>
            <Field label="PAN"><Input value={seller.panNumber} onChange={(event) => setSeller({ ...seller, panNumber: event.target.value })} /></Field>
            <Field label="GST"><Input value={seller.gstNumber} onChange={(event) => setSeller({ ...seller, gstNumber: event.target.value })} /></Field>
            <Field label="Bank account"><Input value={seller.bankAccountNumber} onChange={(event) => setSeller({ ...seller, bankAccountNumber: event.target.value })} /></Field>
            <Field label="IFSC"><Input value={seller.ifscCode} onChange={(event) => setSeller({ ...seller, ifscCode: event.target.value })} /></Field>
            <Field label="Business address"><Textarea value={seller.address} onChange={(event) => setSeller({ ...seller, address: event.target.value })} /></Field>
          </div>
          <Button className="mt-4" onClick={submitSellerKyc}>Submit Application</Button>
        </Panel>

        {/* <Panel title="Create brand" icon={UploadCloud}>
          <div className="grid gap-3">
            <Field label="Brand name">
              <Input value={brand.name} onChange={(event) => setBrand({ name: event.target.value })} />
            </Field>
            <Field label="Logo">
              <Input type="file" accept="image/*" onChange={(event) => setBrandLogo(event.target.files?.[0] || null)} />
            </Field>
            <Button onClick={submitBrand}>Create Brand</Button>
          </div>
        </Panel> */}

        {/* <Panel title="Add product" icon={ShoppingBag}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Product name"><Input value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} /></Field>
            <Field label="Category ID"><Input value={product.category} onChange={(event) => setProduct({ ...product, category: event.target.value })} /></Field>
            <Field label="Brand ID"><Input value={product.brand} onChange={(event) => setProduct({ ...product, brand: event.target.value })} /></Field>
            <Field label="Price"><Input type="number" value={product.price} onChange={(event) => setProduct({ ...product, price: event.target.value })} /></Field>
            <Field label="Stock"><Input type="number" value={product.stock} onChange={(event) => setProduct({ ...product, stock: event.target.value })} /></Field>
            <Field label="Images"><Input type="file" accept="image/*" multiple onChange={(event) => setProductImages(Array.from(event.target.files || []).slice(0, 4))} /></Field>
          </div>
          <Field label="Description">
            <Textarea value={product.description} onChange={(event) => setProduct({ ...product, description: event.target.value })} />
          </Field>
          <Button className="mt-4" onClick={submitProduct}>Add Product</Button>
        </Panel> */}

        <Panel title="Inventory, orders, and earnings" icon={PackageCheck}>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Order ID">
                <Input
                  value={orderStatus.orderId}
                  onChange={(event) => setOrderStatus({ ...orderStatus, orderId: event.target.value })}
                />
              </Field>
              <Field label="Next order status">
                <Input
                  value={orderStatus.status}
                  onChange={(event) => setOrderStatus({ ...orderStatus, status: event.target.value })}
                  placeholder="packed, shipped, out_for_delivery"
                />
              </Field>
            </div>
            <Button variant="outline" onClick={updateOrderStatus}>Update Order Status</Button>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Product ID">
                <Input
                  value={inventoryUpdate.productId}
                  onChange={(event) => setInventoryUpdate({ ...inventoryUpdate, productId: event.target.value })}
                />
              </Field>
              <Field label="New stock">
                <Input
                  type="number"
                  value={inventoryUpdate.stock}
                  onChange={(event) => setInventoryUpdate({ ...inventoryUpdate, stock: event.target.value })}
                />
              </Field>
              <Field label="Low stock alert">
                <Input
                  type="number"
                  value={inventoryUpdate.lowStockThreshold}
                  onChange={(event) => setInventoryUpdate({ ...inventoryUpdate, lowStockThreshold: event.target.value })}
                  placeholder="5"
                />
              </Field>
            </div>
            <Button variant="outline" onClick={updateInventory}>Update Inventory</Button>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Withdrawal amount">
                <Input
                  type="number"
                  value={withdrawal.amount}
                  onChange={(event) => setWithdrawal({ ...withdrawal, amount: event.target.value })}
                />
              </Field>
              <Field label="Payout method">
                <Input
                  value={withdrawal.method}
                  onChange={(event) => setWithdrawal({ ...withdrawal, method: event.target.value })}
                />
              </Field>
              <Field label="Reference">
                <Input
                  value={withdrawal.reference}
                  onChange={(event) => setWithdrawal({ ...withdrawal, reference: event.target.value })}
                  placeholder="Bank / UPI note"
                />
              </Field>
            </div>
            <Button variant="outline" onClick={requestWithdrawal}>Request Wallet Withdrawal</Button>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Requested category">
                <Input
                  value={categoryRequest.name}
                  onChange={(event) => setCategoryRequest({ ...categoryRequest, name: event.target.value })}
                />
              </Field>
              <Field label="Reason">
                <Textarea
                  value={categoryRequest.reason}
                  onChange={(event) => setCategoryRequest({ ...categoryRequest, reason: event.target.value })}
                />
              </Field>
            </div>
            {/* <Button variant="outline" onClick={loadProfile}>View Wallet</Button> */}
            {/* <Button variant="outline" onClick={() => callApi("/seller/orders", "GET")}>View Seller Orders</Button> */}
            <Button variant="outline" onClick={() => loadAnalytics("/seller/analytics")}>View Analytics</Button>
            {/* <Button variant="outline" onClick={() => callApi("/seller/subscription", "POST", { plan: "pro" })}>Upgrade to Pro</Button> */}
            {/* <Button variant="outline" onClick={() => callApi("/seller/category-requests", "POST", categoryRequest)}>Request Category</Button> */}
          </div>
        </Panel>
      </div>
    </div>
  );

  const customer = (
    <div className="space-y-6">
      <OrderFlow />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Place order" icon={Truck}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Product ID"><Input value={order.productId} onChange={(event) => setOrder({ ...order, productId: event.target.value })} /></Field>
            <Field label="Quantity"><Input type="number" value={order.quantity} onChange={(event) => setOrder({ ...order, quantity: event.target.value })} /></Field>
            <Field label="Payment method"><Input value={order.paymentMethod} onChange={(event) => setOrder({ ...order, paymentMethod: event.target.value })} /></Field>
          </div>
          <Button className="mt-4" onClick={placeOrder}>Place Order</Button>
        </Panel>

        <Panel title="Delivery and payment" icon={CreditCard}>
          <Field label="Order ID">
            <Input value={ids.orderId} onChange={(event) => setIds({ ...ids, orderId: event.target.value })} />
          </Field>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => callApi(`/orders/${ids.orderId}/delivery-otp`, "POST", { otp: "123456" })}>Verify Delivery OTP</Button>
            <Button variant="outline" onClick={() => callApi(`/payments/${ids.orderId}/intent`, "POST", { provider: "razorpay" })}>Pay Online</Button>
          </div>
        </Panel>

        <Panel title="Coupons and reviews" icon={Star}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Coupon code"><Input value={coupon.code} onChange={(event) => setCoupon({ ...coupon, code: event.target.value })} /></Field>
            <Field label="Discount value"><Input value={coupon.value} onChange={(event) => setCoupon({ ...coupon, value: event.target.value })} /></Field>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label="Review product ID">
              <Input value={review.productId} onChange={(event) => setReview({ ...review, productId: event.target.value })} />
            </Field>
            <Field label="Review order ID">
              <Input value={review.orderId} onChange={(event) => setReview({ ...review, orderId: event.target.value })} />
            </Field>
            <Field label="Rating">
              <Input type="number" min="1" max="5" value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })} />
            </Field>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => callApi("/coupons/apply", "POST", { code: coupon.code, total: 1499 })}>Apply Coupon</Button>
            <Button variant="outline" onClick={() => callApi("/reviews", "POST", review)}>Submit Review</Button>
          </div>
          <Field label="Review comment">
            <Textarea value={review.comment} onChange={(event) => setReview({ ...review, comment: event.target.value })} />
          </Field>
        </Panel>

        <Panel title="Returns, support, and recommendations" icon={MessageSquareText}>
          <div className="grid gap-3">
            <Button variant="outline" onClick={() => callApi("/returns", "POST", { orderId: ids.orderId, sellerId: ids.sellerId, reason: "Need return" })}>Request Return</Button>
            <Button variant="outline" onClick={() => callApi("/recommendations/trending", "GET")}>View Trending Products</Button>
            <Button variant="outline" onClick={() => callApi(`/recommendations/also-bought/${ids.productId}`, "GET")}>People Also Bought</Button>
            <Button variant="outline" onClick={() => callApi("/products?q=football&sort=popularity", "GET")}>Search Products</Button>
          </div>
        </Panel>

        <Panel title="Buyer and seller chat" icon={MessageSquareText}>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Buyer ID"><Input value={chat.buyerId} onChange={(event) => setChat({ ...chat, buyerId: event.target.value })} /></Field>
              <Field label="Seller ID"><Input value={chat.sellerId} onChange={(event) => setChat({ ...chat, sellerId: event.target.value })} /></Field>
              <Field label="Order ID"><Input value={chat.orderId} onChange={(event) => setChat({ ...chat, orderId: event.target.value })} /></Field>
            </div>
            <Field label="Message"><Textarea value={chat.body} onChange={(event) => setChat({ ...chat, body: event.target.value })} /></Field>
            <Button onClick={() => callApi("/chat/messages", "POST", chat)}>Send Message</Button>
          </div>
        </Panel>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge className="bg-emerald-600">Easy Mode</Badge>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
              {roleText[role]?.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{copy.title}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{copy.description}</p>
          </div>
          <Badge variant="outline" className="w-fit">
            {isLoading ? "Working..." : "Uses your current login session"}
          </Badge>
        </div>
      </div>

      <ResultBox result={result} />

      {role === "admin" ? admin : null}
      {role === "seller" ? sellerView : null}
      {role === "customer" ? customer : null}
    </div>
  );
}

export default EasyMarketplaceDashboard;
