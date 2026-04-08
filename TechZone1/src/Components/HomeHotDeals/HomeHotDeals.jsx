import React, { useState, useEffect } from "react";
import deal1 from "../../assets/hotdeal1.png";
import deal2 from "../../assets/hotdeal2.png";
import { useNavigate } from "react-router-dom";

export default function HomeHotDeals() {
  const [dealProducts, setDealProducts] = useState([
    {
      id: "47",
      name: "Samsung Galaxy Buds 2 Pro",
      description: "24-bit Hi-Fi sound, ANC, and ultimate comfort.",
      image: deal1,
    },
    {
      id: "28",
      name: "Xiaomi 14 Ultra 12GB+256GB",
      description: "Pro-grade Leica camera, Snapdragon 8 Gen 3, and ultra-fast charging.",
      image: deal2,
    },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHotDeals = async () => {
      try {
        // Fetch product with ID 47
        const response47 = await fetch("http://localhost:8080/product/47");
        if (!response47.ok) throw new Error("Failed to fetch product 47");
        const product47 = await response47.json();

        // Fetch product with ID 28
        const response28 = await fetch("http://localhost:8080/product/28");
        if (!response28.ok) throw new Error("Failed to fetch product 28");
        const product28 = await response28.json();

        // Map fetched data to the required format
        const hotDeals = [
          {
            id: product47.product_id.toString(),
            name: product47.name,
            description: product47.description || "Check out this amazing deal!",
            image: deal1, // Keep static image for consistency
          },
          {
            id: product28.product_id.toString(),
            name: product28.name,
            description: product28.description || "Check out this amazing deal!",
            image: deal2, // Keep static image for consistency
          },
        ];

        setDealProducts(hotDeals);
      } catch (err) {
        console.error("Error fetching hot deals:", err);
        // Fallback to static data if fetch fails
      }
    };

    fetchHotDeals();
  }, []);

  const handleClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <section className="py-3 px-3 sm:py-4 sm:px-4 md:py-5 md:px-6 lg:px-12 xl:px-16">
      <div className="flex flex-col space-y-3 sm:space-y-4 lg:space-y-0 lg:flex-row w-full lg:gap-6 xl:gap-6">
        {/* First Deal */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-indigo-100 via-indigo-200 to-white border border-indigo-300 shadow-md rounded-lg overflow-hidden">
          <div className="flex flex-row lg:flex-col xl:flex-row">
            {/* Content */}
            <div className="p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col justify-center w-2/3 xs:w-3/5 sm:w-3/5 md:w-1/2 lg:w-full xl:w-1/2">
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full w-fit mb-2 sm:mb-3 md:mb-4 xl:px-3 xl:py-1 xl:text-sm">
                INTRODUCING
              </span>
              <h2 className="text-lg xs:text-xl sm:text-xl md:text-2xl lg:text-3xl xl:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 lg:mb-3 max-w-full lg:max-w-[80%] xl:max-w-[17rem] break-words heading-font">
                {dealProducts[0].name}
              </h2>
              <p className="text-xs xs:text-sm sm:text-sm md:text-base lg:text-lg xl:text-base text-gray-600 mb-3 sm:mb-4 lg:mb-6 xl:mb-6 max-w-full lg:max-w-[80%] xl:max-w-[30rem] break-words body-font">
                {dealProducts[0].description}
              </p>
              <button
                onClick={() => handleClick(dealProducts[0].id)}
                className="w-full max-w-[12rem] py-2 sm:py-2.5 md:py-3 mt-1 sm:mt-2 xl:w-[50%] xl:py-3 bg-gradient-to-r from-[#004AAD] to-[#1D267D] text-white rounded-md shadow-md text-xs lg:text-sm xl:text-xs hover:from-[#1D267D] hover:to-[#004AAD] transition-all duration-300 transform hover:scale-105 text-center"
              >
                SHOP NOW →
              </button>
            </div>

            {/* Image */}
            <div className="w-1/3 xs:w-2/5 sm:w-2/5 md:w-1/2 lg:w-full xl:w-1/2 flex justify-center items-center p-3 sm:p-4 lg:p-6 xl:p-3">
              <img
                src={dealProducts[0].image}
                className="w-full max-w-24 xs:max-w-28 sm:max-w-36 md:max-w-48 lg:max-w-64 xl:w-72 xl:h-72 object-contain transition-transform duration-300 hover:scale-105"
                alt={dealProducts[0].name}
              />
            </div>
          </div>
        </div>

        {/* Second Deal */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-gray-900 via-indigo-950 to-amber-900 border border-indigo-800 shadow-2xl rounded-lg overflow-hidden">
          <div className="flex flex-row lg:flex-col xl:flex-row relative">
            {/* Content */}
            <div className="p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col justify-center w-2/3 xs:w-3/5 sm:w-3/5 md:w-1/2 lg:w-full xl:w-1/2">
              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-400 text-black rounded-full w-fit mb-2 sm:mb-3 md:mb-4 xl:px-3 xl:py-1 xl:text-sm">
                INTRODUCING NEW
              </span>
              <h2 className="text-lg xs:text-xl sm:text-xl md:text-2xl lg:text-3xl xl:text-3xl font-bold text-white mb-1 sm:mb-2 lg:mb-3 max-w-full lg:max-w-[80%] xl:max-w-[17rem] break-words heading-font">
                {dealProducts[1].name}
              </h2>
              <p className="text-xs xs:text-sm sm:text-sm md:text-base lg:text-lg xl:text-base text-gray-400 mb-3 sm:mb-4 lg:mb-6 xl:mb-6 max-w-full lg:max-w-[80%] xl:max-w-[30rem] break-words body-font">
                {dealProducts[1].description}
              </p>
              <button
                onClick={() => handleClick(dealProducts[1].id)}
                className="w-full max-w-[12rem] py-2 sm:py-2.5 md:py-3 mt-1 sm:mt-2 xl:w-[50%] xl:py-3 bg-gradient-to-r from-[#004AAD] to-[#1D267D] text-white rounded-md shadow-md text-xs lg:text-sm xl:text-xs hover:from-[#1D267D] hover:to-[#004AAD] transition-all duration-300 transform hover:scale-105 text-center"
              >
                SHOP NOW →
              </button>
            </div>

            {/* Image */}
            <div className="w-1/3 xs:w-2/5 sm:w-2/5 md:w-1/2 lg:w-full xl:w-1/2 flex justify-center items-center p-3 sm:p-4 lg:p-6 xl:p-3">
              <img
                src={dealProducts[1].image}
                className="w-full max-w-24 xs:max-w-28 sm:max-w-36 md:max-w-48 lg:max-w-64 xl:w-72 xl:h-72 object-contain transition-transform duration-300 hover:scale-105"
                alt={dealProducts[1].name}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}