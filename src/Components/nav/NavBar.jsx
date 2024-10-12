import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import "./wallet.css"

const NavBar = () => {
    const { publicKey, connected } = useWallet()
    console.log("connected wallet info", publicKey, connected)
    return (
        <>
            <nav className="py-4 flex justify-between items-center">

                <div className='flex items-center gap-4'>


                </div>

                <WalletMultiButton />
                {/* <WalletDisconnectButton/> */}


            </nav>
        </>

    )
}

export default NavBar
