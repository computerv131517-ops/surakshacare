# SurakshaCare — Real Accounts & Database Setup

This version keeps the Vercel Analytics code and adds Supabase authentication/database support.

## What it adds
- Customer account creation
- Technician account creation
- Email + password login
- Customer/Technician role stored in the database
- Customer mobile number and technician skills stored in the database
- Profiles, devices, memberships, service requests, health assessments, complaints and reviews tables
- Row Level Security so a signed-in user can access only their own records
- Existing localStorage demo still works as a fallback until Supabase is connected

## 1. Create a Supabase project
Open https://supabase.com/ and create a project on the Free plan.

## 2. Run the database schema
In the Supabase dashboard:
1. Open SQL Editor.
2. Create a new query.
3. Copy everything from `supabase_schema.sql`.
4. Run it.

## 3. Get the two browser-safe values
In Supabase, open your project's API/settings area and copy:
- Project URL
- Publishable key (or the legacy anon public key if your dashboard labels it that way)

Never put a `service_role` or secret key into this website.

## 4. Put the values in the website
Open `supabase-config.js` and replace:

`YOUR_SUPABASE_PROJECT_URL`

and

`YOUR_SUPABASE_PUBLISHABLE_KEY`

with your real values.

## 5. Upload the files to GitHub
Keep these files at the repository root:
- index.html
- style.css
- script.js
- hero-photo.png
- supabase-config.js

You can also keep `supabase_schema.sql` and this setup guide in the repository; they are not loaded by the website.

## 6. Vercel
Because the GitHub repository is connected to Vercel, commit/push the changes. Vercel will create a new deployment automatically.

## 7. Email confirmation
Supabase hosted projects normally use email confirmation for password signup. If confirmation is enabled, the site tells the user to verify their email before logging in. Configure the Supabase Site URL/redirect URL to your real Vercel domain.

For a college demo, you can choose the confirmation setting that fits your presentation. For a real public service, keep email verification enabled and configure proper email delivery.

## Security notes
- Passwords are handled by Supabase Auth, not stored in SurakshaCare's own table.
- The website must only use the public/publishable key.
- Never expose a Supabase service_role/secret key in HTML or JavaScript.
- Admin capabilities are intentionally not enabled by self-signup in this version.
