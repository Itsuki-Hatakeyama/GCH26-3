"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error?.message ?? "エラーが発生しました");
        return;
      }

      if (data.isNewUser) {
        router.push("/dashboard/connect-github");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-sm p-8">
      <p className="text-sm font-medium text-gray-500 mb-5 tracking-wide uppercase">
        メールアドレスでログイン
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="your@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="w-full h-11 rounded-xl border-gray-200 bg-gray-50 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-300 focus-visible:ring-offset-0"
        />
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {loading ? "処理中..." : "はじめる →"}
        </Button>
        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
      </form>
      <p className="mt-5 text-xs text-gray-400 text-center leading-relaxed">
        初めての方は自動でアカウントを作成します
      </p>
    </div>
  );
}
