"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { Lock, Download, Upload, Trash2, LogOut, Save, AlertTriangle, Eye, EyeOff } from "lucide-react";

interface SettingsProps {
  onLogout: () => void;
  showToast: (text: string, type: "success" | "error" | "info") => void;
}

export default function Settings({ onLogout, showToast }: SettingsProps) {
  const [currentPin, setCurrentPin] = useState<string>("");
  const [newPin, setNewPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [showPinFields, setShowPinFields] = useState<boolean>(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState<boolean>(false);

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();

    const storedPin = localStorage.getItem("khata_pin") || "1234";

    if (currentPin !== storedPin) {
      showToast("Current PIN is incorrect", "error");
      return;
    }

    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      showToast("New PIN must be a 4-digit number", "error");
      return;
    }

    if (newPin !== confirmPin) {
      showToast("New PIN and Confirm PIN do not match", "error");
      return;
    }

    localStorage.setItem("khata_pin", newPin);
    showToast("PIN code updated successfully!", "success");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setShowPinFields(false);
  };

  const handleExportBackup = async () => {
    try {
      const customers = await db.customers.toArray();
      const transactions = await db.transactions.toArray();

      const backup = {
        version: 1,
        exportedAt: Date.now(),
        customers,
        transactions,
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `khata_backup_${today}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Backup exported successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export backup data", "error");
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backup = JSON.parse(text);

        if (!backup.customers || !backup.transactions) {
          showToast("Invalid backup file structure", "error");
          return;
        }

        const confirmRestore = window.confirm(
          "ಗಮನಿಸಿ: ಇದು ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಇರುವ ಎಲ್ಲಾ ಮಾಹಿತಿಯನ್ನು ಅಳಿಸಿ ಬ್ಯಾಕಪ್ ಮಾಹಿತಿಯನ್ನು ತುಂಬುತ್ತದೆ. ಮುಂದುವರಿಯಬೇಕೇ?\n\nWARNING: This will replace all current data. Do you want to proceed?"
        );

        if (confirmRestore) {
          await db.transaction("rw", db.customers, db.transactions, async () => {
            await db.customers.clear();
            await db.transactions.clear();
            await db.customers.bulkAdd(backup.customers);
            await db.transactions.bulkAdd(backup.transactions);
          });
          showToast("Data restored successfully!", "success");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (err) {
        console.error(err);
        showToast("Error parsing file. Ensure it is valid JSON.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleWipeDatabase = async () => {
    try {
      await db.transaction("rw", db.customers, db.transactions, async () => {
        await db.customers.clear();
        await db.transactions.clear();
      });
      showToast("All data cleared successfully", "success");
      setShowWipeConfirm(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast("Failed to clear data", "error");
    }
  };

  return (
    <div className="flex flex-col space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ಅಪ್ಲಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್ಸ್</h1>
        <p className="text-sm text-gray-500 font-medium">Settings & Controls</p>
      </div>

      <div className="space-y-4">
        {/* Security / PIN section */}
        <div className="border border-gray-250 rounded-2xl bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-150 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">ಭದ್ರತಾ ಪಿನ್ ಬದಲಾವಣೆ</h3>
                <p className="text-xs text-gray-400 font-medium">Change Access PIN</p>
              </div>
            </div>
            <button
              onClick={() => setShowPinFields(!showPinFields)}
              className="text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition"
            >
              {showPinFields ? "Hide" : "Edit PIN"}
            </button>
          </div>

          {showPinFields && (
            <form onSubmit={handleUpdatePin} className="pt-3 border-t border-gray-100 space-y-3 animate-fade-in">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="Old PIN"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-center focus:outline-none focus:ring-1 focus:ring-black"
                />
                <input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="New PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-center focus:outline-none focus:ring-1 focus:ring-black"
                />
                <input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="Confirm"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-center focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 hover:bg-gray-800 transition active:bg-gray-900 touch-manipulation"
              >
                <Save className="w-4 h-4" /> Save PIN
              </button>
            </form>
          )}
        </div>

        {/* Database Export Backup */}
        <div className="border border-gray-250 rounded-2xl bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-150 flex items-center justify-center">
              <Download className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h3 className="font-bold text-sm">ಬ್ಯಾಕಪ್ ಫೈಲ್ ಡೌನ್‌ಲೋಡ್</h3>
              <p className="text-xs text-gray-400 font-medium">Export Data Backup (JSON)</p>
            </div>
          </div>
          <button
            onClick={handleExportBackup}
            className="p-2 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition active:scale-95 touch-manipulation"
            title="Download Backup"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Database Import Backup */}
        <div className="border border-gray-250 rounded-2xl bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-150 flex items-center justify-center">
              <Upload className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h3 className="font-bold text-sm">ಮಾಹಿತಿ ಮರುಸ್ಥಾಪನೆ (ಬ್ಯಾಕಪ್)</h3>
              <p className="text-xs text-gray-400 font-medium">Restore Data from Backup</p>
            </div>
          </div>
          <label className="p-2 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition active:scale-95 cursor-pointer touch-manipulation">
            <Upload className="w-5 h-5 text-gray-700" />
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>

        {/* Wipe Database */}
        <div className="border border-red-100 rounded-2xl bg-red-50/20 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-950">ಡೇಟಾ ಅಳಿಸಿಹಾಕಿ (Wipe App)</h3>
              <p className="text-xs text-red-500 font-medium">Clear All Customer Accounts</p>
            </div>
          </div>
          <button
            onClick={() => setShowWipeConfirm(true)}
            className="p-2 border border-red-200 rounded-xl bg-red-50 hover:bg-red-100 transition active:scale-95 text-red-600 touch-manipulation"
            title="Wipe Database"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Log Out */}
        <button
          onClick={onLogout}
          className="w-full border border-gray-250 bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 transition shadow-sm active:scale-98 touch-manipulation"
        >
          <LogOut className="w-5 h-5" />
          <span>ಲಾಗ್ ಔಟ್ / Logout</span>
        </button>
      </div>

      {/* Wipe Database Confirmation Modal */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">ಖಾತಾವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಅಳಿಸುವುದೇ? / Wipe App?</h4>
              <p className="text-xs text-gray-500 font-medium mt-1">
                ಕ್ರಿಟಿಕಲ್: ಇದು ನಿಮ್ಮ ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿರುವ ಎಲ್ಲಾ ಮಾಹಿತಿಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ ಹಾಕುತ್ತದೆ. ಇದನ್ನು ಮರಳಿ ಪಡೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ.
              </p>
              <p className="text-xs text-red-600 font-bold mt-2">
                WARNING: This will permanently delete ALL customers and transactions. Make sure you downloaded a backup JSON.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowWipeConfirm(false)}
                className="py-2.5 border border-gray-200 rounded-xl text-sm font-semibold active:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleWipeDatabase}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition active:bg-red-800"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
