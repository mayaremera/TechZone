import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ShoppingBag,
  Zap,
  ShoppingCart,
  Search,
  Plus,
  Minus,
} from "lucide-react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../Components/CartContext/CartContext";
import SearchBar from "../SearchBar/SearchBar";
import { useAuth0 } from "@auth0/auth0-react";

export default function EyeCatchingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);

  // Auth0 hooks
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0();

  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalItems,
    getTotalPrice,
  } = useCart();

  const navigate = useNavigate();
  const location = useLocation();
  const cartRef = useRef(null);
  const searchRef = useRef(null);
  const headerRef = useRef(null);

  const categories = [
    {
      name: "ShopAll",
      path: "/shop",
      color: "#4f46e5",
      icon: <ShoppingBag className="mr-2" size={20} />,
    },
    {
      name: "Laptops",
      path: "/laptops",
      color: "#0891b2",
      icon: (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V15C20 16.1046 19.1046 17 18 17H6C4.89543 17 4 16.1046 4 15V6Z" stroke="currentColor" strokeWidth="2" />
          <path d="M8 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 17V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      name: "Gaming",
      path: "/gamingconsoles",
      color: "#7c3aed",
      icon: (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 12H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M15 13H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 11H18.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      name: "Phones",
      path: "/smartphones",
      color: "#db2777",
      icon: (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          <line x1="7" y1="7" x2="17" y2="7" stroke="currentColor" strokeWidth="2" />
          <line x1="7" y1="17" x2="17" y2="17" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      name: "Wearables",
      path: "/wearablesaccessories",
      color: "#ea580c",
      icon: (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 7H15M9 7V6C9 4.89543 9.89543 4 11 4H13C14.1046 4 15 4.89543 15 6V7M9 7V16C9 17.1046 9.89543 18 11 18H13C14.1046 18 15 17.1046 15 16V7" stroke="currentColor" strokeWidth="2" />
          <path d="M5 10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 10H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 14H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      name: "PCParts",
      path: "/pccomponents",
      color: "#16a34a",
      icon: (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="2" />
          <path d="M6 10H18" stroke="currentColor" strokeWidth="2" />
          <path d="M10 6L10 18" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      name: isLoading ? "Account" : (isAuthenticated ? "Account" : "Login"),
      path: isLoading ? "#" : (isAuthenticated ? "/account" : null), // Use placeholder path during loading
      color: "#16a34a",
      icon: (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM12 14c-4.41 0-8 2.69-8 6v2h16v-2c0-3.31-3.59-6-8-6z" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      onClick: isLoading ? null : (!isAuthenticated ? () => loginWithRedirect() : null), // Don't trigger login during loading
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      const headerHeight = headerRef.current?.clientHeight || 60;
      setScrollPosition(currentScrollPos);
      setIsHeaderFixed(currentScrollPos > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target))
        setIsCartOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target))
        setIsSearchOpen(false);
    };
    if (isCartOpen || isSearchOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCartOpen, isSearchOpen]);

  useEffect(() => {
    setIsCartOpen(false);
    setIsSearchOpen(false);
    setIsMenuOpen(false);
  }, [location]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const headerHeight = headerRef?.current?.clientHeight || 60;

  return (
    <>
      <header
        ref={headerRef}
        className={`z-40 w-full overflow-hidden px-4 sm:px-8 md:px-16 ${
          isHeaderFixed
            ? "fixed md:static lg:static top-0 left-0 shadow-lg transition-all duration-0 ease-in"
            : "relative"
        }`}
        style={{ transform: "translateY(0)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-950 shadow-xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-0 top-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxkZWZzPgogICAgPHBhdHRlcm4gaWQ9ImhleGFnb25zIiB3aWR0aD0iNTAiIGhlaWdodD0iNDMuMyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDMwKSI+CiAgICAgIDxwYXRoIGQ9Ik0yNSAyOC41NjY1TDEyLjUgNDMuMyAwIDI4LjU2NjUgMTIuNSAxMy44MzMgMjUgMjguNTY2NXpNMzcuNSA0My4zTDI1IDI4LjU2NjUgMzcuNSAxMy44MzMgNTAgMjguNTY2NSAzNy41IDQzLjN6IiBzdHJva2U9IiNmZmYiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMS4yIi8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjaGV4YWdvbnMpIiAvPgo8L3N2Zz4K')]" />
          </div>
        </div>
        <div className="container mx-auto relative z-10">
          <div className="hidden lg:flex items-center">
            <div className="flex items-center mr-8">
              <Zap className="text-white h-7 w-7" />
              <span className="ml-2 text-white font-bold text-xl">TechZone</span>
            </div>
            <nav className="flex">
              {categories.map((category, index) => (
                <NavLink
                  key={index}
                  to={category.path}
                  className={({ isActive }) =>
                    `relative group overflow-hidden py-5 px-4 text-white flex items-center transition-all duration-300 ${
                      isActive ? "font-bold" : "font-medium"
                    }`
                  }
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={(e) => {
                    if (category.onClick) {
                      e.preventDefault(); // Prevent navigation for Login
                      category.onClick(); // Trigger loginWithRedirect
                    }
                    setIsMenuOpen(false);
                  }}
                >
                  <span className="transition-transform duration-300 group-hover:scale-110 flex items-center">
                    {category.icon}
                    <span>{category.name}</span>
                  </span>
                  <span
                    className={`absolute bottom-0 left-0 w-full h-1 transform transition-all duration-300 ${
                      hoveredIndex === index ? "translate-y-0" : "translate-y-full"
                    }`}
                    style={{ backgroundColor: category.color }}
                  />
                  {hoveredIndex === index && (
                    <span
                      className="absolute inset-0 opacity-20 rounded-full blur-xl transition-opacity duration-300"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:hidden flex justify-between items-center px-4 py-3 relative z-20">
          <div className="text-white font-bold text-xl flex items-center">
            <Zap className="mr-2" size={24} />
            <span>TechZone</span>
          </div>

          <div className="flex items-center space-x-3 z-10">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors sm:hidden"
              aria-label="Search"
            >
              <Search className="z-10" size={20} />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors sm:hidden"
                aria-label="Cart"
              >
                <ShoppingCart size={20} />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>

            <button
              className="text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {isSearchOpen && (
        <div
          ref={searchRef}
          className="fixed left-0 right-0 bg-white z-30 shadow-lg p-4"
          style={{ top: isHeaderFixed ? headerHeight : headerHeight }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Search</h3>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <SearchBar />
        </div>
      )}

      {isCartOpen && (
        <div
          ref={cartRef}
          className="fixed right-0 w-full sm:w-96 bg-white rounded-lg shadow-xl z-30 border border-gray-100 max-h-[80vh] overflow-auto"
          style={{ top: isHeaderFixed ? headerHeight : headerHeight }}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Shopping Cart</h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Your cart is empty</p>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-4 border-b">
                      <img
                        src={item.image1}
                        alt={item.name}
                        className="w-16 h-16 object-contain rounded bg-gray-50 p-1"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-800">{item.name}</h4>
                        <p className="text-indigo-600 font-bold">{item.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-md border hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="w-3 h-3 text-gray-600" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-md border hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-gray-800">Total:</span>
                    <span className="text-indigo-600 font-bold">
                      {getTotalPrice().toLocaleString()} EGP
                    </span>
                  </div>
                  <Link
                    to="/cart"
                    onClick={() => setIsCartOpen(false)}
                    className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-2 rounded-md hover:from-blue-700 hover:to-indigo-700 transition-colors"
                  >
                    View Cart
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
          onClick={toggleMenu}
        />
      )}

      <div
        className={`fixed top-0 right-0 w-4/5 max-w-sm h-full bg-gradient-to-b from-blue-700 to-indigo-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-3 bg-white/10 backdrop-blur-sm">
          <h2 className="text-white font-bold text-xl flex items-center">
            <Zap className="mr-2" size={20} />
            <span>TechZone</span>
          </h2>
          <button
            className="text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={toggleMenu}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="py-2 overflow-y-auto max-h-screen">
          {categories.map((category, index) => (
            <NavLink
              key={index}
              to={category.path}
              className={({ isActive }) =>
                `text-white font-medium px-6 py-4 flex items-center transition-all duration-200 ${
                  isActive ? "bg-white/20 font-bold" : "hover:bg-white/10"
                }`
              }
              style={{
                borderLeft: ({ isActive }) =>
                  isActive ? `4px solid ${category.color}` : "4px solid transparent",
              }}
              onClick={(e) => {
                if (category.onClick) {
                  e.preventDefault(); // Prevent navigation for Login
                  category.onClick(); // Trigger loginWithRedirect
                }
                setIsMenuOpen(false);
              }}
            >
              {category.icon}
              <span>{category.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}