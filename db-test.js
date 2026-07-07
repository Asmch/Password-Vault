// Database Test Script
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
async function testDatabaseConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('ERROR: MONGODB_URI environment variable is not defined');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nDatabase collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Test basic operations on User collection
    const userCollection = mongoose.connection.db.collection('users');
    const userCount = await userCollection.countDocuments();
    console.log(`\nUser collection contains ${userCount} documents`);
    
    // Test basic operations on VaultEntry collection
    const vaultCollection = mongoose.connection.db.collection('vaultentries');
    const vaultCount = await vaultCollection.countDocuments();
    console.log(`VaultEntry collection contains ${vaultCount} documents`);
    
    // Check for any potential issues
    console.log('\nPerforming database health checks...');
    
    // Check indexes on User collection
    const userIndexes = await userCollection.indexes();
    console.log('\nUser collection indexes:');
    userIndexes.forEach(index => {
      console.log(`- ${JSON.stringify(index.key)} (${index.name})`);
    });
    
    // Check indexes on VaultEntry collection
    const vaultIndexes = await vaultCollection.indexes();
    console.log('\nVaultEntry collection indexes:');
    vaultIndexes.forEach(index => {
      console.log(`- ${JSON.stringify(index.key)} (${index.name})`);
    });
    
    console.log('\n✅ Database test completed successfully');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testDatabaseConnection();