import QRCode from 'qrcode'

export async function generateQRBase64(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: '#1A1A3E',
      light: '#FFFFFF',
    },
  })
}

export function buildSEP7PaymentURI(params: {
  destination: string
  amount: string
  assetCode: string
  assetIssuer: string
  memo: string
}): string {
  // web+stellar es un esquema no estándar — new URL() crea una "opaque path URL"
  // donde searchParams.set() es un no-op silencioso. Construir el URI manualmente.
  const qs = new URLSearchParams({
    destination: params.destination,
    amount: params.amount,
    asset_code: params.assetCode,
    asset_issuer: params.assetIssuer,
    memo: params.memo,
  }).toString()
  return `web+stellar:pay?${qs}`
}
