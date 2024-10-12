import React, { useState, useEffect, useMemo } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { createTransferInstruction, getMint } from "@solana/spl-token";
import TokenModal from "../TokenModal";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { createAssociatedTokenAccountInstruction } from "@solana/spl-token";

const Hero = () => {
  const { publicKey, signTransaction, connected } = useWallet(); // wallet adapter
  const { connection } = useConnection();
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiverAddress, setReceiverAddress] = useState("");
  const [defaultValues, setDefaultValues] = useState({});
  const [selectedTokens, setSelectedTokens] = useState({});
  const [defaultValue, setDefaultValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactionMessage, setTransactionMessage] = useState("");
  
  const MAX_TRANSACTION_COUNT = 50;
  let transactionsCount = 0;
  // Fetch wallet tokens
  useEffect(() => {
    console.log(tokens);
    const fetchWalletTokens = async () => {
      if (!publicKey) return;

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
            const tokenDecimals = mintAccount.decimals;
            const tokenAmountFormatted = (
              tokenAmount.uiAmount / Math.pow(10, tokenDecimals)
            ).toFixed(tokenDecimals);

            return {
              tokenAddress: accountInfo.pubkey.toString(),
              tokenName: `Token (${mintAddress.slice(0, 5)}...)`,
              tokenAmount: tokenAmountFormatted,
              address: mintAddress,
            };
          })
        );

        setTokens(tokenDetails);
        const initialDefaultValues = tokenDetails.reduce((acc, token) => {
          acc[token.tokenAddress] = "";
          console.log("transactionsCount", tokenDetails);
          return acc;
        }, {});
        setDefaultValues(initialDefaultValues);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      }
    };

    fetchWalletTokens();
  }, [tokens,publicKey, connection]);

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

  const handleCheckboxChange = (tokenAddress) => {
    setSelectedTokens((prev) => ({
      ...prev,
      [tokenAddress]: !prev[tokenAddress],
    }));
  };

  const tokenList = useMemo(
    () =>
      tokens.map((token) => (
        <div className="flex items-center gap-3" key={token.tokenAddress}>
          <input
            type="checkbox"
            checked={!!selectedTokens[token.tokenAddress]}
            onChange={() => handleCheckboxChange(token.tokenAddress)}
            className="form-checkbox text-blue-500"
          />
          <div
            className="flex items-center gap-4 p-4 w-full bg-gray-800 rounded-lg border border-gray-700 cursor-pointer transition-shadow duration-300 hover:shadow-2xl hover:bg-gray-700 hover:ring hover:ring-blue-500"
            onClick={() => openModal(token)}
          >
            <div className="flex flex-1 flex-col">
              <strong className="text-white">Token Name:</strong>
              <span className="text-gray-300"> {token.tokenName}</span>
            </div>
            <div className="flex flex-1 flex-col">
              <strong className="text-white">Token Address:</strong>
              <span className="text-gray-300"> {token.tokenAddress}</span>
            </div>
            <div className="flex flex-1 flex-col">
              <strong className="text-white">Amount:</strong>
              <span className="text-gray-300"> {token.tokenAmount}</span>
            </div>
            <div className="flex flex-1 flex-col">
              <strong className="text-white">Default Value:</strong>
              <span className="text-gray-300">
                {defaultValues[token.tokenAddress] || "N/A"}
              </span>
            </div>
          </div>
        </div>
      )),
    [tokens, selectedTokens, defaultValues]
  );

  async function getNumberDecimals(mintAddress) {
    const info = await connection.getParsedAccountInfo(
      new PublicKey(mintAddress)
    );
    const result = (info.value?.data).parsed.info.decimals;
    return result;
  }



  const sendTokens = async () => {
    if (!connected) {
      console.error("Wallet not connected");
      return;
    }

    setLoading(true);
    setTransactionMessage("");

    try {
      const senderPublicKey = publicKey;
      const receiverPublicKey = new PublicKey(receiverAddress);
      const amountToTransfer = parseFloat(defaultValue);

      const transaction = new Transaction();

      const selectedTokensArray = tokens.filter(
        (token) => selectedTokens[token.tokenAddress]
      );

      for (let token of selectedTokensArray) {
        const numberDecimals = await getNumberDecimals(token.address);

        const senderTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(token.address),
          senderPublicKey
        );

        const receiverTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(token.address),
          receiverPublicKey
        );

        const accountInfo = await connection.getAccountInfo(
          receiverTokenAccount
        );

        if (!accountInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              senderPublicKey,
              receiverTokenAccount,
              receiverPublicKey,
              new PublicKey(token.address)
            )
          );
          transactionsCount++;
        }

        transaction.add(
          createTransferInstruction(
            senderTokenAccount,
            receiverTokenAccount,
            senderPublicKey,
            amountToTransfer * Math.pow(10, numberDecimals),
            []
          )
        );
        transactionsCount++;

        if (transactionsCount > MAX_TRANSACTION_COUNT) {
          setTransactionMessage(
            "Transaction failed: Too many transactions selected."
          );
          console.error("Cannot send more than 50 transactions at a time.");
          setLoading(false);
          return;
        }

        transaction.recentBlockhash = (
          await connection.getLatestBlockhash()
        ).blockhash;
        transaction.feePayer = senderPublicKey;
      }

      if (transactionsCount < MAX_TRANSACTION_COUNT) {
        const signedTransaction = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize()
        );

        await connection.confirmTransaction(signature, "confirmed");

        setTransactionMessage(
          `Transaction successful with signature: ${signature}`
        );
        console.log(`Transaction successful with signature: ${signature}`);
      }
    } catch (error) {
      console.error("Error sending tokens:", error);
      setTransactionMessage("Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg shadow-lg mb-10">
      <div className="grid grid-cols-2 gap-2">
        <div className="mb-6">
          <label className="block mb-2 text-lg font-semibold text-white">
            Receiver Address:
          </label>
          <input
            type="text"
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
            placeholder="Enter receiver address"
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-lg font-semibold text-white">
            Default Value:
          </label>
          <input
            type="number"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
            placeholder="Enter default value"
          />
        </div>
      </div>
      {tokens.length > 0 ? (
        <div className="space-y-4">{tokenList}</div>
      ) : (
        <p className="text-gray-300">
          No tokens found for the specified wallet.
        </p>
      )}

      {selectedToken && (
        <TokenModal
          token={selectedToken}
          isOpen={isModalOpen}
          onClose={closeModal}
          onUpdate={handleUpdateToken}
          defaultValue={defaultValues[selectedToken.tokenAddress]}
        />
      )}

      <div className="flex items-center justify-end mt-4">
        <button
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md disabled:bg-gray-600"
          onClick={sendTokens}
          disabled={loading || !connected}
        >
          {loading ? "Sending..." : "Send Tokens"}
        </button>
      </div>

      {transactionMessage && (
        <div className="mt-4 p-4 bg-red-600 text-white rounded-lg">
          {transactionMessage}
        </div>
      )}
    </div>
  );
};

export default Hero;
