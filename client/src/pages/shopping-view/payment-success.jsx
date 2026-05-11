import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <Card className="w-full max-w-md border-none shadow-none bg-transparent">
        <CardContent className="flex flex-col items-center text-center p-6">
          {/* Success Animated Icon */}
          <div className="mb-6 bg-green-100 p-4 rounded-full animate-bounce">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          
          <p className="text-gray-500 mb-8">
            Thank you for shopping with Panjab Sports Club. Your gear is being prepared for shipment.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3 w-full">
            <Button 
              className="w-full h-12 text-lg bg-red-900 hover:bg-red-800"
              onClick={() => navigate("/shop/account")}
            >
              <ShoppingBag className="mr-2 h-5 w-5" /> View My Orders
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-12 text-lg border-gray-300"
              onClick={() => navigate("/shop/listing")}
            >
              Continue Shopping <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Order Support Info */}
          <p className="mt-8 text-xs text-gray-400">
            A confirmation email has been sent to your registered address.
            <br /> Need help? Contact our support team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentSuccessPage;