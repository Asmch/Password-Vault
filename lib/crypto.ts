import CryptoJS from 'crypto-js';

export const encryptText = (text: string, secret: string): string => {
  return CryptoJS.AES.encrypt(text, secret).toString();
};

export const decryptText = (ciphertext: string, secret: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const generateEncryptionKey = (userId: string, masterKey: string): string => {
  return CryptoJS.SHA256(userId + masterKey).toString();
};
