import CryptoJS from 'crypto-js';

export const encryptText = (text: string, secret: string): string => {
  return CryptoJS.AES.encrypt(text, secret).toString();
};

export const decryptText = (ciphertext: string, secret: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      throw new Error('Failed to decrypt or empty result. Check your encryption key.');
    }
    return decryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. Ensure the encryption key is correct.');
  }
};

export const generateEncryptionKey = (userId: string, masterKey: string): string => {
  return CryptoJS.SHA256(userId + masterKey).toString();
};
