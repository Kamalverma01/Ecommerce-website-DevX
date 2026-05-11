import { useEffect, useState } from "react";
import axios from "axios";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

const API_BASE = "http://localhost:5000/api/admin/seller";

function AdminSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");
  const { toast } = useToast();

  async function fetchSellers() {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/applications`, {
        withCredentials: true,
      });
      setSellers(response.data?.data || []);
    } catch (error) {
      toast({
        title: error.response?.data?.message || "Unable to load sellers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateSellerStatus(id, status) {
    setActionId(id);
    try {
      const response = await axios.put(
        `${API_BASE}/${id}/${status}`,
        {},
        { withCredentials: true }
      );
      toast({ title: response.data?.message || `Seller ${status}d` });
      fetchSellers();
    } catch (error) {
      toast({
        title: error.response?.data?.message || `Unable to ${status} seller`,
        variant: "destructive",
      });
    } finally {
      setActionId("");
    }
  }

  useEffect(() => {
    fetchSellers();
  }, []);

  return (
    <div className="min-w-0 rounded-lg border bg-background">
      <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">Seller Applications</h2>
          <p className="text-sm text-muted-foreground">
            Review, approve, and reject marketplace sellers
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchSellers} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="sr-only">Refresh sellers</span>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sellers.length ? (
            sellers.map((seller) => (
              <TableRow key={seller._id}>
                <TableCell>
                  <div className="max-w-xs break-words font-medium">{seller.businessName}</div>
                  <div className="text-xs text-muted-foreground">
                    {seller.businessType || "Business type not set"}
                  </div>
                  <div className="max-w-xs truncate text-xs text-muted-foreground">
                    {seller.address}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="break-words">{seller.userId?.userName || "User"}</div>
                  <div className="break-all text-xs text-muted-foreground">{seller.userId?.email}</div>
                  {seller.supportEmail ? (
                    <div className="break-all text-xs text-muted-foreground">{seller.supportEmail}</div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <div>{seller.phone}</div>
                  {seller.pickupPincode ? (
                    <div className="text-xs text-muted-foreground">Pickup {seller.pickupPincode}</div>
                  ) : null}
                  {seller.gstNumber ? (
                    <div className="text-xs text-muted-foreground">GST {seller.gstNumber}</div>
                  ) : null}
                </TableCell>
                <TableCell className="capitalize">{seller.status}</TableCell>
                <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateSellerStatus(seller._id, "approve")}
                      disabled={seller.status === "approved" || actionId === seller._id}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateSellerStatus(seller._id, "reject")}
                      disabled={seller.status === "rejected" || actionId === seller._id}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                No seller applications found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default AdminSellers;
