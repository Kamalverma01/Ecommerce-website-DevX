import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useSelector } from "react-redux";
import { Heart } from "lucide-react";

function ShoppingProductTile({
  product,
  handleGetProductDetails,
  handleAddtoCart,
  handleAddToWishlist,
}) {
  const { categoryOptionsMap, brandOptionsMap } = useSelector(
    (state) => state.catalog
  );

  return (
    /* Change: Added flex-col to ensure footer stays at bottom and cards stay uniform */
    <Card className="mx-auto flex flex-col h-full w-full max-w-sm overflow-hidden">
      <div 
        className="cursor-pointer" 
        onClick={() => handleGetProductDetails(product?._id)}
      >
        {/* Change: Used the product-image-container utility to fix image stretching */}
        <div className="product-image-container">
          <img
            src={product?.image}
            alt={product?.title}
          />
          
          {/* Badges and Wishlist Button */}
          {product?.totalStock === 0 ? (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
              Out Of Stock
            </Badge>
          ) : product?.totalStock < 10 ? (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
              {`Only ${product?.totalStock} left`}
            </Badge>
          ) : product?.salePrice > 0 ? (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
              Sale
            </Badge>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 rounded-full bg-white/90 shadow-md hover:bg-white z-10"
            onClick={(event) => {
              event.stopPropagation();
              handleAddToWishlist?.(product?._id);
            }}
          >
            <Heart className="h-4 w-4" />
            <span className="sr-only">Add to wishlist</span>
          </Button>
        </div>

        <CardContent className="p-3 sm:p-4 flex-1">
          <h2 className="mb-1 line-clamp-1 text-base font-bold sm:text-lg">
            {product?.title}
          </h2>
          <p className="mb-2 text-xs font-medium text-slate-500 italic">
            Seller: {product?.businessName || product?.sellerName || "Platform"}
          </p>
          
          <div className="mb-2 flex items-center justify-between gap-2 border-b pb-2">
            <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
              {categoryOptionsMap[product?.category] || product?.category}
            </span>
            <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider text-right">
              {brandOptionsMap[product?.brand] || product?.brand}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              className={`${
                product?.salePrice > 0 ? "line-through text-slate-400 text-sm" : "text-primary text-lg"
              } font-bold`}
            >
              Rs. {product?.price}
            </span>
            {product?.salePrice > 0 ? (
              <span className="text-lg font-bold text-red-600">
                Rs. {product?.salePrice}
              </span>
            ) : null}
          </div>
        </CardContent>
      </div>

      <CardFooter className="mt-auto p-3 pt-0 sm:p-4 sm:pt-0">
        {product?.totalStock === 0 ? (
          <Button className="w-full opacity-60 cursor-not-allowed" disabled>
            Out Of Stock
          </Button>
        ) : (
          <Button
            onClick={() => handleAddtoCart(product?._id, product?.totalStock)}
            className="w-full font-bold"
          >
            Add to cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default ShoppingProductTile;