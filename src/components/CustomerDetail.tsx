"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Customer, type Transaction } from "@/lib/db";
import {
  Phone,
  MapPin,
  ArrowLeft,
  Trash2,
  Edit2,
  Plus,
  Minus,
  Calendar,
  X,
  AlertTriangle,
  FileText,
  Printer
} from "lucide-react";

interface CustomerDetailProps {
  customerId: string;
  onBack: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onAddCredit: () => void;
  onReceivePayment: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
}

export default function CustomerDetail({
  customerId,
  onBack,
  onEditCustomer,
  onDeleteCustomer,
  onAddCredit,
  onReceivePayment,
  onEditTransaction,
  onDeleteTransaction,
}: CustomerDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);

  // Queries
  const customer = useLiveQuery(() => db.customers.get(customerId), [customerId]);
  const transactions = useLiveQuery(
    () => db.transactions.where("customerId").equals(customerId).toArray(),
    [customerId]
  ) || [];

  // Sort transactions newest first
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt
  );

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <p className="text-gray-500 font-medium">Customer details not found.</p>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 border border-black rounded-xl text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const hasDue = customer.balance > 0;

  // Simple date formatter (e.g. 04 Aug 2026)
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("en-US", { month: "short" });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    onDeleteCustomer(customerId);
    setShowDeleteConfirm(false);
  };

  const handleConfirmDeleteTransaction = async () => {
    if (txToDelete) {
      onDeleteTransaction(txToDelete);
      setTxToDelete(null);
    }
  };

  const handleShareWhatsApp = () => {
    if (!customer) return;

    const formattedBalance = customer.balance.toLocaleString("en-IN");
    const nameText = customer.nameKannada
      ? `${customer.nameKannada} (${customer.name})`
      : customer.name;

    const message = `*Shrinivas General Stores*\n` +
      `*Digital Khata / ಡಿಜಿಟಲ್ ಖಾತಾ*\n\n` +
      `ಗ್ರಾಹಕರ ಹೆಸರು / Customer Name: *${nameText}*\n` +
      `ಬಾಕಿ ಹಣ / Balance Amount: *₹${formattedBalance}*\n\n` +
      `PhonePe Number:8123190771\n` +
      `Account Holder: Shrinivas Suresh Bijapur\n` +
      `ದಯವಿಟ್ಟು ಬಾಕಿ ಹಣವನ್ನು ಪಾವತಿಸಿ. / Please settle the pending balance.\n` +
      `ಧನ್ಯವಾದಗಳು! / Thank you!`;

    const encodedText = encodeURIComponent(message);
    const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, "") : "";

    let url = "";
    if (cleanPhone) {
      let phoneWithCountry = cleanPhone;
      if (cleanPhone.length === 10) {
        phoneWithCountry = `91${cleanPhone}`;
      }
      url = `https://wa.me/${phoneWithCountry}?text=${encodedText}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodedText}`;
    }

    window.open(url, "_blank");
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <>
      <div className="flex flex-col space-y-6 pb-24 relative print:hidden">
      {/* Top Navbar */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 p-1 text-gray-500 hover:text-black font-semibold text-sm active:scale-95 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>ಹಿಂದಕ್ಕೆ / Back</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditCustomer(customer)}
            className="p-2 border border-gray-200 rounded-xl bg-gray-50 active:bg-gray-100 text-gray-700 hover:text-black transition"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 border border-red-100 rounded-xl bg-red-50 active:bg-red-100 text-red-600 transition"
            title="Delete Customer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer Summary Card */}
      <div className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold font-kannada">
            {customer.nameKannada && (
              <span className="block text-2xl mb-0.5">{customer.nameKannada}</span>
            )}
            <span className={customer.nameKannada ? "text-sm font-semibold text-gray-400" : "text-xl font-bold"}>
              {customer.name}
            </span>
          </h2>

          <div className="mt-3 space-y-2">
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
              >
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{customer.phone}</span>
              </a>
            )}
            {customer.village && (
              <div className="flex items-start gap-2 text-sm font-medium text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span>ಗ್ರಾಮ / Village: {customer.village}</span>
              </div>
            )}
          </div>
        </div>

        {/* Current Balance Row */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              ಬಾಕಿ ಹಣ / Current Balance
            </span>
            <span
              className={`text-2xl font-black block mt-0.5 ${
                hasDue ? "text-red-600" : "text-green-700"
              }`}
            >
              ₹{customer.balance.toLocaleString("en-IN")}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              hasDue ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
            }`}
          >
            {hasDue ? "Pending Due" : "Settled"}
          </span>
        </div>

        {/* Share & Report Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1ca34f] text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 touch-manipulation cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>ವಾಟ್ಸಾಪ್ ಹಂಚಿಕೊಳ್ಳಿ / Share</span>
          </button>
          <button
            onClick={handlePrintReceipt}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-900 hover:bg-black active:bg-gray-800 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 touch-manipulation cursor-pointer"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>ಬಿಲ್ ಪ್ರಿಂಟ್ / Print Bill</span>
          </button>
        </div>
      </div>

      {/* Transaction Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onAddCredit}
          className="flex flex-col items-center justify-center py-4 rounded-2xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 font-bold space-y-2 shadow-sm transition active:scale-95 touch-manipulation"
        >
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <Plus className="w-5 h-5 text-red-700" />
          </div>
          <span className="text-sm">ಕ್ರೆಡಿಟ್ ಕೊಡಿ / Give Credit</span>
        </button>
        <button
          onClick={onReceivePayment}
          className="flex flex-col items-center justify-center py-4 rounded-2xl border border-green-200 bg-green-50/50 hover:bg-green-50 text-green-700 font-bold space-y-2 shadow-sm transition active:scale-95 touch-manipulation"
        >
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Minus className="w-5 h-5 text-green-700" />
          </div>
          <span className="text-sm">ಹಣ ಸ್ವೀಕರಿಸಿ / Receive Payment</span>
        </button>
      </div>

      {/* Transaction Ledger list */}
      <div className="flex flex-col space-y-3">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-gray-400" />
          <span>ವ್ಯವಹಾರಗಳ ವಿವರ / Transaction History</span>
        </h3>

        {sortedTransactions.length === 0 ? (
          <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400">
            <p className="text-sm font-medium">No transactions on ledger yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">
            {sortedTransactions.map((tx) => {
              const isCredit = tx.type === "credit";
              return (
                <div key={tx.id} className="p-4 flex justify-between items-center group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                          isCredit
                            ? "bg-red-50 text-red-700 border-red-100"
                            : "bg-green-50 text-green-700 border-green-100"
                        }`}
                      >
                        {isCredit ? "Credit" : "Payment"}
                      </span>
                      <span className="text-xs text-gray-400 font-medium inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tx.date)}
                      </span>
                    </div>
                    {tx.description && (
                      <p className="text-sm font-medium text-gray-700">{tx.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 pl-2">
                    <span
                      className={`text-base font-bold tracking-tight ${
                        isCredit ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      {isCredit ? "+" : "-"} ₹{tx.amount.toLocaleString("en-IN")}
                    </span>

                    {/* Edit/Delete mini-icons */}
                    <div className="flex items-center gap-1 border-l border-gray-100 pl-3">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-50 transition active:scale-90"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTxToDelete(tx.id!)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Customer Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">ಗ್ರಾಹಕರನ್ನು ಅಳಿಸುವುದೇ? / Delete Customer?</h4>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Are you sure you want to delete this customer? This will permanently delete all transaction history and cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 border border-gray-200 rounded-xl text-sm font-semibold active:bg-gray-50 transition"
              >
                No, Keep
              </button>
              <button
                onClick={handleConfirmDeleteCustomer}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition active:bg-red-800"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">ವ್ಯವಹಾರವನ್ನು ಅಳಿಸುವುದೇ? / Delete Transaction?</h4>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Are you sure you want to delete this ledger entry? Outstanding balances will automatically recalculate.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setTxToDelete(null)}
                className="py-2.5 border border-gray-200 rounded-xl text-sm font-semibold active:bg-gray-50 transition"
              >
                No, Keep
              </button>
              <button
                onClick={handleConfirmDeleteTransaction}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition active:bg-red-800"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Print-only Statement layout */}
      <div id="print-section" className="hidden print:block p-8 bg-white text-black font-sans">
        <div className="text-center space-y-2 border-b border-dashed border-gray-300 pb-4">
          <h1 className="text-2xl font-black tracking-tight">ಶ್ರೀನಿವಾಸ್ ಜನರಲ್ ಸ್ಟೋರ್ಸ್ / Shrinivas General Stores</h1>
          <p className="text-sm font-semibold text-gray-500">ವ್ಯವಹಾರಗಳ ವಿವರ / Statement of Account</p>
          <p className="text-xs text-gray-400">Date: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
        </div>

        <div className="py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">ಗ್ರಾಹಕರು / Customer</p>
              <p className="text-base font-bold font-kannada mt-0.5">
                {customer.nameKannada ? `${customer.nameKannada} (${customer.name})` : customer.name}
              </p>
            </div>
            <div className="text-right">
              {customer.phone && (
                <>
                  <p className="text-xs text-gray-400 font-bold uppercase">ಮೊಬೈಲ್ / Mobile</p>
                  <p className="text-sm font-semibold mt-0.5">{customer.phone}</p>
                </>
              )}
              {customer.village && (
                <p className="text-xs text-gray-500 mt-1">ಗ್ರಾಮ / Village: {customer.village}</p>
              )}
            </div>
          </div>

          <div className="border border-black rounded-xl p-4 bg-gray-50/50 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                ಒಟ್ಟು ಬಾಕಿ ಹಣ / Outstanding Balance
              </span>
              <span className="text-2xl font-black block mt-0.5 text-red-600">
                ₹{customer.balance.toLocaleString("en-IN")}
              </span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-red-200 bg-red-50 text-red-700">
              {hasDue ? "Pending Due / ಬಾಕಿ ಇದೆ" : "Settled / ಚುಕ್ತಾ ಆಗಿದೆ"}
            </span>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-500">
            ಖಾತಾ ವಿವರ / Transaction History
          </h3>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-black text-xs font-bold text-gray-500">
                <th className="py-2">ದಿನಾಂಕ / Date</th>
                <th className="py-2">ವಿವರ / Description</th>
                <th className="py-2">ವಿಧ / Type</th>
                <th className="py-2 text-right">ಮೊತ್ತ / Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-400">
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => {
                  const isCredit = tx.type === "credit";
                  return (
                    <tr key={tx.id} className="align-middle">
                      <td className="py-3 font-medium whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="py-3 text-gray-700 font-medium">{tx.description || "-"}</td>
                      <td className="py-3 font-bold">
                        <span className={isCredit ? "text-red-600" : "text-green-700"}>
                          {isCredit ? "Credit / ಜಮಾ" : "Payment / ಖರ್ಚು"}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-black ${isCredit ? "text-red-600" : "text-green-700"}`}>
                        ₹{tx.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 text-sm grid grid-cols-2 gap-4">
          <div className="text-left">
            <p className="text-xs text-gray-400 font-bold uppercase">Payment Info / ಪಾವತಿ ವಿವರಗಳು</p>
            <p className="font-semibold mt-1">PhonePe: [PhonePe Number]</p>
            <p className="text-xs text-gray-500">Account Holder: [Father's Name]</p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-dashed border-gray-300 text-center text-xs text-gray-400 font-medium">
          <p>Generated via Shrinivas General Stores. Thank you for your business!</p>
        </div>
      </div>
    </>
  );
}
