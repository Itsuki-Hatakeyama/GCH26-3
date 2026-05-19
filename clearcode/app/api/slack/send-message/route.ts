// app/api/slack/send-message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { postMessage } from '@/lib/slack';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, message } = body;

    if (!channel || !message) {
      return NextResponse.json(
        { error: 'channel and message are required' },
        { status: 400 }
      );
    }

    // 環境変数からBot Tokenを取得
    const botToken = process.env.SLACK_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { error: 'SLACK_BOT_TOKEN is not configured' },
        { status: 500 }
      );
    }

    // Slackにメッセージを送信
    const result = await postMessage(botToken, channel, message);

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: result,
    });

  } catch (error) {
    console.error('Send message error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}