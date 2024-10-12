import React from 'react'
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { UnsafeBurnerWalletAdapter, PhantomWalletAdapter, CoinbaseWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
    WalletModalProvider
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");
const WalletConnectionProvider = ({children}) => {
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking --
    // Only the wallets you configure here will be compiled into your application
    
    const wallets = useMemo(() =>
        [new UnsafeBurnerWalletAdapter(),
        new PhantomWalletAdapter(),
        new CoinbaseWalletAdapter()
        ], []);
        
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default WalletConnectionProvider
