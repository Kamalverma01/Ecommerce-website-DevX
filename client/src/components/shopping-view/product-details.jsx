import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { addToWishlist, fetchWishlist } from "@/store/shop/wishlist-slice";
import { useToast } from "../ui/use-toast";
import { setProductDetails } from "@/store/shop/products-slice";
import { Label } from "../ui/label";
import StarRatingComponent from "../common/star-rating";
import { useEffect, useState } from "react";
import { addReview, getReviews } from "@/store/shop/review-slice";
import { openAuthModal } from "@/lib/auth-modal";

function ProductDetailsDialog({ open, setOpen, productDetails }) {
  const [reviewMsg, setReviewMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { reviews, isLoading: reviewsLoading } = useSelector((state) => state.shopReview);

  const { toast } = useToast();

  function handleRatingChange(getRating) {
    console.log(getRating, "getRating");

    setRating(getRating);
  }

  function handleAddToCart(getCurrentProductId, getTotalStock) {
    if (!user?.id) {
      openAuthModal(window.location.pathname + window.location.search);
      return;
    }

    let getCartItems = cartItems.items || [];

    if (getCartItems.length) {
      const indexOfCurrentItem = getCartItems.findIndex(
        (item) => item.productId === getCurrentProductId
      );
      if (indexOfCurrentItem > -1) {
        const getQuantity = getCartItems[indexOfCurrentItem].quantity;
        if (getQuantity + 1 > getTotalStock) {
          toast({
            title: `Only ${getQuantity} quantity can be added for this item`,
            variant: "destructive",
          });

          return;
        }
      }
    }
    dispatch(
      addToCart({
        userId: user?.id,
        productId: getCurrentProductId,
        quantity: 1,
      })
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id));
        toast({
          title: "Product is added to cart",
        });
      }
    });
  }

  function handleAddToWishlist(getCurrentProductId) {
    if (!user?.id) {
      openAuthModal("/shop/wishlist");
      return;
    }

    dispatch(
      addToWishlist({
        userId: user?.id,
        productId: getCurrentProductId,
      })
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchWishlist(user?.id));
        toast({
          title: "Product added to wishlist",
        });
      }
    });
  }

  function handleDialogClose() {
    setOpen(false);
    dispatch(setProductDetails());
    setRating(0);
    setReviewMsg("");
    setActiveImageIndex(0);
  }

  function handleAddReview() {
    if (!user?.id) {
      openAuthModal(window.location.pathname + window.location.search);
      return;
    }

    dispatch(
      addReview({
        productId: productDetails?._id,
        userId: user?.id,
        userName: user?.userName,
        reviewMessage: reviewMsg,
        reviewValue: rating,
      })
    ).then((data) => {
      if (data.payload?.success) {
        setRating(0);
        setReviewMsg("");
        dispatch(getReviews(productDetails?._id));
        toast({
          title: "Review added successfully!",
        });
      } else {
        toast({
          title: data.payload || "Unable to submit review",
          variant: "destructive",
        });
      }
    });
  }

  useEffect(() => {
    if (productDetails !== null) dispatch(getReviews(productDetails?._id));
  }, [productDetails]);

  console.log(reviews, "reviews");

  const averageReview =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0) /
        reviews.length
      : 0;

  const galleryImages = [
    productDetails?.image,
    ...(Array.isArray(productDetails?.images) ? productDetails.images : []),
  ].filter(Boolean);
  const activeImage = galleryImages[activeImageIndex] || productDetails?.image;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="h-[100dvh] w-screen max-w-none overflow-y-auto rounded-none p-3 sm:h-auto sm:max-h-[90vh] sm:w-[calc(100vw-2rem)] sm:max-w-[80vw] sm:rounded-lg sm:p-6 lg:max-w-[70vw] lg:p-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
        <div className="space-y-3">
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={activeImage}
            alt={productDetails?.title}
            width={600}
            height={600}
            className="aspect-square w-full object-cover"
          />
          {galleryImages.length > 1 ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
                onClick={() =>
                  setActiveImageIndex((current) =>
                    current === 0 ? galleryImages.length - 1 : current - 1
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
                onClick={() =>
                  setActiveImageIndex((current) =>
                    current === galleryImages.length - 1 ? 0 : current + 1
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
        {galleryImages.length > 1 ? (
          <div className="grid grid-cols-4 gap-2">
            {galleryImages.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                onClick={() => setActiveImageIndex(index)}
                className={`overflow-hidden rounded-md border-2 ${
                  activeImageIndex === index ? "border-primary" : "border-transparent"
                }`}
              >
                <img src={image} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
        </div>
        <div className="">
          <div>
            <h1 className="break-words text-2xl font-extrabold sm:text-3xl">{productDetails?.title}</h1>
            <p className="text-muted-foreground text-base leading-7 md:text-lg mb-5 mt-4">
              {productDetails?.description || "No product description available yet."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className={`text-3xl font-bold text-primary ${
                productDetails?.salePrice > 0 ? "line-through" : ""
              } text-2xl sm:text-3xl`}
            >
              Rs.{productDetails?.price}
            </p>
            {productDetails?.salePrice > 0 ? (
              <p className="text-xl font-bold text-muted-foreground sm:text-2xl">
                Rs.{productDetails?.salePrice}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0.5">
              <StarRatingComponent rating={averageReview} />
            </div>
            <span className="text-muted-foreground">
              ({averageReview.toFixed(2)})
            </span>
          </div>
          <div className="mt-5 mb-5">
            {productDetails?.totalStock === 0 ? (
              <Button className="w-full opacity-60 cursor-not-allowed">
                Out of Stock
              </Button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="w-full"
                  onClick={() =>
                    handleAddToCart(
                      productDetails?._id,
                      productDetails?.totalStock
                    )
                  }
                >
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAddToWishlist(productDetails?._id)}
                >
                  Add to Wishlist
                </Button>
              </div>
            )}
          </div>
          <Separator />
          <div className="py-5">
            <h2 className="text-xl font-bold">Description</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {productDetails?.description || "More product details will be added soon."}
            </p>
          </div>
          <Separator />
          <div className="max-h-[300px] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Reviews</h2>
            <div className="grid gap-6">
              {reviews && reviews.length > 0 ? (
                reviews.map((reviewItem) => (
                  <div key={reviewItem._id} className="flex gap-3 sm:gap-4">
                    <Avatar className="w-10 h-10 border">
                      <AvatarFallback>
                        {reviewItem?.userName?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{reviewItem?.userName}</h3>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <StarRatingComponent rating={reviewItem?.reviewValue} />
                      </div>
                      <p className="text-muted-foreground">
                        {reviewItem.reviewMessage}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <h1>No Reviews</h1>
              )}
            </div>
            <div className="mt-10 flex-col flex gap-2">
              <Label>Write a review</Label>
              <div className="flex gap-1">
                <StarRatingComponent
                  rating={rating}
                  handleRatingChange={handleRatingChange}
                />
              </div>
              <Input
                name="reviewMsg"
                value={reviewMsg}
                onChange={(event) => setReviewMsg(event.target.value)}
                placeholder="Write a review..."
              />
              <Button
                onClick={handleAddReview}
                disabled={reviewMsg.trim() === "" || rating < 1 || reviewsLoading}
              >
                {reviewsLoading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProductDetailsDialog;
