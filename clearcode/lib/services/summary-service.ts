import Groq from 'groq-sdk'
import type { ChangeCategory } from '@/lib/prompts/categorize-change'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

function compressDiff(diff: string): string {
  if (!diff) return ''

  const lines = diff.split('\n')

  // 変更ファイル名を先頭に列挙
  const fileNames = lines
    .filter((l) => l.startsWith('diff --git'))
    .map((l) => l.replace('diff --git a/', '').split(' b/')[0])
  const fileHeader = fileNames.length > 0 ? `変更ファイル: ${fileNames.join(', ')}\n\n` : ''

  if (diff.length <= 1000) return fileHeader + diff

  const extracted = lines
    .filter((l) =>
      l.startsWith('+') ||
      l.startsWith('-') ||
      l.startsWith('@@') ||
      l.startsWith('diff --git')
    )
    .join('\n')

  const body = extracted.length <= 2000 ? extracted : extracted.slice(0, 2000)
  return fileHeader + body
}

const SYSTEM_PROMPT = `You are a Git commit analyzer. You MUST respond with ONLY valid JSON — no markdown fences, no explanation, no extra text.
All string values must be in Japanese.

Output this exact JSON structure:
{
  "simplified_message": string,        // 1 sentence for anyone explaining what changed
  "explanation_simple": string,        // 2-3 sentences for non-programmers, no technical jargon at all
  "explanation_technical": string,     // 2-3 sentences for engineers with technical details
  "technical_terms": [{"term": string, "description": string}],  // 0-3 key technical terms explained in plain Japanese
  "quality_score": number,             // integer 0-100 rating commit message clarity (100 = perfect, 0 = useless)
  "quality_feedback": string,          // actionable improvement suggestion, 50 Japanese chars or less
  "categories": string[]               // 1-3 items from exactly: フロントエンド, バックエンド, インフラ, テスト, ドキュメント, 設定, リファクタリング, バグ修正
}

Example 1 (フロントエンド・バグ修正):
Input:
コミットメッセージ: fix login bug
差分:
変更ファイル: app/login/page.tsx
-  if (password.length < 6) return null
+  if (password.length < 8) return null

Output:
{"simplified_message":"ログインのパスワード条件を6文字から8文字に変更しました。","explanation_simple":"ログイン画面でパスワードが短すぎるときにエラーが出る条件を変更しました。以前は6文字以上でよかったのが、8文字以上が必要になりました。これによりアカウントがより安全になります。","explanation_technical":"app/login/page.tsxのパスワード長バリデーションの最小値を6文字から8文字に引き上げました。nullを返すearly returnパターンを維持しつつ、セキュリティポリシーを強化しています。","technical_terms":[{"term":"バリデーション","description":"入力された値が正しい形式かどうかチェックする処理"},{"term":"early return","description":"条件を満たさない場合に処理を早めに終了するコードの書き方"}],"quality_score":42,"quality_feedback":"何のバグか具体的に書くとよい（例：パスワード最小文字数を8文字に修正）","categories":["フロントエンド","バグ修正"]}

Example 2 (バックエンド・新機能):
Input:
コミットメッセージ: add user profile API endpoint
差分:
変更ファイル: app/api/users/[id]/profile/route.ts
+export async function GET(req, { params }) {
+  const user = await db.users.findById(params.id)
+  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 })
+  return NextResponse.json({ name: user.name, email: user.email })
+}

Output:
{"simplified_message":"ユーザーのプロフィール情報を取得する機能を追加しました。","explanation_simple":"アプリがユーザーの名前やメールアドレスを取得できる新しい機能を追加しました。これにより、プロフィールページなどで最新の情報を表示できるようになります。ユーザー自身は特に操作不要で自動的に反映されます。","explanation_technical":"app/api/users/[id]/profile/route.tsにGETエンドポイントを新規実装しました。DBからユーザーを取得し、存在しない場合は404を返すエラーハンドリングも追加しています。","technical_terms":[{"term":"APIエンドポイント","description":"外部からデータをやりとりするための窓口となるURL"},{"term":"404","description":"リクエストしたデータが見つからない場合に返すエラーコード"}],"quality_score":55,"quality_feedback":"どんな情報を返すか具体的に書くとよい（例：ユーザープロフィール取得APIを追加）","categories":["バックエンド"]}

Example 3 (リファクタリング・バックエンド):
Input:
コミットメッセージ: refactor auth middleware
差分:
変更ファイル: middleware/auth.ts
-function checkAuth(req) {
-  const token = req.headers['authorization']
-  if (!token) throw new Error('unauthorized')
-  const user = jwt.verify(token, SECRET)
-  req.user = user
-}
+async function checkAuth(req) {
+  const token = req.cookies.get('session')?.value
+  if (!token) return null
+  return await verifySession(token)
+}

Output:
{"simplified_message":"ログイン確認の仕組みをより安全な方式に作り直しました。","explanation_simple":"アプリにログインしているかどうかを確認する処理を改善しました。以前の方式より安全で、エラーが起きにくくなっています。ユーザーが直接気づく変化はありませんが、裏側の安定性が上がっています。","explanation_technical":"auth middlewareの認証フローをJWTヘッダー検証からセッションCookie検証に移行しました。例外スローをnull返却に変更し、呼び出し元でのエラーハンドリングを柔軟にしています。","technical_terms":[{"term":"ミドルウェア","description":"リクエストとレスポンスの間に挟まって共通処理を行うプログラム"},{"term":"JWT","description":"ログイン情報を安全にやりとりするための暗号化されたトークン形式"},{"term":"リファクタリング","description":"動作を変えずにコードの内部構造を整理・改善すること"}],"quality_score":60,"quality_feedback":"何をどう変えたか具体的に書くとよい（例：認証をJWTからセッションCookieに移行）","categories":["バックエンド","リファクタリング"]}`

