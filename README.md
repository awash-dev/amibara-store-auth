# 🔐 Auth Server with Google, Facebook, Apple Login

This is a Node.js + Express-based backend authentication server that allows users to log in using **Google**, **Facebook**, or **Apple ID**. It stores user information in a PostgreSQL database (e.g. Neon) and issues a **JWT token** with a 3-day expiration for secure session management.

## ✨ Features

- Social login via:
  - 🔵 Google
  - 🔷 Facebook
  - 🟣 Apple ID
- User data stored in PostgreSQL (`users` table)
- `last_login` timestamp updated on each login
- JWT session token generation with 3-day expiry
- Protected API routes via middleware
- Logs HTTP requests with `morgan`
- Deployable to **Vercel** as a serverless function

---

## 🗃️ Table of Contents

- [Setup](#setup)
- [Endpoints](#endpoints)
- [Environment Variables](#environment-variables)
- [Deploy to Vercel](#deploy-to-vercel)
- [License](#license)

---

## 🛠️ Setup

1. Clone this repo:

```bash
git clone https://github.com/awash-dev/amibara-store-auth.git
cd amibara-store-auth
npm i 
