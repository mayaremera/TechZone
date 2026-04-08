import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Home, ShoppingBag, Users, FileText, HeartHandshake, ShieldCheck, Building2, Package, HeadphonesIcon, UserCircle } from 'lucide-react';

const SitemapDiagram = () => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const Section = ({ title, items = [], icon: Icon, color = "blue" }) => {
    const isExpanded = expandedSections[title];
    
    return (
      <div className="group relative">
        <div 
          className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all
            hover:shadow-lg bg-white border border-gray-200 hover:border-${color}-500`}
          onClick={() => toggleSection(title)}
        >
          <div className={`p-2 rounded-full bg-${color}-100`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
          </div>
          <span className="font-semibold text-gray-800">{title}</span>
          {items.length > 0 && (
            <div className="ml-auto">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </div>
          )}
        </div>
        
        {isExpanded && items.length > 0 && (
          <div className="mt-2 ml-8 pl-4 border-l-2 border-gray-200 space-y-2">
            {items.map((item, index) => (
              <div 
                key={index}
                className="p-2 rounded hover:bg-gray-50 text-gray-600 transition-colors"
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">E-commerce Sitemap</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Section 
            title="Homepage" 
            icon={Home}
            color="blue"
            items={[
              "Header",
              "Hero Section",
              "Best Deals",
              "Categories",
              "Featured Products",
              "Marketing Section",
              "Accessories Section",
              "Discount Section",
              "Grid Product Section",
              "Newsletter Section",
              "Footer"
            ]}
          />
          
          <Section 
            title="Shopping" 
            icon={ShoppingBag}
            color="green"
            items={[
              "Shop Page",
              "Single Product Page",
              "Track Order",
              "Wishlist",
              "Cart",
              "Checkout",
              "Thank You Page"
            ]}
          />
          
          <Section 
            title="Authentication" 
            icon={Users}
            color="purple"
            items={[
              "Login",
              "Register",
              "Forget Password",
              "Reset Password",
              "Verify Email",
              "404 Page"
            ]}
          />
          
          <Section 
            title="Account Management" 
            icon={UserCircle}
            color="indigo"
            items={[
              "Dashboard",
              "Order History",
              "Track Order",
              "Cart",
              "Wishlist",
              "Cards and Addresses",
              "Settings",
              "Logout"
            ]}
          />
          
          <Section 
            title="Help & Support" 
            icon={HeadphonesIcon}
            color="red"
            items={[
              "FAQs/Help Center",
              "Contact Us",
              "Size Guide",
              "Shipping Information",
              "Return & Refund Policy"
            ]}
          />
          
          <Section 
            title="Legal" 
            icon={ShieldCheck}
            color="yellow"
            items={[
              "Privacy Policy",
              "Terms & Conditions",
              "Cookie Policy",
              "Terms of Service"
            ]}
          />
          
          <Section 
            title="Company" 
            icon={Building2}
            color="pink"
            items={[
              "About Us",
              "Blog/News Section",
              "Career Page",
              "Store Locator"
            ]}
          />
          
          <Section 
            title="Products" 
            icon={Package}
            color="orange"
            items={[
              "Compare Products",
              "Product Category Landing Pages",
              "Sale/Offers Page",
              "New Arrivals"
            ]}
          />
          
          <Section 
            title="Customer Service" 
            icon={HeartHandshake}
            color="teal"
            items={[
              "Live Chat Interface",
              "Support Ticket System",
              "Customer Reviews/Testimonials"
            ]}
          />
          
          <Section 
            title="Additional Features" 
            icon={FileText}
            color="cyan"
            items={[
              "Download Invoice",
              "Save Payment Methods",
              "Notification Preferences",
              "Order Cancellation",
              "Return Request Form"
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default SitemapDiagram;