import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlist, removeFromWishlist } from "@/store/shop/wishlist-slice";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import AuthRequiredPanel from "@/components/auth/AuthRequiredPanel";

function ShoppingWishlist() {
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchWishlist(user.id));
    }
  }, [dispatch, user?.id]);

  function handleRemove(productId) {
    dispatch(removeFromWishlist({ userId: user?.id, productId })).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchWishlist(user?.id));
        toast({ title: "Removed from wishlist" });
      }
    });
  }

  function handleAddToCart(productId) {
    dispatch(addToCart({ userId: user?.id, productId, quantity: 1 })).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id));
        toast({ title: "Product added to cart" });
      }
    });
  }

  if (!user?.id) {
    return (
      <AuthRequiredPanel
        title="Login to view wishlist"
        description="Save favorite products and access them across devices after signing in."
        redirectTo="/shop/wishlist"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="container mx-auto px-3 sm:px-4">
        <h1 className="mb-6 text-3xl font-bold sm:mb-8 sm:text-4xl">Your Wishlist</h1>
        {wishlist?.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            {wishlist.map((product) => (
              <div key={product._id} className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <img src={product.image} alt={product.title} className="w-full h-64 object-cover" />
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-lg font-bold">Rs.{product.salePrice > 0 ? product.salePrice : product.price}</p>
                      {product.salePrice > 0 ? <p className="text-sm line-through text-slate-400">Rs.{product.price}</p> : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button className="flex-1" onClick={() => handleAddToCart(product._id)}>
                      Add to Cart
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => handleRemove(product._id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
            <p className="text-xl font-semibold">Your wishlist is empty.</p>
            <p className="mt-3 text-sm text-slate-500">Add products to your wishlist from the product detail page.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShoppingWishlist;
