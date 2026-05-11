import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applySeller, fetchSellerApplication } from "@/store/seller/seller-slice";

const statusStyles = {
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

function SellerApplication() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { application, isLoading, error } = useSelector((state) => state.seller);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    businessName: "",
    phone: "",
    address: "",
    businessType: "",
    supportEmail: "",
    gstNumber: "",
    pickupPincode: "",
    productCategories: "",
  });

  useEffect(() => {
    dispatch(fetchSellerApplication());
  }, [dispatch, user?.role]);

  useEffect(() => {
    if (application) {
      setFormData({
        businessName: application.businessName || "",
        phone: application.phone || "",
        address: application.address || "",
        businessType: application.businessType || "",
        supportEmail: application.supportEmail || "",
        gstNumber: application.gstNumber || "",
        pickupPincode: application.pickupPincode || "",
        productCategories: application.productCategories?.join(", ") || "",
      });
    }
  }, [application]);

  async function handleSubmit(event) {
    event.preventDefault();
    const response = await dispatch(
      applySeller({
        ...formData,
        productCategories: formData.productCategories
          .split(",")
          .map((category) => category.trim())
          .filter(Boolean),
      })
    );

    if (response.payload?.success) {
      toast({ title: "Seller application submitted" });
      dispatch(fetchSellerApplication());
      return;
    }

    toast({
      title: response.payload?.message || error || "Unable to submit application",
      variant: "destructive",
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Seller onboarding</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">Apply to become a seller</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Submit your shop details here. After admin approval, the dashboard,
            product manager, and seller orders pages unlock automatically.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-2">Apply</span>
            <span className="rounded-full bg-slate-100 px-3 py-2">Add products</span>
            <span className="rounded-full bg-slate-100 px-3 py-2">Manage orders</span>
          </div>
        </div>

        {application ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-600">Current status</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{application.businessName}</p>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                  statusStyles[application.status] || "bg-slate-100 text-slate-700"
                }`}
              >
                {application.status}
              </span>
            </div>
            {application.status === "approved" && (
              <p className="mt-4 text-sm text-green-700">
                Your seller account is active. Use the seller panel links above to manage products and orders.
              </p>
            )}
            {application.status !== "approved" && (
              <p className="mt-4 text-sm text-slate-500">You can update your onboarding details to resubmit.</p>
            )}
            <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Phone</p>
                <p>{application.phone || "Not added"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Support email</p>
                <p>{application.supportEmail || "Not added"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Business type</p>
                <p>{application.businessType || "Not added"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Pickup pincode</p>
                <p>{application.pickupPincode || "Not added"}</p>
              </div>
            </div>
            {application.status === "approved" ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/seller/products">Manage products</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/seller/orders">View orders</Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500 shadow-sm">
            No application found. Fill the form to apply.
          </div>
        )}
      </div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Seller details</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Input
              placeholder="Business name"
              value={formData.businessName}
              onChange={(event) => setFormData({ ...formData, businessName: event.target.value })}
            />
            <Input
              placeholder="Phone"
              value={formData.phone}
              onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
            />
            <Input
              placeholder="Business type"
              value={formData.businessType}
              onChange={(event) => setFormData({ ...formData, businessType: event.target.value })}
            />
            <Input
              placeholder="Support email"
              type="email"
              value={formData.supportEmail}
              onChange={(event) => setFormData({ ...formData, supportEmail: event.target.value })}
            />
            <Input
              placeholder="GST number"
              value={formData.gstNumber}
              onChange={(event) => setFormData({ ...formData, gstNumber: event.target.value })}
            />
            <Input
              placeholder="Pickup pincode"
              value={formData.pickupPincode}
              onChange={(event) => setFormData({ ...formData, pickupPincode: event.target.value })}
            />
          </div>
          <Input
            placeholder="Categories, comma separated"
            value={formData.productCategories}
            onChange={(event) => setFormData({ ...formData, productCategories: event.target.value })}
          />
          <Textarea
            placeholder="Business address"
            value={formData.address}
            onChange={(event) => setFormData({ ...formData, address: event.target.value })}
          />
          <Button type="submit" disabled={isLoading}>
            {application ? "Update application" : "Submit application"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default SellerApplication;
