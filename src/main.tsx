import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
     <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
        }}
        reverseOrder={false}
      />
    <App />

  </React.StrictMode>,
)
