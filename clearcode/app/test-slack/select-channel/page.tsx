// app/test-slack/select-channel/page.tsx
'use client';

import { useState, useEffect } from 'react';

type Channel = {
  id: string;
  name: string;
  memberCount: number;
};

export default function SelectChannelPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // チャンネル一覧を取得
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch('/api/slack/channels');
        const data = await response.json();
        
        if (data.success) {
          setChannels(data.channels);
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  const handleSend = async () => {
    if (!selectedChannel || !message) {
      alert('チャンネルとメッセージを入力してください');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/slack/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: selectedChannel,
          message: message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: 'メッセージ送信成功！' });
        setMessage('');
      } else {
        setResult({ success: false, message: data.error || 'エラーが発生しました' });
      }
    } catch {
      setResult({ success: false, message: 'ネットワークエラーが発生しました' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: '32px' }}>Slack通知テスト（チャンネル選択版）</h1>
      
      {loading ? (
        <p>チャンネル読み込み中...</p>
      ) : (
        <>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              チャンネルを選択
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="">-- チャンネルを選択 --</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name} ({channel.memberCount}人)
                </option>
              ))}
            </select>
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
            disabled={sending || !selectedChannel}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: sending || !selectedChannel ? '#ccc' : '#2eb886',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: sending || !selectedChannel ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? '送信中...' : 'Slackに送信'}
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
        </>
      )}
    </div>
  );
}