export async function getAuthToken({ getIdTokenClaims, getAccessTokenSilently }) {
  try {
    const claims = await getIdTokenClaims();
    if (claims?.__raw) {
      return claims.__raw;
    }
  } catch (error) {
    console.warn("Could not read Auth0 ID token:", error);
  }

  return getAccessTokenSilently({
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_AUDIENCE || "https://ecommerce-api",
      scope: "openid profile email offline_access",
    },
  });
}
