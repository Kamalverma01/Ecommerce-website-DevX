import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFinancialSummary,
  fetchRevenueBreakdown,
  updateCommissionSetting,
} from "../../store/admin/financial-slice";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const FinancialDashboard = () => {
  const dispatch = useDispatch();
  const { summary, revenueBreakdown } = useSelector(
    (state) => state.adminFinancial
  );
  const [commissionInput, setCommissionInput] = useState("");
  const [groupBy, setGroupBy] = useState("daily");

  useEffect(() => {
    dispatch(fetchFinancialSummary());
    dispatch(fetchRevenueBreakdown({ groupBy }));
  }, [dispatch, groupBy]);

  const handleCommissionUpdate = async () => {
    if (commissionInput && !isNaN(commissionInput)) {
      await dispatch(updateCommissionSetting(parseFloat(commissionInput)));
      setCommissionInput("");
    }
  };

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Financial Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{summary?.data?.totalRevenue?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-gray-500 mt-1">From paid orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₹{summary?.data?.totalCommissionEarned?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Platform earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Seller Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₹{summary?.data?.totalSellerEarnings?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total seller payouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₹{summary?.data?.pendingPayoutAmount?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary?.data?.pendingPayoutCount || 0} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Current Global Commission: {summary?.data?.globalCommission}%
              </label>
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionInput}
                  onChange={(e) => setCommissionInput(e.target.value)}
                  placeholder="Enter new commission %"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={handleCommissionUpdate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Revenue Breakdown</CardTitle>
            <div className="flex gap-2">
              {["daily", "monthly"].map((option) => (
                <Button
                  key={option}
                  onClick={() => setGroupBy(option)}
                  variant={groupBy === option ? "default" : "outline"}
                  className="text-sm"
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {revenueBreakdown?.loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-right">Revenue</th>
                    <th className="px-4 py-2 text-right">Orders</th>
                    <th className="px-4 py-2 text-right">Avg Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueBreakdown?.data?.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{item._id}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        ₹{item.totalRevenue?.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">{item.orderCount}</td>
                      <td className="px-4 py-2 text-right">
                        ₹{item.avgOrderValue?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;
