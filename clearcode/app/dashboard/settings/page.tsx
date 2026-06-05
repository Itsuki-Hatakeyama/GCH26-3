export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">使用手順</h1>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
          Clearcode の初期設定から日常利用までの流れを説明します
        </p>
      </div>

      {/* 全体フロー */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-4">全体フロー</h2>
        <div className="relative pl-6 space-y-0">
          {[
            { label: "Clearcode にメールで登録" },
            { label: "GitHub と連携する（エンジニア）" },
            { label: "監視するリポジトリを登録" },
            { label: "非エンジニアをメールで招待" },
            { label: "Slack チャンネルを設定（任意）" },
            { label: "コミットが自動翻訳される", last: true },
          ].map((step, i, arr) => (
            <div key={i} className="flex gap-4 relative">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-gray-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px flex-1 bg-gray-200 dark:bg-neutral-700 my-1" />
                )}
              </div>
              <div className={`pb-6 ${i === arr.length - 1 ? "pb-0" : ""}`}>
                <p className="text-sm font-medium text-gray-800 dark:text-neutral-200 pt-0.5">{step.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Step 1 */}
      <Step number={1} title="Clearcode にメールで登録する">
        <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
          トップページでメールアドレスを入力するだけで登録できます。GitHub アカウントは不要です。
        </p>
        <InfoBox>
          <Row label="対象" value="エンジニア・非エンジニア両方" />
          <Row label="必要なもの" value="メールアドレスのみ" />
        </InfoBox>
      </Step>

      {/* Step 2 */}
      <Step number={2} title="GitHub と連携する">
        <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
          エンジニアがリポジトリ追加ページから GitHub OAuth で連携します。「GitHubと連携する」ボタンを押して認証を完了してください。
        </p>
        <InfoBox>
          <Row label="対象" value="エンジニア（GitHub アカウント保持者）" />
          <Row label="ページ" value="ダッシュボード → リポジトリ追加" />
        </InfoBox>
        <Note>非エンジニアは GitHub アカウントがなくても Clearcode を利用できます。</Note>
      </Step>

      {/* Step 3 */}
      <Step number={3} title="監視するリポジトリを登録する">
        <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
          GitHub 連携後、コミットを翻訳したいリポジトリを選んで登録します。登録すると Clearcode が GitHub の Webhook を自動設定し、以降のコミットを自動で取得します。
        </p>
        <InfoBox>
          <Row label="対象" value="エンジニア" />
          <Row label="ページ" value="ダッシュボード → リポジトリ追加" />
          <Row label="プライベートリポジトリ" value="対応しています" />
        </InfoBox>
      </Step>

      {/* Step 4 */}
      <Step number={4} title="非エンジニアをリポジトリに招待する">
        <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
          リポジトリ詳細画面の「メンバー招待」ボタンから、閲覧させたい非エンジニアのメールアドレスを入力して招待します。
        </p>
        <InfoBox>
          <Row label="対象" value="エンジニア（招待する側）" />
          <Row label="ページ" value="ダッシュボード → リポジトリ詳細 → メンバー招待" />
        </InfoBox>
        <ol className="space-y-2 mt-3">
          {[
            "リポジトリ詳細画面を開く",
            "「メンバー招待」ボタンをクリック",
            "招待したい非エンジニアのメールアドレスを入力",
            "「招待する」を押す",
            "非エンジニアがそのメールアドレスで Clearcode に登録すると自動で閲覧可能になる",
          ].map((text, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-500 dark:text-neutral-400">
              <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 text-xs font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              {text}
            </li>
          ))}
        </ol>
        <Note>招待されたメールアドレスで Clearcode に登録すると、GitHub アカウントなしでコミット内容を閲覧できます。</Note>
      </Step>

      {/* Step 5 */}
      <Step number={5} title="Slack チャンネルを設定する（任意）">
        <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
          コミットが push されるたびに Slack へ自動通知を送ることができます。通知不要の場合はこのステップをスキップしてください。
        </p>
        <InfoBox>
          <Row label="対象" value="エンジニア" />
          <Row label="ページ" value="ダッシュボード → リポジトリ詳細 → Slack連携" />
          <Row label="必要なもの" value="Slack Bot Token または OAuth 連携" />
        </InfoBox>
      </Step>

      {/* Step 6 */}
      <Step number={6} title="コミットを確認する">
        <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
          設定完了後は、エンジニアがコミットを push するたびに Clearcode が自動で翻訳・要約を生成します。
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 px-4 py-2.5 border-b border-gray-100 dark:border-neutral-800">
              <p className="text-xs font-semibold text-gray-600 dark:text-neutral-300">エンジニアの確認方法</p>
            </div>
            <ul className="px-4 py-3 space-y-1.5">
              {[
                "Clearcode ダッシュボードでコミット一覧・詳細を閲覧",
                "Slack に自動通知（設定した場合）",
                "コミット詳細で差分・コード説明を確認",
              ].map((item, i) => (
                <li key={i} className="text-sm text-gray-500 dark:text-neutral-400 flex gap-2">
                  <span className="text-gray-300 dark:text-neutral-600">•</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 px-4 py-2.5 border-b border-gray-100 dark:border-neutral-800">
              <p className="text-xs font-semibold text-gray-600 dark:text-neutral-300">非エンジニアの確認方法</p>
            </div>
            <ul className="px-4 py-3 space-y-1.5">
              {[
                "Slack で自動通知を受け取る（GitHub アカウント不要）",
                "Clearcode にメールでログインしてコミット一覧を閲覧",
                "AIが平易な日本語に翻訳した内容を確認",
              ].map((item, i) => (
                <li key={i} className="text-sm text-gray-500 dark:text-neutral-400 flex gap-2">
                  <span className="text-gray-300 dark:text-neutral-600">•</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Step>
    </div>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wide">
          Step {number}
        </span>
        <h2 className="text-base font-semibold text-gray-900 dark:text-neutral-100">{title}</h2>
      </div>
      <div className="border border-gray-100 dark:border-neutral-800 rounded-xl px-5 py-5 space-y-4 bg-white dark:bg-neutral-900">
        {children}
      </div>
    </section>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-neutral-800 overflow-hidden text-xs">
      <table className="w-full">
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-gray-100 dark:border-neutral-800 last:border-0">
      <td className="px-3 py-2 text-gray-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 w-40 whitespace-nowrap">{label}</td>
      <td className="px-3 py-2 text-gray-700 dark:text-neutral-300">{value}</td>
    </tr>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-gray-400 dark:text-neutral-500 bg-gray-50 dark:bg-neutral-800/50 rounded-lg px-3 py-2">
      💡 {children}
    </p>
  )
}
