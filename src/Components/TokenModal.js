import React, { useState, useEffect } from 'react';

const TokenModal = ({ token, isOpen, onClose, onUpdate, defaultValue }) => {
    const [newAmount, setNewAmount] = useState(token.tokenAmount);
    const [error, setError] = useState('');

    // Update the newAmount whenever the token prop changes
    useEffect(() => {
        setNewAmount(token.tokenAmount);
        setError(''); // Reset error when token changes
    }, [token]);

    // Update the newAmount whenever the defaultValue prop changes
    useEffect(() => {
        setNewAmount(defaultValue); // Set new amount to the default value
        setError(''); // Reset error when defaultValue changes
    }, [defaultValue]);

    const handleUpdate = () => {
        onUpdate(token.tokenAddress, newAmount);
        onClose(); // Close the modal after updating
    };
    const handleChange = (e) => {
        const value = e.target.value;
        if (value === '' || Number(value) <= token.tokenAmount) {
            setNewAmount(value);
            setError(''); // Clear error if valid
        } else {
            setError('Amount cannot be greater than the current amount.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-white">Update Token Amount</h2>
                <div className="mt-4">
                    <strong className="text-white">Current Amount:</strong>
                    <p className="text-gray-300">{token.tokenAmount}</p>
                </div>

                <div className="mt-4">
                    <input
                        type="number"
                        value={newAmount}
                        onChange={handleChange}
                        className={`w-full p-2 rounded-lg border ${error ? 'border-red-600' : 'border-gray-600'
                            } bg-gray-700 text-white`}
                    />
                    {error && <p className="text-red-600">{error}</p>}
                </div>
                <div className="mt-4 flex justify-between">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg text-white">Cancel</button>
                    <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 rounded-lg text-white">Update</button>
                </div>
            </div>
        </div>
    );
};

export default TokenModal;