function buildUserPrompt(commitMessage: string, diff: string): string {
  return `コミットメッセージ: ${commitMessage}

差分:
${compressDiff(diff) || '(差分なし)'}`
}

async function generate(userPrompt: string, retries = 2): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 700,
        response_format: { type: 'json_object' },
      })
      return result.choices[0].message.content?.trim() ?? ''
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Groq raw error]', msg)

      if (msg.includes('429') || msg.includes('rate_limit')) {
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 10_000))
          continue
        }
        throw new Error('QUOTA_EXCEEDED_DAILY')
      }
      throw err
    }
  }
  throw new Error('Groq generate failed after retries')
}

export interface CommitSummary {
  simplified_message: string
  code_explanation: string
  message_quality_score: number
  message_quality_feedback: string
  change_categories: ChangeCategory[]
}

export type SummaryError = 'QUOTA_EXCEEDED' | 'AUTH_ERROR' | 'UNKNOWN'

export async function generateSummary(
  commitMessage: string,
  diff: string
): Promise<CommitSummary | { error: SummaryError } | null> {
  try {
    const raw = await generate(buildUserPrompt(commitMessage, diff))
    const json = JSON.parse(raw)

    const terms = Array.isArray(json.technical_terms)
      ? json.technical_terms.slice(0, 3).map((t: { term?: string; description?: string }) => ({
          term: String(t.term ?? ''),
          description: String(t.description ?? ''),
        }))
      : []
    return {
      simplified_message: json.simplified_message ?? commitMessage,
      code_explanation: JSON.stringify({
        simple: json.explanation_simple ?? json.code_explanation ?? '',
        technical: json.explanation_technical ?? '',
        terms,
      }),
      message_quality_score: Math.min(100, Math.max(0, Number(json.quality_score) || 50)),
      message_quality_feedback: json.quality_feedback ?? '',
      change_categories: Array.isArray(json.categories) ? json.categories.slice(0, 3) as ChangeCategory[] : [],
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'QUOTA_EXCEEDED_DAILY') {
      console.warn('Groqレート制限。要約をスキップします。')
      return { error: 'QUOTA_EXCEEDED' }
    }
    if (msg.includes('401') || msg.includes('invalid_api_key')) {
      console.error('Groq APIキーが無効です:', msg)
      return { error: 'AUTH_ERROR' }
    }
    console.error('Groq要約生成エラー:', msg)
    return { error: 'UNKNOWN' }
  }
}
