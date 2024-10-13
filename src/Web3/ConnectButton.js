import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui';

const ConnectButton = () => {
    const { connected, disconnect, publicKey } = useWallet();
    const { setVisible } = useWalletModal();

    const handleConnectClick = () => {
        if (connected) {
            disconnect();
        } else {
            setVisible(true);
        }
    };
    console.log("disconnected",connected)

    return (
        <div className="flex justify-center items-center mt-6">
  {!connected ? (
    <button
      onClick={handleConnectClick}
      className="py-2.5 px-6 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-blue-600 hover:to-blue-500 text-white rounded-lg text-sm md:text-base font-medium shadow-md transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500"
    >
      {publicKey ? 'Disconnect Wallet' : 'Connect Wallet'}
    </button>
  ) : (
    <div className="transition-all transform hover:scale-105">
      <WalletMultiButton />
    </div>
  )}
</div>

    );
};

export default ConnectButton;
