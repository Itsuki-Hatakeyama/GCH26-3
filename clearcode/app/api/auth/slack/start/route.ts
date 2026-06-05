
// app/api/auth/slack/start/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // URLパラメータからリポジトリIDを取得
  const repository_id = request.nextUrl.searchParams.get('repository_id');
  
  if (!repository_id) {
    return NextResponse.json(
      { error: 'repository_id is required' },
      { status: 400 }
    );
  }

  // Slack認証ページのURLを作成
  const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize');
  slackAuthUrl.searchParams.set('client_id', process.env.SLACK_CLIENT_ID!);
  slackAuthUrl.searchParams.set('scope', 'chat:write,channels:read,files:write');
  slackAuthUrl.searchParams.set('redirect_uri', process.env.SLACK_REDIRECT_URI!);
  slackAuthUrl.searchParams.set('state', repository_id);

  // Slackの認証ページにリダイレクト
  return NextResponse.redirect(slackAuthUrl.toString());
}