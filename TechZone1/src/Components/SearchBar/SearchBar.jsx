import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch all products from API when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:8080/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        // Map backend data to match frontend expectations
        const formattedProducts = data.map((product) => ({
          id: product.product_id,
          name: product.name,
          price: product.price,
        }));
        setAllProducts(formattedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  // Reset search term when location changes
  useEffect(() => {
    setSearchTerm("");
    setIsSearching(false);
  }, [location.pathname]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      setIsSearching(true);
      const results = allProducts.filter((product) =>
        product.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [searchTerm, allProducts]);

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearching(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
    setSearchTerm("");
    setIsSearching(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() && searchResults.length > 0) {
      handleProductClick(searchResults[0]);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-4 pr-12 py-2.5 rounded-lg border-2 border-indigo-100 focus:border-indigo-300 focus:outline-none placeholder-gray-400 bg-white/90 backdrop-blur-sm transition-all duration-300 shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-0 top-0 h-full px-4 flex items-center justify-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </form>

      {isSearching && searchResults.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
          <ul className="max-h-72 overflow-y-auto">
            {searchResults.map((product) => (
              <li
                key={product.id}
                className="px-4 py-3 hover:bg-indigo-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                onClick={() => handleProductClick(product)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{product.name}</span>
                  {product.price && (
                    <span className="text-indigo-600 font-bold">
                      {typeof product.price === "number"
                        ? `$${product.price.toLocaleString()}`
                        : product.price}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;