CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  account_type  VARCHAR(20) NOT NULL CHECK (account_type IN ('personal', 'business')),
  business_name VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.stellar_accounts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  public_key       VARCHAR(56) NOT NULL,
  encrypted_secret TEXT NOT NULL,
  iv               VARCHAR(64) NOT NULL,
  auth_tag         VARCHAR(64) NOT NULL,
  network          VARCHAR(10) NOT NULL DEFAULT 'testnet' CHECK (network IN ('testnet', 'mainnet')),
  funded           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE public.transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stellar_tx_hash VARCHAR(64),
  type            VARCHAR(20) NOT NULL CHECK (type IN ('payment_received', 'withdrawal', 'deposit')),
  amount_usdc     NUMERIC(18, 7) NOT NULL,
  memo            TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  anchor_tx_id    VARCHAR(255),
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.savings_goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  target_usdc     NUMERIC(18, 7) NOT NULL,
  current_usdc    NUMERIC(18, 7) NOT NULL DEFAULT 0,
  deadline        DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payment_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_usdc     NUMERIC(18, 7) NOT NULL,
  description     TEXT,
  memo            VARCHAR(28),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  expires_at      TIMESTAMPTZ,
  paid_tx_id      UUID REFERENCES public.transactions(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_transactions_user_id    ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_stellar_accounts_pubkey ON public.stellar_accounts(public_key);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at       BEFORE UPDATE ON public.users       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_savings_goals_updated_at BEFORE UPDATE ON public.savings_goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS habilitado (acceso desde backend con service role key bypassea esto)
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stellar_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests  ENABLE ROW LEVEL SECURITY;
