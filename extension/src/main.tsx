import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Guestbook } from "@/components/Guestbook";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Guestbook />
  </StrictMode>,
);
