"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Users, AlertTriangle, TrendingUp, Plus, ArrowUpRight, ArrowDownRight, Phone } from "lucide-react";

interface DashboardProps {
  onAddCustomerClick: () => void;
  onCustomerSelect: (customerId: string) => void;
  onNavigateToCustomers: () => void;
}

export default function Dashboard({
  onAddCustomerClick,
  onCustomerSelect,
  onNavigateToCustomers,
}: DashboardProps) {
  // Queries
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const recentTransactions = useLiveQuery(() => 
    db.transactions.orderBy("createdAt").reverse().limit(5).toArray()
  ) || [];

  // Calculations
  const totalCustomers = customers.length;
  const pendingCustomers = customers.filter(c => c.balance > 0);
  const totalOutstanding = pendingCustomers.reduce((sum, c) => sum + c.balance, 0);

  const customerMap = new Map(customers.map(c => [c.id, c]));

  // Simple date formatter (e.g. 04 Aug 2026)
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ಮುಖಪುಟ</h1>
        <p className="text-sm text-gray-500 font-medium">Dashboard Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Outstanding Card (Double Width) */}
        <div className="col-span-2 p-5 rounded-2xl bg-black text-white flex flex-col justify-between space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              ಬಾಕಿ ಹಣ / Total Outstanding
            </span>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <span className="text-3xl font-extrabold">₹{totalOutstanding.toLocaleString("en-IN")}</span>
            <p className="text-xs text-gray-400 mt-1">Total credit currently with customers</p>
          </div>
        </div>

        {/* Total Customers */}
        <button
          onClick={onNavigateToCustomers}
          className="p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition text-left flex flex-col justify-between space-y-4 shadow-sm"
        >
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
            <Users className="w-4 h-4 text-black" />
          </div>
          <div>
            <span className="text-2xl font-bold block">{totalCustomers}</span>
            <span className="text-xs text-gray-500 font-medium block">ಗ್ರಾಹಕರು / Customers</span>
          </div>
        </button>

        {/* Pending due customers */}
        <button
          onClick={onNavigateToCustomers}
          className="p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition text-left flex flex-col justify-between space-y-4 shadow-sm"
        >
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <span className="text-2xl font-bold text-red-600 block">{pendingCustomers.length}</span>
            <span className="text-xs text-gray-500 font-medium block">ಬಾಕಿ ಇರುವವರು / Pending Due</span>
          </div>
        </button>
      </div>

      {/* Recent Transactions Section */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">ಇತ್ತೀಚಿನ ವ್ಯವಹಾರಗಳು / Recent Activity</h2>
          {recentTransactions.length > 0 && (
            <button
              onClick={onNavigateToCustomers}
              className="text-xs font-semibold text-gray-500 hover:text-black border-b border-gray-300 pb-0.5"
            >
              View All
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400">
            <p className="text-sm font-medium">No recent transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">
            {recentTransactions.map((tx) => {
              const customer = customerMap.get(tx.customerId);
              const isCredit = tx.type === "credit";

              return (
                <div
                  key={tx.id}
                  onClick={() => onCustomerSelect(tx.customerId)}
                  className="flex items-center justify-between p-4 active:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        isCredit ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {customer?.nameKannada ? (
                          <span>
                            {customer.nameKannada} <span className="text-xs font-normal text-gray-400">({customer.name})</span>
                          </span>
                        ) : (
                          customer?.name || "Deleted Customer"
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        {formatDate(tx.date)}
                        {tx.description && ` • ${tx.description}`}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${isCredit ? "text-red-600" : "text-green-700"}`}>
                    {isCredit ? "+" : "-"} ₹{tx.amount.toLocaleString("en-IN")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
