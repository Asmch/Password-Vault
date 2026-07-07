# SecureVault - Password Manager

SecureVault is a secure, modern password management application built with Next.js, featuring end-to-end encrypted password storage, a tag-based organization system, Two-Factor Authentication (2FA), and integration with "Have I Been Pwned" for enhanced data protection.

![Live Link]https://password-vault-murex.vercel.app/

## ✨ Key Features

- **🔐 End-to-End Encryption:** Vault entries are encrypted on the client side using AES encryption (`crypto-js`) before being stored, ensuring that your data is secure.
- **🛡️ Two-Factor Authentication (2FA):** Support for Time-Based One-Time Passwords (TOTP) to provide an extra layer of security on login.
- **🚨 Breach Detection:** Built-in "Have I Been Pwned" (HIBP) integration checks if your saved passwords have been exposed in known data breaches, using k-anonymity to preserve privacy.
- **🔑 Password Generator:** Generate strong, random passwords on the fly.
- **⏱️ Inactivity Auto-Lock:** Automatically locks your vault session after a period of inactivity.
- **🏷️ Organization:** Full CRUD operations and tag-based filtering for easily managing large lists of credentials.
- **🎨 Modern UI/UX:** Built with Tailwind CSS, Framer Motion, and shadcn/ui components for a clean, responsive, and accessible interface.

## 🛠️ Tech Stack

- **Framework:** [Next.js 13+](https://nextjs.org/) (App Router)
- **Database:** [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Authentication:** Custom JWT-based auth & `bcryptjs`
- **Security & Crypto:** `crypto-js`, `speakeasy`, `jsonwebtoken`
- **Deployment:** Vercel

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB Database (Local or Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/Asmch/Password-Vault.git
cd Password-Vault
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory and add your environment variables:

```env
MONGODB_URI="your_mongodb_connection_string"
JWT_SECRET="your_secure_jwt_secret"
NEXTAUTH_SECRET="your_nextauth_secret_if_applicable"
```

> **Tip:** You can generate secure secrets using `openssl rand -hex 32` or node's `crypto` module.

### 4. Run the development server

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

## 🔒 Security & Cryptography Note

This project uses **CryptoJS** for the encryption and decryption of sensitive vault entry data (passwords, notes, etc.). All sensitive information is encrypted before it leaves the client and travels to the backend, meaning the database only ever stores ciphertext.

For breach checks, passwords are hashed using SHA-1, and only the first 5 characters of the hash are sent to the Have I Been Pwned API (k-anonymity model), ensuring your password is never transmitted in cleartext.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
