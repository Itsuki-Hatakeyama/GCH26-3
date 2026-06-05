export async function getAccessToken(code: string) {
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.SLACK_REDIRECT_URI!,
    }),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(`Slack OAuth error: ${data.error}`);
  return data;
}

export async function getChannels(accessToken: string) {
  const allChannels: Record<string, unknown>[] = []
  let cursor: string | undefined

  do {
    const url = new URL('https://slack.com/api/conversations.list')
    url.searchParams.set('limit', '200')
    if (cursor) url.searchParams.set('cursor', cursor)

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    const data = await response.json()
    if (!data.ok) throw new Error(`Slack API error: ${data.error}`)

    allChannels.push(...(data.channels ?? []))
    cursor = data.response_metadata?.next_cursor || undefined
  } while (cursor)

  return allChannels
}

export async function postMessage(accessToken: string, channel: string, text: string) {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, text }),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data;
}
