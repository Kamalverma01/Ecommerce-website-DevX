import { Button } from "../ui/button";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Label } from "../ui/label";

function AddressCard({
  addressInfo,
  handleDeleteAddress,
  handleEditAddress,
  setCurrentSelectedAddress,
  selectedId,
}) {
  return (
    <Card
      onClick={
        setCurrentSelectedAddress
          ? () => setCurrentSelectedAddress(addressInfo)
          : null
      }
      className={`cursor-pointer transition-all ${
        selectedId?._id === addressInfo?._id
          ? "border-red-900 border-[4px] shadow-md"
          : "border-muted hover:border-gray-400"
      }`}
    >
      <CardContent className="grid p-4 gap-4">
        <div className="flex flex-col gap-1">
          <Label className="font-bold text-gray-700">Address:</Label>
          <span className="text-sm text-gray-600">{addressInfo?.address}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="font-bold">City:</Label>
            <span className="text-sm block">{addressInfo?.city}</span>
          </div>
          <div>
            <Label className="font-bold">State:</Label>
            <span className="text-sm block">{addressInfo?.state}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="font-bold">Pincode:</Label>
            <span className="text-sm block">{addressInfo?.pincode}</span>
          </div>
          <div>
            <Label className="font-bold">Phone:</Label>
            <span className="text-sm block">{addressInfo?.phone}</span>
          </div>
        </div>

        {/* Corrected Conditional Rendering for Notes */}
        {addressInfo?.notes ? (
          <div>
            <Label className="font-bold">Notes:</Label>
            <span className="text-sm block text-gray-500 italic">
              {addressInfo?.notes}
            </span>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="p-3 flex justify-between bg-gray-50/50">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEditAddress(addressInfo);
          }}
        >
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteAddress(addressInfo);
          }}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AddressCard;