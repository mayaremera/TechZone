import React, { createContext, useContext, useEffect, useState } from "react";
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
import { API_URL } from "./config";
import { getAuthToken } from "./authToken";

const AuthSyncContext = createContext({
  isUserSynced: false,
  syncedRole: null,
});

function Auth0ProtectedRoute({ element: Component, requiredRole = "customer" }) {
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0();
  const { isUserSynced, syncedRole } = useContext(AuthSyncContext);
  const [authError, setAuthError] = useState(null);
  const currentRole = (syncedRole || "").toLowerCase().trim();

  if (isLoading || (isAuthenticated && !isUserSynced && !authError)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: "https://ecommerce-api",
        scope: "openid profile email offline_access",
      },
      appState: { returnTo: window.location.pathname },
    }).catch((err) => {
      console.error("Login redirect failed:", err);
      setAuthError("Failed to initiate login. Please check Auth0 configuration.");
    });
    return null;
  }

  if (requiredRole === "admin" && currentRole !== "admin") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">Access Denied</p>
          <p>You do not have admin privileges.</p>
          <p className="mt-2 text-sm text-gray-600">Current role: {currentRole || "unknown"}</p>
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

export default function App() {
  const { isAuthenticated, user, getAccessTokenSilently, getIdTokenClaims, isLoading, loginWithRedirect, error: authError } = useAuth0();
  const [isUserSynced, setIsUserSynced] = useState(false);
  const [syncedRole, setSyncedRole] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const maxAttempts = 3;
  const currentSub = user?.sub || null;

  useEffect(() => {
    setIsUserSynced(false);
    setSyncedRole(null);
    setSyncAttempts(0);
    setSyncError(null);
  }, [currentSub]);

  const syncUserWithBackend = async (user) => {
    console.log("Starting syncUserWithBackend for user:", user.email);
    if (syncAttempts >= maxAttempts) {
      console.error("Max sync attempts reached:", syncAttempts);
      setSyncError("Failed to save this account in the database. Retry login.");
      return;
    }

    let token;
    try {
      token = await getAuthToken({ getIdTokenClaims, getAccessTokenSilently });
    } catch (tokenError) {
      console.error("Token refresh failed:", tokenError);
      setSyncError("Failed to authenticate. Please try again.");
      setSyncAttempts((prev) => prev + 1);
      return;
    }

    if (!token) {
      setSyncError("No Auth0 token available to register this user.");
      setSyncAttempts((prev) => prev + 1);
      return;
    }

    try {
      console.log("Sending POST request to /api/register-user...");
      const response = await fetch(`${API_URL}/api/register-user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            sub: user.sub,
            email: user.email || user[`${import.meta.env.VITE_AUTH0_AUDIENCE}/email`],
            name: user.name || user.nickname || user.email || "Unknown",
          },
        }),
      });

      const responseData = await response.json();
      console.log("Register response:", response.status, responseData);

      if (!response.ok) {
        throw new Error(`Sync failed: ${responseData.message || "Unknown error"}`);
      }

      let role = (responseData.role || "").toLowerCase().trim();
      if (!role) {
        const meResponse = await fetch(`${API_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meResponse.ok) {
          const me = await meResponse.json();
          console.log("Me response:", me);
          role = (me.role || "").toLowerCase().trim();
        }
      }

      console.log("Resolved backend role:", role || "customer");
      setSyncedRole(role || "customer");
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
    if (isAuthenticated && user && !isUserSynced && !isLoading && syncAttempts < maxAttempts) {
      const timer = setTimeout(() => {
        console.log("Triggering syncUserWithBackend...");
        syncUserWithBackend(user);
      }, syncAttempts === 0 ? 0 : 800);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isUserSynced, isLoading, syncAttempts, getAccessTokenSilently, getIdTokenClaims]);

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
    <AuthSyncContext.Provider value={{ isUserSynced, syncedRole }}>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthSyncContext.Provider>
  );
}
