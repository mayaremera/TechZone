import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { useCart } from "../../Components/CartContext/CartContext";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const API_URL = "http://localhost:8080";
const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>" +
      "<rect width='100%' height='100%' fill='#f3f4f6'/>" +
      "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-family='Arial' font-size='14'>" +
      "Image unavailable" +
      "</text>" +
    "</svg>"
  );

// Custom Toast Component
const Toast = ({ message, product, onClose, type }) => (
  <div
    className="fixed bottom-4 right-4 bg-white border border-indigo-500/20 shadow-lg rounded-lg p-3 animate-slide-up"
    style={{ animation: "slideUp 0.3s ease-out", zIndex: 1000 }}
  >
    <div className="flex items-center gap-2">
      <div
        className={`rounded-full p-1 ${type === "wishlist"
          ? "bg-pink-600"
          : type === "error"
            ? "bg-red-600"
            : "bg-gradient-to-r from-blue-700 to-indigo-900"
          }`}
      >
        <Check className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col">
        <p className="text-xs font-medium text-gray-900">
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
          {message || product?.name}
        </p>
      </div>
    </div>
  </div>
);

export default function HomeCustomersAlsoBought() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, getAccessTokenSilently, loginWithRedirect, user, isLoading } = useAuth0();
  const [products, setProducts] = useState([]);
  const [wishlistStatus, setWishlistStatus] = useState({});
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setError(null); // Reset error state

      // Fetch products (public endpoint)
      try {
        console.log("Fetching products from:", `${API_URL}/products`);
        const productResponse = await axios.get(`${API_URL}/products`);
        console.log("Products response:", productResponse.data);
        const data = productResponse.data;
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const randomProducts = shuffled.slice(0, 10);
        const formattedProducts = randomProducts.map((product) => ({
          product_id: product.product_id,
          id: product.product_id,
          name: product.name,
          price: product.price,
          category: product.category || "Unknown",
          discount: product.discount || null,
          images: product.images || [],
          image1: product.images?.length > 0 ? product.images[0] : FALLBACK_IMAGE,
          description: product.description || "",
        }));
        setProducts(formattedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        if (err.response) {
          console.error("Products response status:", err.response.status);
          console.error("Products response data:", err.response.data);
        } else if (err.request) {
          console.error("No response from /products:", err.request);
        }
        setError("Failed to fetch products. Please try again.");
      }

      // Fetch wishlist if authenticated
      if (isAuthenticated && user && !isLoading) {
        try {
          console.log("Fetching wishlist for user:", user.sub);
          const token = await getAccessTokenSilently({
            audience: "https://ecommerce-api",
            scope: "read:current_user",
          });
          const wishlistResponse = await axios.get(`${API_URL}/wishlist/${user.sub}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Wishlist response:", wishlistResponse.data);
          const wishlistItems = wishlistResponse.data;
          const wishlistMap = wishlistItems.reduce((acc, item) => {
            acc[item.product_id] = true;
            return acc;
          }, {});
          setWishlistStatus(wishlistMap);
        } catch (err) {
          console.error("Error fetching wishlist:", err);
          if (err.response) {
          } else if (err.request) {
          }
        }
      }
    };

    fetchData();
  }, [isAuthenticated, user, isLoading, getAccessTokenSilently]);

  const handleProductClick = (product) => {
    navigate(`/product/${product.product_id}`, { state: { product } });
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    const cartProduct = {
      id: product.product_id,
      name: product.name,
      price: product.price,
      image: product.image1,
      discount: product.discount || null,
    };
    addToCart(cartProduct);
    setToast({ message: "Product added to cart", product, type: "cart" });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleWishlist = async (e, product) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      loginWithRedirect();
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

      console.log(`Sending ${method} to ${url} for product ${product.product_id}`);

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
        console.error("Wishlist response error:", response.status, responseText);
        throw new Error(`Failed to ${isInWishlist ? "remove from" : "add to"} wishlist: ${response.status}`);
      }

      setWishlistStatus((prev) => ({
        ...prev,
        [product.product_id]: !isInWishlist,
      }));
      setToast({
        message: `${product.name} ${isInWishlist ? "removed from" : "added to"} wishlist`,
        product,
        type: "wishlist",
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: "Error updating wishlist", product, type: "error" });
      setTimeout(() => setToast(null), 3000);
      console.error("Wishlist error:", err);
    }
  };

  if (error && products.length === 0) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  return (
    <section className="py-2 px-2 sm:py-4 sm:px-6 md:px-8 lg:px-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold heading-font mb-1 sm:mb-0">
          Customers Also Bought
        </h2>
        <Link
          to="/shop"
          className="text-[#004AAD] hover:underline text-xs sm:text-sm md:text-base font-medium backdrop-blur-sm"
        >
          Browse All Products →
        </Link>
      </div>

      <div className="w-full">
        {error && (
          <div className="text-center mb-4 text-red-500">{error}</div>
        )}
        <div className="w-full overflow-x-auto pb-2 sm:pb-4 no-scrollbar -mx-2 px-2">
          <div className="flex gap-3 md:gap-4 min-w-max">
            {products.length === 0 && !error ? (
              <p className="text-center text-gray-500">Loading products...</p>
            ) : (
              products.map((product) => (
                <div
                  key={product.product_id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-lg overflow-hidden shadow-md flex-shrink-0 w-[200px] md:w-[220px] lg:w-[240px] group relative cursor-pointer"
                >
                  <div className="relative h-48 md:h-52 lg:h-56">
                    <img
                      src={product.image1}
                      alt={product.name}
                      data-image-index="0"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const currentIndex = Number(e.currentTarget.dataset.imageIndex || "0");
                        const nextIndex = currentIndex + 1;
                        const nextImage = product.images?.[nextIndex];

                        if (nextImage) {
                          e.currentTarget.dataset.imageIndex = String(nextIndex);
                          e.currentTarget.src = nextImage;
                          return;
                        }

                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                    {product.discount && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white px-1 py-0.5 rounded-sm text-xs">
                        Sale
                      </span>
                    )}
                    {product.discount && (
                      <span className="absolute top-2 right-2 text-xs text-gray-500 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-semibold text-gray-600 mb-1 truncate">
                      {product.category}
                    </div>
                    <h3 className="h-12 text-gray-800 text-sm font-semibold mb-1 body-font line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {product.discount ? (
                        <>
                          <p className="text-red-600 font-bold heading-font text-sm">
                            ${(product.price - product.discount).toFixed(2)}
                          </p>
                          <p className="text-gray-500 text-xs line-through">
                            ${product.price.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p className="text-[#1B6392] font-bold heading-font text-sm">
                          ${product.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className={`p-1 rounded-md border transition-all duration-200 ${wishlistStatus[product.product_id]
                          ? "border-pink-200 bg-pink-50 hover:bg-pink-100"
                          : "border-gray-200 hover:bg-gray-50"
                          }`}
                        onClick={(e) => toggleWishlist(e, product)}
                        aria-label={
                          wishlistStatus[product.product_id]
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${wishlistStatus[product.product_id]
                            ? "text-pink-600 fill-pink-600"
                            : "text-gray-600"
                            }`}
                        />
                      </button>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="flex-1 bg-gradient-to-r from-blue-700 to-indigo-900 hover:from-[#1D267D] hover:to-[#004AAD] text-white font-bold py-1 px-2 rounded-md flex items-center justify-center gap-1 text-xs"
                      >
                        <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
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
        @keyframes heartBeat {
          0% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.3);
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.3);
          }
          70% {
            transform: scale(1);
          }
        }
        .heart-beat {
          animation: heartBeat 1s;
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </section>
  );
}