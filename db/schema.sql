-- ============================================
-- Email Template System — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read own row"
  ON admins FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Admins can update own row"
  ON admins FOR UPDATE
  USING (auth.uid() = auth_id);

-- 2. Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_admin ON clients(admin_id);
CREATE INDEX idx_clients_email ON clients(email);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can CRUD own clients"
  ON clients FOR ALL
  USING (admin_id IN (SELECT id FROM admins WHERE auth_id = auth.uid()));

-- 3. Email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  formstack_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_templates_admin ON email_templates(admin_id);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can CRUD own templates"
  ON email_templates FOR ALL
  USING (admin_id IN (SELECT id FROM admins WHERE auth_id = auth.uid()));

-- 4. Email logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_logs_admin ON email_logs(admin_id);
CREATE INDEX idx_logs_status ON email_logs(status);
CREATE INDEX idx_logs_sent_at ON email_logs(sent_at);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read own logs"
  ON email_logs FOR SELECT
  USING (admin_id IN (SELECT id FROM admins WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can insert own logs"
  ON email_logs FOR INSERT
  WITH CHECK (admin_id IN (SELECT id FROM admins WHERE auth_id = auth.uid()));

-- 5. SMTP settings
CREATE TABLE IF NOT EXISTS smtp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID UNIQUE NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
  port INTEGER NOT NULL DEFAULT 587,
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can CRUD own SMTP settings"
  ON smtp_settings FOR ALL
  USING (admin_id IN (SELECT id FROM admins WHERE auth_id = auth.uid()));
