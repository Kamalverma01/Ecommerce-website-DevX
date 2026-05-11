import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFraudLogs,
  fetchFraudLogStats,
  updateFraudLogStatus,
} from "../../store/admin/financial-slice";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const FraudLogViewer = () => {
  const dispatch = useDispatch();
  const { fraudLogs, fraudStats } = useSelector((state) => state.adminFinancial);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [selectedFraud, setSelectedFraud] = useState(null);

  useEffect(() => {
    dispatch(fetchFraudLogs({ page, limit, status, sortBy }));
    dispatch(fetchFraudLogStats());
  }, [dispatch, page, limit, status, sortBy]);

  const handleStatusUpdate = async (fraudId, newStatus) => {
    await dispatch(updateFraudLogStatus({ id: fraudId, status: newStatus }));
    dispatch(fetchFraudLogs({ page, limit, status, sortBy }));
  };

  const getRiskScoreColor = (score) => {
    if (score >= 80) return "text-red-600 bg-red-50";
    if (score >= 60) return "text-orange-600 bg-orange-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "bg-red-100 text-red-800",
      under_review: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      false_positive: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Fraud Log Management</h1>

      {/* Fraud Statistics */}
      {fraudStats?.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fraudStats.data.totalFraudCases?.[0]?.total || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fraudStats.data.averageRiskScore?.[0]?.avgScore?.toFixed(1) ||
                  "0"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Open Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {fraudStats.data.byStatus?.find((s) => s._id === "open")
                  ?.count || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {fraudStats.data.byStatus?.find((s) => s._id === "resolved")
                  ?.count || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Sort Options */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Latest</option>
                <option value="riskScore">Risk Score</option>
              </select>
            </div>

            {(status || sortBy !== "createdAt") && (
              <Button
                onClick={() => {
                  setStatus("");
                  setSortBy("createdAt");
                  setPage(1);
                }}
                variant="outline"
                className="mt-6"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fraud Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fraud Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {fraudLogs?.loading ? (
            <div className="text-center py-8">Loading fraud logs...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Risk Type</th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Risk Score
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">User</th>
                      <th className="px-4 py-3 text-left font-semibold">Seller</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudLogs?.data?.length > 0 ? (
                      fraudLogs.data.map((fraud) => (
                        <tr
                          key={fraud._id}
                          className="border-b hover:bg-gray-50 transition cursor-pointer"
                          onClick={() => setSelectedFraud(fraud)}
                        >
                          <td className="px-4 py-3 font-medium">{fraud.riskType}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-3 py-1 rounded-full font-bold ${getRiskScoreColor(
                                fraud.riskScore
                              )}`}
                            >
                              {fraud.riskScore}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{fraud.userName}</p>
                              <p className="text-xs text-gray-500">
                                {fraud.userEmail}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{fraud.sellerName}</p>
                              <p className="text-xs text-gray-500">
                                {fraud.sellerEmail}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                fraud.status
                              )}`}
                            >
                              {fraud.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(fraud.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFraud(fraud);
                              }}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-500">
                          No fraud logs found
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
                  {Math.min(page * limit, fraudLogs?.pagination?.totalRecords)} of{" "}
                  {fraudLogs?.pagination?.totalRecords} fraud cases
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
                    Page {page} of {fraudLogs?.pagination?.totalPages}
                  </span>
                  <Button
                    onClick={() =>
                      setPage(Math.min(page + 1, fraudLogs?.pagination?.totalPages))
                    }
                    disabled={page === fraudLogs?.pagination?.totalPages}
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

      {/* Detail Modal */}
      {selectedFraud && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
            <CardHeader className="flex justify-between items-center border-b">
              <CardTitle>Fraud Case Details</CardTitle>
              <button
                onClick={() => setSelectedFraud(null)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Risk Type</label>
                  <p className="text-lg font-bold mt-1">{selectedFraud.riskType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Risk Score
                  </label>
                  <p className="text-lg font-bold mt-1">{selectedFraud.riskScore}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User</label>
                  <p className="mt-1">{selectedFraud.userName}</p>
                  <p className="text-sm text-gray-500">{selectedFraud.userEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Seller</label>
                  <p className="mt-1">{selectedFraud.sellerName}</p>
                  <p className="text-sm text-gray-500">{selectedFraud.sellerEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Order Amount
                  </label>
                  <p className="text-lg font-bold mt-1">
                    ₹{selectedFraud.orderAmount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        selectedFraud.status
                      )}`}
                    >
                      {selectedFraud.status.replace("_", " ")}
                    </span>
                  </p>
                </div>
              </div>

              {selectedFraud.metadata && Object.keys(selectedFraud.metadata).length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-600">
                    Additional Information
                  </label>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedFraud.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {selectedFraud.status !== "resolved" && (
                  <Button
                    onClick={() => {
                      handleStatusUpdate(selectedFraud._id, "resolved");
                      setSelectedFraud(null);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark as Resolved
                  </Button>
                )}
                {selectedFraud.status !== "under_review" && (
                  <Button
                    onClick={() => {
                      handleStatusUpdate(selectedFraud._id, "under_review");
                      setSelectedFraud(null);
                    }}
                    variant="outline"
                  >
                    Start Review
                  </Button>
                )}
                {selectedFraud.status !== "false_positive" && (
                  <Button
                    onClick={() => {
                      handleStatusUpdate(selectedFraud._id, "false_positive");
                      setSelectedFraud(null);
                    }}
                    variant="outline"
                  >
                    Mark as False Positive
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FraudLogViewer;
