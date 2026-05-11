import { Button } from "@/components/ui/button";
import {
  Airplay,
  ChevronLeftIcon,
  ChevronRightIcon,
  Images,
  Shirt,
  ShoppingBasket,
  WatchIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllFilteredProducts,
  fetchProductDetails,
} from "@/store/shop/products-slice";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { useLocation, useNavigate } from "react-router-dom";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "@/components/ui/use-toast";
import ProductDetailsDialog from "@/components/shopping-view/product-details";
import { getFeatureImages } from "@/store/common-slice";
import { fetchBrands, fetchCategories } from "@/store/catalog-slice";
import { openAuthModal } from "@/lib/auth-modal";

const categoryIcons = [Shirt, ShoppingBasket, WatchIcon, Images, Airplay];
const brandIcons = [ShoppingBasket, Shirt, Airplay, Images, WatchIcon];

function ShoppingHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { productList, productDetails } = useSelector(
    (state) => state.shopProducts,
  );
  const { featureImageList } = useSelector((state) => state.commonFeature);
  const { categories, brands } = useSelector((state) => state.catalog);

  const categoriesWithIcon = categories.map((category, index) => ({
    id: category.slug,
    label: category.name,
    icon: categoryIcons[index % categoryIcons.length],
  }));

  const brandsWithIcon = brands.map((brand, index) => ({
    id: brand.slug,
    label: brand.name,
    logo: brand.logo,
    icon: brandIcons[index % brandIcons.length],
  }));

  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  function handleNavigateToListingPage(getCurrentItem, section) {
    sessionStorage.removeItem("filters");
    const currentFilter = {
      [section]: [getCurrentItem.id],
    };
    sessionStorage.setItem("filters", JSON.stringify(currentFilter));
    navigate(`/shop/listing`);
  }

  function handleGetProductDetails(getCurrentProductId) {
    dispatch(fetchProductDetails(getCurrentProductId));
  }

  function handleAddtoCart(getCurrentProductId) {
    if (!user?.id) {
      openAuthModal(`${location.pathname}${location.search || ""}`);
      return;
    }

    dispatch(
      addToCart({
        userId: user?.id,
        productId: getCurrentProductId,
        quantity: 1,
      }),
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id));
        toast({ title: "Product is added to cart" });
      }
    });
  }

  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true);
  }, [productDetails]);

  useEffect(() => {
    if (!featureImageList?.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % featureImageList.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [featureImageList]);

  useEffect(() => {
    dispatch(
      fetchAllFilteredProducts({
        filterParams: {},
        sortParams: "price-lowtohigh",
      }),
    );
    dispatch(getFeatureImages());
    dispatch(fetchCategories());
    dispatch(fetchBrands());
  }, [dispatch]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Banner Section */}
      <div className="relative h-[260px] w-full overflow-hidden sm:h-[380px] lg:h-[600px]">
        {featureImageList?.length > 0 &&
          featureImageList.map((slide, index) => (
            <img
              src={slide?.image}
              key={index}
              className={`${index === currentSlide ? "opacity-100" : "opacity-0"} absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000`}
            />
          ))}
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setCurrentSlide(
              (prev) =>
                (prev - 1 + featureImageList.length) % featureImageList.length,
            )
          }
          className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/80"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setCurrentSlide((prev) => (prev + 1) % featureImageList.length)
          }
          className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/80"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Categories Section - Fixed to 6 Columns on Large Screens */}
      <section className="bg-gray-50 py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-center text-2xl font-bold sm:mb-8 sm:text-3xl">
            Shop by category
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {categoriesWithIcon.map((categoryItem) => (
              <Card
                key={categoryItem.id}
                onClick={() =>
                  handleNavigateToListingPage(categoryItem, "category")
                }
                className="cursor-pointer hover:shadow-lg transition-shadow"
              >
                <CardContent className="flex min-h-[120px] flex-col items-center justify-center p-4 text-center sm:p-6">
                  <categoryItem.icon className="w-10 h-10 mb-3 text-primary" />
                  <span className="font-bold text-sm sm:text-base">
                    {categoryItem.label}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brands Section - Fixed to 8 Columns on Large Screens */}
      {/* Brands Section - Logo + Name Layout */}
      <section className="bg-gray-50 py-8 sm:py-12 border-t">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-center text-2xl font-bold sm:mb-8 sm:text-3xl">
            Shop by Brand
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-8">
            {brandsWithIcon.map((brandItem) => (
              <Card
                key={brandItem.id}
                onClick={() => handleNavigateToListingPage(brandItem, "brand")}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <CardContent className="flex flex-col items-center justify-center p-3 h-28 sm:h-32 text-center">
                  {brandItem.logo ? (
                    <div className="flex items-center justify-center w-full h-16 mb-2">
                      <img
                        src={brandItem.logo}
                        alt={brandItem.label}
                        // className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                    </div>
                  ) : (
                    <brandItem.icon className="w-10 h-10 mb-2 text-primary group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-bold text-xs sm:text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    {brandItem.label}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Products Section */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-center text-2xl font-bold sm:mb-8 sm:text-3xl">
            Feature Products
          </h2>
          <div className="responsive-grid gap-4 sm:gap-6">
            {productList?.length > 0 &&
              productList.map((productItem, index) => (
                <ShoppingProductTile
                  key={productItem?._id || productItem?.id || index}
                  handleGetProductDetails={handleGetProductDetails}
                  product={productItem}
                  handleAddtoCart={handleAddtoCart}
                />
              ))}
          </div>
        </div>
      </section>

      <ProductDetailsDialog
        open={openDetailsDialog}
        setOpen={setOpenDetailsDialog}
        productDetails={productDetails}
      />
    </div>
  );
}

export default ShoppingHome;
