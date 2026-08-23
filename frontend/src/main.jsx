import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "./context/AuthContext.jsx"
import App from "./App.jsx"
import "./index.css"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3200,
            style: {
              background: "#0B1F33",
              color: "#fff",
              borderRadius: "10px",
              fontSize: "14px",
            },
          }}
        />
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
