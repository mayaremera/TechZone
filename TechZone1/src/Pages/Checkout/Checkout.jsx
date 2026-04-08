import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../Components/CartContext/CartContext";
import {
  ShoppingBag,
  CreditCard,
  Truck,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const API_URL = "http://localhost:8080";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, setIsCartOpen, clearCart } = useCart();
  const { user, isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const token = await getAccessTokenSilently({
          audience: "https://ecommerce-api",
          scope: "read:current_user",
        });
        const response = await axios.get(`${API_URL}/addresses/${user.sub}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedAddresses(response.data || []);
        if (response.data.length > 0) {
          setSelectedAddressId(response.data[0].address_id.toString());
          handleSelectSavedAddress(response.data[0].address_id.toString());
        }
      } catch (error) {
        console.error("Error fetching saved addresses:", error);
        setSavedAddresses([]);
      }
    };
    fetchSavedAddresses();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        firstName: user.given_name || "",
        lastName: user.family_name || "",
      }));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect();
    }
  }, [isAuthenticated, loginWithRedirect]);

  const subtotal = cartItems.reduce((sum, item) => {
    const price =
      typeof item.price === "string"
        ? parseFloat(item.price.replace(/,/g, "").replace(" EGP", ""))
        : item.price || 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  const shipping = 35.0;
  const tax = subtotal * 0.14;
  const total = subtotal + shipping + tax;

  const formatPrice = (price) => `${price.toLocaleString()} EGP`;

  const getItemImage = (item) => {
    // Try different possible image fields
    return (
      item.image_url ||
      item.image ||
      (item.images && item.images.length > 0 ? item.images[0] : null) ||
      "https://via.placeholder.com/80"
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectSavedAddress = (addressId) => {
    const selected = savedAddresses.find((addr) => addr.address_id.toString() === addressId);
    if (selected) {
      setSelectedAddressId(addressId);
      setFormData((prev) => ({
        ...prev,
        address: selected.full_address,
        apartment: "",
        city: selected.city,
        state: "",
        zip: selected.postal_code,
        country: selected.country,
      }));
    }
  };

  const handleUseSavedAddressToggle = () => {
    setUseSavedAddress((prev) => {
      if (prev) {
        setFormData((prevData) => ({
          ...prevData,
          address: "",
          apartment: "",
          city: "",
          state: "",
          zip: "",
          country: "",
        }));
        return false;
      } else {
        if (savedAddresses.length > 0) {
          const defaultAddressId = selectedAddressId || savedAddresses[0].address_id.toString();
          handleSelectSavedAddress(defaultAddressId);
        }
        return true;
      }
    });
  };

  const storeOrder = async () => {
    if (!isAuthenticated || !user) return;

    setError(null);
    setIsLoading(true);

    try {
      const token = await getAccessTokenSilently({
        audience: "https://ecommerce-api",
        scope: "read:current_user",
      });

      const address = useSavedAddress && selectedAddressId
        ? { address_id: parseInt(selectedAddressId) }
        : {
            address: `${formData.address}${formData.apartment ? ", " + formData.apartment : ""}, ${formData.city}, ${formData.zip}, ${formData.country}`,
          };

      const order = {
        items: cartItems.map((item) => ({
          id: item.id || item.product_id || 0,
          name: item.name || "Unknown Item",
          price:
            typeof item.price === "string"
              ? parseFloat(item.price.replace(/,/g, "").replace(" EGP", ""))
              : item.price || 0,
          quantity: item.quantity || 1,
          image: getItemImage(item), // Include image in the order payload
        })),
        paymentMethod,
        address,
        subtotal,
        shipping,
        tax,
        total,
        ...(paymentMethod === "card" && { cardDetails: null }),
      };

      console.log("Sending order:", order);

      const response = await fetch(`${API_URL}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(order),
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error("Checkout failed:", response.status, responseText);
        let errorMessage = `Checkout failed with status ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = responseText || "Unknown error occurred";
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      console.log("Checkout response:", data);

      setSuccessMessage(`Order #${data.order_id} placed successfully! Redirecting...`);
      clearCart();
      setIsCartOpen(false);

      setTimeout(() => {
        navigate("/thankyou", {
          state: {
            paymentMethod: paymentMethod === "cod" ? "Cash on Delivery" : "Card",
            orderId: data.order_id,
            total: data.total,
            items: data.items,
          }
        });
      }, 1500);
    } catch (error) {
      console.error("Checkout error:", error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!formData.email || !formData.phone || (!useSavedAddress && (!formData.address || !formData.city || !formData.zip || !formData.country))) {
      setError("Please fill in all required fields (email, phone, and shipping address).");
      return;
    }
    if (paymentMethod === "card") {
      setError("Card payments are not yet supported. Please select Cash on Delivery.");
      return;
    }
    setCurrentStep(3);
    storeOrder();
  };

  if (!isAuthenticated) {
    return <div className="text-center py-10">Redirecting to login...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="py-5 px-4 md:px-8 lg:px-16 bg-gray-50 text-center">
        <div className="max-w-7xl mx-auto pt-16 pb-32">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag size={40} className="text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 max-w-md mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <button
              onClick={() => navigate("/shop")}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-3 px-8 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-5 px-4 md:px-8 lg:px-16 bg-gray-50">
      <div className="max-w-7xl mx-auto mb-12 pt-12">
        <div className="flex flex-col items-start">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-1 bg-indigo-600 rounded"></div>
            <span className="text-indigo-600 font-medium uppercase tracking-wider text-sm">
              Secure Checkout
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Complete Your Order
          </h1>
          <p className="text-gray-500 mt-4 max-w-2xl">
            Please fill in your details to complete your purchase of {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-8 mb-6 md:mb-0">
            <div className={`flex items-center ${currentStep >= 1 ? "text-indigo-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${currentStep >= 1 ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}>
                <ShoppingBag size={16} />
              </div>
              <span className={`font-medium ${currentStep >= 1 ? "text-gray-800" : "text-gray-400"}`}>Cart</span>
            </div>
            <div className="w-8 h-px bg-gray-200 hidden md:block"></div>
            <div className={`flex items-center ${currentStep >= 2 ? "text-indigo-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${currentStep >= 2 ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}>
                <Truck size={16} />
              </div>
              <span className={`font-medium ${currentStep >= 2 ? "text-gray-800" : "text-gray-400"}`}>Shipping</span>
            </div>
            <div className="w-8 h-px bg-gray-200 hidden md:block"></div>
            <div className={`flex items-center ${currentStep >= 3 ? "text-indigo-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${currentStep >= 3 ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}>
                <CreditCard size={16} />
              </div>
              <span className={`font-medium ${currentStep >= 3 ? "text-gray-800" : "text-gray-400"}`}>Payment</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-indigo-600">{cartItems.length}</span> item{cartItems.length !== 1 ? "s" : ""} in your cart
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-gray-100 bg-white shadow-sm p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <ShoppingBag size={20} className="text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-800">Order Items</h2>
              </div>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id || item.product_id || Math.random()}
                    className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <img
                        src={getItemImage(item)}
                        alt={item.name || "Item"}
                        className="w-20 h-20 object-contain rounded-md"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/80")}
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-base font-medium text-gray-800">{item.name || "Unknown Item"}</h3>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity || 1}</p>
                      <p className="text-indigo-700 font-semibold mt-1">
                        {typeof item.price === "string" ? item.price : formatPrice(item.price || 0)}
                      </p>
                    </div>
                    <div className="text-right font-medium text-gray-800">
                      {typeof item.price === "string"
                        ? `${(parseFloat(item.price.replace(/,/g, "").replace(" EGP", "")) * (item.quantity || 1)).toLocaleString()} EGP`
                        : formatPrice((item.price || 0) * (item.quantity || 1))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-gray-100 bg-white shadow-sm p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <Phone size={20} className="text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-800">Contact Information</h2>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email address"
                    className="block w-full pl-10 border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Phone size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="block w-full pl-10 border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="border border-gray-100 bg-white shadow-sm p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <MapPin size={20} className="text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-800">Shipping Address</h2>
              </div>
              {savedAddresses.length > 0 && (
                <div className="mb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={useSavedAddress}
                      onChange={handleUseSavedAddressToggle}
                      className="form-checkbox h-5 w-5 text-indigo-600"
                    />
                    <span>Use a saved address</span>
                  </label>
                </div>
              )}
              {useSavedAddress && savedAddresses.length > 0 ? (
                <div className="space-y-4">
                  <select
                    value={selectedAddressId}
                    onChange={(e) => handleSelectSavedAddress(e.target.value)}
                    className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    {savedAddresses.map((address) => (
                      <option key={address.address_id} value={address.address_id.toString()}>
                        {address.full_address}, {address.city}, {address.postal_code} {address.country}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First Name"
                      className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last Name"
                      className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Address"
                      className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required={!useSavedAddress}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleInputChange}
                      placeholder="Apartment, suite, etc."
                      className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required={!useSavedAddress}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State/Province"
                      className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required={!useSavedAddress}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      placeholder="ZIP/Postal Code"
                      className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required={!useSavedAddress}
                    />
                  </div>
                  <div>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      required={!useSavedAddress}
                    >
                      <option value="" disabled>Select Country</option>
                      <option value="Egypt">Egypt</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="border border-gray-100 bg-white shadow-sm p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <CreditCard size={20} className="text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-800">Payment Method</h2>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    disabled
                    className={`flex-1 py-3 px-4 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${paymentMethod === "card"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    <CreditCard size={18} />
                    <span>Credit/Debit Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex-1 py-3 px-4 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${paymentMethod === "cod"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <Truck size={18} />
                    <span>Cash on Delivery</span>
                  </button>
                </div>
                {paymentMethod === "card" && (
                  <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-100 mb-4">
                    <p className="text-sm">
                      Card payments are not yet available. Please select Cash on Delivery or stay tuned for Paymob integration!
                    </p>
                  </div>
                )}
                {paymentMethod === "cod" && (
                  <div>
                    <div className="p-4 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-100 mb-4">
                      <p className="text-sm">You will pay {formatPrice(total)} with cash upon delivery.</p>
                    </div>
                    <button
                      onClick={handleCheckout}
                      disabled={isLoading}
                      className={`w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 px-6 rounded-lg font-medium transition-all duration-200 shadow-md ${isLoading
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:from-blue-700 hover:to-indigo-800 hover:shadow-lg"
                        }`}
                    >
                      {isLoading ? "Processing..." : "Place Order (Cash on Delivery)"}
                    </button>
                  </div>
                )}
                {successMessage && (
                  <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-100 mb-4">
                    <p className="text-sm">{successMessage}</p>
                  </div>
                )}
                {error && (
                  <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 mb-4">
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="border border-gray-100 bg-white shadow-sm p-6 rounded-xl sticky top-4">
              <h2 className="text-xl font-semibold text-gray-800 pb-6 border-b border-gray-100">Order Summary</h2>
              <div className="py-6 space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-800">{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (14%)</span>
                  <span className="font-medium text-gray-800">{formatPrice(tax)}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total</span>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-indigo-700">{formatPrice(total)}</span>
                    <span className="text-xs text-gray-500">Including VAT</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Truck size={16} className="mr-2" />
                    Estimated delivery
                  </span>
                  <span className="font-medium text-gray-800">3-5 business days</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Order details</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Items ({cartItems.length})</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Additional fees</span>
                    <span className="font-medium">{formatPrice(shipping + tax)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/cart")}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg mt-6 font-medium transition-colors"
              >
                <ShoppingBag size={16} />
                <span>Back to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}