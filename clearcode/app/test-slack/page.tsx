// app/test-slack/page.tsx
'use client';

import { useState } from 'react';

export default function TestSlackPage() {
  const [channelId, setChannelId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSend = async () => {
    if (!channelId || !message) {
      alert('チャンネルIDとメッセージを入力してください');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/slack/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: channelId,
          message: message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: 'メッセージ送信成功！' });
        setMessage(''); // メッセージをクリア
      } else {
        setResult({ success: false, message: data.error || 'エラーが発生しました' });
      }
    } catch (error) {
      setResult({ success: false, message: 'ネットワークエラーが発生しました' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: '32px' }}>Slack通知テスト</h1>
      
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          チャンネルID
        </label>
        <input
          type="text"
          placeholder="例: C1234567890"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
        <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
          チャンネルIDの取得方法：Slackでチャンネルを開く → 右上の「▼」→「チャンネル詳細を表示」→ 一番下にあります
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          メッセージ
        </label>
        <textarea
          placeholder="送信するメッセージを入力..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            resize: 'vertical',
          }}
        />
      </div>

      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: loading ? '#ccc' : '#2eb886',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '送信中...' : 'Slackに送信'}
      </button>

      {result && (
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            borderRadius: '4px',
            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
            color: result.success ? '#155724' : '#721c24',
            border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}