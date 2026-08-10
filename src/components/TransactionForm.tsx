"use client";

import { useState, useEffect, useRef } from "react";
import { type Transaction } from "@/lib/db";
import { X, Save, Calendar, Landmark } from "lucide-react";

interface TransactionFormProps {
  transaction?: Transaction; // Provided if editing
  type: "credit" | "payment";
  onSave: (data: {
    amount: number;
    description: string;
    date: string;
  }) => void;
  onCancel: () => void;
}

export default function TransactionForm({
  transaction,
  type,
  onSave,
  onCancel,
}: TransactionFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>("");

  const amountInputRef = useRef<HTMLInputElement>(null);

  const getTodayStr = () => {
    const today = new Date();
    return today.getFullYear() + "-" + 
           String(today.getMonth() + 1).padStart(2, "0") + "-" + 
           String(today.getDate()).padStart(2, "0");
  };

  const getYesterdayStr = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.getFullYear() + "-" + 
           String(yesterday.getMonth() + 1).padStart(2, "0") + "-" + 
           String(yesterday.getDate()).padStart(2, "0");
  };

  // Initialize values
  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || "");
      setDate(transaction.date);
    } else {
      setDate(getTodayStr());
      setAmount("");
      setDescription("");
    }

    // Auto-focus amount field
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 150);
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    onSave({
      amount: amt,
      description: description.trim(),
      date: date || new Date().toISOString().split("T")[0],
    });
  };

  const isCredit = type === "credit";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-gray-200 p-6 shadow-2xl space-y-5 animate-slide-up flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isCredit ? "bg-red-500" : "bg-green-500"
              }`}
            />
            {transaction ? (
              <span>ಬದಲಾವಣೆ / Edit Entry</span>
            ) : isCredit ? (
              <span>ಕ್ರೆಡಿಟ್ ಕೊಡಿ / Give Credit</span>
            ) : (
              <span>ಹಣ ಸ್ವೀಕರಿಸಿ / Receive Payment</span>
            )}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Amount field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              ಹಣದ ಮೊತ್ತ / Amount (Required)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-2xl font-black text-gray-400">
                ₹
              </span>
              <input
                ref={amountInputRef}
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className={`w-full pl-10 pr-4 py-4 bg-gray-50 border rounded-2xl text-2xl font-extrabold focus:outline-none focus:ring-1 focus:ring-black focus:border-black ${
                  isCredit ? "text-red-600 border-red-100" : "text-green-700 border-green-100"
                }`}
              />
            </div>
          </div>

          {/* Description field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              ವಿವರಣೆ / Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Rice + Sugar, Oil, Paid remaining"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-semibold text-gray-800"
            />
          </div>

          {/* Date field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              ದಿನಾಂಕ / Date
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <Calendar className="w-5 h-5" />
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-bold"
              />
            </div>
            
            {/* Quick date shortcuts */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDate(getTodayStr())}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition ${
                  date === getTodayStr()
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-200 active:bg-gray-50 shadow-sm"
                }`}
              >
                ಇಂದು / Today
              </button>
              <button
                type="button"
                onClick={() => setDate(getYesterdayStr())}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition ${
                  date === getYesterdayStr()
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-200 active:bg-gray-50 shadow-sm"
                }`}
              >
                ನಿನ್ನೆ / Yesterday
              </button>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="py-3 border border-gray-200 rounded-xl text-sm font-bold active:bg-gray-50 transition"
          >
            ರದ್ದು ಮಾಡಿ / Cancel
          </button>
          <button
            type="submit"
            className="py-3 bg-black hover:bg-gray-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition active:bg-gray-900 touch-manipulation"
          >
            <Save className="w-4 h-4" />
            <span>ಉಳಿಸಿ / Save</span>
          </button>
        </div>
      </form>
    </div>
  );
}
