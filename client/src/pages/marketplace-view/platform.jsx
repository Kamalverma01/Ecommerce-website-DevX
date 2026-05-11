import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  FileText,
  Filter,
  LockKeyhole,
  MessageSquareText,
  PackageCheck,
  PackagePlus,
  RefreshCcw,
  Search,
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const API_BASE = "/api/marketplace";

const tabs = [
  { id: "command", label: "Command", icon: BarChart3 },
  { id: "auth", label: "Auth", icon: LockKeyhole },
  { id: "seller", label: "Seller", icon: Store },
  { id: "catalog", label: "Catalog", icon: Tags },
  { id: "orders", label: "Orders", icon: Truck },
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "risk", label: "Risk", icon: ShieldCheck },
  { id: "growth", label: "Growth", icon: Bot },
  { id: "support", label: "Support", icon: MessageSquareText },
];

const metrics = [
  { label: "Revenue", value: "Rs. 18.4L", detail: "prepaid + COD pipeline", icon: CircleDollarSign, tone: "bg-emerald-50 text-emerald-700" },
  { label: "Commission", value: "Rs. 2.1L", detail: "earned after delivery", icon: Wallet, tone: "bg-sky-50 text-sky-700" },
  { label: "Fraud Review", value: "14", detail: "orders under review", icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
  { label: "Verified Sellers", value: "286", detail: "approved KYC profiles", icon: UserCheck, tone: "bg-violet-50 text-violet-700" },
];

const lifecycle = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "returned",
];

const endpointMap = [
  ["Auth", "POST /auth/register", "POST /auth/login", "POST /auth/otp/verify"],
  ["Seller", "POST /sellers/register", "POST /admin/sellers/:id/approve", "GET /seller/wallet"],
  ["Catalog", "POST /admin/categories", "POST /seller/brands", "POST /seller/products"],
  ["Orders", "POST /orders", "PATCH /orders/:id/status", "POST /orders/:id/delivery-otp"],
  ["Finance", "GET /admin/commission", "POST /payments/:id/intent", "POST /payments/refund"],
  ["Risk", "GET /admin/fraud", "POST /admin/fraud/sellers/:id/flag", "COD 5/day"],
  ["Growth", "POST /coupons", "POST /reviews", "GET /recommendations/trending"],
  ["Ops", "POST /returns", "POST /invoices/:id", "POST /chat/messages"],
];

const defaultPayloads = {
  customerRegister: {
    userName: "Aarav Customer",
    email: "buyer@example.com",
    phone: "9876543210",
    password: "SecurePass@123",
  },
  sellerRegister: {
    userName: "Meera Seller",
    email: "seller@example.com",
    phone: "9876500011",
    password: "SecurePass@123",
    businessName: "North Star Sports",
    businessType: "proprietorship",
    supportEmail: "support@northstar.test",
    address: "Sector 17, Chandigarh",
    kyc: {
      panNumber: "ABCDE1234F",
      gstNumber: "03ABCDE1234F1Z5",
      bankAccountNumber: "123456789012",
      ifscCode: "HDFC0001234",
      accountHolderName: "Meera Kapoor",
    },
  },
  product: {
    name: "Tournament Grade Football",
    description: "FIFA size football with durable PU shell.",
    category: "",
    brand: "",
    price: 1499,
    salePrice: 1299,
    stock: 80,
    lowStockThreshold: 8,
    status: "active",
  },
  order: {
    paymentMethod: "cod",
    paymentProvider: "cod",
    items: [{ productId: "", quantity: 1 }],
    address: {
      name: "Aarav Customer",
      line1: "House 12",
      city: "Chandigarh",
      state: "Punjab",
      pincode: "160017",
      phone: "9876543210",
    },
  },
};

function safeJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase text-slate-500">{label}</Label>
      {children}
    </div>
  );
}

