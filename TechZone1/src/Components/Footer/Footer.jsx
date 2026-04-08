import React from "react";
import { Facebook, Instagram, Twitter, Zap } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="relative py-8 md:py-10 px-4 sm:px-6 md:px-16 bg-gradient-to-r from-blue-800 via-indigo-900 to-purple-950 shadow-xl text-gray-200 font-sans">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-0 top-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxkZWZzPgogICAgPHBhdHRlcm4gaWQ9ImhleGFnb25zIiB3aWR0aD0iNTAiIGhlaWdodD0iNDMuMyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDMwKSI+CiAgICAgIDxwYXRoIGQ9Ik0yNSAyOC41NjY1TDEyLjUgNDMuMyAwIDI4LjU2NjUgMTIuNSAxMy44MzMgMjUgMjguNTY2NXpNMzcuNSA0My4zTDI1IDI4LjU2NjUgMzcuNSAxMy44MzMgNTAgMjguNTY2NSAzNy41IDQzLjN6IiBzdHJva2U9IiNmZmYiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMS4yIi8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjaGV4YWdvbnMpIiAvPgo8L3N2Zz4K')]" />
      </div>

      {/* Main footer content with improved grid */}
      <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* Company Info */}
        <div className="flex flex-col items-start z-10">
        <div className="flex items-center mb-4">
            <Zap className="text-white h-6 w-6 md:h-7 md:w-7" />
            <span className="ml-2 text-white font-bold text-2xl md:text-3xl">
              TechZone
            </span>
          </div>
          <p className="text-sm md:text-md text-gray-300 ">Customer Support:</p>
          <p className="text-base md:text-lg font-normal text-white">
            01270545289
          </p>
          <a
            href="https://www.youssefashour.com"
            className="text-[#fff200] font-normal hover:underline text-base md:text-lg cursor-pointer break-words"
            target="_blank"
          >
            https://www.youssefashour.com
          </a>

          {/* Social Icons */}
          <div className="flex gap-4 mt-4">
            <Facebook className="w-6 h-6 md:w-7 md:h-7 text-gray-300 hover:text-white transition cursor-pointer" />
            <Instagram className="w-6 h-6 md:w-7 md:h-7 text-gray-300 hover:text-white transition cursor-pointer" />
            <Twitter className="w-6 h-6 md:w-7 md:h-7 text-gray-300 hover:text-white transition cursor-pointer" />
          </div>
        </div>

        {/* Categories */}
        <div className="z-10">
          <h3 className="text-white text-lg md:text-2xl font-semibold mb-3 md:mb-4">
            Top Categories
          </h3>
          <ul className="space-y-1 md:space-y-2 text-sm md:text-md text-gray-300">
            <li>
              <Link to="/laptops" className="hover:text-[#fff200] transition">
                Laptops
              </Link>
            </li>
            <li>
              <Link
                to="/gamingconsoles"
                className="hover:text-[#fff200] transition"
              >
                Gaming
              </Link>
            </li>
            <li>
              <Link to="/smartphones" className="hover:text-[#fff200] transition">
                Phones
              </Link>
            </li>
            <li>
              <Link
                to="/wearablesaccessories"
                className="text-[#fff200] hover:text-[#fff200] transition"
              >
                Wearables
              </Link>
            </li>
            <li>
              <Link to="/pccomponents" className="hover:text-[#fff200] transition">
                PC Parts
              </Link>
            </li>
          </ul>
          <Link
            to="/shop"
            className="text-[#fff200] hover:text-[#fff200] text-sm md:text-md mt-2 inline-block transition"
          >
            Browse All Products →
          </Link>
        </div>

        {/* Quick Links */}
        <div className="z-10">
          <h3 className="text-white text-lg md:text-2xl font-semibold mb-3 md:mb-4">
            Quick Links
          </h3>
          <ul className="space-y-1 md:space-y-2 text-sm md:text-md text-gray-300">
            <li>
              <Link to="/cart" className="hover:text-[#fff200] transition">
                Shopping Cart
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-[#fff200] transition">
                Wishlist
              </Link>
            </li>
            <li>
              <Link
                to="/customersupport"
                className="hover:text-[#fff200] transition"
              >
                Customer Support
              </Link>
            </li>
            <li>
              <Link to="/aboutus" className="hover:text-[#fff200] transition">
                About Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Popular Tags */}
        {/* <div className="z-10">
          <h3 className="text-white text-lg md:text-2xl font-semibold mb-3 md:mb-4">
            Popular Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Game",
              "iPhone",
              "Asus Laptop",
              "Macbook",
              "SSD",
              "Graphics Card",
              "Power Bank",
              "Speaker",
              "Samsung",
            ].map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-black/50 backdrop-blur-sm text-gray-200 rounded-lg hover:bg-black/70 transition cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div> */}
      </div>

      {/* Bottom */}
      <div className="border-t border-white/20 mt-6 pt-4 text-center text-xs sm:text-sm md:text-md text-gray-300">
        Youssef & Mayar © 2024. Design by Besmeallahe Masha2allah Team
      </div>
    </footer>
  );
}
