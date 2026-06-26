import { Asset } from '@stellar/stellar-sdk'

let _usdc: Asset | null = null

export function getUSDC(): Asset {
  if (!_usdc) {
    _usdc = new Asset(process.env.USDC_ASSET_CODE!, process.env.USDC_ISSUER!)
  }
  return _usdc
}

// Para compatibilidad con código que importa USDC directamente
export const USDC = new Proxy({} as Asset, {
  get(_target, prop) {
    return getUSDC()[prop as keyof Asset]
  },
})

export function getUSDCIssuer(): string {
  return process.env.USDC_ISSUER!
}

export function getUSDCAssetCode(): string {
  return process.env.USDC_ASSET_CODE!
}
