import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { API_URL } from "../../config";


// Base64 encoded SVG background pattern remains unchanged
const backgroundSvg = `
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="hexagonPattern" width="50" height="86.6" patternUnits="userSpaceOnUse">
      <path d="M25,0 L50,14.4 L50,43.2 L25,57.6 L0,43.2 L0,14.4 Z" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="0.5" 
            stroke-opacity="0.1"/>
      <path d="M25,28.8 L50,43.2 L50,72 L25,86.4 L0,72 L0,43.2 Z" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="0.5" 
            stroke-opacity="0.1"/>
    </pattern>
    <linearGradient id="premiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E1B4B;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#312E81;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1E1B4B;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
      <feColorMatrix type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 15 -7"/>
    </filter>
  </defs>
  <rect width="100" height="100" fill="url(#premiumGradient)"/>
  <rect width="100" height="100" fill="url(#hexagonPattern)"/>
  <circle cx="10" cy="10" r="1" fill="#fff" filter="url(#glow)" opacity="0.15" />
  <circle cx="90" cy="90" r="1" fill="#fff" filter="url(#glow)" opacity="0.15" />
  <circle cx="90" cy="10" r="1" fill="#fff" filter="url(#glow)" opacity="0.15" />
  <circle cx="10" cy="90" r="1" fill="#fff" filter="url(#glow)" opacity="0.15" />
</svg>
`;

const HomePromotionSection = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const fetchFirstProduct = async () => {
      try {
        setLoading(true);
        let token = "";
        if (isAuthenticated) {
          token = await getAccessTokenSilently();
        }
        const response = await axios.get(`${API_URL}/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const products = response.data.products || response.data;
        if (products.length > 0) {
          const firstProduct = products[1];
          setProduct({
            product_id: firstProduct.product_id,
            id: firstProduct.product_id,
            name: firstProduct.name,
            price: firstProduct.price,
            originalPrice: firstProduct.discount
              ? firstProduct.price + firstProduct.discount
              : null,
            description: firstProduct.description || "",
            images: firstProduct.images || [],
            image1: firstProduct.images?.length > 0
              ? firstProduct.images[0]
              : "https://placehold.co/300x300",
          });
        } else {
          setError("No products found");
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);

        setProduct({
          product_id: "1",
          id: "1",
          name: "MacBook Pro M3",
          price: 1499,
          originalPrice: 1699,
          description:
            "Experience the power of Apple's latest M3 chip with exceptional performance and battery life.",
          image1: "https://placehold.co/300x300",
        });
      }
    };

    fetchFirstProduct();
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleShopNow = () => {
    if (product) {
      navigate(`/product/${product.product_id}`, { state: { product } });
    }
  };

  if (loading) {
    return (
      <section className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 lg:px-16">
        <div className="w-full bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 p-3 sm:p-4 md:p-6 relative rounded-xl overflow-hidden">
          <div className="flex justify-center items-center min-h-[200px] sm:min-h-[300px] md:min-h-[400px]">
            <div className="animate-pulse text-white">Loading product...</div>
          </div>
        </div>
      </section>
    );
  }

  if (error && !product) {
    return (
      <section className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 lg:px-16">
        <div className="w-full bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 p-3 sm:p-4 md:p-6 relative rounded-xl overflow-hidden">
          <div className="flex justify-center items-center min-h-[200px] sm:min-h-[300px] md:min-h-[400px]">
            <div className="text-white">Error: {error}</div>
          </div>
        </div>
      </section>
    );
  }

  if (!product) return null;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <section className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 lg:px-16">
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8 relative rounded-xl overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 border-2 border-opacity-10">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div
            className="absolute top-0 left-0 w-full h-full bg-repeat"
            style={{
              opacity: 0.8,
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute bg-gradient-to-br from-indigo-950/50 via-transparent to-indigo-950/50" />
        </div>

        {/* Main Container */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5 md:gap-6 lg:gap-8 relative">
          {/* Left Content */}
          <div className="w-full lg:max-w-xl z-10">
            {/* Special Tag */}
            <div className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-sm w-fit px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full mb-3 sm:mb-4 md:mb-6">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
              <span className="text-white text-xs sm:text-sm font-medium">
                {hasDiscount ? "LIMITED TIME OFFER" : "FEATURED PRODUCT"}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-lg sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4 lg:mb-6">
              {product.name}
            </h1>

            {/* Product Description */}
            <p className="text-white/80 text-xs sm:text-sm md:text-base lg:text-lg mb-4 sm:mb-6 md:mb-8 max-w-lg">
              {product.description ||
                "Experience our high-quality product. Perfect for all your needs."}
            </p>

            {/* Price Display */}
            <div className="flex items-center gap-2 mb-4 sm:mb-6 md:mb-8">
              {hasDiscount ? (
                <>
                  <p className="text-red-500 font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl">
                    ${product.price.toFixed(2)}
                  </p>
                  <p className="text-white/60 line-through text-sm sm:text-base md:text-lg">
                    ${product.originalPrice.toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-white font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl">
                  ${product.price.toFixed(2)}
                </p>
              )}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleShopNow}
              className="group bg-white/10 hover:bg-white/20 text-white px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-4 rounded-lg flex items-center gap-2 transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
            >
              Shop Now
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right Content - Image */}
          <div className="relative flex-1 min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[400px] mt-4 lg:mt-0">
            {/* Product Image Container */}
            <div className="relative h-full rounded-lg sm:rounded-xl overflow-hidden group">
              <div className="absolute inset-0" />
              <img
                src={product.image1 || "https://placehold.co/300x300"}
                alt={product.name}
                className="relative z-10 object-contain w-full h-full p-2 sm:p-4 md:p-6 transform transition-transform duration-300 product-image"
                onError={(e) => {
                  console.error(
                    `Failed to load image for ${product.name}: ${product.image1}`
                  );
                  e.target.src = "https://placehold.co/300x300";
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePromotionSection;