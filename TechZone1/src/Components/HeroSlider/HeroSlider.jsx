import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";

const XboxSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});
  const [products, setProducts] = useState([]);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = useRef(null);
  const navigate = useNavigate();

  const slides = [
    {
      title: "THE BEST PLACE TO PLAY",
      heading: "Xbox Series X",
      description:
        "Save up to 50% on select Xbox games.\nGet 3 months of PC Game Pass for $2 USD.",
      color: "#4f46e5",
      buttonColor: "from-blue-600 to-indigo-600",
      price: "$299",
      consoleColor: "black",
      backgroundColor: "bg-blue-100",
      image: "/src/assets/Image22.png",
      link: "/product/19",
      id: "19",
    },
    {
      title: "SPECIAL BUNDLE",
      heading: "Apple Watch Series 10",
      description:
        "Advanced health tracking, stunning display. \nStay connected, active, and stylish.",
      color: "#7c3aed",
      buttonColor: "from-indigo-600 to-purple-700",
      price: "$329",
      consoleColor: "green",
      backgroundColor: "bg-indigo-100",
      image: "/src/assets/Image333.png",
      link: "/product/31",
      id: "31",
    },
    {
      title: "LIMITED EDITION",
      heading: "Apple MacBook Air M3",
      description:
        "Powerful performance, ultra-slim design.\nExperience speed, efficiency, and all-day battery life.",
      color: "#db2777",
      buttonColor: "from-purple-700 to-pink-600",
      price: "$349",
      consoleColor: "white",
      backgroundColor: "bg-purple-100",
      image: "/src/assets/Image44.png",
      link: "/product/9",
      id: "9",
    },
  ];

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setProducts(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err.message);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Preload all images
  useEffect(() => {
    let loadedCount = 0;
    const totalImages = slides.length;
    const tempLoadedImages = {};

    slides.forEach((slide, index) => {
      const img = new Image();
      img.src = slide.image;
      img.onload = () => {
        loadedCount++;
        tempLoadedImages[index] = true;
        setLoadedImages(tempLoadedImages);
        if (loadedCount === totalImages) {
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setIsLoading(false);
        }
      };
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isLoading) {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [isLoading]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  // Handle touch events for swiping
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left
      nextSlide();
    }

    if (touchStart - touchEnd < -50) {
      // Swipe right
      prevSlide();
    }
  };

  const handleShopNow = () => {
    const currentSlideData = slides[currentSlide];
    const productId = currentSlideData.id;

    const matchingProduct = products.find((p) => p.id === productId);

    if (matchingProduct) {
      navigate(`/product/${productId}`, {
        state: { product: matchingProduct },
      });
    } else {
      const basicProduct = {
        id: productId,
        name: currentSlideData.heading,
        price: parseFloat(currentSlideData.price.replace("$", "")),
        description: currentSlideData.description,
        image1: currentSlideData.image,
      };

      navigate(`/product/${productId}`, { state: { product: basicProduct } });
    }
  };

  if (isLoading) {
    return (
      <section className="relative overflow-hidden py-3 px-3 sm:py-5 sm:px-4 md:px-16 font-sans">
        <div className="w-full min-h-[450px] sm:min-h-[650px] md:min-h-[500px] rounded-xl overflow-hidden shadow-xl bg-blue-100 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">
              Loading slider...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-3 px-3 sm:py-5 sm:px-4 md:px-16 font-sans z-0">
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
        .font-sans {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, Segoe UI,
            Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans,
            Helvetica Neue, sans-serif;
        }
        /* Hide nav buttons by default */
        .nav-button {
          display: none;
        }
        /* Show nav buttons only between 500px and 767px */
        @media (min-width: 500px) and (max-width: 767px) {
          .nav-button {
            display: block;
          }
        }
      `}</style>

      <div
        ref={sliderRef}
        className="relative w-full min-h-[450px] sm:min-h-[450px] md:min-h-[310px] lg:min-h-[420px] xl:min-h-[480px] rounded-xl overflow-hidden shadow-xl bg-slate-50"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              index === currentSlide ? "opacity-100 z-20" : "opacity-0 z-10"
            }`}
            style={{
              transform:
                index === currentSlide
                  ? "translateX(0)"
                  : index < currentSlide
                  ? "translateX(-100%)"
                  : "translateX(100%)",
            }}
          >
            {/* Solid Background */}
            <div className={`absolute inset-0 ${slide.backgroundColor}`}></div>

            {/* Main Content Container */}
            <div className="flex flex-col md:flex-row h-full w-full max-w-7xl mx-auto">
              {/* Left Side: Text Content */}
              <div className="w-full md:w-1/2 xl:w-1/2 flex flex-col justify-center px-4 py-4 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-0 text-center md:text-left z-10">
                <div className="flex items-center justify-center md:justify-start mb-2 sm:mb-2 md:mb-3 lg:mb-4">
                  <Zap
                    className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-4 lg:h-4 mr-1 sm:mr-1 md:mr-2 lg:mr-2"
                    style={{ color: slide.color }}
                  />
                  <span
                    className="text-xs sm:text-xs md:text-xs lg:text-xs font-semibold tracking-widest uppercase"
                    style={{ color: slide.color }}
                  >
                    {slide.title}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-2xl md:text-3xl lg:text-5xl font-bold mt-1 sm:mt-1 md:mt-2 lg:mt-2 mb-2 sm:mb-2 md:mb-3 lg:mb-4 text-gray-800 tracking-tight">
                  {slide.heading}
                </h2>
                <p className="text-gray-600 text-xs sm:text-xs md:text-sm lg:text-base whitespace-pre-line mb-3 sm:mb-3 md:mb-4 lg:mb-6 max-w-md sm:max-w-[90%] md:max-w-[85%] lg:max-w-md mx-auto md:mx-0 leading-relaxed">
                  {slide.description}
                </p>
                <div className="flex justify-center md:justify-start">
                  <button
                    onClick={handleShopNow}
                    className={`flex items-center gap-1 sm:gap-1 md:gap-2 lg:gap-2 bg-gradient-to-r ${slide.buttonColor} text-white px-4 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2 md:py-2 lg:py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xs sm:text-xs md:text-sm lg:text-base font-medium relative overflow-hidden group`}
                  >
                    <span className="relative z-10 tracking-wide uppercase text-xs sm:text-xs md:text-sm lg:text-base">
                      SHOP NOW
                    </span>
                    <ChevronRight className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                  </button>
                </div>
              </div>

              {/* Right Side: Image Container */}
              <div className="w-full md:w-1/2 xl:w-1/2 relative flex items-center justify-center md:justify-end">
                {/* Simplified glow circle */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-full blur-3xl opacity-20"
                  style={{ backgroundColor: slide.color }}
                ></div>

                {/* Image */}
                {loadedImages[index] && (
                  <div className="relative z-20 w-full h-full flex items-center justify-center px-4 sm:px-3 md:px-4 lg:px-4">
                    <img
                      src={slide.image}
                      alt={slide.heading}
                      className="max-w-full md:max-w-[85%] lg:max-w-[80%] max-h-[200px] sm:max-h-[180px] md:max-h-[220px] lg:max-h-[400px] object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows - Visible only between 500px and 767px */}
        <>
          <button
            onClick={prevSlide}
            className="nav-button absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            className="nav-button absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>

        {/* Mobile swipe instruction - Only visible on first load for mobile */}
        {isMobile && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-xs px-3 py-1 rounded-full z-30 animate-pulse">
            Swipe to navigate
          </div>
        )}

        {/* Dots navigation */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2 z-30">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 sm:h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "w-6 sm:w-8 md:w-10 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md"
                  : "w-1.5 sm:w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default XboxSlider;
