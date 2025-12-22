import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import Auth0ProviderWithNavigate from "./auth/Auth0ProviderWithNavigate.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigate
        domain="dev-337kvjgonapcykbg.us.auth0.com"
        clientId="jIZtIdoJA8qfc1he4iDtLozRLMacE15W"
        authorizationParams={{
          redirect_uri: window.location.origin,
          // `offline_access` enables Refresh Token Rotation for SPAs (keeps users logged in across refreshes)
          // when enabled in the Auth0 dashboard for this application.
          scope: "openid profile email offline_access",
        }}
        cacheLocation="localstorage"
        useRefreshTokens={true}
        useRefreshTokensFallback={true}
      >
        <App />
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  </StrictMode>,
)
