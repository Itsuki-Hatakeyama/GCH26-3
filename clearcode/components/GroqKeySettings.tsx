"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";

export default function GroqKeySettings() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/settings/groq-key")
      .then((r) => r.json())
      .then((d) => setHasKey(d.hasKey ?? false));
  }, []);

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/groq-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: inputValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error ?? "保存に失敗しました", ok: false });
      } else {
        setHasKey(true);
        setInputValue("");
        setShowInput(false);
        setMessage({ text: "APIキーを保存しました", ok: true });
        setTimeout(() => setMessage(null), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/groq-key", { method: "DELETE" });
      if (res.ok) {
        setHasKey(false);
        setMessage({ text: "APIキーを削除しました", ok: true });
        setTimeout(() => setMessage(null), 3000);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* 現在の状態 */}
      <div className="flex items-center gap-3">
        {hasKey === null ? (
          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        ) : hasKey ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
            <Check className="w-3 h-3" />
            設定済み（個人キーを使用中）
          </span>
        ) : (
          <span className="inline-flex items-center text-xs font-medium text-neutral-500 bg-neutral-100 rounded-full px-2.5 py-1">
            未設定（アプリのデフォルトキーを使用中）
          </span>
        )}
      </div>

      {/* 入力フォーム */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showInput ? "text" : "password"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="gsk_..."
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono pr-9 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
          <button
            type="button"
            onClick={() => setShowInput((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            {showInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !inputValue.trim()}
          size="sm"
          className="rounded-lg shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "保存"}
        </Button>
        {hasKey && (
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="outline"
            size="sm"
            className="rounded-lg shrink-0 text-red-600 hover:text-red-700 hover:border-red-300"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* フィードバック */}
      {message && (
        <p className={`text-xs ${message.ok ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}

      <p className="text-xs text-neutral-400 leading-relaxed">
        Groqの無料APIキーは{" "}
        <a
          href="https://console.groq.com/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          console.groq.com/keys
        </a>{" "}
        から取得できます。設定するとあなた専用のレート制限が適用されます。
      </p>
    </div>
  );
}
