import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BadgeCheck,
  Bot,
  Boxes,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  FileText,
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const API_BASE = "/api/marketplace";

const roleCopy = {
  admin: {
    eyebrow: "Admin Marketplace Control",
    title: "Platform operations, finance, fraud, catalog, sellers, and analytics",
    description:
      "Approve sellers, manage categories, audit commission, review fraud logs, handle returns, generate GST invoices, and supervise the full marketplace.",
  },
  seller: {
    eyebrow: "Seller Marketplace Workspace",
    title: "KYC, products, brands, inventory, orders, wallet, analytics, and chat",
    description:
      "Run the seller business from one place: upload listings, manage stock, request categories, create brands, update orders, watch earnings, and respond to customers.",
  },
  customer: {
    eyebrow: "Customer Marketplace Center",
    title: "Orders, OTP delivery, coupons, reviews, returns, chat, and recommendations",
    description:
      "Shop with marketplace-grade controls for checkout risk, delivery OTP, refunds, verified reviews, seller chat, and personalized recommendations.",
  },
};

const lifecycle = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "returned",
];

const defaults = {
  login: {
    email: "buyer@example.com",
    password: "SecurePass@123",
  },
  customerRegister: {
    userName: "Aarav Customer",
    email: "buyer@example.com",
    phone: "9876543210",
    password: "SecurePass@123",
  },
  otp: {
    target: "buyer@example.com",
    purpose: "auth",
    otp: "123456",
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
  category: {
    name: "Sports Gear",
    description: "Admin-controlled sports catalog",
  },
  categoryRequest: {
    name: "Recovery Equipment",
    reason: "Seller wants to list foam rollers and recovery kits.",
  },
  brand: {
    name: "North Star",
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
  orderStatus: {
    status: "delivered",
  },
  deliveryOtp: {
    otp: "123456",
  },
  coupon: {
    code: "SPORTS10",
    discountType: "percentage",
    value: 10,
    maxDiscount: 500,
    minOrderValue: 999,
    expiresAt: "2026-12-31T23:59:59.000Z",
    usageLimit: 100,
  },
  couponApply: {
    code: "SPORTS10",
    total: 1499,
  },
  review: {
    productId: "",
    orderId: "",
    rating: 5,
    title: "Great quality",
    comment: "Verified purchase and excellent match quality.",
  },
  sellerFlag: {
    reason: "High return rate detected",
    score: 82,
  },
  inventory: {
    csv: "productId,stock,lowStockThreshold\n6630f1...,120,8",
  },
  payment: {
    provider: "razorpay",
  },
  capture: {
    orderId: "",
    reference: "razorpay_pay_123",
    provider: "razorpay",
  },
  refund: {
    orderId: "",
    reference: "refund_123",
  },
  returnRequest: {
    orderId: "",
    sellerId: "",
    reason: "Size issue",
  },
  returnApproval: {
    adminNote: "Return approved after inspection.",
  },
  subscription: {
    plan: "pro",
  },
  chat: {
    buyerId: "",
    sellerId: "",
    orderId: "",
    body: "Can you confirm dispatch timing?",
  },
};

function toJson(value) {
  return JSON.stringify(value, null, 2);
}

function parseJson(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

function Card({ title, icon: Icon, action, children }) {
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="truncate text-lg font-semibold text-slate-950">{title}</h2>
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
      <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </Label>
      {children}
    </div>
  );
}

function JsonEditor({ value, onChange, rows = 8 }) {
  return (
    <Textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className="font-mono text-xs leading-relaxed"
    />
  );
}

function ActionCard({
  title,
  icon,
  endpoint,
  method = "POST",
  payload,
  onPayloadChange,
  onRun,
  button = "Run",
}) {
  return (
    <Card
      title={title}
      icon={icon}
      action={
        <Button size="sm" onClick={() => onRun({ endpoint, method, payload })}>
          {button}
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{method}</Badge>
        <span className="break-all font-mono text-xs text-slate-600">
          {API_BASE}
          {endpoint}
        </span>
      </div>
      <JsonEditor value={payload} onChange={onPayloadChange} />
    </Card>
  );
}

function LifecycleRail() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
      {lifecycle.map((item, index) => (
        <div key={item} className="rounded-lg border bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase text-slate-500">
              {item.replaceAll("_", " ")}
            </span>
            <Badge variant={index < 5 ? "secondary" : index === 5 ? "default" : "outline"}>
              {index + 1}
            </Badge>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-slate-100">
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

function ResponsePanel({ response, loading, token, setToken, ids, setIds }) {
  return (
    <aside className="space-y-4">
      <Card
        title={loading ? "Running Request" : "API Response"}
        icon={loading ? RefreshCcw : ClipboardCheck}
        action={<Badge variant={response?.success ? "default" : "destructive"}>{response?.success ? "OK" : "Error"}</Badge>}
      >
        <pre className="max-h-[520px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
          {toJson(response)}
        </pre>
      </Card>

      <Card title="Token and IDs" icon={ClipboardCheck}>
        <div className="space-y-3">
          <Field label="Access token">
            <Input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Login fills this automatically"
            />
          </Field>
          {Object.keys(ids).map((key) => (
            <Field key={key} label={key}>
              <Input
                value={ids[key]}
                onChange={(event) =>
                  setIds((current) => ({ ...current, [key]: event.target.value }))
                }
              />
            </Field>
          ))}
        </div>
      </Card>
    </aside>
  );
}

function MarketplaceFeatureConsole({ role = "customer" }) {
  const copy = roleCopy[role] || roleCopy.customer;
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [brandLogo, setBrandLogo] = useState(null);
  const [productFiles, setProductFiles] = useState([]);
  const [response, setResponse] = useState({
    success: true,
    message: `${copy.eyebrow} ready.`,
    data: { mountPath: API_BASE, role },
  });
  const [ids, setIds] = useState({
    sellerId: "",
    productId: "",
    orderId: "",
    returnId: "",
  });
  const [forms, setForms] = useState(() =>
    Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, toJson(value)]))
  );

  const parsed = useMemo(
    () => Object.fromEntries(Object.entries(forms).map(([key, value]) => [key, parseJson(value)])),
    [forms]
  );

  const setForm = (key) => (value) => setForms((current) => ({ ...current, [key]: value }));

  async function runRequest({ endpoint, method = "POST", payload, formData }) {
    setLoading(true);
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (!formData && method !== "GET") headers["Content-Type"] = "application/json";

      const request = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body:
          method === "GET"
            ? undefined
            : formData || JSON.stringify(typeof payload === "string" ? parseJson(payload) : payload || {}),
      });

      const data = await request
        .json()
        .catch(() => ({ success: false, message: "No JSON response returned." }));
      setResponse(data);

      if (data?.data?.accessToken) {
        setToken(data.data.accessToken);
      }
    } catch (error) {
      setResponse({ success: false, message: error.message, data: { endpoint } });
    } finally {
      setLoading(false);
    }
  }

  function runBrandUpload() {
    const formData = new FormData();
    Object.entries(parsed.brand).forEach(([key, value]) => formData.append(key, value));
    if (brandLogo) formData.append("logo", brandLogo);
    runRequest({ endpoint: "/seller/brands", formData });
  }

  function runProductUpload() {
    const formData = new FormData();
    Object.entries(parsed.product).forEach(([key, value]) => formData.append(key, value));
    productFiles.forEach((file) => formData.append("images", file));
    runRequest({ endpoint: "/seller/products", formData });
  }

  const commonAuth = (
    <div className="grid gap-4 lg:grid-cols-2">
      <ActionCard
        title="JWT Login"
        icon={LockKeyhole}
        endpoint="/auth/login"
        payload={forms.login}
        onPayloadChange={setForm("login")}
        onRun={runRequest}
      />
      <ActionCard
        title="OTP Verification"
        icon={ShieldCheck}
        endpoint="/auth/otp/verify"
        payload={forms.otp}
        onPayloadChange={setForm("otp")}
        onRun={runRequest}
      />
    </div>
  );

  const adminView = (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-4">
        {[
          ["Revenue", "Rs. 18.4L", CircleDollarSign],
          ["Commission", "earned / pending / reversed", Wallet],
          ["Fraud", "COD, returns, seller flags", AlertTriangle],
          ["Sellers", "KYC approval queue", Store],
        ].map(([label, value, Icon]) => (
          <div key={label} className="rounded-lg border bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-slate-500" />
            <p className="mt-4 text-xs font-semibold uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ActionCard title="Create Admin Category" icon={Tags} endpoint="/admin/categories" payload={forms.category} onPayloadChange={setForm("category")} onRun={runRequest} />
        <Card
          title="Seller Approval"
          icon={UserCheck}
          action={<Button size="sm" onClick={() => runRequest({ endpoint: `/admin/sellers/${ids.sellerId}/approve`, payload: { note: "KYC approved" } })}>Approve</Button>}
        >
          <Field label="Seller ID">
            <Input value={ids.sellerId} onChange={(event) => setIds((current) => ({ ...current, sellerId: event.target.value }))} />
          </Field>
          <Button className="mt-3" variant="outline" onClick={() => runRequest({ endpoint: `/admin/sellers/${ids.sellerId}/reject`, payload: { note: "KYC rejected" } })}>
            Reject Seller
          </Button>
        </Card>
        <Card title="Commission Dashboard" icon={CircleDollarSign} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/admin/commission" })}>Fetch</Button>}>
          <div className="grid gap-3 sm:grid-cols-4">
            {["pending", "earned", "reversed", "paid"].map((item) => (
              <div key={item} className="rounded-md bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">{item}</p>
                <p className="mt-2 text-lg font-semibold">Rs. 0</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Fraud Logs and Seller Freeze" icon={AlertTriangle} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/admin/fraud" })}>Logs</Button>}>
          <JsonEditor value={forms.sellerFlag} onChange={setForm("sellerFlag")} rows={5} />
          <Button className="mt-3" onClick={() => runRequest({ endpoint: `/admin/fraud/sellers/${ids.sellerId}/flag`, payload: forms.sellerFlag })}>
            Flag Seller
          </Button>
        </Card>
        <ActionCard title="Admin Coupon" icon={TicketPercent} endpoint="/coupons" payload={forms.coupon} onPayloadChange={setForm("coupon")} onRun={runRequest} />
        <ActionCard title="Payment Refund" icon={CreditCard} endpoint="/payments/refund" payload={forms.refund} onPayloadChange={setForm("refund")} onRun={runRequest} />
        <Card title="Return Approval" icon={RefreshCcw} action={<Button size="sm" onClick={() => runRequest({ endpoint: `/admin/returns/${ids.returnId}/approve`, payload: forms.returnApproval })}>Approve</Button>}>
          <Field label="Return ID">
            <Input value={ids.returnId} onChange={(event) => setIds((current) => ({ ...current, returnId: event.target.value }))} />
          </Field>
          <div className="mt-3">
            <JsonEditor value={forms.returnApproval} onChange={setForm("returnApproval")} rows={4} />
          </div>
        </Card>
        <Card title="GST Invoice" icon={FileText} action={<Button size="sm" onClick={() => runRequest({ endpoint: `/invoices/${ids.orderId}`, payload: {} })}>Generate</Button>}>
          <Field label="Order ID">
            <Input value={ids.orderId} onChange={(event) => setIds((current) => ({ ...current, orderId: event.target.value }))} />
          </Field>
        </Card>
        <Card title="Admin Analytics" icon={BarChart3} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/admin/analytics" })}>Fetch</Button>}>
          <p className="text-sm text-slate-600">Total revenue, commission, fraud stats, and platform order health.</p>
        </Card>
      </div>
    </div>
  );

  const sellerView = (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <ActionCard title="Seller KYC Registration" icon={Building2} endpoint="/sellers/register" payload={forms.sellerRegister} onPayloadChange={setForm("sellerRegister")} onRun={runRequest} />
        <Card title="Wallet" icon={Wallet} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/seller/wallet" })}>Fetch</Button>}>
          <div className="grid gap-3">
            {["totalEarnings", "commissionDeducted", "availableBalance"].map((item) => (
              <div key={item} className="rounded-md bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">{item}</p>
                <p className="mt-2 text-xl font-semibold">Rs. 0</p>
              </div>
            ))}
          </div>
        </Card>
        <ActionCard title="Subscription" icon={TicketPercent} endpoint="/seller/subscription" payload={forms.subscription} onPayloadChange={setForm("subscription")} onRun={runRequest} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ActionCard title="Request Category" icon={PackagePlus} endpoint="/seller/category-requests" payload={forms.categoryRequest} onPayloadChange={setForm("categoryRequest")} onRun={runRequest} />
        <Card title="Create Brand with Logo" icon={UploadCloud} action={<Button size="sm" onClick={runBrandUpload}>Create</Button>}>
          <JsonEditor value={forms.brand} onChange={setForm("brand")} rows={4} />
          <Input className="mt-3" type="file" accept="image/*" onChange={(event) => setBrandLogo(event.target.files?.[0] || null)} />
        </Card>
        <Card title="Create Product with 3-4 Images" icon={ShoppingBag} action={<Button size="sm" onClick={runProductUpload}>Create</Button>}>
          <JsonEditor value={forms.product} onChange={setForm("product")} rows={9} />
          <Input className="mt-3" type="file" accept="image/*" multiple onChange={(event) => setProductFiles(Array.from(event.target.files || []).slice(0, 4))} />
          <p className="mt-2 text-xs text-slate-500">{productFiles.length} file(s) selected</p>
        </Card>
        <ActionCard title="Bulk Inventory CSV" icon={Boxes} endpoint="/seller/inventory/bulk" payload={forms.inventory} onPayloadChange={setForm("inventory")} onRun={runRequest} />
        <Card title="Seller Orders" icon={Truck} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/seller/orders" })}>Fetch</Button>}>
          <LifecycleRail />
        </Card>
        <Card title="Update Order Status" icon={PackageCheck} action={<Button size="sm" onClick={() => runRequest({ method: "PATCH", endpoint: `/orders/${ids.orderId}/status`, payload: forms.orderStatus })}>Update</Button>}>
          <Field label="Order ID">
            <Input value={ids.orderId} onChange={(event) => setIds((current) => ({ ...current, orderId: event.target.value }))} />
          </Field>
          <div className="mt-3">
            <JsonEditor value={forms.orderStatus} onChange={setForm("orderStatus")} rows={4} />
          </div>
        </Card>
        <Card title="Seller Analytics" icon={BarChart3} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/seller/analytics" })}>Fetch</Button>}>
          <p className="text-sm text-slate-600">Sales graph data and product performance by revenue and units.</p>
        </Card>
        <ActionCard title="Seller Coupon" icon={TicketPercent} endpoint="/coupons" payload={forms.coupon} onPayloadChange={setForm("coupon")} onRun={runRequest} />
      </div>
    </div>
  );

  const customerView = (
    <div className="space-y-5">
      {commonAuth}
      <LifecycleRail />
      <div className="grid gap-4 lg:grid-cols-2">
        <ActionCard title="Customer Registration" icon={UserCheck} endpoint="/auth/register" payload={forms.customerRegister} onPayloadChange={setForm("customerRegister")} onRun={runRequest} />
        <ActionCard title="Place COD or Prepaid Order" icon={Truck} endpoint="/orders" payload={forms.order} onPayloadChange={setForm("order")} onRun={runRequest} />
        <Card title="Delivery OTP Verification" icon={ShieldCheck} action={<Button size="sm" onClick={() => runRequest({ endpoint: `/orders/${ids.orderId}/delivery-otp`, payload: forms.deliveryOtp })}>Verify</Button>}>
          <Field label="Order ID">
            <Input value={ids.orderId} onChange={(event) => setIds((current) => ({ ...current, orderId: event.target.value }))} />
          </Field>
          <div className="mt-3">
            <JsonEditor value={forms.deliveryOtp} onChange={setForm("deliveryOtp")} rows={4} />
          </div>
        </Card>
        <ActionCard title="Apply Coupon" icon={TicketPercent} endpoint="/coupons/apply" payload={forms.couponApply} onPayloadChange={setForm("couponApply")} onRun={runRequest} />
        <ActionCard title="Verified Buyer Review" icon={Star} endpoint="/reviews" payload={forms.review} onPayloadChange={setForm("review")} onRun={runRequest} />
        <ActionCard title="Return Request" icon={RefreshCcw} endpoint="/returns" payload={forms.returnRequest} onPayloadChange={setForm("returnRequest")} onRun={runRequest} />
        <Card title="Payment Intent" icon={CreditCard} action={<Button size="sm" onClick={() => runRequest({ endpoint: `/payments/${ids.orderId}/intent`, payload: forms.payment })}>Create</Button>}>
          <Field label="Order ID">
            <Input value={ids.orderId} onChange={(event) => setIds((current) => ({ ...current, orderId: event.target.value }))} />
          </Field>
          <div className="mt-3">
            <JsonEditor value={forms.payment} onChange={setForm("payment")} rows={4} />
          </div>
        </Card>
        <Card title="Recommendations" icon={Bot} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/recommendations/trending" })}>Trending</Button>}>
          <Field label="Product ID for also bought">
            <Input value={ids.productId} onChange={(event) => setIds((current) => ({ ...current, productId: event.target.value }))} />
          </Field>
          <Button className="mt-3" variant="outline" onClick={() => runRequest({ method: "GET", endpoint: `/recommendations/also-bought/${ids.productId}` })}>
            People Also Bought
          </Button>
        </Card>
        <ActionCard title="Order-Specific Chat" icon={MessageSquareText} endpoint="/chat/messages" payload={forms.chat} onPayloadChange={setForm("chat")} onRun={runRequest} />
        <Card title="Search and Filters" icon={Search} action={<Button size="sm" onClick={() => runRequest({ method: "GET", endpoint: "/products?q=football&sort=popularity&rating=4" })}>Search</Button>}>
          <div className="flex flex-wrap gap-2">
            {["keywords", "price", "category", "rating", "popularity", "newest"].map((item) => (
              <Badge key={item} variant="outline" className="capitalize">{item}</Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-600">Production APIs</Badge>
              <Badge variant="outline">MVC</Badge>
              <Badge variant="outline">Service layer</Badge>
              <Badge variant="outline">Events</Badge>
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              {copy.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {copy.title}
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{copy.description}</p>
          </div>
          <Badge variant="secondary" className="w-fit">
            {API_BASE}
          </Badge>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="min-w-0">
          {role === "admin" ? adminView : null}
          {role === "seller" ? sellerView : null}
          {role === "customer" ? customerView : null}
        </div>
        <ResponsePanel
          response={response}
          loading={loading}
          token={token}
          setToken={setToken}
          ids={ids}
          setIds={setIds}
        />
      </div>
    </div>
  );
}

export default MarketplaceFeatureConsole;
