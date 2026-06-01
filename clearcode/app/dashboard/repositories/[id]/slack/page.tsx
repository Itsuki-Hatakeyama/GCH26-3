import { Suspense } from 'react'
import SlackContent from './SlackContent'

export const dynamic = 'force-dynamic'

export default function SlackIntegrationPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-neutral-400">読み込み中...</div>}>
      <SlackContent />
    </Suspense>
  )
}
