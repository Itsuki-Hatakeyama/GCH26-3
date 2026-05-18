

// app/api/auth/slack/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/slack';

export async function GET(request: NextRequest) {
  try {
    // URLパラメータを取得
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state'); // repository_id
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is missing' },
        { status: 400 }
      );
    }

    // Slackからアクセストークンを取得
    const tokenData = await getAccessToken(code);

    console.log('✅ Slack連携成功！');
    console.log('Repository ID:', state);
    console.log('Workspace:', tokenData.team.name);
    console.log('Access Token取得完了');

    // 成功ページを表示（今は簡易版）
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Slack連携成功</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              text-align: center;
            }
            h1 { color: #2eb886; margin: 0 0 16px; }
            p { color: #666; margin: 8px 0; }
            .info { 
              background: #f8f8f8; 
              padding: 16px; 
              border-radius: 4px; 
              margin-top: 24px;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Slack連携成功！</h1>
            <p>Clearcodeがワークスペースに接続されました</p>
            <div class="info">
              <p><strong>ワークスペース:</strong> ${tokenData.team.name}</p>
              <p><strong>リポジトリID:</strong> ${state}</p>
            </div>
            <p style="margin-top: 24px; color: #999;">
              この画面を閉じてダッシュボードに戻ってください
            </p>
          </div>
        </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );

  } catch (error) {
    console.error('Slack OAuth error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to complete Slack authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}