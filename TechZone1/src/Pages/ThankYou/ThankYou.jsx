import React, { useState, useEffect } from "react";
import { Check, Clock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { API_URL } from "../../config";


export default function ThankYou() {
  const [showHistory, setShowHistory] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null); // New error state
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

  // Get order details from location.state (passed from Checkout)
  const paymentMethod = location.state?.paymentMethod || "Unknown";
  const orderId = location.state?.orderId || "Pending ID";
  const total = location.state?.total || 0;
  const items = location.state?.items || [];

  // Fetch order history when showHistory is toggled
  useEffect(() => {
    if (showHistory && isAuthenticated && user) {
      const fetchOrders = async () => {
        try {
          const token = await getAccessTokenSilently({
            audience: "https://ecommerce-api",
            scope: "read:current_user",
          });
          const response = await fetch(`${API_URL}/orders/${user.sub}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch orders: ${response.status}`);
          }

          const data = await response.json();
          setOrders(data); // Use backend data directly (already grouped)
          setError(null);
        } catch (error) {
          console.error("Error fetching orders:", error);
          setOrders([]);
          setError("Failed to load order history. Please try again.");
        }
      };

      fetchOrders();
    }
  }, [showHistory, isAuthenticated, user, getAccessTokenSilently]);

  // Use location.state for the latest order details
  const orderDetails = {
    orderId,
    date: new Date().toLocaleString(), // Current time as fallback
    total,
    status: "Processing", // Default status for new COD orders
    items,
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/"); // Redirect to home or login page
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <div>Redirecting...</div>;
  }

  return (
    <section className="py-5 px-4 md:px-8 lg:px-16 bg-gray-50">
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-slate-800 h-48 flex items-center justify-center rounded-t-xl">
          <h3 className="text-4xl md:text-5xl font-bold text-white">Thank You!</h3>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-b-xl border border-gray-100">
          <div className="text-center mb-8">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-semibold mb-2">Order Confirmed</h2>
            <p className="text-gray-600">
              Order #{orderDetails.orderId} ({items.length} item{items.length !== 1 ? "s" : ""})
            </p>
            <p className="text-gray-600 mb-2">Payment Method: {paymentMethod}</p>
            <p className="text-gray-600 mb-6">
              We'll send you shipping confirmation when your order ships.
            </p>

            {/* Order Summary */}
            <div className="text-left mb-6">
              <h4 className="text-lg font-medium text-gray-800 mb-2">Order Summary</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Date:</span> {orderDetails.date}
                </p>
                <p>
                  <span className="font-medium">Total:</span> {formatPrice(orderDetails.total)}
                </p>
                <p>
                  <span className="font-medium">Items ({items.length}):</span>
                </p>
                <ul className="list-disc pl-5">
                  {items.map((item) => (
                    <li key={item.id || Math.random()}>
                      {item.name} (x{item.quantity}) - {formatPrice(item.price * item.quantity)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-all duration-200"
            >
              {showHistory ? "Hide Order History" : "View Order History"}
            </button>
          </div>

          {showHistory && (
            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Order History</h3>
              {error && (
                <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 mb-4">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center">No order history available yet</p>
                ) : (
                  orders.map((order) => (
                    <div key={order.order_id} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            Order #{order.order_id} ({order.items.length} item{order.items.length !== 1 ? "s" : ""})
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {order.total_price.toLocaleString()} EGP
                          </p>
                          <p className="text-sm">
                            <span
                              className={`inline-flex items-center gap-1 ${order.status === "Delivered" ? "text-green-600" : "text-blue-600"
                                }`}
                            >
                              {order.status === "Delivered" ? (
                                <Check size={14} />
                              ) : (
                                <Clock size={14} />
                              )}
                              {order.status}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Items:</span>
                        </p>
                        <ul className="list-disc pl-5">
                          {order.items.map((item) => (
                            <li key={item.order_item_id}>
                              Product #{item.product_id} (x{item.quantity}) - {formatPrice(item.total_price)}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1">
                          Payment: {order.payment_method} ({order.amount ? `${formatPrice(order.amount)}` : "Pending"})
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => navigate("/shop")}
              className="bg-gray-900 hover:bg-gray-800 text-white py-2 px-6 rounded-lg transition-all duration-200"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatPrice(price) {
  return `${price.toLocaleString()} EGP`;
}