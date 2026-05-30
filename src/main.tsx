// =============================================================================
// main.tsx
// =============================================================================
// PURPOSE: The entry point of the React application.
// This file starts everything. Vite reads this file first.
//
// React.StrictMode: Wrapping App in StrictMode enables extra warnings in
// development. It helps catch bugs early (like side effects in render).
// It has NO effect in the production build.
// =============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
