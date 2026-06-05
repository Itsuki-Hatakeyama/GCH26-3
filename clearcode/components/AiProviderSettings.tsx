"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";

type AIProvider = "groq" | "gemini" | "openai";

const PROVIDERS: { value: AIProvider; label: string; placeholder: string; hint: string }[] = [
  {
    value: "groq",
    label: "Groq (llama-3.3-70b)",
    placeholder: "gsk_...",
    hint: "console.groq.com/keys",
  },
  {
    value: "gemini",
    label: "Google Gemini (gemini-2.0-flash)",
    placeholder: "AIza...",
    hint: "aistudio.google.com/apikey",
  },
  {
    value: "openai",
    label: "OpenAI (gpt-4o-mini)",
    placeholder: "sk-...",
    hint: "platform.openai.com/api-keys",
  },
];

export default function AiProviderSettings() {
  const [currentProvider, setCurrentProvider] = useState<AIProvider>("groq");
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("groq");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/settings/ai-provider")
      .then((r) => r.json())
      .then((d) => {
        if (d.provider) { setCurrentProvider(d.provider); setSelectedProvider(d.provider); }
        setHasKey(d.hasKey ?? false);
      });
  }, []);

  const selectedMeta = PROVIDERS.find((p) => p.value === selectedProvider)!;

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/ai-provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error ?? "保存に失敗しました", ok: false });
      } else {
        setCurrentProvider(selectedProvider);
        setHasKey(true);
        setApiKey("");
        setShowKey(false);
        setMessage({ text: "保存しました", ok: true });
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
      const res = await fetch("/api/settings/ai-provider", { method: "DELETE" });
      if (res.ok) {
        setCurrentProvider("groq");
        setSelectedProvider("groq");
        setHasKey(false);
        setMessage({ text: "削除しました。デフォルト（Groq）に戻りました", ok: true });
        setTimeout(() => setMessage(null), 3000);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 現在の状態 */}
      <div className="flex items-center gap-2 flex-wrap">
        {hasKey === null ? (
          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        ) : hasKey ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
            <Check className="w-3 h-3" />
            {PROVIDERS.find((p) => p.value === currentProvider)?.label ?? currentProvider} を使用中
          </span>
        ) : (
          <span className="inline-flex items-center text-xs font-medium text-neutral-500 bg-neutral-100 rounded-full px-2.5 py-1">
            未設定（デフォルト: Groq 共有キー）
          </span>
        )}
      </div>

      {/* プロバイダー選択 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.value}
            onClick={() => setSelectedProvider(p.value)}
            className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-colors ${
              selectedProvider === p.value
                ? "border-neutral-900 bg-neutral-50 text-neutral-900 font-semibold"
                : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
            }`}
          >
            <span className="block font-mono text-[11px] mb-0.5 opacity-60">{p.value.toUpperCase()}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* APIキー入力 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={selectedMeta.placeholder}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono pr-9 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button onClick={handleSave} disabled={saving || !apiKey.trim()} size="sm" className="rounded-lg shrink-0">
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
        <p className={`text-xs ${message.ok ? "text-green-600" : "text-red-500"}`}>{message.text}</p>
      )}

      {/* APIキー取得リンク */}
      <p className="text-xs text-neutral-400">
        APIキーの取得:{" "}
        <a href={`https://${selectedMeta.hint}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          {selectedMeta.hint}
        </a>
      </p>
    </div>
  );
}
