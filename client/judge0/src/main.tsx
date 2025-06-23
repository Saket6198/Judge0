import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from "react-router";
import { store } from './store/store.ts';
import { Provider } from 'react-redux';
import { ToastContainer } from "react-toastify";

createRoot(document.getElementById('root')!).render(
  
  <StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <App />
      <ToastContainer
        theme="dark"
        position="top-right"
        autoClose={4000}
        hideProgressBar={true}
        pauseOnHover={false}
        
      />
    </BrowserRouter>
  </Provider>
  </StrictMode>,
)
