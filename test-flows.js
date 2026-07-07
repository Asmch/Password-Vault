require('dotenv').config({ path: '.env.local' });
// Try .env if .env.local doesn't have it
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: '.env' });
}

const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  let token = '';
  let userId = '';
  let entryId = '';
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';
  const masterKey = 'MySuperSecretMasterKey';

  console.log('--- Starting Tests ---');

  try {
    // 1. Register
    console.log(`Registering ${testEmail}...`);
    let res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    if (!res.ok) throw new Error(`Register failed: ${await res.text()}`);
    let data = await res.json();
    console.log('Registered successfully.');

    // 2. Login
    console.log('Logging in...');
    res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    if (!res.ok) throw new Error(`Login failed: ${await res.text()}`);
    data = await res.json();
    token = data.token;
    userId = data.user.id;
    console.log(`Logged in. Token received. User ID: ${userId}`);

    // 3. 2FA Generation
    console.log('Testing 2FA generation...');
    res = await fetch(`${BASE_URL}/api/auth/2fa`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`2FA generation failed: ${await res.text()}`);
    data = await res.json();
    console.log('2FA generation successful.');

    // 4. Create Vault Entry
    console.log('Creating Vault Entry...');
    const encryptionKey = CryptoJS.SHA256(userId + masterKey).toString();
    const vaultPassword = 'SuperSecretVaultPassword99!';
    const encryptedPassword = CryptoJS.AES.encrypt(vaultPassword, encryptionKey).toString();

    res = await fetch(`${BASE_URL}/api/vault`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Test Service',
        username: 'test_username',
        encrypted_password: encryptedPassword,
        url: 'https://example.com',
        notes: 'Test notes',
        tags: ['test']
      })
    });
    if (!res.ok) throw new Error(`Vault creation failed: ${await res.text()}`);
    data = await res.json();
    entryId = data.entry.id;
    console.log(`Vault entry created with ID: ${entryId}`);

    // 5. Verify direct MongoDB storage is encrypted
    console.log('Verifying MongoDB storage...');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const entryInDb = await db.collection('vaultentries').findOne({ _id: new mongoose.Types.ObjectId(entryId) });
    if (!entryInDb) throw new Error('Entry not found in DB!');
    
    if (entryInDb.encrypted_password === vaultPassword) {
      throw new Error('CRITICAL FAILURE: Password was stored in plaintext in the database!');
    }
    console.log('Verified: Password is encrypted in MongoDB.');

    // 6. Decrypt and check
    const bytes = CryptoJS.AES.decrypt(entryInDb.encrypted_password, encryptionKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (decrypted !== vaultPassword) {
      throw new Error('CRITICAL FAILURE: Decrypted password does not match original!');
    }
    console.log('Verified: Decryption succeeds and matches original password.');

    // 7. Delete Vault Entry
    console.log('Deleting Vault Entry...');
    res = await fetch(`${BASE_URL}/api/vault/${entryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Vault deletion failed: ${await res.text()}`);
    console.log('Vault entry deleted.');

    // Cleanup: delete user from DB
    await db.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
    console.log('Test user cleaned up.');

    console.log('--- All tests passed! Phase 1 complete. ---');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
