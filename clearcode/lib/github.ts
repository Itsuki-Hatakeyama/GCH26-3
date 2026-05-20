const GITHUB_API = 'https://api.github.com'

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
})

export const github = {
  getUser: async (accessToken: string) => {
    const res = await fetch(`${GITHUB_API}/user`, { headers: headers(accessToken) })
    if (!res.ok) throw new Error('GitHub user fetch failed')
    return res.json()
  },

  getRepositories: async (accessToken: string) => {
    const res = await fetch(`${GITHUB_API}/user/repos?per_page=100&sort=updated`, {
      headers: headers(accessToken),
    })
    if (!res.ok) throw new Error('GitHub repos fetch failed')
    return res.json()
  },

  getCommit: async (accessToken: string, owner: string, repo: string, sha: string) => {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`, {
      headers: headers(accessToken),
    })
    if (!res.ok) throw new Error('GitHub commit fetch failed')
    return res.json()
  },

  getCommitDiff: async (accessToken: string, owner: string, repo: string, sha: string): Promise<string> => {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`, {
      headers: { ...headers(accessToken), Accept: 'application/vnd.github.diff' },
    })
    if (!res.ok) return ''
    return res.text()
  },

  createWebhook: async (accessToken: string, owner: string, repo: string, webhookUrl: string) => {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      headers: headers(accessToken),
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: process.env.GITHUB_WEBHOOK_SECRET,
        },
      }),
    })
    if (!res.ok) return null
    return res.json()
  },

  deleteWebhook: async (accessToken: string, owner: string, repo: string, hookId: number) => {
    await fetch(`${GITHUB_API}/repos/${owner}/${repo}/hooks/${hookId}`, {
      method: 'DELETE',
      headers: headers(accessToken),
    })
  },
}
