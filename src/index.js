import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { WalletApi } from './context/walletContext';
import WalletConnectionProvider from './Web3/WalletConnectionProvider';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <BrowserRouter>
    <WalletConnectionProvider>
      <WalletApi>
        <App />
      </WalletApi>
    </WalletConnectionProvider>
  </BrowserRouter>


);

