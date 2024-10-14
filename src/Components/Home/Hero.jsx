import React, { useState, useEffect, useMemo, useRef } from "react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import TokenModal from "../TokenModal";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import TransactionMessage from "../../utils/TransactionMessage";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const MAX_TRANSACTION_COUNT = 50;
const QUICKNODE_RPC_Mainnet = "https://orbital-morning-wind.solana-mainnet.quiknode.pro/7887b7763b7b75a4abf73f64907bcc595acf8d85";
const connection = new Connection(QUICKNODE_RPC_Mainnet);

const Hero = () => {
  const { publicKey, signTransaction, connected } = useWallet();
  // const { connection } = useConnection()


  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiverAddress, setReceiverAddress] = useState("");
  const receiverAddressRef = useRef(""); // Ref to track latest address
  const topRef = useRef(null);
  const [defaultValues, setDefaultValues] = useState({});

  const [selectedTokens, setSelectedTokens] = useState({});
  const [defaultAmount, setDefaultAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionCount, setTransactionCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [defaultError,setDefaultError] = useState(false);
  const [refresh,setRefresh] = useState(false)

  useEffect(() => {
    setErrorMessage(
      !receiverAddress ? "Enter Valid Reciever Address to select Tokens" : ""
    );
    receiverAddressRef.current = receiverAddress;
    setTransactionCount(0)
    setSelectedTokens({});
  }, [receiverAddress]);



  useEffect(() => {
    if (!publicKey  ) return;

    // let checkAddress = "CRiZmkEEYaoERGonNz5iWxKjpYRCnCrryCfqMwqyyNMf"


    const fetchWalletTokens = async () => {
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          new PublicKey(publicKey),
          {
            programId: new PublicKey(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            ),
          }
        );

        const tokenDetails = await Promise.all(
          tokenAccounts.value.map(async (accountInfo) => {
            const { mint: mintAddress, tokenAmount } =
              accountInfo.account.data.parsed.info;
            const mintAccount = await getMint(
              connection,
              new PublicKey(mintAddress)
            );
            const decimals = mintAccount.decimals;
console.log(accountInfo)
            return {
              tokenAddress: accountInfo.pubkey.toString(),
              tokenName: `Token (${mintAddress.slice(0, 5)}...)`,
              tokenAmount: tokenAmount.uiAmount.toFixed(decimals),
              address: mintAddress,
              decimals,
            };
          })
        );

        setTokens(tokenDetails);
        const initialDefaults = Object.fromEntries(
          tokenDetails.map((token) => [token.tokenAddress, ""])
        );
        setDefaultValues(initialDefaults);
        setTokenLoading(false)
      } catch (error) {
        console.error("Error fetching tokens:", error);
        setErrorMessage("Failed to fetch tokens. Please try again.");
        setTokenLoading(false)
      }
    };

    fetchWalletTokens();
    //console.log(tokens);
  }, [publicKey,refresh]);

  const openModal = (token) => {
    setSelectedToken(token);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedToken(null);
  };

  const handleAmountChange = (e) => {
    setDefaultError(false);
    const value = e.target.value;
    let amountToSet = value >= 0 ? value : 0;
    setDefaultAmount(amountToSet);
    const updatedAmounts = Object.fromEntries(
      tokens.map((token) => [token.tokenAddress, amountToSet])
    );
    setDefaultValues(updatedAmounts);
    if (value < 0) {
      setErrorMessage("Amount cannot be negative.");
    } else {
      setErrorMessage(""); 
    }
  };
  const handleUpdateToken = (tokenAddress, newAmount) => {
    setDefaultValues((prev) => ({
      ...prev,
      [tokenAddress]: newAmount,
    }));
    closeModal();
  };

 
  

  
 
 
  const sendTokens = async () => {
    setErrorMessage(""); // Clear previous error messages

    if (
      !connected ||
      !receiverAddressRef.current ||
      !parseFloat(defaultAmount)
      
    ) {
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: "smooth" }); // Scroll to the ref
      }
      setDefaultError(true);
      setErrorMessage("Please provide valid default amount.");
      return;
    }

    try {
      setLoading(true);
      const transaction = new Transaction();
      const receiverPubKey = new PublicKey(receiverAddressRef.current);
      let transactionCount = 0;

      const selectedTokensArray = tokens.filter(
        (token) => selectedTokens[token.tokenAddress]
      );

      for (const token of selectedTokensArray) {
       
        const amount = parseFloat(defaultValues[token.tokenAddress]) * 10 ** token.decimals;
      
        const senderTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(token.address),
          publicKey
        );
        const receiverTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(token.address),
          receiverPubKey
        );

        const accountInfo = await connection.getAccountInfo(
          receiverTokenAccount
        );
       
        if (!accountInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              receiverTokenAccount,
              receiverPubKey,
              new PublicKey(token.address)
            )
          );
        }

        transaction.add(
          createTransferInstruction(
            senderTokenAccount,
            receiverTokenAccount,
            publicKey,
            amount,
            []
          )
        );

        transactionCount += accountInfo ? 1 : 2;
      }

      if (transactionCount > MAX_TRANSACTION_COUNT) {
        throw new Error("Transaction limit exceeded.");
      }

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      await connection.confirmTransaction(signature, "confirmed");

      setTransactionMessage(`Transaction successful: ${signature}`);
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: "smooth" }); // Scroll to the ref
      }
      setSelectedTokens({}); // Clear selections after success
      setDefaultAmount(""); // Reset amount
      setTransactionCount(0)
      setRefresh(!refresh);
    } catch (error) {
      setDefaultAmount("");
      console.error("Error sending tokens:", error);
     // Check if the error message includes 'Transaction too large'
  if (error.message && error.message.includes("Transaction too large")) {
    setErrorMessage("Transaction too large. Please reduce the number of selected tokens.");
  } else {
    setErrorMessage("Transaction failed. Please try again.");
  }
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: "smooth" }); // Scroll to the ref
      }
    } finally {
      setLoading(false);
    }
  };

  
  const tokenList = useMemo(() => {
    return tokens.map((token) => {
      const isSelectable =
        transactionCount < MAX_TRANSACTION_COUNT ||
        selectedTokens[token.tokenAddress];
        

      const handleCheckboxChange = async (tokenAddress) => {
        
        setErrorMessage(""); // Clear any previous error messages

        const isSelected = !!selectedTokens[tokenAddress];
        const newSelectedTokens = {
          ...selectedTokens,
          [tokenAddress]: !isSelected,
        };

        const newTransactionCount = await calculateTransactionCount(
          newSelectedTokens
        );

        if (newTransactionCount > MAX_TRANSACTION_COUNT) {
          setErrorMessage(
            `Selection exceeds the maximum allowed transaction count. You have only ${MAX_TRANSACTION_COUNT - transactionCount
            } left.`
          );
          return;
        }

        setSelectedTokens(newSelectedTokens);
        setTransactionCount(newTransactionCount);
      };

      const calculateTransactionCount = async (selectedTokens) => {
        let count = 0;

        for (const token of tokens) {
          if (selectedTokens[token.tokenAddress]) {
            const receiverPubKey = new PublicKey(receiverAddressRef.current);
            const associatedTokenAccount = await getAssociatedTokenAddress(
              new PublicKey(token.address),
              receiverPubKey
            );

            const accountInfo = await connection.getAccountInfo(
              associatedTokenAccount
            );

            count += accountInfo ? 1 : 2;
          }
        }
        return count;
      };

      return (
        <div
          className="flex items-center  gap-3 p-4 transition-transform duration-300 hover:scale-105"
          key={token.tokenAddress}
        >
          <input
            type="checkbox"
            checked={!!selectedTokens[token.tokenAddress]}
            onChange={() => handleCheckboxChange(token.tokenAddress)}
            className="form-checkbox text-blue-500"
            disabled={!isSelectable || !receiverAddress}
          />

          <div
            className={` ${ parseFloat(token.tokenAmount)< parseFloat(defaultValues[token.tokenAddress]) ?"border-red-600 ":"border-gray-600 "} flex  flex-col w-full bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 rounded-lg border border-gray-600 shadow-md transition-shadow duration-300 hover:shadow-xl hover:bg-gray-800`}
            onClick={() => openModal(token)}
          >
            <div className="flex flex-col p-4">
              <div className="flex justify-between items-center mb-2">
                <strong className="text-lg text-white">Token Name:</strong>
                <span className="text-sm text-gray-400">{token.tokenName}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <strong className="text-lg text-white">Token Address:</strong>
                <span className="text-sm text-gray-400">
                  {token.tokenAddress}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <strong className="text-lg text-white">Amount:</strong>
                <span className="text-sm text-gray-400">
                  {token.tokenAmount}
                </span>
              </div>
              <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <strong className="text-lg text-white">Default Value:</strong>
                <span className="text-sm text-gray-400">
                  {defaultValues[token.tokenAddress] || "N/A"}
                </span>
              </div>
              {parseFloat(token.tokenAmount)< parseFloat(defaultValues[token.tokenAddress]) ?
              <>
               <span className="text-sm font-medium text-white bg-red-500 p-2 rounded-md">
                You don't have enough tokens
                </span></>:<></>}
                <button className="px-4 py-2 bg-gray-500 rounded-lg text-white">Update value</button>
              </div>
              
            </div>
          </div>
        </div>
      );
    });
  }, [
    tokens,
    selectedTokens,
    transactionCount,
    receiverAddress,
    defaultValues,
  ]);

  return (
    <div ref={topRef} className="p-6 bg-gradient-to-r from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white font-semibold mb-2">
            Receiver Address:
          </label>
          <input
            type="text"
            onChange={(e) => setReceiverAddress(e.target.value)} // Direct update, no validation
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
            placeholder="Enter receiver address"
            aria-label="Receiver Address"
          />
        </div>
        <div>
          <label className="block text-white font-semibold mb-2">
            Default Amount:
          </label>
          <input
            type="number"
            value={defaultAmount}
            onChange={handleAmountChange
              
          }
            className={` ${defaultError?"border-red-700":"border-gray-700"} w-full p-3 bg-gray-800 border  rounded-lg text-gray-300`}
            placeholder="Enter amount in tokens"
            aria-label="Default Amount"
          />
        </div>
      </div>

      {transactionMessage && (
        <TransactionMessage
          message={transactionMessage}
          onClose={() => setTransactionMessage("")}
        />
      )}

      {/* Display transaction count and error message */}
      {errorMessage && (
        <div className="mt-4 p-4 bg-red-500 text-white rounded-lg">
          {errorMessage}
        </div>
      )}
      <div className="flex gap-10">
        <div className="mt-4">
          <span className="text-gray-300">
            Transaction Count: {transactionCount}
          </span>
        </div>
        <div className="mt-4">
          <span className="text-gray-300">
            Total Tokens Found: {tokens.length}
          </span>
        </div>
      </div>

      <div className="mt-6">
        {
          publicKey ? (

            tokenLoading ? <AiOutlineLoading3Quarters className="text-3xl text-white animate-spin text-center w-full"/> :
              tokens.length > 0 ? (
                <div className="space-y-4">{tokenList}</div>
              ) : (
                <p className="text-gray-400 text-center">
                  No tokens found for the specified wallet.
                </p>
              )
          ) : <p className="text-gray-400 text-center">
            Connect your wallet to continue ...
          </p>}
      </div>

      {selectedToken && (
        <TokenModal
          token={selectedToken}
          isOpen={isModalOpen}
          onClose={closeModal}
          onUpdate={handleUpdateToken}
          defaultValue={defaultValues[selectedToken.tokenAddress] || ""} // Pass current default value or empty string
        />
      )}

      <div className="flex justify-end mt-8">
        <button
          className="px-5 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-600"
          onClick={sendTokens}
          disabled={loading || !connected || transactionCount === 0}
        >
          {loading ? "Sending..." : "Send Tokens"}
        </button>
      </div>
    </div>
  );
};

export default Hero;
