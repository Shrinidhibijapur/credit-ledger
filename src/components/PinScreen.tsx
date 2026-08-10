"use client";

import { useState, useEffect } from "react";
import { Lock, Delete, ArrowRight } from "lucide-react";

interface PinScreenProps {
  onUnlock: () => void;
}

export default function PinScreen({ onUnlock }: PinScreenProps) {
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [storedPin, setStoredPin] = useState<string>("1234");

  useEffect(() => {
    // Check if a PIN is set in localStorage, otherwise set default 1234
    const pinInStorage = localStorage.getItem("khata_pin");
    if (pinInStorage) {
      setStoredPin(pinInStorage);
    } else {
      localStorage.setItem("khata_pin", "1234");
    }
  }, []);

  const handleKeyPress = (num: string) => {
    if (error) setError(false);
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      // Auto-validate when 4 digits are entered
      if (nextPin.length === 4) {
        if (nextPin === storedPin) {
          localStorage.setItem("khata_logged_in", "true");
          onUnlock();
        } else {
          setTimeout(() => {
            setError(true);
            setPin("");
          }, 200);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col justify-between p-6 z-50">
      {/* Top Section */}
      <div className="flex flex-col items-center justify-center flex-1 space-y-6">
        <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-black" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold">ಡಿಜಿಟಲ್ ಖಾತಾ</h1>
          <p className="text-sm text-gray-500 font-medium">Digital Khata Ledger</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex space-x-4 py-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border border-gray-300 transition-all duration-150 ${
                index < pin.length
                  ? "bg-black scale-110"
                  : "bg-transparent"
              } ${error ? "border-red-500 bg-red-500 animate-pulse" : ""}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm font-semibold text-red-600 animate-bounce">
            Incorrect PIN. Try again. (Default: 1234)
          </p>
        )}
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-sm mx-auto grid grid-cols-3 gap-4 pb-8">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num)}
            className="h-16 rounded-full border border-gray-100 bg-gray-50 text-xl font-bold active:bg-black active:text-white transition duration-75 flex items-center justify-center touch-manipulation"
          >
            {num}
          </button>
        ))}
        {/* Backspace */}
        <button
          onClick={handleBackspace}
          className="h-16 rounded-full border border-transparent text-gray-500 active:bg-gray-100 transition flex items-center justify-center touch-manipulation"
        >
          <Delete className="w-6 h-6" />
        </button>
        {/* Zero */}
        <button
          onClick={() => handleKeyPress("0")}
          className="h-16 rounded-full border border-gray-100 bg-gray-50 text-xl font-bold active:bg-black active:text-white transition flex items-center justify-center touch-manipulation"
        >
          0
        </button>
        {/* Info or Clear */}
        <div className="h-16 flex items-center justify-center text-xs text-gray-400 font-medium select-none">
          PIN required
        </div>
      </div>
    </div>
  );
}
