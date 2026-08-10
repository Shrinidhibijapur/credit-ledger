"use client";

import { useState, useEffect, useRef } from "react";
import { type Customer } from "@/lib/db";
import { Mic, MicOff, Languages, X, HelpCircle, Save, Loader2 } from "lucide-react";

interface CustomerFormProps {
  customer?: Customer; // If provided, we are editing
  onSave: (data: Omit<Customer, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: number; openingBalanceDate?: string }) => void;
  onCancel: () => void;
  showToast: (text: string, type: "success" | "error" | "info") => void;
}

export default function CustomerForm({
  customer,
  onSave,
  onCancel,
  showToast,
}: CustomerFormProps) {
  const [name, setName] = useState<string>("");
  const [nameKannada, setNameKannada] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [village, setVillage] = useState<string>("");
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [openingBalanceDate, setOpeningBalanceDate] = useState<string>("");
  const [createdDate, setCreatedDate] = useState<string>("");

  // States for UX integrations
  const [isListening, setIsListening] = useState<boolean>(false);
  const [listeningLang, setListeningLang] = useState<"kn-IN" | "en-IN">("kn-IN");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translitSuggestions, setTranslitSuggestions] = useState<string[]>([]);

  const recognitionRef = useRef<any>(null);

  const getTodayStr = () => {
    const today = new Date();
    return today.getFullYear() + "-" + 
           String(today.getMonth() + 1).padStart(2, "0") + "-" + 
           String(today.getDate()).padStart(2, "0");
  };

  const formatDateStr = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.getFullYear() + "-" + 
           String(d.getMonth() + 1).padStart(2, "0") + "-" + 
           String(d.getDate()).padStart(2, "0");
  };

  // Load editing values if provided
  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setNameKannada(customer.nameKannada || "");
      setPhone(customer.phone || "");
      setVillage(customer.village || "");
      setOpeningBalance(customer.balance);
      setCreatedDate(formatDateStr(customer.createdAt));
    } else {
      setOpeningBalanceDate(getTodayStr());
      setCreatedDate(getTodayStr());
    }
  }, [customer]);

  // Transliterate function using Google Input Tools API
  const handleTransliterate = async (textToTranslate: string) => {
    const text = textToTranslate || name;
    if (!text.trim()) {
      showToast("Please enter an English name first", "error");
      return;
    }

    setIsTranslating(true);
    setTranslitSuggestions([]);
    try {
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
        text
      )}&itc=kn-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      if (data[0] === "SUCCESS") {
        const suggestions = data[1][0][1] as string[];
        if (suggestions.length > 0) {
          setTranslitSuggestions(suggestions);
          // Auto-select first suggestion for Kannada Name
          setNameKannada(suggestions[0]);
          showToast("Transliteration suggestions loaded!", "success");
        } else {
          showToast("No Kannada suggestions found for this name", "info");
        }
      } else {
        throw new Error("API status failed");
      }
    } catch (err) {
      console.error(err);
      showToast("Translation offline. Enter Kannada manually.", "error");
    } finally {
      setIsTranslating(false);
    }
  };

  // Toggle voice dictation
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("Speech Recognition not supported in this browser.", "error");
      return;
    }

    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      // Start listening
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = listeningLang;

      recognition.onstart = () => {
        setIsListening(true);
        showToast(`Listening in ${listeningLang === "kn-IN" ? "Kannada" : "English"}...`, "info");
      };

      recognition.onresult = async (event: any) => {
        let transcript = "";
        if (event.results) {
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i]?.[0]) {
              transcript += event.results[i][0].transcript;
            }
          }
        }
        const text = transcript.trim();
        if (!text) {
          setIsListening(false);
          return;
        }

        if (listeningLang === "en-IN") {
          setName(text);
          setIsTranslating(true);
          setTranslitSuggestions([]);
          try {
            // Translate English to Kannada
            const gtUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=kn&dt=t&q=${encodeURIComponent(text)}`;
            const gtRes = await fetch(gtUrl);
            if (gtRes.ok) {
              const gtData = await gtRes.ok ? await gtRes.json() : null;
              const translated = gtData?.[0]?.[0]?.[0]?.trim();
              if (translated) {
                setNameKannada(translated);
              }
            }

            // Also get Google Input Tools suggestions for choice chips
            const gitUrl = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=kn-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
            const gitRes = await fetch(gitUrl);
            if (gitRes.ok) {
              const gitData = await gitRes.json();
              if (gitData[0] === "SUCCESS") {
                const suggestions = gitData[1][0][1] as string[];
                setTranslitSuggestions(suggestions);
                if (suggestions.length > 0) {
                  setNameKannada((prev) => prev || suggestions[0]);
                }
              }
            }
          } catch (err) {
            console.error("Transliteration failed:", err);
            showToast("Offline: Saved text as-is", "info");
          } finally {
            setIsTranslating(false);
          }
        } else {
          // User spoke in Kannada script
          setNameKannada(text);
          setIsTranslating(true);
          try {
            // Translate Kannada script to English characters
            const gtUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=kn&tl=en&dt=t&q=${encodeURIComponent(text)}`;
            const gtRes = await fetch(gtUrl);
            if (gtRes.ok) {
              const gtData = await gtRes.json();
              const translated = gtData?.[0]?.[0]?.[0]?.trim();
              if (translated) {
                setName(translated);
              }
            }
          } catch (err) {
            console.error("English translation failed:", err);
          } finally {
            setIsTranslating(false);
          }
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        // Ignore "aborted" (programmatic stop) and "no-speech" (no voice detected)
        if (event.error !== "aborted" && event.error !== "no-speech") {
          showToast(`Voice input failed: ${event.error}`, "error");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() && !nameKannada.trim()) {
      showToast("Name is required", "error");
      return;
    }

    // Default to English name if only Kannada name is provided
    const finalName = name.trim() || nameKannada.trim();

    onSave({
      id: customer?.id,
      name: finalName,
      nameKannada: nameKannada.trim() || undefined,
      phone: phone.trim() || undefined,
      village: village.trim() || undefined,
      balance: openingBalance,
      openingBalanceDate: openingBalanceDate,
      createdAt: createdDate ? new Date(createdDate).getTime() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-gray-200 p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-5 animate-slide-up flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold">
            {customer ? "ವಿವರಗಳನ್ನು ಬದಲಿಸಿ / Edit Customer" : "ಹೊಸ ಗ್ರಾಹಕರ ಸೇರ್ಪಡೆ / Add Customer"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs Section */}
        <div className="space-y-4 flex-1">
          {/* Name Field (English) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              ಗ್ರಾಹಕರ ಹೆಸರು (English) / Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter English Name (e.g. Ramesh)"
                className="w-full pl-3 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-semibold"
              />
              <button
                type="button"
                onClick={() => handleTransliterate(name)}
                disabled={isTranslating}
                className="absolute right-2 top-1.5 h-9 px-3 rounded-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 text-xs font-bold transition flex items-center gap-1 active:scale-95 touch-manipulation"
              >
                {isTranslating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Languages className="w-3.5 h-3.5" />
                )}
                <span>ಅ -{">"} A</span>
              </button>
            </div>
          </div>

          {/* Kannada Name Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              ಹೆಸರು ಕನ್ನಡದಲ್ಲಿ / Kannada Name
            </label>
            <input
              type="text"
              value={nameKannada}
              onChange={(e) => setNameKannada(e.target.value)}
              placeholder="ಕನ್ನಡ ಹೆಸರು (ಉದಾ: ರಮೇಶ್)"
              className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-semibold font-kannada"
            />

            {/* Transliteration suggestions chips */}
            {translitSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                <span className="text-[10px] text-gray-400 font-bold self-center mr-1 uppercase">Suggestions:</span>
                {translitSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setNameKannada(suggestion)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold font-kannada border transition ${
                      nameKannada === suggestion
                        ? "bg-black text-white border-black"
                        : "bg-gray-50 hover:bg-gray-100 text-black border-gray-200"
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Input Options */}
          <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                🎤 ಧ್ವನಿ ಇನ್ಪುಟ್ / Speech Input
              </span>
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setListeningLang("kn-IN")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    listeningLang === "kn-IN" ? "bg-black text-white" : "text-gray-500"
                  }`}
                >
                  ಕನ್ನಡ
                </button>
                <button
                  type="button"
                  onClick={() => setListeningLang("en-IN")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    listeningLang === "en-IN" ? "bg-black text-white" : "text-gray-500"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleListening}
              className={`w-full py-3 border rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition active:scale-98 touch-manipulation ${
                isListening
                  ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                  : "bg-white text-black border-gray-200 hover:bg-gray-50 shadow-sm"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 text-red-600" />
                  <span>ಮಾತನಾಡುವುದನ್ನು ನಿಲ್ಲಿಸಿ / Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-gray-600" />
                  <span>
                    {listeningLang === "kn-IN"
                      ? "ಮಾತನಾಡಿ ಹೆಸರು ದಾಖಲಿಸಿ"
                      : "Speak Name in English"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Phone Number Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              ಮೊಬೈಲ್ ನಂಬರ್ / Phone (Optional)
            </label>
            <input
              type="tel"
              pattern="[0-9]*"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 9876543210"
              maxLength={10}
              className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-semibold"
            />
          </div>

          {/* Village Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              ಗ್ರಾಮ / Village (Optional)
            </label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Rampura, Hosur"
              className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-semibold"
            />
          </div>

          {/* Registration Date Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              ದಾಖಲಿಸಿದ ದಿನಾಂಕ / Add Date (Optional)
            </label>
            <input
              type="date"
              value={createdDate}
              onChange={(e) => setCreatedDate(e.target.value)}
              className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-bold"
            />
          </div>

          {/* Opening Balance (Only shown during customer creation, disabled for edits) */}
          {!customer && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  ಆರಂಭಿಕ ಬಾಕಿ ಹಣ / Opening Due Balance
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={openingBalance || ""}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-semibold"
                  />
                </div>
              </div>

              {openingBalance > 0 && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    ಆರಂಭಿಕ ದಿನಾಂಕ / Opening Balance Date
                  </label>
                  <input
                    type="date"
                    value={openingBalanceDate}
                    onChange={(e) => setOpeningBalanceDate(e.target.value)}
                    required
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-bold"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Submit Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="py-3 border border-gray-200 rounded-xl text-sm font-bold active:bg-gray-50 transition"
          >
            రದ್ದು ಮಾಡಿ / Cancel
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
