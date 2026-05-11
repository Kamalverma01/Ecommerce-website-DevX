import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  addBrand,
  addCategory,
  approveCategoryRequest,
  deleteBrand,
  deleteCategory,
  editBrand,
  editCategory,
  fetchBrands,
  fetchCategories,
  fetchCategoryRequests,
  rejectCategoryRequest,
} from "@/store/catalog-slice";
import { Edit, ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const emptyBrandForm = { name: "", logo: "" };

function AdminCatalog() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { categories, brands, categoryPagination, categoryRequests, isLoading } = useSelector(
    (state) => state.catalog
  );

  const [categoryName, setCategoryName] = useState("");
  const [brandForm, setBrandForm] = useState(emptyBrandForm);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandLogoReading, setBrandLogoReading] = useState(false);

  function refreshCatalog() {
    dispatch(fetchCategories());
    dispatch(fetchBrands());
    dispatch(fetchCategoryRequests());
  }

  function handleCategorySubmit(event) {
    event.preventDefault();

    const action = editingCategory
      ? editCategory({ id: editingCategory._id, formData: { name: categoryName } })
      : addCategory({ name: categoryName });

    dispatch(action).then((data) => {
      if (data?.payload?.success) {
        setCategoryName("");
        setEditingCategory(null);
        dispatch(fetchCategories());
        toast({ title: editingCategory ? "Category updated" : "Category added" });
      } else {
        toast({
          title: data?.payload?.message || "Category action failed",
          variant: "destructive",
        });
      }
    });
  }

  function handleBrandSubmit(event) {
    event.preventDefault();

    const action = editingBrand
      ? editBrand({ id: editingBrand._id, formData: brandForm })
      : addBrand(brandForm);

    dispatch(action).then((data) => {
      if (data?.payload?.success) {
        setBrandForm(emptyBrandForm);
        setEditingBrand(null);
        dispatch(fetchBrands());
        toast({ title: editingBrand ? "Brand updated" : "Brand added" });
      } else {
        toast({
          title: data?.payload?.message || "Brand action failed",
          variant: "destructive",
        });
      }
    });
  }

  function handleBrandLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBrandLogoReading(true);
    const reader = new FileReader();

    reader.onload = () => {
      setBrandLogoReading(false);
      if (typeof reader.result === "string") {
        setBrandForm((current) => ({
          ...current,
          logo: reader.result,
        }));
      }
    };

    reader.onerror = () => {
      setBrandLogoReading(false);
      toast({ title: "Logo preview failed", variant: "destructive" });
    };

    reader.readAsDataURL(file);
  }

  useEffect(() => {
    refreshCatalog();
  }, [dispatch]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-lg border bg-background xl:col-span-2">
        <div className="border-b p-4">
          <h2 className="text-lg font-bold">Seller Category Requests</h2>
          <p className="text-sm text-muted-foreground">
            Approve requests to create admin-controlled categories.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryRequests?.length ? (
              categoryRequests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>
                    <div className="font-medium">{request.name}</div>
                    <div className="text-xs text-muted-foreground">{request.reason || "No reason added"}</div>
                  </TableCell>
                  <TableCell>
                    <div>{request.sellerBusinessName}</div>
                    <div className="text-xs text-muted-foreground">{request.sellerId?.email}</div>
                  </TableCell>
                  <TableCell className="capitalize">{request.status}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={request.status !== "pending"}
                        onClick={() =>
                          dispatch(approveCategoryRequest(request._id)).then(() => refreshCatalog())
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={request.status !== "pending"}
                        onClick={() =>
                          dispatch(rejectCategoryRequest(request._id)).then(() => refreshCatalog())
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No category requests
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-bold">Categories</h2>
            <p className="text-sm text-muted-foreground">
              {categoryPagination?.total || categories.length} total categories
            </p>
          </div>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : null}
        </div>

        <form onSubmit={handleCategorySubmit} className="grid gap-3 p-4">
          <Label htmlFor="categoryName">Category name</Label>
          <div className="flex gap-2">
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Men Clothing"
            />
            <Button type="submit" disabled={!categoryName.trim()}>
              {editingCategory ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span className="sr-only">{editingCategory ? "Save" : "Add"}</span>
            </Button>
            {editingCategory ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryName("");
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel</span>
              </Button>
            ) : null}
          </div>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length ? (
              categories.map((category) => (
                <TableRow key={category._id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryName(category.name);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit category</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() =>
                          dispatch(deleteCategory(category._id)).then(() =>
                            dispatch(fetchCategories())
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete category</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  No categories yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-bold">Brands</h2>
            <p className="text-sm text-muted-foreground">{brands.length} total brands</p>
          </div>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : null}
        </div>

        <form onSubmit={handleBrandSubmit} className="grid gap-3 p-4">
          <Label htmlFor="brandName">Brand name</Label>
          <Input
            id="brandName"
            value={brandForm.name}
            onChange={(event) =>
              setBrandForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Nike"
          />

          <Label htmlFor="brandLogo">Logo URL</Label>
          <div className="flex gap-2">
            <Input
              id="brandLogo"
              value={brandForm.logo}
              onChange={(event) =>
                setBrandForm((current) => ({ ...current, logo: event.target.value }))
              }
              placeholder="https://..."
            />
            <Button asChild type="button" variant="outline" size="icon">
              <Label htmlFor="brandLogoFile" className="cursor-pointer">
                <ImagePlus className="h-4 w-4" />
                <span className="sr-only">Upload logo</span>
              </Label>
            </Button>
            <Input
              id="brandLogoFile"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBrandLogoChange}
            />
          </div>
          {brandLogoReading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing preview...
            </p>
          ) : null}
          {brandForm.logo ? (
            <div className="flex items-center gap-3 rounded-md border bg-slate-50 p-3">
              <img
                src={brandForm.logo}
                alt="Brand logo preview"
                className="h-16 w-16 rounded-md border bg-white object-contain"
              />
              <div>
                <p className="text-sm font-semibold">Logo preview</p>
                <p className="text-xs text-muted-foreground">
                  This image will be stored with the brand record.
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button type="submit" disabled={!brandForm.name.trim()}>
              {editingBrand ? "Update Brand" : "Add Brand"}
            </Button>
            {editingBrand ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingBrand(null);
                  setBrandForm(emptyBrandForm);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.length ? (
              brands.map((brand) => (
                <TableRow key={brand._id}>
                  <TableCell>
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="h-10 w-10 rounded-md border object-contain"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md border bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>{brand.slug}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingBrand(brand);
                          setBrandForm({ name: brand.name, logo: brand.logo || "" });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit brand</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() =>
                          dispatch(deleteBrand(brand._id)).then(() => dispatch(fetchBrands()))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete brand</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No brands yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

export default AdminCatalog;
