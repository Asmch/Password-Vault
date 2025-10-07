# Password-Vault

A secure password management application built with Next.js.

## How to Run

Follow these steps to set up and run the project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Asmch/Password-Vault.git
    cd Password-Vault
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory and add your environment variables. (e.g., MongoDB URI, JWT Secret, etc.)

    ```
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000` (or `http://localhost:3001` if port 3000 is in use).

## Cryptography Note

This project uses **CryptoJS** for encryption and decryption of sensitive vault entry data. CryptoJS is a collection of cryptographic algorithms implemented in JavaScript, providing robust security for storing passwords and notes.