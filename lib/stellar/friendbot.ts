export async function fundTestnetAccount(publicKey: string): Promise<void> {
  const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Friendbot error ${res.status}: ${body}`)
  }
}
