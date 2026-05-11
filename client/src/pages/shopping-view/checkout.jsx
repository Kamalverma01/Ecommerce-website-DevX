// import Address from "@/components/shopping-view/address";
// import img from "../../assets/account.jpg";
// import { useDispatch, useSelector } from "react-redux";
// import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
// import { Button } from "@/components/ui/button";
// import { useState } from "react";
// import { createNewOrder } from "@/store/shop/order-slice";
// import { Navigate } from "react-router-dom";
// import { useToast } from "@/components/ui/use-toast";

// function ShoppingCheckout() {
//   const { cartItems } = useSelector((state) => state.shopCart);
//   const { user } = useSelector((state) => state.auth);
//   const { approvalURL } = useSelector((state) => state.shopOrder);
//   const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
//   const [isPaymentStart, setIsPaymemntStart] = useState(false);
//   const dispatch = useDispatch();
//   const { toast } = useToast();

//   console.log(currentSelectedAddress, "cartItems");

//   const totalCartAmount =
//     cartItems && cartItems.items && cartItems.items.length > 0
//       ? cartItems.items.reduce(
//           (sum, currentItem) =>
//             sum +
//             (currentItem?.salePrice > 0
//               ? currentItem?.salePrice
//               : currentItem?.price) *
//               currentItem?.quantity,
//           0
//         )
//       : 0;

//   function handleInitiatePaypalPayment() {
//     if (cartItems.length === 0) {
//       toast({
//         title: "Your cart is empty. Please add items to proceed",
//         variant: "destructive",
//       });

//       return;
//     }
//     if (currentSelectedAddress === null) {
//       toast({
//         title: "Please select one address to proceed.",
//         variant: "destructive",
//       });

//       return;
//     }

//     const orderData = {
//       userId: user?.id,
//       cartId: cartItems?._id,
//       cartItems: cartItems.items.map((singleCartItem) => ({
//         productId: singleCartItem?.productId,
//         title: singleCartItem?.title,
//         image: singleCartItem?.image,
//         price:
//           singleCartItem?.salePrice > 0
//             ? singleCartItem?.salePrice
//             : singleCartItem?.price,
//         quantity: singleCartItem?.quantity,
//       })),
//       addressInfo: {
//         addressId: currentSelectedAddress?._id,
//         address: currentSelectedAddress?.address,
//         city: currentSelectedAddress?.city,
//         pincode: currentSelectedAddress?.pincode,
//         phone: currentSelectedAddress?.phone,
//         notes: currentSelectedAddress?.notes,
//       },
//       orderStatus: "pending",
//       paymentMethod: "paypal",
//       paymentStatus: "pending",
//       totalAmount: totalCartAmount,
//       orderDate: new Date(),
//       orderUpdateDate: new Date(),
//       paymentId: "",
//       payerId: "",
//     };

//     dispatch(createNewOrder(orderData)).then((data) => {
//       console.log(data, "sangam");
//       if (data?.payload?.success) {
//         setIsPaymemntStart(true);
//       } else {
//         setIsPaymemntStart(false);
//       }
//     });
//   }

//   if (approvalURL) {
//     window.location.href = approvalURL;
//   }

