import React from "react";
import { Auth0Provider } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const Auth0ProviderWithNavigate = ({ children, ...auth0Props }) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState) => {
    const returnTo = appState?.returnTo ?? "/chat";
    navigate(returnTo, { replace: true });
  };

  return (
    <Auth0Provider onRedirectCallback={onRedirectCallback} {...auth0Props}>
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithNavigate;
