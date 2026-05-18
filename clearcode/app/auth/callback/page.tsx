"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const LoadingCard = () => (
  <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex items-center justify-center px-4">
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center">
        <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">ログイン中...</h1>
        <p className="text-sm text-gray-500">しばらくお待ちください</p>
      </CardContent>
    </Card>
  </div>
);

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Googleでの認証がキャンセルされました");
      return;
    }

    if (!code) {
      setError("認可コードが取得できませんでした");
      return;
    }

    fetch("/api/auth/google/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error.message ?? "認証に失敗しました。もう一度お試しください");
          return;
        }
        if (data.isNewUser) {
          router.push("/dashboard/connect-github");
        } else {
          router.push("/dashboard");
        }
      })
      .catch(() => {
        setError("ネットワークエラーが発生しました");
      });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              ログインに失敗しました
            </h1>
            <p className="text-sm text-gray-500 mb-8">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/api/auth/google/start">
                <Button className="w-full sm:w-auto">もう一度試す</Button>
              </a>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => router.push("/")}
              >
                トップページに戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <LoadingCard />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <CallbackContent />
    </Suspense>
  );
}
