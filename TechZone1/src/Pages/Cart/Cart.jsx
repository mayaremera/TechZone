import React from "react";
import { X, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../Components/CartContext/CartContext";

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, setIsCartOpen } = useCart();

  // Log cartItems for debugging
  console.log("Cart items:", cartItems);

  // Calculate order summary with fallback for undefined prices
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const shipping = 35.0;
  const tax = subtotal * 0.14; // Egypt's VAT rate
  const total = subtotal + shipping + tax;

  const formatPrice = (price) => `${(price || 0).toLocaleString()} EGP`;

  // Handle quantity change with validation
  const handleQuantityChange = (itemId, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);
    if (!isNaN(quantity) && quantity >= 1) {
      updateQuantity(itemId, quantity);
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <section className="py-5 px-4 md:px-8 lg:px-16 bg-gray-50">
      <div>
        {/* New premium header design */}
        <div className="max-w-7xl mx-auto mb-12 pt-12">
          <div className="flex flex-col items-start">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-1 bg-indigo-600 rounded"></div>
              <span className="text-indigo-600 font-medium uppercase tracking-wider text-sm">Shopping Cart</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">Your Items</h1>
            <p className="text-gray-500 mt-4 max-w-2xl">
              Review your items below before proceeding to checkout. Shipping will be calculated based on your delivery address.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                      <ShoppingBag size={32} className="text-indigo-600" />
                    </div>
                    <p className="text-xl text-gray-600 mb-2">Your cart is empty</p>
                    <p className="text-gray-400 mb-6">Looks like you haven't added any items yet.</p>
                    <button
                      onClick={() => navigate("/shop")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Browse Products
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-6 text-gray-500 font-medium">Product</div>
                        <div className="col-span-2 text-gray-500 font-medium text-center">Price</div>
                        <div className="col-span-2 text-gray-500 font-medium text-center">Quantity</div>
                        <div className="col-span-2 text-gray-500 font-medium text-right">Total</div>
                      </div>
                    </div>

                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-6 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-6">
                            <div className="flex items-center space-x-4">
                              <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                <img
                                  src={item.image && item.image !== "" ? item.image : "https://placehold.co/80x80"}
                                  alt={item.name}
                                  className="w-16 h-16 object-contain"
                                  onError={(e) => {
                                    console.error(`Failed to load image for ${item.name}: ${item.image}`);
                                    e.target.src = "https://placehold.co/80x80";
                                  }}
                                />
                              </div>
                              <div>
                                <h3 className="text-base font-medium text-gray-800">{item.name || "Unnamed Product"}</h3>
                              </div>
                            </div>
                          </div>

                          <div className="col-span-2 text-center font-medium text-gray-800">
                            {formatPrice(item.price)}
                          </div>

                          <div className="col-span-2 flex justify-center">
                            <div className="relative">
                              <select
                                value={item.quantity || 1}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                className="appearance-none bg-white border border-gray-200 rounded-lg py-1 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                  <option key={num} value={num}>
                                    {num}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg
                                  className="fill-current h-4 w-4"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="col-span-2 text-right font-medium text-indigo-700">
                            {formatPrice((item.price || 0) * (item.quantity || 1))}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="ml-3 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="lg:col-span-4">
              <div className="border border-gray-100 bg-white shadow-sm p-8 rounded-xl sticky top-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-8">Order Summary</h2>
                <div className="space-y-5">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping estimate</span>
                    <span className="font-medium">{formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax estimate (14%)</span>
                    <span className="font-medium">{formatPrice(tax)}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-5 mt-5">
                    <div className="flex justify-between font-semibold">
                      <span className="text-xl text-gray-800">Order total</span>
                      <span className="text-xl text-indigo-700">{formatPrice(total)}</span>
                    </div>
                  </div>
                  {cartItems.length > 0 && (
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-4 px-6 rounded-lg mt-8 font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Proceed to Checkout
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/shop")}
                    className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 py-4 px-6 rounded-lg mt-3 font-medium transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}