import React, { useEffect, useState } from "react";

const TransactionMessage = ({ message, onClose }) => {
  const [countdown, setCountdown] = useState(10);

  // Handle auto-close after 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    if (countdown === 0) {
      onClose(); // Close the message when countdown reaches 0
    }

    return () => clearInterval(timer);
  }, [countdown, onClose]);

  // Copy the transaction hash to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(message.split(": ")[1]);
    alert("Transaction hash copied!");
  };

  const isSuccess = message.startsWith("Transaction successful");
  const transactionHash = isSuccess ? message.split(": ")[1].slice(0, 10) + "..." : message;

  return (
    <div
      className={`relative mt-6 p-4 text-center rounded-lg shadow-lg transition-transform transform hover:scale-105
        ${isSuccess ? "bg-blue-500 border-blue-300" : "bg-red-500 border-red-300"}
        text-white border-2 glow`}
      style={{ animation: "pulse 1.5s infinite alternate" }} // Dim light effect
    >
      <strong>
        {isSuccess ? "🎉 Success! " : "⚠️ Error: "}
      </strong>
      {transactionHash}

      {/* Copy Button for Successful Transaction */}
      {isSuccess && (
        <button
          onClick={handleCopy}
          className="ml-4 px-3 py-1 bg-white text-blue-500 font-bold rounded-lg shadow-md hover:bg-gray-200"
        >
          Copy
        </button>
      )}

      {/* Countdown Timer Box */}
      <div
        className="absolute top-2 right-2 px-2 py-1 bg-black text-white rounded-md text-xs"
      >
        Disappears in: {countdown}s
      </div>
    </div>
  );
};

export default TransactionMessage;
