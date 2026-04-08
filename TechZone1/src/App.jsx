import React, { useEffect, useState } from "react";
import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Home from "./Pages/Home/Home";
import Layout from "./Pages/Layout/Layout";
import ErrorPage from "./Pages/ErrorPage/ErrorPage";
import Shop from "./Pages/Shop/Shop";
import Sitemap from "./Components/Sitemap/Sitemap";
import ProductDetails from "./Components/ProductDetails/ProductDetails";
import Cart from "./Pages/Cart/Cart";
import Checkout from "./Pages/Checkout/Checkout";
import ThankYou from "./Pages/ThankYou/ThankYou";
import Account from "./Pages/Account/Account";
import ProductCard from "./Components/ProductCard/ProductCard";
import Laptops from "./Pages/Laptops/Laptops";
import Gaming from "./Pages/Gaming/Gaming";
import Smartphones from "./Pages/Smartphones/Smartphones";
import WearablesAccessories from "./Pages/WearablesAccessories/WearablesAccessories";
import PCComponents from "./Pages/PCComponents/PCComponents";
import AboutUs from "./Pages/AboutUs/AboutUs";
import Customersupport from "./Pages/Customersupport/Customersupport";
import AdminDashboard from "./Pages/AdminDashboard/AdminDashboard";
import { CartProvider } from "./Components/CartContext/CartContext";

// Protected Route Component
function Auth0ProtectedRoute({ element: Component, requiredRole = "customer" }) {
  const { isAuthenticated, loginWithRedirect, isLoading, user, getAccessTokenSilently } = useAuth0();
  const [role, setRole] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: "https://ecommerce-api",
              scope: "openid profile email read:current_user offline_access read:users update:users",
            },
          });
          const response = await fetch("http://localhost:8080/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.status === 403) {
            setRole("customer"); // Assume customer if access denied
          } else if (response.ok) {
            const users = await response.json();
            const currentUser = users.find(u => u.email === user.email);
            setRole(currentUser?.role || "customer");
          } else {
            throw new Error("Failed to fetch user role");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole("customer"); // Fallback to customer
        }
      }
    };
    if (isAuthenticated) fetchUserRole();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  if (isLoading || (isAuthenticated && role === null && !authError)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, initiating login...");
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: "https://ecommerce-api",
        scope: "openid profile email read:current_user offline_access read:users update:users",
      },
      appState: { returnTo: window.location.pathname },
    }).catch(err => {
      console.error("Login redirect failed:", err);
      setAuthError("Failed to initiate login. Please check Auth0 configuration.");
    });
    return null;
  }

  if (role !== requiredRole && requiredRole === "admin") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">Access Denied</p>
          <p>You do not have admin privileges.</p>
          <button
            onClick={() => window.location.href = "/"}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return <Component />;
}

export default function App() {
  const { isAuthenticated, user, getAccessTokenSilently, isLoading, loginWithRedirect, error: authError } = useAuth0();
  const [isUserSynced, setIsUserSynced] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const maxAttempts = 3;

  const syncUserWithBackend = async (user) => {
    console.log("Starting syncUserWithBackend for user:", user.email);
    if (syncAttempts >= maxAttempts) {
      console.error("Max sync attempts reached:", syncAttempts);
      setSyncError("Failed to sync user after multiple attempts. Please log in again.");
      loginWithRedirect();
      return;
    }

    let token;
    try {
      console.log("Fetching access token...");
      token = await getAccessTokenSilently({
        authorizationParams: {
          audience: "https://ecommerce-api",
          scope: "openid profile email read:current_user offline_access read:users update:users",
        },
      });
      console.log("Access token obtained successfully:", token.substring(0, 10) + "..."); // Log first 10 chars for brevity
    } catch (tokenError) {
      console.error("Token refresh failed:", tokenError);
      setSyncError("Failed to authenticate. Please try again.");
      setSyncAttempts((prev) => prev + 1);
      return;
    }

    try {
      console.log("Sending POST request to /api/register-user...");
      const response = await fetch("http://localhost:8080/api/register-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            sub: user.sub,
            email: user.email,
            name: user.name || user.nickname || "Unknown",
          },
        }),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        console.error("Sync failed with response:", responseData);
        throw new Error(`Sync failed: ${responseData.message || "Unknown error"}`);
      }

      console.log("User sync successful:", user.email);
      setIsUserSynced(true);
      setSyncAttempts(0);
      setSyncError(null);
    } catch (error) {
      console.error("Error syncing user:", error);
      setSyncError(error.message);
      setSyncAttempts((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && !isUserSynced && !isLoading) {
      console.log("Triggering syncUserWithBackend...");
      syncUserWithBackend(user);
    } else {
      console.log("Not triggering syncUserWithBackend. Conditions:", {
        isAuthenticated,
        user: !!user,
        isUserSynced,
        isLoading,
      });
    }
  }, [isAuthenticated, user, isUserSynced, isLoading, getAccessTokenSilently]);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: "/shop", element: <Shop /> },
        { path: "/laptops", element: <Laptops /> },
        { path: "/gamingconsoles", element: <Gaming /> },
        { path: "/smartphones", element: <Smartphones /> },
        { path: "/wearablesaccessories", element: <WearablesAccessories /> },
        { path: "/pccomponents", element: <PCComponents /> },
        { path: "/sitemap", element: <Sitemap /> },
        { path: "/product/:id", element: <ProductDetails /> },
        { path: "/card", element: <ProductCard /> },
        { path: "/cart", element: <Cart /> },
        { path: "/aboutus", element: <AboutUs /> },
        { path: "/customersupport", element: <Customersupport /> },
        {
          path: "/checkout",
          element: <Auth0ProtectedRoute element={Checkout} />,
        },
        {
          path: "/thankyou",
          element: <Auth0ProtectedRoute element={ThankYou} />,
        },
        {
          path: "/account",
          element: <Auth0ProtectedRoute element={Account} />,
        },
        {
          path: "/adminlogin",
          element: <Auth0ProtectedRoute element={AdminDashboard} requiredRole="admin" />,
        },
        { path: "*", element: <ErrorPage /> },
      ],
    },
  ]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Authentication Error</p>
          <p>{authError.message}</p>
          <button
            onClick={() => loginWithRedirect()}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Login Again
          </button>
        </div>
      </div>
    );
  }

  if (syncError && syncAttempts >= maxAttempts) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Sync Error</p>
          <p>{syncError}</p>
          <button
            onClick={() => {
              setSyncAttempts(0);
              setSyncError(null);
              syncUserWithBackend(user);
            }}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
}