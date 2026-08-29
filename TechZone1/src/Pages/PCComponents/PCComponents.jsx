import React, { useState, useEffect } from "react";
import { Heart, ShoppingCart, Filter, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../Components/CartContext/CartContext";
import { useAuth0 } from "@auth0/auth0-react";
import { API_URL } from "../../config";

// Toast Component (unchanged)
const Toast = ({ message, product, onClose, type }) => (
  <div
    className="fixed bottom-4 right-4 bg-white border border-indigo-500/20 shadow-lg rounded-lg p-4 animate-slide-up z-50"
    style={{ animation: "slideUp 0.3s ease-out" }}
  >
    <div className="flex items-center gap-3">
      <div
        className={`rounded-full p-1.5 ${type === "wishlist"
            ? "bg-pink-600"
            : type === "error"
              ? "bg-red-600"
              : "bg-gradient-to-r from-blue-700 to-indigo-900"
          }`}
      >
        <Check className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-900">
          {type === "wishlist"
            ? "Added to Wishlist!"
            : type === "error"
              ? "Error"
              : "Added to Cart!"}
        </p>
        <p
          className={`text-xs ${type === "wishlist"
              ? "text-pink-600"
              : type === "error"
                ? "text-red-600"
                : "text-indigo-600"
            }`}
        >
          {product?.name}
        </p>
      </div>
    </div>
  </div>
);

export default function PCComponents() {
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("PC Components");
  const [selectedStockStatus, setSelectedStockStatus] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { isAuthenticated, getAccessTokenSilently, loginWithRedirect, user } = useAuth0();

  // Fetch products for PC Components category (ID 5)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let token = "";
        if (isAuthenticated) {
          token = await getAccessTokenSilently();
        }
        const response = await fetch(`${API_URL}/categories/5`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        console.log("Raw backend response:", data);
        const formattedProducts = data.map((product) => {
          const firstImageUrl =
          product.images && product.images.length > 0
            ? product.images[0]
            : "https://placehold.co/150x150";
          return {
            product_id: product.product_id,
            id: product.product_id,
            name: product.name,
            price: product.price,
            category: product.category || "Uncategorized",
            discount: product.discount || null,
            images: product.images || [],
            firstImage: firstImageUrl,
            description: product.description || "",
            stock: product.available_items > 0 ? "in stock" : "out of stock",
          };
        });
        console.log("Formatted products:", formattedProducts);
        setProducts(formattedProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Fetch wishlist when authenticated
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const token = await getAccessTokenSilently();
        const userSub = user.sub;
        const response = await fetch(`${API_URL}/wishlist/${userSub}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch wishlist");
        const data = await response.json();
        console.log(`Wishlist for user ${userSub}:`, data);
        setWishlist(data);
      } catch (err) {
        console.error("Error fetching wishlist:", err);
        setWishlist([]);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  const handleProductClick = (product) => {
    navigate(`/product/${product.product_id}`, { state: { product } });
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if (product.stock === "out of stock") {
      setToast({ message: "Product is out of stock", product, type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const cartProduct = {
      id: product.product_id,
      name: product.name,
      price: product.price,
      image: product.firstImage,
      discount: product.discount || null,
    };
    addToCart(cartProduct);
    setToast({ message: "Product added to cart", product, type: "cart" });
    setTimeout(() => setToast(null), 3000);
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.product_id === productId);
  };

  const toggleWishlist = async (e, product) => {
    e.stopPropagation();
    if (!isAuthenticated || !user) {
      loginWithRedirect();
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      const userSub = user.sub;
      const isCurrentlyInWishlist = isInWishlist(product.product_id);
      const method = isCurrentlyInWishlist ? "DELETE" : "POST";
      const response = await fetch(`${API_URL}/wishlist/${userSub}/${product.product_id}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: method === "POST" ? JSON.stringify({}) : null,
      });

      if (!response.ok) throw new Error("Failed to update wishlist");

      if (isCurrentlyInWishlist) {
        setWishlist(wishlist.filter((item) => item.product_id !== product.product_id));
      } else {
        setWishlist([...wishlist, {
          product_id: product.product_id,
          product_name: product.name,
          price: product.price,
          image_url: product.firstImage,
        }]);
      }

      const message = isCurrentlyInWishlist
        ? "Removed from wishlist"
        : "Added to wishlist";
      setToast({ message, product, type: "wishlist" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: "Error updating wishlist", product, type: "error" });
      setTimeout(() => setToast(null), 3000);
      console.error("Wishlist error:", err);
    }
  };

  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    setPriceRange((prev) => ({ ...prev, [name]: value }));
  };

  const filteredProducts = products.filter((product) => {
    const isCategoryMatch =
      !selectedCategory ||
      (product.category && product.category.toLowerCase() === selectedCategory.toLowerCase());
    const isStockStatusMatch =
      !selectedStockStatus ||
      (selectedStockStatus === "In Stock" && product.stock === "in stock") ||
      (selectedStockStatus === "Out of Stock" && product.stock === "out of stock");
    const isPriceRangeMatch =
      (priceRange.min === "" || product.price >= parseFloat(priceRange.min)) &&
      (priceRange.max === "" || product.price <= parseFloat(priceRange.max));
    console.log(`Filter check for ${product.name}:`, {
      selectedCategory,
      productCategory: product.category,
      isCategoryMatch,
      isStockStatusMatch,
      isPriceRangeMatch,
    });
    return isCategoryMatch && isStockStatusMatch && isPriceRangeMatch;
  });

  console.log("Filtered products:", filteredProducts);

  const FilterSection = () => {
    // Define category-to-route mapping based on provided paths
    const categoryRoutes = {
      "All": "/shop",
      "Laptops": "/laptops",
      "Gaming Consoles": "/gamingconsoles",
      "Smartphones": "/smartphones",
      "Wearables & Accessories": "/wearablesaccessories",
      "PC Components": "/pccomponents",
    };

    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-700/5 rounded-xl -z-10">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute left-0 top-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxkZWZzPgogICAgPHBhdHRlcm4gaWQ9ImhexagonsIiB3aWR0aD0iNTAiIGhlaWdodD0iNDMuMyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDMwKSI+CiAgICAgIDxwYXRoIGQ9Ik0yNSAyOC41NjY1TDEyLjUgNDMuMyAwIDI4LjU2NjUgMTIuNSAxMy4zMzMgMjUgMjguNTY2NXpNMzcuNSA0My4zTDI1IDI4LjU2NjUgMzcuNSAxMy4zMzMgNTAgMjguNTY2NSAzNy41IDQzLjN6IiBzdHJva2U9IiMwMDAiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMS4yIi8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjaGV4YWdvbnMpIiAvPgo8L3N2Zz4K')]"></div>
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-6 text-indigo-900 border-b border-indigo-100/70 pb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-indigo-600"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 4.5H17M3 12H17M3 19.5H17M21 4.5V19.5M21 4.5L18 7.5M21 4.5L24 7.5M21 19.5L18 16.5M21 19.5L24 16.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Filters
          </h2>
          <div className="space-y-8">
            <div className="transform transition-all duration-300">
              <h3 className="text-sm font-medium text-indigo-800 mb-4 flex items-center">
                <span className="w-1 h-4 bg-indigo-600 rounded mr-2"></span>
                Categories
              </h3>
              <div className="space-y-3">
                {[
                  "All",
                  "Laptops",
                  "Gaming Consoles",
                  "Smartphones",
                  "Wearables & Accessories",
                  "PC Components",
                ].map((category) => (
                  <label
                    key={category}
                    className="flex items-center group cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={
                        selectedCategory === (category === "All" ? "" : category)
                      }
                      onChange={() => {
                        const route = categoryRoutes[category];
                        if (route && route !== "/pccomponents") {
                          navigate(route);
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 transition-all duration-300"
                    />
                    <span className="ml-3 text-sm text-gray-600 group-hover:text-indigo-600 transition-colors duration-300">
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="transform transition-all duration-300">
              <h3 className="text-sm font-medium text-indigo-800 mb-4 flex items-center">
                <span className="w-1 h-4 bg-indigo-600 rounded mr-2"></span>
                Stock Status
              </h3>
              <div className="space-y-3">
                {["All", "In Stock", "Out of Stock"].map((status) => (
                  <label
                    key={status}
                    className="flex items-center group cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="stockStatus"
                      checked={
                        selectedStockStatus === (status === "All" ? "" : status)
                      }
                      onChange={() =>
                        setSelectedStockStatus(status === "All" ? "" : status)
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 transition-all duration-300"
                    />
                    <span className="ml-3 text-sm text-gray-600 group-hover:text-indigo-600 transition-colors duration-300">
                      {status}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="transform transition-all duration-300">
              <h3 className="text-sm font-medium text-indigo-800 mb-4 flex items-center">
                <span className="w-1 h-4 bg-indigo-600 rounded mr-2"></span>
                Price Range
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="min"
                      value={priceRange.min}
                      onChange={handlePriceRangeChange}
                      placeholder="Min"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 outline-none"
                    />
                  </div>
                  <span className="text-gray-500">-</span>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="max"
                      value={priceRange.max}
                      onChange={handlePriceRangeChange}
                      placeholder="Max"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 outline-none"
                    />
                  </div>
                </div>
                <button className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-5 px-4 md:px-16 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-5 px-4 md:px-16 flex justify-center items-center min-h-[400px]">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error loading products</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-5 px-4 md:px-16">
      <div className="xl:hidden mb-4">
        <button
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div
          className={`xl:w-1/4 ${isMobileFilterOpen ? "block" : "hidden"
            } xl:block transition-all duration-300`}
        >
          <FilterSection />
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">
                No products found matching your filters.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isInCart = cartItems.some(
                  (item) => item.id === product.product_id
                );
                const isOutOfStock = product.stock === "out of stock";
                return (
                  <div
                    key={product.product_id}
                    onClick={() => handleProductClick(product)}
                    className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group relative cursor-pointer ${isOutOfStock ? "opacity-75" : ""
                      }`}
                  >
                    {/* Product Image */}
                    <div className="relative h-32 xs:h-40 sm:h-48 md:h-56 lg:h-64">
                      <img
                        src={product.firstImage}
                        alt={product.name}
                        className="w-full h-full object-contain transition-transform duration-300"
                        onError={(e) => {
                          console.error(
                            `Failed to load image for ${product.name}: ${product.firstImage}`
                          );
                          e.target.src = "https://placehold.co/150x150";
                        }}
                      />
                      {product.discount && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white px-1.5 py-0.5 rounded-sm text-xs">
                          Sale
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="absolute top-2 right-2 bg-gray-600 text-white px-1.5 py-0.5 rounded-sm text-xs">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="p-2 sm:p-3 md:p-4">
                      <div className="text-[10px] xs:text-xs text-gray-600 mb-0.5">
                        {product.category}
                      </div>
                      <h3 className="h-8 xs:h-10 text-gray-800 text-xs xs:text-sm font-medium mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {product.discount ? (
                          <>
                            <p className="text-red-600 font-semibold text-xs sm:text-sm">
                              ${(product.price - product.discount).toFixed(2)}
                            </p>
                            <p className="text-gray-500 line-through text-[10px] xs:text-xs">
                              ${product.price.toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <p className="text-blue-600 font-semibold text-xs sm:text-sm">
                            ${product.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                        {/* Wishlist Button */}
                        <button
                          className={`p-1 sm:p-1.5 rounded-lg border transition-all duration-200 ${isInWishlist(product.product_id)
                              ? "border-pink-200 bg-pink-50 hover:bg-pink-100"
                              : "border-gray-200 hover:bg-gray-50"
                            }`}
                          onClick={(e) => toggleWishlist(e, product)}
                          aria-label={
                            isInWishlist(product.product_id)
                              ? "Remove from wishlist"
                              : "Add to wishlist"
                          }
                        >
                          <Heart
                            className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors ${isInWishlist(product.product_id)
                                ? "text-pink-600 fill-pink-600"
                                : "text-gray-600"
                              }`}
                          />
                        </button>
                        {/* Add to Cart Button */}
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className={`flex-1 font-medium py-1 px-2 sm:py-1.5 sm:px-3 rounded-lg flex items-center justify-center gap-1 text-[10px] xs:text-xs ${isOutOfStock
                              ? "bg-gray-400 text-white cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-700 to-indigo-900 text-white hover:bg-blue-600"
                            }`}
                          disabled={isOutOfStock}
                        >
                          <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {isInCart && !isOutOfStock ? "Added" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Slide Up Animation and Custom Grid Styling */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @media (max-width: 400px) {
          .grid {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
        }
      `}</style>
    </section>
  );
}