-- ============================================================
-- CITABEL — Schéma de base de données Supabase
-- Exécuter dans : https://supabase.com/dashboard/project/vhhvcxbmqpvcgxahsusd/sql/new
-- ============================================================

-- Table principale : demandes de contact (formulaire public)
CREATE TABLE IF NOT EXISTS public.citabel_contacts (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  topic        text        NOT NULL DEFAULT 'devis',
  full_name    text        NOT NULL,
  organisation text,
  email        text        NOT NULL,
  phone        text,
  country      text        DEFAULT 'Sénégal',
  volume       text,
  message      text        NOT NULL,
  status       text        NOT NULL DEFAULT 'new',
  lang         text        DEFAULT 'fr',
  notes        text
);

-- Index pour recherche admin rapide
CREATE INDEX IF NOT EXISTS idx_citabel_contacts_status      ON public.citabel_contacts (status);
CREATE INDEX IF NOT EXISTS idx_citabel_contacts_topic       ON public.citabel_contacts (topic);
CREATE INDEX IF NOT EXISTS idx_citabel_contacts_created_at  ON public.citabel_contacts (created_at DESC);

-- ── Sécurité Row Level Security ────────────────────────────
ALTER TABLE public.citabel_contacts ENABLE ROW LEVEL SECURITY;

-- Tout visiteur anonyme peut soumettre une demande (INSERT seulement)
CREATE POLICY "citabel_contacts_public_insert"
  ON public.citabel_contacts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Seuls les utilisateurs authentifiés (admins CITABEL) peuvent lire
CREATE POLICY "citabel_contacts_auth_select"
  ON public.citabel_contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- Seuls les admins peuvent mettre à jour le statut / les notes
CREATE POLICY "citabel_contacts_auth_update"
  ON public.citabel_contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── Commentaires pour lisibilité dans Supabase Studio ──────
COMMENT ON TABLE  public.citabel_contacts              IS 'Demandes reçues via le formulaire de contact CITABEL';
COMMENT ON COLUMN public.citabel_contacts.topic        IS 'devis | partenariat | investisseur | presse | visite | carrieres';
COMMENT ON COLUMN public.citabel_contacts.status       IS 'new | read | replied | closed';
COMMENT ON COLUMN public.citabel_contacts.lang         IS 'fr | en';
COMMENT ON COLUMN public.citabel_contacts.notes        IS 'Notes internes équipe CITABEL (non visibles par le client)';
