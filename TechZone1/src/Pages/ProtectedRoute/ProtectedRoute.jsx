// import React from "react";
// import { Outlet, Navigate } from "react-router-dom"; // Add Navigate for cleaner redirect
// import { useAuth0 } from "@auth0/auth0-react";

// const ProtectedRoute = () => {
//   const { isAuthenticated, isLoading, error, loginWithRedirect } = useAuth0();

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="flex justify-center items-center h-screen text-red-500">
//         Authentication Error: {error.message}
//       </div>
//     );
//   }

//   // Not authenticated? Redirect to login
//   if (!isAuthenticated) {
//     loginWithRedirect();
//     return null; // Return null while redirecting
//   }


//   // Authenticated? Render the protected content
//   return <Outlet />;
// };

// export default ProtectedRoute;