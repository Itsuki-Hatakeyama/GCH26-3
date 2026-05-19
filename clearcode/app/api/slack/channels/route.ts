// app/api/slack/channels/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getChannels } from '@/lib/slack';

export async function GET(request: NextRequest) {
  try {
    // 環境変数からBot Tokenを取得
    const botToken = process.env.SLACK_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { error: 'SLACK_BOT_TOKEN is not configured' },
        { status: 500 }
      );
    }

    // Slackからチャンネル一覧を取得
    const channels = await getChannels(botToken);

    // パブリックチャンネルのみフィルタリング
    const publicChannels = channels
      .filter((channel: any) => !channel.is_private && !channel.is_archived)
      .map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        memberCount: channel.num_members || 0,
      }));

    return NextResponse.json({
      success: true,
      channels: publicChannels,
    });

  } catch (error) {
    console.error('Get channels error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get channels',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}