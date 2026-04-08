import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HomeGridProductsSection() {
  const navigate = useNavigate();
  const [gridData, setGridData] = useState({
    flashSale: { title: "FLASH SALE TODAY", products: [] },
    bestSellers: { title: "BEST SELLERS", products: [] },
    topRated: { title: "TOP RATED", products: [] },
    newArrival: { title: "NEW ARRIVAL", products: [] },
  });

  useEffect(() => {
    fetch("http://localhost:8080/products")
      .then(response => response.json())
      .then(data => {
        // Shuffle array
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        
        // Get 12 random products (3 for each section)
        const randomProducts = shuffled.slice(0, 12);
        
        // Update grid data with random products
        setGridData({
          flashSale: {
            title: "FLASH SALE TODAY",
            products: randomProducts.slice(0, 3).map(p => ({
              ...p,
              price: p.price.toLocaleString()
            }))
          },
          bestSellers: {
            title: "BEST SELLERS",
            products: randomProducts.slice(3, 6).map(p => ({
              ...p,
              price: p.price.toLocaleString()
            }))
          },
          topRated: {
            title: "TOP RATED",
            products: randomProducts.slice(6, 9).map(p => ({
              ...p,
              price: p.price.toLocaleString()
            }))
          },
          newArrival: {
            title: "NEW ARRIVAL",
            products: randomProducts.slice(9, 12).map(p => ({
              ...p,
              price: p.price.toLocaleString()
            }))
          },
        });
      })
      .catch(error => {
        console.error('Error fetching products:', error);
      });
  }, []);

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  return (
    <section className="mt-5">
      <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(gridData).map(([key, { title, products }]) => (
            <section
              key={key}
              className="w-full bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-100 p-4">
                {title}
              </h2>
              <div className="space-y-4 p-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="group flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-md bg-gray-100">
                      <img
                        src={product.image1}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold heading-font text-gray-900 leading-tight mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-blue-500 group-hover:text-blue-600 transition-colors duration-200">
                        ${product.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}