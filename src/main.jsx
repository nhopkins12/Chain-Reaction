import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import WordChainGame from './WordChainGame.jsx'
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);