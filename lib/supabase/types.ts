export type AccountType = 'personal' | 'business'
export type TransactionType = 'payment_received' | 'withdrawal' | 'deposit'
export type TransactionStatus = 'pending' | 'confirmed' | 'failed'
export type PaymentRequestStatus = 'pending' | 'paid' | 'expired' | 'cancelled'
export type Network = 'testnet' | 'mainnet'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          full_name: string
          account_type: AccountType
          business_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          full_name: string
          account_type: AccountType
          business_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          full_name?: string
          account_type?: AccountType
          business_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stellar_accounts: {
        Row: {
          id: string
          user_id: string
          public_key: string
          encrypted_secret: string
          iv: string
          auth_tag: string
          network: Network
          funded: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          public_key: string
          encrypted_secret: string
          iv: string
          auth_tag: string
          network?: Network
          funded?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          public_key?: string
          encrypted_secret?: string
          iv?: string
          auth_tag?: string
          network?: Network
          funded?: boolean
          created_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          stellar_tx_hash: string | null
          type: TransactionType
          amount_usdc: number
          memo: string | null
          status: TransactionStatus
          anchor_tx_id: string | null
          metadata: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stellar_tx_hash?: string | null
          type: TransactionType
          amount_usdc: number
          memo?: string | null
          status?: TransactionStatus
          anchor_tx_id?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stellar_tx_hash?: string | null
          type?: TransactionType
          amount_usdc?: number
          memo?: string | null
          status?: TransactionStatus
          anchor_tx_id?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_usdc: number
          current_usdc: number
          deadline: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_usdc: number
          current_usdc?: number
          deadline?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_usdc?: number
          current_usdc?: number
          deadline?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          id: string
          user_id: string
          amount_usdc: number
          description: string | null
          memo: string | null
          status: PaymentRequestStatus
          expires_at: string | null
          paid_tx_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount_usdc: number
          description?: string | null
          memo?: string | null
          status?: PaymentRequestStatus
          expires_at?: string | null
          paid_tx_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount_usdc?: number
          description?: string | null
          memo?: string | null
          status?: PaymentRequestStatus
          expires_at?: string | null
          paid_tx_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
