import React, { useState, useEffect } from "react";
import { Heart, ShoppingCart, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../Components/CartContext/CartContext";

export default function ProductCard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastProduct, setToastProduct] = useState(null);
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:8080/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation(); // Prevent card click event
    console.log("memo");
    addToCart(product);
    setToastProduct(product);
    setShowToast(true);

    // Hide toast after 3 seconds and reset toastProduct
    setTimeout(() => {
      setShowToast(false);
      setToastProduct(null); // Reset toastProduct
    }, 3000);
  };

  if (loading) {
    return (
      <div className="py-5 px-16 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-5 px-16 flex justify-center items-center min-h-[400px]">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error loading products</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-5 px-16 relative">
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold heading-font">Featured Products</h2>
          <a href="#" className="text-orange-500 hover:underline body-font">
            Browse All Products →
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-4">
          {products.map((product) => {
            const isInCart = cartItems.some((item) => item.id === product.id);
            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-lg overflow-hidden shadow-lg group relative cursor-pointer z-0"
              >
                <div className="relative h-64">
                  <img
                    src={product.image1}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.discount && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-sm text-sm">
                      Sale
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-sm font-semibold text-gray-600 mb-1">
                    {product.category}
                  </div>
                  <h3 className="h-[3rem] text-gray-800 text-sm font-semibold mb-1 body-font line-clamp-3">
                    {product.name.split(" ").slice(0, 8).join(" ") +
                      (product.name.split(" ").length > 3 ? "..." : "")}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[#1B6392] font-bold heading-font">${product.price}</p>
                    {product.discount && (
                      <p className="text-gray-500 line-through text-sm">${product.discount}</p>
                    )}
                  </div>
                  <div className="flex gap-1 mt-3">
                    <button
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Heart className={`w-4 h-4 ${isInCart ? "text-red-500" : "text-gray-600"}`} />
                    </button>
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      className="flex-1 bg-[#3b82f6] text-white font-bold py-1.5 px-3 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-1 text-xs"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {isInCart ? "Added" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && toastProduct && (
        <div
          className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-xs z-50 flex items-start gap-3"
          style={{
            animation: "fadeInUp 0.3s forwards",
            opacity: 0,
            transform: "translateY(20px)",
          }}
        >
          <div className="bg-green-100 p-2 rounded-full">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Added to Cart!</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{toastProduct.name}</p>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-sm font-semibold text-[#1B6392]">${toastProduct.price}</span>
              <button
                onClick={() => navigate("/cart")}
                className="text-xs bg-[#3b82f6] hover:bg-blue-700 text-white rounded px-3 py-1"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}