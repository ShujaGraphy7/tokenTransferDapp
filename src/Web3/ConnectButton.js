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
        <>
            {!connected ? <button
                onClick={handleConnectClick}
                className='py-2.5 px-4 bg-neutral-800 rounded-lg text-white text-xs md:text-base'
            >
                {publicKey ? 'Disconnect Wallet' : 'Connect Wallet'}

            </button>
                :
                <WalletMultiButton />}

        </>
    );
};

export default ConnectButton;
