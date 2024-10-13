import React, { useState, useEffect, useMemo, useRef } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import TokenModal from "../TokenModal";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import TransactionMessage from "../../utils/TransactionMessage";

const MAX_TRANSACTION_COUNT = 2;

const Hero = () => {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiverAddress, setReceiverAddress] = useState("");
  const receiverAddressRef = useRef(""); // Ref to track latest address
  const [defaultValues, setDefaultValues] = useState({});
  const [selectedTokens, setSelectedTokens] = useState({});
  const [defaultAmount, setDefaultAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionCount, setTransactionCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setErrorMessage(!receiverAddress ? "Enter Valid Reciever Address to check Tokens" : "")
    receiverAddressRef.current = receiverAddress;
  }, [receiverAddress]);

  useEffect(() => {
    if (!publicKey) return;

    const fetchWalletTokens = async () => {
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
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

            return {
              tokenAddress: accountInfo.pubkey.toString(),
              tokenName: `Token (${mintAddress.slice(0, 5)}...)`,
              tokenAmount: (tokenAmount.uiAmount / 10 ** decimals).toFixed(
                decimals
              ),
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
      } catch (error) {
        console.error("Error fetching tokens:", error);
        setErrorMessage("Failed to fetch tokens. Please try again.");
      }
    };

    fetchWalletTokens();
    console.log(tokens)
  }, [publicKey, connection]);

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
        `Selection exceeds the maximum allowed transaction count. You have only ${
          MAX_TRANSACTION_COUNT - transactionCount
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

  const openModal = (token) => {
    setSelectedToken(token);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedToken(null);
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
      setErrorMessage("Please provide valid input.");
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
        const amount = parseFloat(defaultAmount) * 10 ** token.decimals;

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
      setSelectedTokens({}); // Clear selections after success
      setDefaultAmount(""); // Reset amount
    } catch (error) {
      console.error("Error sending tokens:", error);
      setErrorMessage("Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tokenList = useMemo(() => {
    return tokens.map((token) => {
      const isSelectable =
        transactionCount < MAX_TRANSACTION_COUNT ||
        selectedTokens[token.tokenAddress];

      return (
        <div
          className="flex items-center gap-3 p-4 transition-transform duration-300 hover:scale-105"
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
            className="flex flex-col w-full bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 rounded-lg border border-gray-600 shadow-md transition-shadow duration-300 hover:shadow-xl hover:bg-gray-800"
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
              <div className="flex justify-between items-center">
                <strong className="text-lg text-white">Default Value:</strong>
                <span className="text-sm text-gray-400">
                  {defaultValues[token.tokenAddress] || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }, [tokens, selectedTokens, transactionCount, receiverAddress]);

  return (
    <div className="p-6 bg-gradient-to-r from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl mb-10">
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
            onChange={(e) => {
              const value = e.target.value;
              setDefaultAmount(value);
              if (value < 0) {
                setErrorMessage("Amount cannot be negative.");
              } else {
                setErrorMessage(""); // Clear error on valid input
              }
            }}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
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
      <div className="mt-4">
        <span className="text-gray-300">
          Transaction Count: {transactionCount}
        </span>
      </div>

      <div className="mt-6">
        {tokens.length > 0 ? (
          <div className="space-y-4">{tokenList}</div>
        ) : (
          <p className="text-gray-400 text-center">
            No tokens found for the specified wallet.
          </p>
        )}
      </div>

      {selectedToken && (
        <TokenModal
        token={selectedToken}
        isOpen={isModalOpen}
        onClose={closeModal}
        onUpdate={handleUpdateToken}
        defaultValue={defaultValues[selectedToken.tokenAddress] || ''} // Pass current default value or empty string
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
