// The main entry point of the application. It imports the necessary dependencies, including React, ReactDOM, the App component, and global styles. It then uses ReactDOM's createRoot method to render the App component inside a StrictMode wrapper, which helps identify potential problems in the application during development.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
// The main entry point of the application. It imports the necessary dependencies, including React, ReactDOM, the App component, and global styles. It then uses ReactDOM's createRoot method to render the App component inside a StrictMode wrapper, which helps identify potential problems in the application during development.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
