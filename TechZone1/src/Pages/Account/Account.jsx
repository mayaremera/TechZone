import React, { useState, useEffect } from "react";
import {
  Heart,
  MapPin,
  Settings,
  ShoppingBag,
  Lock,
  Mail,
  LogOut,
  CreditCard,
  Edit,
  Menu,
  X,
  Truck,
  Trash2,
} from "lucide-react";
import { useCart } from "../../Components/CartContext/CartContext";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { API_URL } from "../../config";


export default function Account() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [emailForm, setEmailForm] = useState({ email: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);
  const { addToCart } = useCart();
  const { user, isAuthenticated, isLoading, logout, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  const tabs = [
    { id: "Dashboard", label: "Dashboard", icon: <ShoppingBag className="w-5 h-5" /> },
    { id: "favorites", label: "Favorites", icon: <Heart className="w-5 h-5" /> },
    { id: "orders", label: "Orders", icon: <ShoppingBag className="w-5 h-5" /> },
    { id: "addresses", label: "Saved Addresses & Cards", icon: <MapPin className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  const fetchUserData = async () => {
    if (!isAuthenticated || !user || isLoading) return;
    try {
      setLoadingWishlist(true);
      setLoadingOrders(true);
      setLoadingAddresses(true);
      setLoadingCards(true);
      const token = await getAccessTokenSilently({
        audience: "https://ecommerce-api",
        scope: "read:current_user update:current_user",
      });
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      };

      const [wishlistRes, ordersRes, addressesRes, cardsRes] = await Promise.all([
        axios.get(`${API_URL}/wishlist/${user.sub}`, config).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/orders/${user.sub}`, config).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/addresses/${user.sub}`, config).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/saved_credit_cards/${user.sub}`, config).catch(() => ({ data: [] })),
      ]);

      console.log("Wishlist API response:", wishlistRes.data);
      // Enhanced logging for wishlist items
      if (wishlistRes.data && wishlistRes.data.length > 0) {
        wishlistRes.data.forEach((item, index) => {
          console.log(`Wishlist item ${index}:`, {
            product_id: item.product_id,
            product_name: item.product_name,
            price: item.price,
            image_url: item.image_url,
          });
        });
      } else {
        console.log("Wishlist is empty or invalid:", wishlistRes.data);
      }
      setWishlist(wishlistRes.data || []);

      console.log("Orders API response:", ordersRes.data);
      setOrders(ordersRes.data || []);
      console.log("Addresses API response:", addressesRes.data);
      setAddresses(addressesRes.data || []);
      console.log("Cards API response:", cardsRes.data);
      setCards(
        cardsRes.data && cardsRes.data.length > 0
          ? cardsRes.data.map((card) => ({
            id: card.card_id,
            type: card.card_type,
            last4: card.card_number.slice(-4),
            expiry: card.expiry_date,
          }))
          : []
      );
      setError(null);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setWishlist([]);
      setOrders([]);
      setAddresses([]);
      setCards([]);
      setError(error.response?.data?.message || "Failed to load account data. Please try again.");
    } finally {
      setLoadingWishlist(false);
      setLoadingOrders(false);
      setLoadingAddresses(false);
      setLoadingCards(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [isAuthenticated, user, isLoading, getAccessTokenSilently]);

  const removeFromFavorites = async (productId) => {
    try {
      const token = await getAccessTokenSilently({
        audience: "https://ecommerce-api",
        scope: "read:current_user",
      });
      await axios.delete(`${API_URL}/wishlist/${user.sub}/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchUserData();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to remove item from favorites.");
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const token = await getAccessTokenSilently({
        audience: "https://ecommerce-api",
        scope: "read:current_user",
      });
      await axios.delete(`${API_URL}/orders/${user.sub}/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchUserData();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete order.");
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const token = await getAccessTokenSilently({
        audience: "https://ecommerce-api",
        scope: "read:current_user",
      });
      await axios.delete(`${API_URL}/addresses/${user.sub}/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchUserData();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete address.");
    }
  };

  const updateAddress = async (addressId, updatedAddress) => {
    try {
      const token = await getAccessTokenSilently({
        audience: "https://ecommerce-api",
        scope: "read:current_user",
      });
      await axios.put(
        `${API_URL}/addresses/${user.sub}/${addressId}`,
        updatedAddress,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchUserData();
      setEditingAddress(null);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update address.");
    }
  };

  const updateEmail = async () => {
    try {
      const token = await getAccessTokenSilently({
        audience: "https://ecommerce-api",
        scope: "update:current_user",
      });
      await axios.put(
        `${API_URL}/user/${user.sub}/email`,
        { email: emailForm.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingEmail(false);
      setEmailForm({ email: "" });
      await fetchUserData();
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update email.");
    }
  };

  const updatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        audience: "https://ecommerce-api",
        scope: "update:current_user",
      });
      await axios.put(
        `${API_URL}/user/${user.sub}/password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingPassword(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update password.");
    }
  };

  const handleAddToCart = (item) => {
    addToCart({
      id: item.product_id,
      name: item.product_name,
      price: item.price || 0,
      image: item.image_url && item.image_url !== "" ? item.image_url : "https://placehold.co/80x80",
      quantity: 1,
    });
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleEditAddress = (address) => {
    const [streetAddress, ...apartmentParts] = address.full_address.split(", ");
    const apartment = apartmentParts.length > 0 ? apartmentParts.join(", ") : "";
    setEditingAddress({
      address_id: address.address_id,
      address: streetAddress,
      apartment: apartment,
      city: address.city,
      state: "",
      postal_code: address.postal_code,
      country: address.country,
    });
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setEditingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e) => {
    setEmailForm({ email: e.target.value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = () => {
    if (editingAddress) {
      const fullAddress = editingAddress.apartment
        ? `${editingAddress.address}, ${editingAddress.apartment}`
        : editingAddress.address;
      updateAddress(editingAddress.address_id, {
        full_address: fullAddress,
        city: editingAddress.city,
        postal_code: editingAddress.postal_code,
        country: editingAddress.country,
      });
    }
  };

  if (isLoading) return <div className="text-center py-10">Loading...</div>;
  if (!isAuthenticated) {
    loginWithRedirect({ appState: { returnTo: "/account" } });
    return null;
  }

  return (
    <section className="py-5 px-4 sm:px-8 lg:px-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-800">My Account</h1>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          <div className={`lg:flex ${isMenuOpen ? "block" : "hidden"} lg:border-b border-gray-200`}>
            <div className="lg:flex lg:w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center w-full lg:w-auto lg:flex-1 px-4 py-3 space-x-2 border-l-4 lg:border-l-0 lg:border-b-2 transition-colors ${activeTab === tab.id
                    ? "border-[#3b3ccd] text-[#3b3ccd] bg-blue-50 lg:bg-transparent"
                    : "border-transparent text-gray-500 hover:text-[#3b3ccd] hover:bg-gray-50 lg:hover:bg-transparent"
                    }`}
                >
                  {tab.icon}
                  <span className="text-sm lg:text-base">{tab.label}</span>
                  {tab.id === "favorites" && wishlist.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-[#3b3ccd] rounded-full">
                      {wishlist.length}
                    </span>
                  )}
                  {tab.id === "orders" && orders.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-[#3b3ccd] rounded-full">
                      {orders.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 lg:p-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 mb-6">
                <p className="text-sm">{error}</p>
              </div>
            )}
            {activeTab === "Dashboard" && (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800">
                    Welcome back, {user.name || user.email.split("@")[0]}!
                  </h2>
                  <span className="text-sm text-gray-500">
                    Member since {new Date(user.updated_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-[#3b3ccd]" />
                    <span className="text-sm lg:text-base">{user.email}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-[#3b3ccd]">{orders.length}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Favorites</p>
                    <p className="text-2xl font-bold text-[#3b3ccd]">{wishlist.length}</p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "favorites" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    My Favorites{" "}
                    <span className="text-sm text-gray-500 font-normal">
                      ({wishlist.length} item{wishlist.length !== 1 ? "s" : ""})
                    </span>
                  </h2>
                </div>
                {loadingWishlist ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3ccd] mx-auto"></div>
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                      <Heart className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Your wishlist is empty</h3>
                    <p className="text-gray-500 max-w-md">
                      Click the heart icon on products you love to add them to your favorites.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.map((item) => (
                      <div
                        key={item.product_id}
                        className="p-4 border rounded-lg hover:border-[#3b3ccd] hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                            <img
                              src={item.image_url && item.image_url !== "" ? item.image_url : "https://placehold.co/80x80"}
                              alt={item.product_name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                console.error(`Failed to load image for ${item.product_name}: ${item.image_url}`);
                                e.target.src = "https://placehold.co/80x80";
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500 mb-1">Electronics</div>
                              <button
                                onClick={() => removeFromFavorites(item.product_id)}
                                className="group transition-transform hover:scale-110"
                                aria-label="Remove from favorites"
                              >
                                <Heart className="w-5 h-5 text-[#3b3ccd] fill-[#3b3ccd] group-hover:fill-indigo-600 group-hover:text-indigo-600" />
                              </button>
                            </div>
                            <h3 className="font-medium text-sm line-clamp-2 mb-1">{item.product_name}</h3>
                            <div className="flex items-center justify-between mt-2">
                              <p className="font-bold text-[#3b3ccd]">
                                {item.price ? item.price.toLocaleString() : "N/A"} EGP
                              </p>
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="bg-[#3b3ccd] text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-indigo-600 transition-colors duration-200 flex items-center gap-1"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "orders" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    My Orders{" "}
                    <span className="text-sm text-gray-500 font-normal">
                      ({orders.length} order{orders.length !== 1 ? "s" : ""})
                    </span>
                  </h2>
                </div>
                {loadingOrders ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3ccd] mx-auto"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                      <ShoppingBag className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">You haven't placed any orders yet</h3>
                    <p className="text-gray-500 max-w-md">Start shopping to see your orders here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.order_id} className="p-4 border rounded-lg bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-medium text-gray-800">Order #{order.order_id}</span>
                          <div className="flex items-center gap-4">
                            <span className="font-medium text-[#3b3ccd]">
                              {order.total_price ? order.total_price.toLocaleString() : "N/A"} EGP
                            </span>
                            <button
                              onClick={() => deleteOrder(order.order_id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              aria-label="Delete order"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mb-4">
                          Placed on {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="space-y-2 mb-4">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item) => (
                              <div key={item.order_item_id} className="flex justify-between text-sm text-gray-600">
                                <span>
                                  {item.quantity} x Product #{item.product_id}
                                </span>
                                <span>{item.total_price ? item.total_price.toLocaleString() : "N/A"} EGP</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-600">No items in this order</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span
                            className={`${order.status === "Processing"
                              ? "text-yellow-600"
                              : order.status === "Shipped"
                                ? "text-blue-600"
                                : "text-green-600"
                              }`}
                          >
                            {order.status || "Unknown"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Payment: {order.payment_method || "Cash on Delivery"} (
                          {order.amount ? `${order.amount.toLocaleString()} EGP` : "Pending"})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "addresses" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-6 text-gray-800">Saved Addresses</h3>
                  {loadingAddresses ? (
                    <div className="text-center py-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3ccd] mx-auto"></div>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p>No saved addresses yet. Add one during checkout.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {addresses.map((address) => (
                        <div
                          key={address.address_id}
                          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <MapPin className="w-6 h-6 text-[#3b3ccd]" />
                              <h4 className="text-lg font-medium text-gray-800">Shipping Address</h4>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditAddress(address)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                <Edit className="w-5 h-5 text-[#3b3ccd]" />
                              </button>
                              <button
                                onClick={() => deleteAddress(address.address_id)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p className="font-semibold text-gray-700">
                              {user.name || user.email.split("@")[0]}
                            </p>
                            <p>{address.full_address || "N/A"}</p>
                            <p>
                              {address.city || ""}, {address.postal_code || ""} {address.country || ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {editingAddress && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                      <h4 className="text-lg font-semibold mb-4">Edit Address</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <input
                          type="text"
                          name="address"
                          value={editingAddress.address}
                          onChange={handleAddressChange}
                          placeholder="Address (e.g., 123 Main St)"
                          className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          name="apartment"
                          value={editingAddress.apartment}
                          onChange={handleAddressChange}
                          placeholder="Apartment, suite, etc. (optional)"
                          className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          name="city"
                          value={editingAddress.city}
                          onChange={handleAddressChange}
                          placeholder="City (e.g., Cairo)"
                          className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          name="state"
                          value={editingAddress.state}
                          onChange={handleAddressChange}
                          placeholder="State/Province (optional)"
                          className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          name="postal_code"
                          value={editingAddress.postal_code}
                          onChange={handleAddressChange}
                          placeholder="ZIP/Postal Code (e.g., 12345)"
                          className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <select
                          name="country"
                          value={editingAddress.country}
                          onChange={handleAddressChange}
                          className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        >
                          <option value="" disabled>Select Country</option>
                          <option value="Egypt">Egypt</option>
                          <option value="United Arab Emirates">United Arab Emirates</option>
                          <option value="Saudi Arabia">Saudi Arabia</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-4 mt-6">
                        <button
                          onClick={() => setEditingAddress(null)}
                          className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveAddress}
                          className="py-2 px-4 bg-[#3b3ccd] text-white rounded-lg hover:bg-indigo-600"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold mb-6 text-gray-800">Saved Cards</h3>
                  {loadingCards ? (
                    <div className="text-center py-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3ccd] mx-auto"></div>
                    </div>
                  ) : cards.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p>No saved cards yet. Add one during checkout when card payment is available.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cards.map((card) => (
                        <div
                          key={card.id}
                          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <CreditCard className="w-6 h-6 text-[#3b3ccd]" />
                              <h4 className="text-lg font-medium text-gray-800">{card.type || "Unknown"}</h4>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                              <Edit className="w-5 h-5 text-[#3b3ccd]" />
                            </button>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Ending in {card.last4 || "N/A"}</p>
                            <p>Expires {card.expiry || "N/A"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Lock className="w-5 h-5 text-[#3b3ccd]" />
                        <span className="text-sm lg:text-base">Password</span>
                      </div>
                      <button
                        onClick={() => setEditingPassword(true)}
                        className="px-4 py-2 bg-[#3b3ccd] text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-[#3b3ccd]" />
                        <span className="text-sm lg:text-base">Email</span>
                      </div>
                      <button
                        onClick={() => setEditingEmail(true)}
                        className="px-4 py-2 bg-[#3b3ccd] text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-4 border rounded-lg bg-white hover:bg-blue-600 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <LogOut className="w-5 h-5 group-hover:text-white text-[#3b3ccd]" />
                      <span className="text-sm lg:text-base">Logout</span>
                    </div>
                  </button>
                </div>

                {editingEmail && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                      <h4 className="text-lg font-semibold mb-4">Update Email</h4>
                      <div className="space-y-4">
                        <input
                          type="email"
                          value={emailForm.email}
                          onChange={handleEmailChange}
                          placeholder="New email address"
                          className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex justify-end gap-4 mt-6">
                        <button
                          onClick={() => setEditingEmail(false)}
                          className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={updateEmail}
                          className="py-2 px-4 bg-[#3b3ccd] text-white rounded-lg hover:bg-indigo-600"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {editingPassword && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                      <h4 className="text-lg font-semibold mb-4">Change Password</h4>
                      <div className="space-y-4">
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Current password"
                          className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="New password"
                          className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm new password"
                          className="block w-full border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex justify-end gap-4 mt-6">
                        <button
                          onClick={() => setEditingPassword(false)}
                          className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={updatePassword}
                          className="py-2 px-4 bg-[#3b3ccd] text-white rounded-lg hover:bg-indigo-600"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}