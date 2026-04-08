import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, ShoppingCart, Check, ArrowRight } from "lucide-react";
import { useCart } from "../../Components/CartContext/CartContext";
import { useAuth0 } from "@auth0/auth0-react";
import airpod from "../../assets/airpod.png";

const API_URL = "http://localhost:8080";

const Toast = ({ message, product, onClose, type }) => (
  <div
    className="fixed bottom-4 right-4 bg-white border border-indigo-500/20 shadow-lg rounded-lg p-4 animate-slide-up"
    style={{ animation: "slideUp 0.3s ease-out", zIndex: 1000 }}
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
          {type === "wishlist" ? "Added to Wishlist!" : type === "error" ? "Error" : "Added to Cart!"}
        </p>
        <p
          className={`text-xs ${type === "wishlist" ? "text-pink-600" : type === "error" ? "text-red-600" : "text-indigo-600"
            }`}
        >
          {message || product?.name}
        </p>
      </div>
    </div>
  </div>
);

export default function HomeFeaturedProductsSection() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, getAccessTokenSilently, loginWithRedirect, user, isLoading } = useAuth0();
  const [products, setProducts] = useState([]);
  const [wishlistStatus, setWishlistStatus] = useState({});
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    if (!isAuthenticated || !user || isLoading) {
      setWishlistStatus({});
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        audience: "https://ecommerce-api",
        scope: "read:current_user",
      });
      const response = await fetch(`${API_URL}/wishlist/${user.sub}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch wishlist");
      const wishlistItems = await response.json();
      const wishlistMap = wishlistItems.reduce((acc, item) => {
        if (item.product_id) acc[item.product_id] = true;
        return acc;
      }, {});
      setWishlistStatus(wishlistMap);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setWishlistStatus({});
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching products from:", `${API_URL}/products`);
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const productData = await response.json();
        console.log("Products response:", productData);

        const mappedProducts = productData.map((product) => ({
          id: product.product_id,
          product_id: product.product_id,
          name: product.name,
          price: product.price,
          image1: product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/300x300",
          category: product.category_name || "Unknown", // Use category_name from API
          brand: product.brand || "Generic", // Ensure backend provides this field
          rating: { score: 4.5, reviews: 100 }, // Static for now; fetch from backend if available
          discount: product.discount || null, // Ensure backend supports this
          stock: product.available_items > 0 ? "in stock" : "out of stock",
        }));
        const shuffled = [...mappedProducts].sort(() => 0.5 - Math.random());
        setProducts(shuffled.slice(0, 8));
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to fetch products. Please try again later.");
      }

      await fetchWishlist();
      setLoading(false);
    };

    fetchData();
  }, [isAuthenticated, user, isLoading, getAccessTokenSilently]);

  const toggleWishlist = async (e, product) => {
    e.stopPropagation();

    if (!isAuthenticated || !user || isLoading) {
      loginWithRedirect({ appState: { returnTo: window.location.pathname } });
      return;
    }

    try {
      const token = await getAccessTokenSilently({
        audience: "https://ecommerce-api",
        scope: "read:current_user",
      });
      const isInWishlist = wishlistStatus[product.product_id] || false;
      const url = `${API_URL}/wishlist/${user.sub}/${product.product_id}`;
      const method = isInWishlist ? "DELETE" : "POST";

      // Optimistic UI update
      setWishlistStatus((prev) => ({
        ...prev,
        [product.product_id]: !isInWishlist,
      }));

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: method === "POST" ? JSON.stringify({}) : null,
      });

      if (!response.ok) {
        const responseText = await response.text();
        // Revert optimistic update on failure
        setWishlistStatus((prev) => ({
          ...prev,
          [product.product_id]: isInWishlist,
        }));
        if (response.status === 409 && method === "POST") {
          setToast({ message: `${product.name} is already in your wishlist`, product, type: "wishlist" });
        } else {
          throw new Error(`Failed to ${isInWishlist ? "remove from" : "add to"} wishlist`);
        }
      } else {
        setToast({
          message: `${product.name} ${isInWishlist ? "removed from" : "added to"} wishlist`,
          product,
          type: "wishlist",
        });
      }
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: "Error updating wishlist", product, type: "error" });
      setTimeout(() => setToast(null), 3000);
      console.error("Wishlist error:", err);
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if (product.stock === "out of stock") {
      setToast({ message: `${product.name} is out of stock`, product, type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    addToCart({ ...product, quantity: 1 });
    setToast({ message: `${product.name} added to cart`, product, type: "cart" });
    setTimeout(() => setToast(null), 3000);
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  if (loading && products.length === 0) {
    return (
      <section className="py-4 sm:py-5 px-3 sm:px-4 md:px-8 lg:px-16">
        <div className="text-center text-gray-500">Loading featured products...</div>
      </section>
    );
  }

  return (
    <section className="py-4 sm:py-5 px-3 sm:px-4 md:px-8 lg:px-16">
      <div className="min-h-screen">
        <div className="flex flex-col lg:flex-row lg:gap-8 xl:gap-10">
          {/* Promotional Banners */}
          <div className="hidden lg:flex flex-col lg:w-1/4 xl:w-1/5 h-full gap-6 sticky top-0">
            {/* Banner 1 */}
            <div className="relative h-1/2 bg-[#e0e7ff] rounded-xl shadow-sm overflow-hidden flex flex-col items-center justify-center text-center group border border-indigo-100 hover:border-indigo-200 transition-colors duration-300">
              <div className="absolute inset-0">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-10">
                  <defs>
                    <pattern id="simplePattern" width="60" height="60" patternUnits="userSpaceOnUse">
                      <path d="M30 10 L50 30 L30 50 L10 30 Z" fill="none" stroke="#4F46E5" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#simplePattern)" />
                </svg>
                <div className="absolute top-1/3 right-1/3 w-40 h-40 bg-indigo-300 rounded-full filter blur-3xl opacity-10 group-hover:opacity-15 transition-opacity duration-300"></div>
              </div>
              <div className="p-6 flex flex-col items-center justify-center h-full text-center z-10">
                <div className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 mb-3">
                  <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                    </svg>
                    RAMADAN SPECIAL
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center flex-grow">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-indigo-300/20 blur-2xl rounded-full transform scale-75 group-hover:bg-indigo-300/30 transition-all duration-300"></div>
                    <img
                      src={airpod}
                      alt="Wireless Earbuds"
                      className="w-36 h-26 object-contain drop-shadow-lg relative z-10 transform group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Ramadan Nights Collection</h2>
                  <p className="text-gray-600 text-sm mb-4 max-w-[200px]">Premium gifts for the blessed month</p>
                  <div className="relative bg-white border border-indigo-200 px-4 py-2 rounded-lg mb-4 transform group-hover:scale-105 transition-transform duration-300 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-700 text-xl">Up to 25%</span>
                      <span className="text-indigo-600 text-sm">OFF</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/shop")}
                  className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-900 text-white font-bold px-3 rounded-lg hover:from-[#1D267D] hover:to-[#004AAD] text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-sm group-hover:shadow-md transform group-hover:translate-y-[-2px]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M8 2h8l4 10H4L8 2Z"></path>
                    <path d="M12 12v6"></path>
                    <path d="M8 22v-2c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2H8Z"></path>
                  </svg>
                  Explore Collection
                </button>
              </div>
            </div>
            {/* Banner 2 */}
            <div className="relative h-1/2 bg-[#e0e7ff] rounded-xl shadow-sm overflow-hidden flex flex-col items-center justify-center text-center group border border-indigo-100 hover:border-indigo-200 transition-colors duration-300">
              <div className="absolute inset-0">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-10">
                  <defs>
                    <pattern id="simpleDiamondPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                      <path d="M30 10 L50 30 L30 50 L10 30 Z" fill="none" stroke="#4F46E5" strokeWidth="0.5" />
                      <circle cx="30" cy="30" r="1.5" fill="#4F46E5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#simpleDiamondPattern)" />
                </svg>
                <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-indigo-300 rounded-full filter blur-3xl opacity-10 group-hover:opacity-15 transition-opacity duration-300"></div>
                <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-indigo-300 rounded-full filter blur-3xl opacity-10 group-hover:opacity-15 transition-opacity duration-300"></div>
              </div>
              <div className="p-6 flex flex-col items-center justify-center h-full text-center z-10">
                <div className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 mb-3">
                  <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">ULTRA PREMIUM</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ramadan Collection</h2>
                <p className="text-gray-600 text-sm mb-5 max-w-[220px]">Limited edition flagship smartphones</p>
                <div className="relative mb-5 transform group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-300/10 to-indigo-300/10 rounded-lg blur-xl"></div>
                  <div className="relative bg-white border border-indigo-200 p-4 rounded-lg shadow-sm">
                    <div className="text-4xl font-extrabold text-indigo-700">
                      40<span className="text-xl">%</span>
                    </div>
                    <div className="text-sm text-indigo-600 font-medium mt-1">RAMADAN DISCOUNTS</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/shop")}
                  className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-900 text-white font-bold px-3 rounded-lg hover:from-[#1D267D] hover:to-[#004AAD] text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-sm group-hover:shadow-md transform group-hover:translate-y-[-2px]"
                >
                  Explore Collection
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Small Banner for xs/sm screens */}
          <div className="lg:hidden mb-6">
            <div className="relative bg-[#e0e7ff] rounded-xl shadow-sm overflow-hidden p-4 sm:p-6 border border-indigo-100">
              <div className="absolute inset-0">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-10">
                  <defs>
                    <pattern id="mobilePattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M20 5 L35 20 L20 35 L5 20 Z" fill="none" stroke="#4F46E5" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#mobilePattern)" />
                </svg>
              </div>
              <div className="flex flex-row justify-between items-center relative z-10">
                <div className="flex-1">
                  <div className="bg-indigo-50 inline-block px-2 py-0.5 rounded-full border border-indigo-200 mb-2">
                    <span className="text-xs font-semibold text-indigo-700">RAMADAN SPECIAL</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Ramadan Collection</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Premium tech with special offers</p>
                  <div className="inline-block bg-white border border-indigo-200 px-2 py-1 rounded-lg mb-2">
                    <span className="font-bold text-indigo-700 text-sm sm:text-base">Up to 40% OFF</span>
                  </div>
                </div>
                <div className="w-20 sm:w-24 ml-2">
                  <img src={airpod} alt="Wireless Earbuds" className="w-full h-auto object-contain drop-shadow-lg" />
                </div>
              </div>
              <button
                onClick={() => navigate("/shop")}
                className="w-full mt-2 py-2 bg-gradient-to-r from-blue-700 to-indigo-900 text-white font-bold px-3 rounded-lg text-xs flex items-center justify-center gap-1 hover:from-[#1D267D] hover:to-[#004AAD] transition-all duration-300"
              >
                Explore Collection
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="w-full lg:flex-1">
            {error && <div className="text-center mb-4 text-red-500">{error}</div>}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold heading-font">Featured Products</h2>
              <Link
                to="/shop"
                className="text-sm sm:text-base text-[#004AAD] hover:underline font-medium backdrop-blur-sm"
              >
                Browse All →
              </Link>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-4 lg:gap-5">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 group relative cursor-pointer"
                >
                  <div className="relative h-48 xs:h-40 sm:h-44 md:h-52 lg:h-48 xl:h-52">
                    <img
                      src={product.image1}
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                      onError={(e) => {
                        console.log(`Image failed to load for ${product.name}, using placeholder`);
                        e.target.src = "https://placehold.co/300x300";
                      }}
                    />
                    {product.discount && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white px-1.5 py-0.5 rounded-sm text-xs">
                        Sale
                      </span>
                    )}
                    {product.stock === "out of stock" && (
                      <span className="absolute top-2 right-2 bg-gray-600 text-white px-1.5 py-0.5 rounded-sm text-xs">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <div className="p-3 sm:p-3 lg:p-4">
                    <div className="text-xs sm:text-xs lg:text-sm font-semibold text-gray-600 mb-1">
                      {product.category}
                    </div>
                    <h3 className="h-[2.5rem] xs:h-[2.75rem] sm:h-[2.5rem] lg:h-[2.5rem] xl:h-[2.75rem] text-gray-800 text-xs sm:text-xs lg:text-sm font-semibold mb-1 body-font line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {product.discount ? (
                        <>
                          <p className="text-red-600 font-bold heading-font text-sm sm:text-sm lg:text-base">
                            ${(product.price - product.discount).toFixed(2)}
                          </p>
                          <p className="text-gray-500 line-through text-xs">
                            ${product.price.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p className="text-[#1B6392] font-bold heading-font text-sm sm:text-sm lg:text-base">
                          ${product.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 mt-2 sm:mt-2 lg:mt-3">
                      <button
                        className={`p-1 sm:p-1 lg:p-1.5 rounded-lg border transition-all duration-200 ${wishlistStatus[product.product_id]
                            ? "border-pink-200 bg-pink-50 hover:bg-pink-100"
                            : "border-gray-200 hover:bg-gray-50"
                          }`}
                        onClick={(e) => toggleWishlist(e, product)}
                        aria-label={
                          wishlistStatus[product.product_id] ? "Remove from wishlist" : "Add to wishlist"
                        }
                        disabled={isLoading}
                      >
                        <Heart
                          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 transition-colors ${wishlistStatus[product.product_id]
                              ? "text-pink-600 fill-pink-600"
                              : "text-gray-600"
                            }`}
                        />
                      </button>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`flex-1 font-bold py-1 sm:py-1 lg:py-1.5 px-2 sm:px-2 lg:px-3 rounded-lg flex items-center justify-center gap-1 text-xs ${product.stock === "out of stock"
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-700 to-indigo-900 text-white hover:from-[#1D267D] hover:to-[#004AAD]"
                          }`}
                        disabled={product.stock === "out of stock"}
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                        <span className="hidden sm:inline lg:inline">
                          {product.stock === "out of stock" ? "Out of Stock" : "Add to Cart"}
                        </span>
                        <span className="sm:hidden lg:hidden">
                          {product.stock === "out of stock" ? "Out" : "Add"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
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
        @media (max-width: 640px) {
          .xs\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .xs\\:gap-4 {
            gap: 1rem;
          }
          .xs\\:h-40 {
            height: 10rem;
          }
          .xs\\:h-\\[2\\.75rem\\] {
            height: 2.75rem;
          }
        }
      `}</style>
    </section>
  );
}