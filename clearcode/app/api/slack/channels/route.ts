import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getChannels } from '@/lib/slack'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const allChannels = await getChannels()
  const channels = allChannels
    .filter((c: Record<string, unknown>) => !c.is_private && !c.is_archived)
    .map((c: Record<string, unknown>) => ({ id: c.id, name: c.name, num_members: c.num_members ?? 0 }))

  return NextResponse.json({ channels })
}
