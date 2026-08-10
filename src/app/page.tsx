"use client";

import { useState, useEffect } from "react";
import { db, type Customer, type Transaction } from "@/lib/db";
import PinScreen from "@/components/PinScreen";
import Dashboard from "@/components/Dashboard";
import CustomerList from "@/components/CustomerList";
import CustomerDetail from "@/components/CustomerDetail";
import CustomerForm from "@/components/CustomerForm";
import TransactionForm from "@/components/TransactionForm";
import Settings from "@/components/Settings";
import Toast, { type ToastMessage } from "@/components/Toast";
import { Home, Users, Settings as SettingsIcon, LogOut, BookOpen } from "lucide-react";

// Helper function to generate UUID v4 with a fallback for older devices
function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function App() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<"dashboard" | "customers" | "settings">("dashboard");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modal / overlay states
  const [showCustomerForm, setShowCustomerForm] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showTxForm, setShowTxForm] = useState<"credit" | "payment" | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Toast states
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Check login on mount
  useEffect(() => {
    setMounted(true);
    const loggedIn = localStorage.getItem("khata_logged_in") === "true";
    if (loggedIn) {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("khata_logged_in");
    setIsUnlocked(false);
    showToast("Logged out successfully", "info");
  };

  // Toast helper
  const showToast = (text: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper: Recalculate customer balance from transactions
  const recalculateCustomerBalance = async (customerId: string) => {
    const txs = await db.transactions.where("customerId").equals(customerId).toArray();
    const balance = txs.reduce((sum, tx) => {
      return tx.type === "credit" ? sum + tx.amount : sum - tx.amount;
    }, 0);
    await db.customers.update(customerId, { balance, updatedAt: Date.now() });
  };

  // DB Operations: Customer Save (Create or Update)
  const handleSaveCustomer = async (data: Omit<Customer, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: number; openingBalanceDate?: string }) => {
    try {
      if (data.id) {
        // Edit Customer Profile (Does not overwrite balance, balance is based on transactions)
        await db.customers.update(data.id, {
          name: data.name,
          nameKannada: data.nameKannada,
          phone: data.phone,
          village: data.village,
          createdAt: data.createdAt,
          updatedAt: Date.now(),
        });
        showToast("ಗ್ರಾಹಕರ ವಿವರಗಳು ಬದಲಾಗಿವೆ / Profile updated!", "success");
      } else {
        // Create Customer
        const newId = generateUUID();
        await db.customers.add({
          id: newId,
          name: data.name,
          nameKannada: data.nameKannada,
          phone: data.phone,
          village: data.village,
          balance: data.balance || 0,
          createdAt: data.createdAt || Date.now(),
          updatedAt: Date.now(),
        });

        // If they have opening balance, write it as a transaction
        if (data.balance && data.balance > 0) {
          await db.transactions.add({
            id: generateUUID(),
            customerId: newId,
            type: "credit",
            amount: data.balance,
            description: "Opening Balance / ಆರಂಭಿಕ ಬಾಕಿ",
            date: data.openingBalanceDate || new Date().toISOString().split("T")[0],
            createdAt: data.createdAt || Date.now(),
          });
        }
        showToast("ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಲಾಗಿದೆ / Customer added!", "success");
      }
      setShowCustomerForm(false);
      setEditingCustomer(null);
    } catch (err) {
      console.error(err);
      showToast("Operation failed", "error");
    }
  };

  // DB Operations: Delete Customer
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await db.transaction("rw", db.customers, db.transactions, async () => {
        await db.customers.delete(customerId);
        await db.transactions.where("customerId").equals(customerId).delete();
      });
      showToast("ಗ್ರಾಹಕರ ಖಾತೆಯನ್ನು ಅಳಿಸಲಾಗಿದೆ / Customer deleted", "success");
      setSelectedCustomerId(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete customer", "error");
    }
  };

  // DB Operations: Save Transaction (Create or Edit)
  const handleSaveTransaction = async (txData: { amount: number; description: string; date: string }) => {
    const custId = selectedCustomerId;
    if (!custId) return;

    try {
      if (editingTx) {
        // Editing existing transaction
        await db.transactions.update(editingTx.id!, {
          amount: txData.amount,
          description: txData.description,
          date: txData.date,
        });
        await recalculateCustomerBalance(custId);
        showToast("ವ್ಯವಹಾರದ ವಿವರ ಬದಲಾಗಿದೆ / Transaction updated!", "success");
      } else {
        // Adding new transaction
        const txType = showTxForm;
        if (!txType) return;

        await db.transactions.add({
          id: generateUUID(),
          customerId: custId,
          type: txType,
          amount: txData.amount,
          description: txData.description,
          date: txData.date,
          createdAt: Date.now(),
        });
        await recalculateCustomerBalance(custId);
        showToast(
          txType === "credit" ? "ಕ್ರೆಡಿಟ್ ನೀಡಲಾಗಿದೆ / Credit added!" : "ಹಣ ಜಮೆ ಮಾಡಿಕೊಳ್ಳಲಾಗಿದೆ / Payment received!",
          "success"
        );
      }
      setShowTxForm(null);
      setEditingTx(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to save transaction", "error");
    }
  };

  // DB Operations: Delete Transaction
  const handleDeleteTransaction = async (txId: string) => {
    const custId = selectedCustomerId;
    if (!custId) return;

    try {
      await db.transactions.delete(txId);
      await recalculateCustomerBalance(custId);
      showToast("ವ್ಯವಹಾರ ವಿವರ ಅಳಿಸಲಾಗಿದೆ / Transaction deleted", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete transaction", "error");
    }
  };

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If locked, render lockscreen
  if (!isUnlocked) {
    return <PinScreen onUnlock={handleUnlock} />;
  }

  // Active View router
  const renderActiveTab = () => {
    if (selectedCustomerId) {
      return (
        <CustomerDetail
          customerId={selectedCustomerId}
          onBack={() => setSelectedCustomerId(null)}
          onEditCustomer={(customer) => {
            setEditingCustomer(customer);
            setShowCustomerForm(true);
          }}
          onDeleteCustomer={handleDeleteCustomer}
          onAddCredit={() => setShowTxForm("credit")}
          onReceivePayment={() => setShowTxForm("payment")}
          onEditTransaction={(tx) => {
            setEditingTx(tx);
            setShowTxForm(tx.type);
          }}
          onDeleteTransaction={handleDeleteTransaction}
        />
      );
    }

    switch (currentTab) {
      case "dashboard":
        return (
          <Dashboard
            onAddCustomerClick={() => setShowCustomerForm(true)}
            onCustomerSelect={(id) => setSelectedCustomerId(id)}
            onNavigateToCustomers={() => setCurrentTab("customers")}
          />
        );
      case "customers":
        return (
          <CustomerList
            onAddCustomerClick={() => setShowCustomerForm(true)}
            onCustomerSelect={(id) => setSelectedCustomerId(id)}
          />
        );
      case "settings":
        return <Settings onLogout={handleLogout} showToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Toast Manager */}
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={dismissToast} />
      ))}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-6 pb-24">
        {renderActiveTab()}
      </main>

      {/* Bottom Nav Bar (Hidden when detailed customer screen is open or forms are open) */}
      {!selectedCustomerId && !showCustomerForm && !showTxForm && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
          <div className="max-w-md mx-auto h-full grid grid-cols-3">
            <button
              onClick={() => setCurrentTab("dashboard")}
              className={`flex flex-col items-center justify-center space-y-0.5 active:scale-95 transition touch-manipulation ${
                currentTab === "dashboard" ? "text-black font-extrabold" : "text-gray-400 font-medium"
              }`}
            >
              <Home className={`w-5 h-5 ${currentTab === "dashboard" ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
              <span className="text-[10px]">ಮುಖಪುಟ / Home</span>
            </button>

            <button
              onClick={() => setCurrentTab("customers")}
              className={`flex flex-col items-center justify-center space-y-0.5 active:scale-95 transition touch-manipulation ${
                currentTab === "customers" ? "text-black font-extrabold" : "text-gray-400 font-medium"
              }`}
            >
              <Users className={`w-5 h-5 ${currentTab === "customers" ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
              <span className="text-[10px]">ಗ್ರಾಹಕರು / Customers</span>
            </button>

            <button
              onClick={() => setCurrentTab("settings")}
              className={`flex flex-col items-center justify-center space-y-0.5 active:scale-95 transition touch-manipulation ${
                currentTab === "settings" ? "text-black font-extrabold" : "text-gray-400 font-medium"
              }`}
            >
              <SettingsIcon className={`w-5 h-5 ${currentTab === "settings" ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
              <span className="text-[10px]">ಸೆಟ್ಟಿಂಗ್ಸ್ / Settings</span>
            </button>
          </div>
        </nav>
      )}

      {/* Customer Form Overlay (Add/Edit Customer) */}
      {showCustomerForm && (
        <CustomerForm
          customer={editingCustomer || undefined}
          onSave={handleSaveCustomer}
          onCancel={() => {
            setShowCustomerForm(false);
            setEditingCustomer(null);
          }}
          showToast={showToast}
        />
      )}

      {/* Transaction Form Overlay (Give Credit / Receive Payment) */}
      {showTxForm && (
        <TransactionForm
          transaction={editingTx || undefined}
          type={showTxForm}
          onSave={handleSaveTransaction}
          onCancel={() => {
            setShowTxForm(null);
            setEditingTx(null);
          }}
        />
      )}
    </div>
  );
}
