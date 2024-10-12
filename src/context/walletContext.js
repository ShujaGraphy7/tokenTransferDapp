import { createContext ,useContext} from "react";

const WalletContext = createContext(undefined)

export const WalletApi = ({ children }) => {
   



    return (
        <WalletContext.Provider value={{
          
        }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWalletContext = () => useContext(WalletContext);


export default WalletContext;