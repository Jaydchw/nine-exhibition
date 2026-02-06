import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import ArtistPage from "./ArtistPage.tsx";
import ScrollToHash from "./ScrollToHash.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/artists/:slug" element={<ArtistPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
