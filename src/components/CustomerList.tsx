"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Search, Plus, Phone, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";

interface CustomerListProps {
  onAddCustomerClick: () => void;
  onCustomerSelect: (customerId: string) => void;
}

export default function CustomerList({
  onAddCustomerClick,
  onCustomerSelect,
}: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Retrieve all customers from IndexedDB
  const customers = useLiveQuery(() => db.customers.toArray()) || [];

  // Filter customers by English name, Kannada name, or Phone
  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const nameMatch = customer.name.toLowerCase().includes(query);
    const kannadaMatch = customer.nameKannada?.toLowerCase().includes(query) || false;
    const phoneMatch = customer.phone?.toLowerCase().includes(query) || false;

    return nameMatch || kannadaMatch || phoneMatch;
  });

  // Sort: Outstanding balances first, then alphabetically by name
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (a.balance > 0 && b.balance === 0) return -1;
    if (a.balance === 0 && b.balance > 0) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ಗ್ರಾಹಕರು</h1>
          <p className="text-sm text-gray-500 font-medium">Customer Directory</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ಹೆಸರು ಅಥವಾ ಫೋನ್ ನಂಬರ್ ಹುಡುಕಿ..."
          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium transition"
        />
      </div>

      {/* Empty State */}
      {sortedCustomers.length === 0 ? (
        <div className="p-12 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400 mt-4">
          <p className="text-sm font-medium">
            {searchQuery ? "No matching customers found." : "ನಿಮ್ಮ ಬಳಿ ಇನ್ನು ಯಾವುದೇ ಗ್ರಾಹಕರಿಲ್ಲ."}
          </p>
          {!searchQuery && (
            <button
              onClick={onAddCustomerClick}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-black border border-black px-3.5 py-2 rounded-xl active:bg-black active:text-white transition"
            >
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          )}
        </div>
      ) : (
        /* Customer Cards Grid */
        <div className="flex flex-col gap-3">
          {sortedCustomers.map((customer) => {
            const hasDue = customer.balance > 0;
            return (
              <div
                key={customer.id}
                onClick={() => onCustomerSelect(customer.id!)}
                className={`p-4 bg-white border rounded-2xl flex items-center justify-between shadow-sm active:bg-gray-50 transition cursor-pointer ${
                  hasDue ? "border-red-100" : "border-gray-200"
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  {/* Status Indicator Bar */}
                  <div
                    className={`w-2.5 h-10 rounded-full shrink-0 ${
                      hasDue ? "bg-red-500" : "bg-green-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base truncate flex items-center gap-1.5">
                      {customer.nameKannada && (
                        <span className="text-black font-semibold font-kannada">
                          {customer.nameKannada}
                        </span>
                      )}
                      <span className={`${customer.nameKannada ? "text-xs font-normal text-gray-400" : "text-black"}`}>
                        {customer.nameKannada ? `(${customer.name})` : customer.name}
                      </span>
                    </h3>

                    {/* Phone block */}
                    {customer.phone ? (
                      <div
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-black mt-1"
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid selecting card
                          window.location.href = `tel:${customer.phone}`;
                        }}
                      >
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{customer.phone}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 block mt-1">No phone number</span>
                    )}
                  </div>
                </div>

                {/* Balance display */}
                <div className="flex items-center gap-2.5 shrink-0 pl-3">
                  <div className="text-right">
                    <span
                      className={`text-base font-extrabold block ${
                        hasDue ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      ₹{customer.balance.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {hasDue ? "Pending Due" : "Settled"}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Add Customer Button */}
      <button
        onClick={onAddCustomerClick}
        className="fixed bottom-24 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform duration-100 touch-manipulation z-40 border border-gray-800"
        aria-label="Add Customer"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
