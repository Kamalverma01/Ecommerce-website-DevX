import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { fetchCategories } from "@/store/catalog-slice";
import {
  fetchSellerProducts,
  addSellerProduct,
  editSellerProduct,
  deleteSellerProduct,
  uploadSellerProductImages,
  fetchSellerBrands,
  uploadSellerBrandLogo,
  createSellerBrand,
  requestSellerCategory,
} from "@/store/seller/seller-slice";

const initialFormData = {
  title: "",
  description: "",
  category: "",
  brand: "",
  price: "",
  salePrice: "",
  totalStock: "",
  images: [],
};

function SellerProducts() {
  const dispatch = useDispatch();
  const { products, brands, isLoading } = useSelector((state) => state.seller);
  const { categories } = useSelector((state) => state.catalog);
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [brandForm, setBrandForm] = useState({ name: "", logo: "" });
  const [brandLogoLoading, setBrandLogoLoading] = useState(false);
  const [categoryRequest, setCategoryRequest] = useState({ name: "", reason: "" });
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchSellerProducts());
    dispatch(fetchSellerBrands());
    dispatch(fetchCategories());
  }, [dispatch]);

  function resetForm() {
    setFormData(initialFormData);
    setEditingId(null);
  }

  function handleProductImages(files) {
    if (!files?.length) return;
    if (files.length < 3 || files.length > 4) {
      toast({ title: "Select 3 to 4 product images", variant: "destructive" });
      return;
    }

    setImageUploadLoading(true);
    dispatch(uploadSellerProductImages(files)).then((result) => {
      setImageUploadLoading(false);
      if (result.payload?.success) {
        setFormData((current) => ({ ...current, images: result.payload.data || [] }));
        toast({ title: "Product images uploaded" });
        return;
      }

      toast({
        title: result.payload?.message || "Unable to upload images",
        variant: "destructive",
      });
    });
  }

  function handleBrandLogo(file) {
    if (!file) return;
    setBrandLogoLoading(true);
    dispatch(uploadSellerBrandLogo(file)).then((result) => {
      setBrandLogoLoading(false);
      if (result.payload?.success) {
        setBrandForm((current) => ({ ...current, logo: result.payload.data }));
        toast({ title: "Brand logo uploaded" });
        return;
      }

      toast({
        title: result.payload?.message || "Unable to upload brand logo",
        variant: "destructive",
      });
    });
  }

  function handleCreateBrand(event) {
    event.preventDefault();
    dispatch(createSellerBrand(brandForm)).then((result) => {
      if (result.payload?.success) {
        toast({ title: "Brand created" });
        setBrandForm({ name: "", logo: "" });
        dispatch(fetchSellerBrands());
        return;
      }

      toast({
        title: result.payload?.message || "Unable to create brand",
        variant: "destructive",
      });
    });
  }

  function handleCategoryRequest(event) {
    event.preventDefault();
    dispatch(requestSellerCategory(categoryRequest)).then((result) => {
      if (result.payload?.success) {
        toast({ title: "Category request sent to admin" });
        setCategoryRequest({ name: "", reason: "" });
        return;
      }

      toast({
        title: result.payload?.message || "Unable to request category",
        variant: "destructive",
      });
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      ...formData,
      name: formData.title,
      price: Number(formData.price || 0),
      salePrice: Number(formData.salePrice || 0),
      totalStock: Number(formData.totalStock || 0),
    };

    const action = editingId
      ? editSellerProduct({ id: editingId, formData: payload })
      : addSellerProduct(payload);

    dispatch(action).then((result) => {
      if (result.payload?.success) {
        toast({ title: editingId ? "Product updated" : "Product added" });
        dispatch(fetchSellerProducts());
        resetForm();
        return;
      }

      toast({
        title: result.payload?.message || "Unable to save product",
        variant: "destructive",
      });
    });
  }

  function handleEdit(product) {
    setEditingId(product._id);
    setFormData({
      title: product.title || product.name || "",
      description: product.description || "",
      category: product.category || "",
      brand: product.brand || "",
      price: product.price || "",
      salePrice: product.salePrice || "",
      totalStock: product.totalStock || "",
      images: product.images?.length ? product.images : product.image ? [product.image] : [],
    });
  }

  function handleDelete(id) {
    dispatch(deleteSellerProduct(id)).then((result) => {
      if (result.payload?.success) {
        toast({ title: "Product removed" });
        dispatch(fetchSellerProducts());
        return;
      }

      toast({
        title: result.payload?.message || "Unable to delete product",
        variant: "destructive",
      });
    });
  }

  return (
    <div className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
      <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Products</p>
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Your seller catalog</h2>
          </div>
          <span className="text-sm text-slate-500">{products?.length || 0} listings</span>
        </div>
        <div className="space-y-4">
          {products?.map((product) => (
            <div key={product._id} className="rounded-lg border bg-slate-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <img
                    src={product.image || product.images?.[0]}
                    alt={product.title}
                    className="h-20 w-20 rounded-md border bg-white object-cover"
                  />
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-900">{product.title}</p>
                    <p className="text-sm text-slate-500">
                      {product.businessName || product.sellerName} | {product.category} | {product.brand}
                    </p>
                    <p className="text-sm text-slate-600">Rs. {product.price}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="w-full sm:w-auto" variant="outline" onClick={() => handleEdit(product)}>
                    Edit
                  </Button>
                  <Button className="w-full sm:w-auto" variant="destructive" onClick={() => handleDelete(product._id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {products?.length === 0 && (
            <p className="text-sm text-slate-500">No products created yet. Add your first listing.</p>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-4 sm:space-y-6">
        <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-xl font-semibold text-slate-900">{editingId ? "Edit listing" : "Create listing"}</h2>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <Input
              placeholder="Product name"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
            />
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select admin category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.brand}
              onValueChange={(value) => setFormData({ ...formData, brand: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand._id} value={brand.slug}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleProductImages(event.dataTransfer.files);
              }}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-5 text-center"
            >
              {imageUploadLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
              <span className="text-sm font-medium">Upload 3 to 4 product images</span>
              <Input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => handleProductImages(event.target.files)}
              />
            </Label>
            {formData.images.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {formData.images.map((image) => (
                  <img key={image} src={image} alt="Product" className="h-16 w-full rounded-md border object-cover" />
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Price"
                type="number"
                value={formData.price}
                onChange={(event) => setFormData({ ...formData, price: event.target.value })}
              />
              <Input
                placeholder="Sale price"
                type="number"
                value={formData.salePrice}
                onChange={(event) => setFormData({ ...formData, salePrice: event.target.value })}
              />
              <Input
                placeholder="Stock"
                type="number"
                value={formData.totalStock}
                onChange={(event) => setFormData({ ...formData, totalStock: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button className="w-full sm:w-auto" type="submit" disabled={isLoading}>
                {editingId ? "Update product" : "Add product"}
              </Button>
              <Button className="w-full sm:w-auto" variant="outline" type="button" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </form>
        </div>

        <form className="rounded-lg border bg-white p-4 shadow-sm sm:p-5" onSubmit={handleCreateBrand}>
          <h3 className="text-lg font-semibold">Create seller brand</h3>
          <div className="mt-4 space-y-3">
            <Input
              placeholder="Brand name"
              value={brandForm.name}
              onChange={(event) => setBrandForm({ ...brandForm, name: event.target.value })}
            />
            <Label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-4">
              {brandLogoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Upload brand logo
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleBrandLogo(event.target.files?.[0])}
              />
            </Label>
            {brandForm.logo ? (
              <img src={brandForm.logo} alt="Brand logo" className="h-16 w-16 rounded-md border object-contain" />
            ) : null}
            <Button type="submit" disabled={!brandForm.name.trim() || !brandForm.logo}>
              Create brand
            </Button>
          </div>
        </form>

        <form className="rounded-lg border bg-white p-4 shadow-sm sm:p-5" onSubmit={handleCategoryRequest}>
          <h3 className="text-lg font-semibold">Request new category</h3>
          <div className="mt-4 space-y-3">
            <Input
              placeholder="Category name"
              value={categoryRequest.name}
              onChange={(event) => setCategoryRequest({ ...categoryRequest, name: event.target.value })}
            />
            <Textarea
              placeholder="Reason for admin"
              value={categoryRequest.reason}
              onChange={(event) => setCategoryRequest({ ...categoryRequest, reason: event.target.value })}
            />
            <Button type="submit" variant="outline" disabled={!categoryRequest.name.trim()}>
              Send category request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SellerProducts;