//   return (
//     <div className="flex flex-col">
//       <div className="relative h-[300px] w-full overflow-hidden">
//         <img src={img} className="h-full w-full object-cover object-center" />
//       </div>
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
//         <Address
//           selectedId={currentSelectedAddress}
//           setCurrentSelectedAddress={setCurrentSelectedAddress}
//         />
//         <div className="flex flex-col gap-4">
//           {cartItems && cartItems.items && cartItems.items.length > 0
//             ? cartItems.items.map((item) => (
//                 <UserCartItemsContent cartItem={item} />
//               ))
//             : null}
//           <div className="mt-8 space-y-4">
//             <div className="flex justify-between">
//               <span className="font-bold">Total</span>
//               <span className="font-bold">${totalCartAmount}</span>
//             </div>
//           </div>
//           <div className="mt-4 w-full">
//             <Button onClick={handleInitiatePaypalPayment} className="w-full">
//               {isPaymentStart
//                 ? "Processing Paypal Payment..."
//                 : "Checkout with Paypal"}
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ShoppingCheckout;
import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createNewOrder, capturePayment } from "@/store/shop/order-slice";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input"; // Added
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Added
import { Label } from "@/components/ui/label"; // Added
import { applyCoupon } from "@/store/shop/coupon-slice";
import AuthRequiredPanel from "@/components/auth/AuthRequiredPanel";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymentStart] = useState(false);
  
  // --- ADDED FOR DISCOUNTS & COD ---
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalCartAmount =
    cartItems && cartItems.items && cartItems.items.length > 0
      ? cartItems.items.reduce(
          (sum, currentItem) =>
            sum +
            (currentItem?.salePrice > 0
              ? currentItem?.salePrice
              : currentItem?.price) *
              currentItem?.quantity,
          0
        )
      : 0;

  // Final amount calculation
  const finalTotalAmount = totalCartAmount - appliedDiscount;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  async function handleInitiatePayment() {
    if (!user?.id) {
      toast({ title: "Please login to place an order.", variant: "destructive" });
      return;
    }

    if (!cartItems?.items?.length) {
      toast({ title: "Your cart is empty.", variant: "destructive" });
      return;
    }
    if (currentSelectedAddress === null) {
      toast({ title: "Please select an address.", variant: "destructive" });
      return;
    }

    setIsPaymentStart(true);

    const orderData = {
      userId: user?.id,
      cartId: cartItems?._id,
      cartItems: cartItems.items.map((singleCartItem) => ({
        productId: singleCartItem?.productId,
        title: singleCartItem?.title,
        image: singleCartItem?.image,
        price: singleCartItem?.salePrice > 0 ? singleCartItem?.salePrice : singleCartItem?.price,
        quantity: singleCartItem?.quantity,
      })),
      addressInfo: {
        addressId: currentSelectedAddress?._id,
        address: currentSelectedAddress?.address,
        city: currentSelectedAddress?.city,
        state: currentSelectedAddress?.state, // Added State support
        pincode: currentSelectedAddress?.pincode,
        phone: currentSelectedAddress?.phone,
        notes: currentSelectedAddress?.notes,
      },
      orderStatus: paymentMethod === "cod" ? "confirmed" : "pending",
      paymentMethod: paymentMethod,
      paymentStatus: "pending",
      totalAmount: finalTotalAmount,
      discountAmount: appliedDiscount, // Added
      couponCode: couponCode, // Added
      orderDate: new Date(),
      orderUpdateDate: new Date(),
    };

    // Handle Order Creation
    dispatch(createNewOrder(orderData)).then(async (data) => {
      if (data?.payload?.success) {
        
        // --- ADDED: COD REDIRECT ---
        if (paymentMethod === "cod") {
          navigate("/shop/payment-success");
          return;
        }

        // --- RAZORPAY FLOW ---
        const res = await loadRazorpayScript();
        if (!res) {
          toast({ title: "Razorpay SDK failed.", variant: "destructive" });
          setIsPaymentStart(false);
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.payload.amount,
          currency: data.payload.currency,
          name: "Panjab Sports Club",
          description: "Payment for your order",
          order_id: data.payload.razorpayOrderId,
          handler: async function (response) {
            const capturePayload = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: data.payload.orderId,
            };

            dispatch(capturePayment(capturePayload)).then((resData) => {
              if (resData?.payload?.success) {
                navigate("/shop/payment-success");
              }
            });
          },
          prefill: { name: user?.userName, email: user?.email },
          theme: { color: "#3399cc" },
          modal: { ondismiss: () => setIsPaymentStart(false) },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setIsPaymentStart(false);
        toast({ title: "Failed to create order.", variant: "destructive" });
      }
    });
  }

  if (!user?.id) {
    return (
      <AuthRequiredPanel
        title="Login to checkout"
        description="Sign in to use saved addresses, apply coupons, and place your order securely."
        redirectTo="/shop/checkout"
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col">
      <div className="relative h-44 w-full overflow-hidden sm:h-64 md:h-[300px]">
        <img src={img} className="h-full w-full object-cover object-center" />
      </div>
      <div className="grid grid-cols-1 gap-4 p-3 sm:mt-5 sm:gap-5 sm:p-5 lg:grid-cols-[1fr_minmax(320px,0.9fr)]">
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />
        <div className="flex min-w-0 flex-col gap-4">
          {cartItems?.items?.map((item) => (
            <UserCartItemsContent key={item.productId} cartItem={item} />
          ))}
          
          <div className="mt-8 space-y-4 border-t pt-4">
            {/* --- ADDED: COUPON SECTION --- */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input 
                placeholder="Enter Coupon Code" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <Button variant="outline" onClick={() => {
                dispatch(applyCoupon({
                  code: couponCode,
                  userId: user?.id,
                  cartTotal: totalCartAmount,
                })).then((data) => {
                  if (data?.payload?.success) {
                    setAppliedDiscount(data.payload.data.discountAmount);
                    toast({ title: "Coupon applied" });
                  } else {
                    setAppliedDiscount(0);
                    toast({ title: data?.payload || "Invalid Coupon", variant: "destructive" });
                  }
                });
              }}>Apply</Button>
            </div>

            {/* --- ADDED: PAYMENT METHOD SELECTION --- */}
            <div className="py-4">
              <Label className="font-bold mb-2 block">Payment Method</Label>
              <RadioGroup defaultValue="razorpay" onValueChange={(value) => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="razorpay" id="razorpay" />
                  <Label htmlFor="razorpay">Online Payment (Razorpay)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod">Cash on Delivery (COD)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-bold text-gray-600">Subtotal</span>
              <span>Rs.{totalCartAmount.toFixed(2)}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex flex-wrap justify-between gap-2 text-green-600">
                <span className="font-bold">Discount</span>
                <span>-Rs.{appliedDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex flex-wrap justify-between gap-2 border-t pt-2">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg">Rs.{finalTotalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 w-full">
            <Button
              onClick={handleInitiatePayment}
              className="w-full"
              disabled={isPaymentStart}
            >
              {isPaymentStart ? "Processing..." : paymentMethod === 'cod' ? "Place COD Order" : "Pay with Razorpay"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