function ShellPanel({ title, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`rounded-lg border bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <Icon className="h-4 w-4" />
          </span>
          <h2 className="truncate text-base font-semibold text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusRail() {
  return (
    <div className="grid gap-2 md:grid-cols-7">
      {lifecycle.map((status, index) => (
        <div key={status} className="rounded-md border bg-white px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase text-slate-500">{status.replaceAll("_", " ")}</span>
            <Badge variant={index < 5 ? "secondary" : index === 5 ? "default" : "outline"}>{index + 1}</Badge>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (index + 1) * 14)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function JsonBox({ value, onChange, rows = 10 }) {
  return (
    <Textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className="font-mono text-xs leading-relaxed"
    />
  );
}

function ActionForm({ title, icon, method = "POST", endpoint, payload, setPayload, token, onRun, button = "Run" }) {
  return (
    <ShellPanel
      title={title}
      icon={icon}
      action={
        <Button size="sm" onClick={() => onRun({ method, endpoint, payload, token })}>
          {button}
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-600">
        <Badge variant="outline">{method}</Badge>
        <span className="break-all font-mono">{API_BASE}{endpoint}</span>
      </div>
      <JsonBox value={payload} onChange={setPayload} />
    </ShellPanel>
  );
}

function MarketplacePlatform() {
  const [activeTab, setActiveTab] = useState("command");
  const [token, setToken] = useState("");
  const [response, setResponse] = useState({
    success: true,
    message: "Marketplace UI ready. Run any action to call the new backend module.",
    data: { mountPath: API_BASE, everyFeatureHasUiSurface: true },
  });
  const [loading, setLoading] = useState(false);
  const [productFiles, setProductFiles] = useState([]);
  const [brandLogo, setBrandLogo] = useState(null);
  const [forms, setForms] = useState(() => ({
    customerRegister: safeJson(defaultPayloads.customerRegister),
    login: safeJson({ email: "buyer@example.com", password: "SecurePass@123" }),
    otp: safeJson({ target: "buyer@example.com", purpose: "auth", otp: "123456" }),
    sellerRegister: safeJson(defaultPayloads.sellerRegister),
    sellerDecision: safeJson({ note: "KYC verified by admin" }),
    category: safeJson({ name: "Sports Gear", description: "Admin controlled sports catalog" }),
    categoryRequest: safeJson({ name: "Recovery Equipment", reason: "Seller wants to list foam rollers" }),
    brand: safeJson({ name: "North Star" }),
    product: safeJson(defaultPayloads.product),
    order: safeJson(defaultPayloads.order),
    status: safeJson({ status: "delivered" }),
    deliveryOtp: safeJson({ otp: "123456" }),
    coupon: safeJson({ code: "SPORTS10", discountType: "percentage", value: 10, maxDiscount: 500, minOrderValue: 999, expiresAt: "2026-12-31T23:59:59.000Z", usageLimit: 100 }),
    review: safeJson({ productId: "", orderId: "", rating: 5, title: "Great quality", comment: "Verified purchase and excellent match quality." }),
    sellerFlag: safeJson({ reason: "High return rate detected", score: 82 }),
    inventory: safeJson({ csv: "productId,stock,lowStockThreshold\n6630f1...,120,8" }),
    payment: safeJson({ provider: "razorpay" }),
    capture: safeJson({ orderId: "", reference: "razorpay_pay_123", provider: "razorpay" }),
    refund: safeJson({ orderId: "", reference: "refund_123" }),
    returnRequest: safeJson({ orderId: "", sellerId: "", reason: "Size issue" }),
    subscription: safeJson({ plan: "pro" }),
    chat: safeJson({ buyerId: "", sellerId: "", orderId: "", body: "Can you confirm dispatch timing?" }),
  }));
  const [ids, setIds] = useState({
    sellerId: "",
    productId: "",
    orderId: "",
    returnId: "",
  });

  const setForm = (key) => (value) => setForms((current) => ({ ...current, [key]: value }));

  const parsedForms = useMemo(() => {
    return Object.fromEntries(
      Object.entries(forms).map(([key, value]) => {
        try {
          return [key, JSON.parse(value || "{}")];
        } catch {
          return [key, {}];
        }
      })
    );
  }, [forms]);

  async function runRequest({ method = "POST", endpoint, payload, token: passedToken, formData }) {
    setLoading(true);
    try {
      const headers = {};
      if (passedToken || token) headers.Authorization = `Bearer ${passedToken || token}`;
      if (!formData) headers["Content-Type"] = "application/json";

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: method === "GET" ? undefined : formData || JSON.stringify(typeof payload === "string" ? JSON.parse(payload || "{}") : payload || {}),
      });

      const data = await res.json().catch(() => ({ success: false, message: "No JSON response returned." }));
      setResponse(data);

      const accessToken = data?.data?.accessToken;
      if (accessToken) setToken(accessToken);
    } catch (error) {
      setResponse({ success: false, message: error.message, data: { endpoint } });
    } finally {
      setLoading(false);
    }
  }

  function runProductUpload() {
    const formData = new FormData();
    Object.entries(parsedForms.product).forEach(([key, value]) => formData.append(key, value));
    productFiles.forEach((file) => formData.append("images", file));
    runRequest({ method: "POST", endpoint: "/seller/products", formData });
  }

  function runBrandUpload() {
    const formData = new FormData();
    Object.entries(parsedForms.brand).forEach(([key, value]) => formData.append(key, value));
    if (brandLogo) formData.append("logo", brandLogo);
    runRequest({ method: "POST", endpoint: "/seller/brands", formData });
  }

  const tabButtonClass = (id) =>
    `inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition ${
      activeTab === id ? "bg-slate-950 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-5 md:px-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-600">Production module</Badge>
                <Badge variant="outline">MVC + services + events</Badge>
                <Badge variant="outline">REST APIs</Badge>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Marketplace Operations Console</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Admin, seller, customer, order, commission, fraud, inventory, payment, review, notification, chat, analytics, search, AI recommendation, return, invoice, and subscription workflows.
              </p>
            </div>
            <div className="w-full max-w-xl rounded-lg border bg-slate-50 p-3">
              <Label className="text-xs font-semibold uppercase text-slate-500">Access token</Label>
              <div className="mt-2 flex gap-2">
                <Input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Login fills this automatically" />
                <Button variant="outline" size="icon" title="Clear token" onClick={() => setToken("")}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} type="button" className={tabButtonClass(tab.id)} onClick={() => setActiveTab(tab.id)}>
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-screen-2xl gap-5 px-4 py-5 md:px-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          {activeTab === "command" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label} className="rounded-lg border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-500">{metric.label}</p>
                          <p className="mt-2 text-2xl font-bold">{metric.value}</p>
                          <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
                        </div>
                        <span className={`rounded-md p-2 ${metric.tone}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <StatusRail />
              <div className="grid gap-4 lg:grid-cols-2">
                <ShellPanel title="Feature Coverage" icon={ClipboardCheck}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {endpointMap.map(([group, ...items]) => (
                      <div key={group} className="rounded-md border bg-slate-50 p-3">
                        <p className="font-semibold">{group}</p>
                        <div className="mt-2 space-y-1">
                          {items.map((item) => (
                            <p key={item} className="break-all font-mono text-xs text-slate-600">{item}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ShellPanel>
                <ShellPanel title="Integration Health" icon={ShieldCheck}>
                  <div className="space-y-3 text-sm">
                    {[
                      "JWT access + refresh token authentication",
                      "Multer + Cloudinary upload controls",
                      "Event-based order hooks for commission and returns",
                      "Fraud review flow with wallet freeze controls",
                      "Seller subscription limits and commission reduction",
                      "Search, filters, review ranking, and recommendations",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
                        <BadgeCheck className="h-4 w-4 text-emerald-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </ShellPanel>
              </div>
            </>
          ) : null}

          {activeTab === "auth" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ActionForm title="Customer Registration + OTP" icon={UserCheck} endpoint="/auth/register" payload={forms.customerRegister} setPayload={setForm("customerRegister")} onRun={runRequest} />
              <ActionForm title="Login and Capture Token" icon={LockKeyhole} endpoint="/auth/login" payload={forms.login} setPayload={setForm("login")} onRun={runRequest} />
              <ActionForm title="OTP Verification" icon={ShieldCheck} endpoint="/auth/otp/verify" payload={forms.otp} setPayload={setForm("otp")} onRun={runRequest} />
              <ActionForm title="Refresh Access Token" icon={RefreshCcw} endpoint="/auth/refresh" payload={safeJson({ refreshToken: "paste-refresh-token" })} setPayload={() => {}} onRun={runRequest} />
            </div>
          ) : null}

          {activeTab === "seller" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ActionForm title="Seller KYC Registration" icon={Building2} endpoint="/sellers/register" payload={forms.sellerRegister} setPayload={setForm("sellerRegister")} onRun={runRequest} />
              <ShellPanel title="Admin Approval" icon={BadgeCheck} action={<Button size="sm" onClick={() => runRequest({ endpoint: `/admin/sellers/${ids.sellerId}/approve`, payload: forms.sellerDecision })}>Approve</Button>}>
                <Field label="Seller ID">
                  <Input value={ids.sellerId} onChange={(event) => setIds((current) => ({ ...current, sellerId: event.target.value }))} placeholder="Marketplace seller id" />
                </Field>
                <div className="mt-3">
                  <JsonBox value={forms.sellerDecision} onChange={setForm("sellerDecision")} rows={5} />
                </div>
                <Button className="mt-3" variant="outline" onClick={() => runRequest({ endpoint: `/admin/sellers/${ids.sellerId}/reject`, payload: forms.sellerDecision })}>
                  Reject
                </Button>
              </ShellPanel>
              <ShellPanel title="Wallet and Earnings" icon={Wallet} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/seller/wallet" })}>Fetch</Button>}>
                <div className="grid gap-3 sm:grid-cols-3">
                  {["totalEarnings", "commissionDeducted", "availableBalance"].map((item) => (
                    <div key={item} className="rounded-md bg-slate-50 p-3">
                      <p className="text-xs uppercase text-slate-500">{item}</p>
                      <p className="mt-2 text-xl font-semibold">Rs. 0</p>
                    </div>
                  ))}
                </div>
              </ShellPanel>
              <ActionForm title="Subscription Plan" icon={TicketPercent} endpoint="/seller/subscription" payload={forms.subscription} setPayload={setForm("subscription")} onRun={runRequest} />
            </div>
          ) : null}

          {activeTab === "catalog" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ActionForm title="Admin Category Creation" icon={Tags} endpoint="/admin/categories" payload={forms.category} setPayload={setForm("category")} onRun={runRequest} />
              <ActionForm title="Seller Category Request" icon={PackagePlus} endpoint="/seller/category-requests" payload={forms.categoryRequest} setPayload={setForm("categoryRequest")} onRun={runRequest} />
              <ShellPanel title="Brand Logo Upload" icon={UploadCloud} action={<Button size="sm" onClick={runBrandUpload}>Create Brand</Button>}>
                <JsonBox value={forms.brand} onChange={setForm("brand")} rows={5} />
                <Input className="mt-3" type="file" accept="image/*" onChange={(event) => setBrandLogo(event.target.files?.[0] || null)} />
              </ShellPanel>
              <ShellPanel title="Product Upload with 3-4 Images" icon={ShoppingBag} action={<Button size="sm" onClick={runProductUpload}>Create Product</Button>}>
                <JsonBox value={forms.product} onChange={setForm("product")} rows={10} />
                <Input className="mt-3" type="file" accept="image/*" multiple onChange={(event) => setProductFiles(Array.from(event.target.files || []).slice(0, 4))} />
                <p className="mt-2 text-xs text-slate-500">{productFiles.length} image file(s) selected</p>
              </ShellPanel>
              <ShellPanel title="Search and Filters" icon={Search} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/products?q=football&sort=popularity&rating=4" })}>Search</Button>}>
                <div className="flex flex-wrap gap-2">
                  {["keyword", "price", "category", "rating", "popularity", "newest"].map((item) => (
                    <Badge key={item} variant="outline" className="capitalize">{item}</Badge>
                  ))}
                </div>
              </ShellPanel>
              <ActionForm title="Inventory CSV Bulk Upload" icon={Boxes} endpoint="/seller/inventory/bulk" payload={forms.inventory} setPayload={setForm("inventory")} onRun={runRequest} />
            </div>
          ) : null}

          {activeTab === "orders" ? (
            <div className="space-y-4">
              <StatusRail />
              <div className="grid gap-4 lg:grid-cols-2">
                <ActionForm title="Place Order with Fraud Score" icon={PackageCheck} endpoint="/orders" payload={forms.order} setPayload={setForm("order")} onRun={runRequest} />
                <ShellPanel title="Update Order Lifecycle" icon={Truck} action={<Button size="sm" onClick={() => runRequest({ method: "PATCH", endpoint: `/orders/${ids.orderId}/status`, payload: forms.status })}>Update</Button>}>
                  <Field label="Order ID">
                    <Input value={ids.orderId} onChange={(event) => setIds((current) => ({ ...current, orderId: event.target.value }))} />
                  </Field>
                  <div className="mt-3">
                    <JsonBox value={forms.status} onChange={setForm("status")} rows={5} />
                  </div>
                </ShellPanel>
                <ActionForm title="Delivery OTP Verification" icon={ShieldCheck} endpoint={`/orders/${ids.orderId || ":orderId"}/delivery-otp`} payload={forms.deliveryOtp} setPayload={setForm("deliveryOtp")} onRun={(args) => runRequest({ ...args, endpoint: `/orders/${ids.orderId}/delivery-otp` })} />
                <ShellPanel title="Admin Order Visibility" icon={ClipboardCheck} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/admin/orders" })}>Fetch All</Button>}>
                  <p className="text-sm text-slate-600">Admin sees all orders. Seller order visibility is available from the Seller tab.</p>
                </ShellPanel>
              </div>
            </div>
          ) : null}

          {activeTab === "finance" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ShellPanel title="Commission Summary" icon={CircleDollarSign} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/admin/commission" })}>Fetch</Button>}>
                <div className="grid gap-3 sm:grid-cols-4">
                  {["pending", "earned", "reversed", "paid"].map((item) => (
                    <div key={item} className="rounded-md bg-slate-50 p-3">
                      <p className="text-xs uppercase text-slate-500">{item}</p>
                      <p className="mt-2 text-lg font-semibold">Rs. 0</p>
                    </div>
                  ))}
                </div>
              </ShellPanel>
              <ActionForm title="Payment Intent" icon={CreditCard} endpoint={`/payments/${ids.orderId || ":orderId"}/intent`} payload={forms.payment} setPayload={setForm("payment")} onRun={(args) => runRequest({ ...args, endpoint: `/payments/${ids.orderId}/intent` })} />
              <ActionForm title="Capture Payment" icon={BadgeCheck} endpoint="/payments/capture" payload={forms.capture} setPayload={setForm("capture")} onRun={runRequest} />
              <ActionForm title="Refund Payment" icon={RefreshCcw} endpoint="/payments/refund" payload={forms.refund} setPayload={setForm("refund")} onRun={runRequest} />
            </div>
          ) : null}

          {activeTab === "risk" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ShellPanel title="Fraud Logs" icon={AlertTriangle} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/admin/fraud" })}>Fetch</Button>}>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>COD limit: 5/day</p>
                  <p>COD + new user: high risk</p>
                  <p>High value orders can become under_review</p>
                  <p>Return rate above 50% triggers blocking/freeze controls</p>
                </div>
              </ShellPanel>
              <ShellPanel title="Flag Seller Fraud" icon={ShieldCheck} action={<Button size="sm" onClick={() => runRequest({ endpoint: `/admin/fraud/sellers/${ids.sellerId}/flag`, payload: forms.sellerFlag })}>Flag</Button>}>
                <Field label="Seller ID">
                  <Input value={ids.sellerId} onChange={(event) => setIds((current) => ({ ...current, sellerId: event.target.value }))} />
                </Field>
                <div className="mt-3">
                  <JsonBox value={forms.sellerFlag} onChange={setForm("sellerFlag")} rows={5} />
                </div>
              </ShellPanel>
            </div>
          ) : null}

          {activeTab === "growth" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ActionForm title="Coupon Engine" icon={TicketPercent} endpoint="/coupons" payload={forms.coupon} setPayload={setForm("coupon")} onRun={runRequest} />
              <ActionForm title="Verified Buyer Review" icon={Star} endpoint="/reviews" payload={forms.review} setPayload={setForm("review")} onRun={runRequest} />
              <ShellPanel title="Trending Products" icon={Bot} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/recommendations/trending" })}>Fetch</Button>}>
                <p className="text-sm text-slate-600">AI-ready recommendation surface for trending products and purchase history.</p>
              </ShellPanel>
              <ShellPanel title="People Also Bought" icon={Filter} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: `/recommendations/also-bought/${ids.productId}` })}>Fetch</Button>}>
                <Field label="Product ID">
                  <Input value={ids.productId} onChange={(event) => setIds((current) => ({ ...current, productId: event.target.value }))} />
                </Field>
              </ShellPanel>
            </div>
          ) : null}

          {activeTab === "support" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ActionForm title="Return Request" icon={RefreshCcw} endpoint="/returns" payload={forms.returnRequest} setPayload={setForm("returnRequest")} onRun={runRequest} />
              <ShellPanel title="Approve Return + Refund Tracking" icon={PackageCheck} action={<Button size="sm" onClick={() => runRequest({ endpoint: `/admin/returns/${ids.returnId}/approve`, payload: { adminNote: "Approved" } })}>Approve</Button>}>
                <Field label="Return ID">
                  <Input value={ids.returnId} onChange={(event) => setIds((current) => ({ ...current, returnId: event.target.value }))} />
                </Field>
              </ShellPanel>
              <ShellPanel title="GST Invoice" icon={FileText} action={<Button size="sm" onClick={() => runRequest({ endpoint: `/invoices/${ids.orderId}`, payload: {} })}>Generate</Button>}>
                <Field label="Order ID">
                  <Input value={ids.orderId} onChange={(event) => setIds((current) => ({ ...current, orderId: event.target.value }))} />
                </Field>
              </ShellPanel>
              <ActionForm title="Buyer to Seller Chat" icon={MessageSquareText} endpoint="/chat/messages" payload={forms.chat} setPayload={setForm("chat")} onRun={runRequest} />
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <ShellPanel
            title={loading ? "Running Request" : "API Response"}
            icon={loading ? RefreshCcw : ClipboardCheck}
            action={<Badge variant={response?.success ? "default" : "destructive"}>{response?.success ? "OK" : "Error"}</Badge>}
          >
            <pre className="max-h-[640px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
              {safeJson(response)}
            </pre>
          </ShellPanel>
          <ShellPanel title="Pinned IDs" icon={ClipboardCheck}>
            <div className="space-y-3">
              {Object.entries(ids).map(([key, value]) => (
                <Field key={key} label={key}>
                  <Input value={value} onChange={(event) => setIds((current) => ({ ...current, [key]: event.target.value }))} />
                </Field>
              ))}
            </div>
          </ShellPanel>
          <Separator />
          <p className="text-xs leading-relaxed text-slate-500">
            The UI is wired to the marketplace module path. Mount the backend module at `/api/marketplace` for live requests.
          </p>
        </aside>
      </main>
    </div>
  );
}

export default MarketplacePlatform;
