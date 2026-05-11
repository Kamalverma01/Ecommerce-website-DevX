import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSellerCommissions,
  markPayoutAsPaid,
} from "../../store/admin/financial-slice";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const SellerCommissionView = () => {
  const dispatch = useDispatch();
  const { sellerCommissions } = useSelector((state) => state.adminFinancial);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("commission");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    dispatch(
      fetchSellerCommissions({
        page,
        limit,
        sortBy,
        search,
      })
    );
  }, [dispatch, page, limit, sortBy, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleMarkAsPaid = (sellerId) => {
    dispatch(markPayoutAsPaid(sellerId)).then(() => {
      dispatch(
        fetchSellerCommissions({
          page,
          limit,
          sortBy,
          search,
        })
      );
    });
  };

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Seller Commission Management</h1>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Search Sellers</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by business name or email..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Search
            </Button>
            {search && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Sorting Options */}
      <div className="mb-6 flex gap-2">
        <Button
          onClick={() => {
            setSortBy("commission");
            setPage(1);
          }}
          variant={sortBy === "commission" ? "default" : "outline"}
        >
          Sort by Commission
        </Button>
        <Button
          onClick={() => {
            setSortBy("orders");
            setPage(1);
          }}
          variant={sortBy === "orders" ? "default" : "outline"}
        >
          Sort by Orders
        </Button>
      </div>

      {/* Sellers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Seller Commission Details</CardTitle>
        </CardHeader>
        <CardContent>
          {sellerCommissions?.loading ? (
            <div className="text-center py-8">Loading sellers...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Business Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Seller</th>
                      <th className="px-4 py-3 text-right font-semibold">Orders</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Total Earnings
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Paid Payouts
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Pending Payouts
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerCommissions?.data?.length > 0 ? (
                      sellerCommissions.data.map((seller) => (
                        <tr
                          key={seller.sellerId}
                          className="border-b hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-3 font-medium">
                            {seller.businessName}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{seller.sellerName}</p>
                              <p className="text-xs text-gray-500">{seller.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">{seller.totalOrders}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-600">
                            ₹{seller.totalEarnings?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-blue-600">
                            ₹{seller.paidPayouts?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-orange-600">
                            ₹{seller.pendingPayouts?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {seller.pendingPayouts > 0 ? (
                              <Button
                                onClick={() => handleMarkAsPaid(seller.sellerId)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Pay Now
                              </Button>
                            ) : (
                              <span className="text-green-600 text-sm font-medium">
                                Paid ✓
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-500">
                          No sellers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, sellerCommissions?.pagination?.totalRecords)} of{" "}
                  {sellerCommissions?.pagination?.totalRecords} sellers
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-2">
                    Page {page} of {sellerCommissions?.pagination?.totalPages}
                  </span>
                  <Button
                    onClick={() =>
                      setPage(
                        Math.min(
                          page + 1,
                          sellerCommissions?.pagination?.totalPages
                        )
                      )
                    }
                    disabled={
                      page === sellerCommissions?.pagination?.totalPages
                    }
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerCommissionView;
