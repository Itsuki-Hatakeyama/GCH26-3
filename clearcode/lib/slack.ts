export async function getChannels() {
  const response = await fetch('https://slack.com/api/conversations.list', {
    headers: {
      'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data.channels;
}

export async function postMessage(channel: string, text: string) {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, text }),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data;
}
