# Full-Stack Email Template System

A full-stack web application that allows a master admin to manage clients and create reusable email templates. The admin can select a template, pick a client, and send the email — all from a single dashboard. Emails are sent via **Enterprise Google Workspace SMTP**, data is stored in **Supabase**, and the app is hosted on **Render**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Email Sending | Nodemailer via Google Workspace SMTP |
| Rich Text Editor | TipTap or React-Quill |
| Hosting | Render (Web Service + Static Site) |

---

## Features

### Authentication
- Supabase Auth with email/password (single master admin)
- JWT token passed to backend on every request
- Protected routes — redirects to login if not authenticated

### Client Management
- Table view of all clients (name, email, company, tags, date added)
- Add / Edit / Delete clients via modal
- CSV bulk import
- Search and filter by name, email, company, or tags

### Template Builder
- Create, edit, duplicate, and delete email templates
- Rich text body editor (HTML email content)
- Subject line and body support placeholders: `{{first_name}}`, `{{last_name}}`, `{{email}}`, `{{company}}`
- Live preview with sample data before saving

### Send Email
1. Select a saved template
2. Pick one or multiple clients
3. Preview the email with placeholders filled in
4. Click **Send** — backend replaces placeholders, sends via Google SMTP, logs the result
5. Success/failure toast notification

### Email Logs
- Table showing: recipient, subject, template used, status (sent/failed/bounced), sent date
- Filter by status, date range, or client
- Expand to view full email content

### SMTP Settings
- Configure SMTP host, port, username, password, sender name, and sender email
- Pre-filled with Google Workspace defaults (`smtp.gmail.com`, port 587)
- **Test Connection** button sends a test email to the admin's address
- SMTP password encrypted at rest (AES-256)

---

## Folder Structure

```
email-template-system/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/         # Sidebar, Header, DashboardLayout
│   │   │   ├── Auth/           # LoginPage, ProtectedRoute
│   │   │   ├── Clients/        # ClientList, ClientForm, ClientImport
│   │   │   ├── Templates/      # TemplateList, TemplateEditor, TemplatePreview
│   │   │   ├── SendEmail/      # SendEmailPage, TemplateSelector, ClientSelector, EmailPreview
│   │   │   ├── Logs/           # EmailLogList
│   │   │   └── Settings/       # SmtpSettings
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Express Backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clients.js
│   │   ├── templates.js
│   │   ├── email.js
│   │   └── settings.js
│   ├── middleware/
│   │   ├── auth.js             # Supabase JWT verification
│   │   └── rateLimit.js
│   ├── services/
│   │   ├── emailService.js     # Nodemailer + Google SMTP
│   │   └── templateEngine.js   # Placeholder replacement
│   ├── utils/
│   │   ├── encryption.js       # AES-256 encrypt/decrypt SMTP password
│   │   └── validators.js
│   ├── server.js
│   └── package.json
│
├── .env.example
└── README.md
```

---

## Database Schema (Supabase / PostgreSQL)

Five tables with Row Level Security (RLS) enabled:

- **`admins`** — master admin accounts
- **`clients`** — client contact records tied to an admin
- **`email_templates`** — saved HTML email templates with placeholder support
- **`email_logs`** — full history of every email sent (status, body, timestamps)
- **`smtp_settings`** — per-admin SMTP configuration (password encrypted)

Full SQL schema (tables, indexes, RLS policies) is in [`/db/schema.sql`](./db/schema.sql).

---

## API Endpoints

```
POST   /api/auth/login             Verify Supabase token

GET    /api/clients                List all clients
POST   /api/clients                Add client
PUT    /api/clients/:id            Update client
DELETE /api/clients/:id            Delete client
POST   /api/clients/import         Bulk import from CSV

GET    /api/templates              List all templates
POST   /api/templates              Create template
PUT    /api/templates/:id          Update template
DELETE /api/templates/:id          Delete template

POST   /api/email/send             Send email (template_id + client_ids[])
POST   /api/email/preview          Preview with placeholder data
GET    /api/email/logs             Get send history

GET    /api/settings/smtp          Get SMTP config
PUT    /api/settings/smtp          Update SMTP config
POST   /api/settings/smtp/test     Test SMTP connection
```

---

## Environment Variables

Create a `.env` file in both `client/` and `server/` based on `.env.example`:

```env
# Supabase (frontend)
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase (backend)
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key

# Server
PORT=3001

# SMTP defaults
DEFAULT_SMTP_HOST=smtp.gmail.com
DEFAULT_SMTP_PORT=587
```

> Never commit `.env` files to git. They are already listed in `.gitignore`.

---

## Google Workspace SMTP Setup

1. Go to **Google Account → Security → 2-Step Verification → App Passwords**
2. Generate an App Password for **Mail → Other (Custom name)**
3. Use the 16-character app password as your SMTP password in the dashboard
4. SMTP settings:
   - Host: `smtp.gmail.com`
   - Port: `587` (STARTTLS) or `465` (SSL)
   - User: `your-enterprise-email@yourdomain.com`

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A Supabase project
- A Google Workspace account with SMTP/App Password configured

### 1. Clone the repo

```bash
git clone https://github.com/yannickD-cmd/Formstack-automation-AOD-Retail.git
cd Formstack-automation-AOD-Retail
```

### 2. Set up Supabase

- Create a Supabase project at [supabase.com](https://supabase.com)
- Run the SQL from `db/schema.sql` in the Supabase SQL editor
- Manually seed your admin user via Supabase Auth + insert into the `admins` table

### 3. Start the backend

```bash
cd server
cp ../.env.example .env   # fill in your values
npm install
node server.js
```

### 4. Start the frontend

```bash
cd client
cp ../.env.example .env   # fill in VITE_ values
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.

---

## Deployment (Render)

### Backend — Web Service
- Root Directory: `server/`
- Build Command: `npm install`
- Start Command: `node server.js`
- Add all server env vars in Render dashboard

### Frontend — Static Site
- Root Directory: `client/`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL` (your backend Render URL)

---

## Security

- SMTP password encrypted at rest with AES-256
- Supabase RLS enforced on all tables (admins can only access their own data)
- JWT verified on every backend request
- Rate limiting on the email send endpoint
- CORS restricted to the frontend domain
- HTTPS enforced via Render
- No secrets committed to git

---

## Roadmap (Phase 2)

- [ ] File attachments (PDFs, contracts)
- [ ] Scheduled email delivery
- [ ] Bulk send to all clients or a filtered group
- [ ] Email open tracking (pixel)
- [ ] Unsubscribe link (CAN-SPAM compliance)
- [ ] Multiple admin users with role-based access
- [ ] Unique form URL generation per client
- [ ] Webhook receiver for form submission data
