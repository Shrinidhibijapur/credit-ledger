"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info";
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgClass =
    toast.type === "success"
      ? "bg-black text-white border border-gray-800"
      : toast.type === "error"
      ? "bg-red-50 text-red-900 border border-red-200"
      : "bg-gray-50 text-gray-900 border border-gray-200";

  const icon =
    toast.type === "success" ? (
      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
    ) : (
      <AlertCircle className={`w-5 h-5 shrink-0 ${toast.type === "error" ? "text-red-500" : "text-gray-500"}`} />
    );

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-50 flex items-center justify-between p-4 rounded-xl shadow-lg border ${bgClass} transition-all duration-300 animate-slide-down`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{toast.text}</span>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
