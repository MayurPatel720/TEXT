// Quick MongoDB Connection Test
// Run: node test-mongodb.js
const mongoose = require('mongoose');
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const MONGODB_URI = 'mongodb+srv://ieitata44_db_user:ZZDY2oE7THSBhUPU@laxmi.iahd1xh.mongodb.net/textile-ai?retryWrites=true&w=majority';

console.log('🔌 Testing MongoDB connection...\n');
console.log('Connection String:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
})
    .then(() => {
        console.log('\n✅ SUCCESS! MongoDB connected successfully!');
        console.log('Your IP is whitelisted and credentials are correct.\n');
        process.exit(0);
    })
    .catch((error) => {
        console.log('\n❌ CONNECTION FAILED!\n');

        if (error.message.includes('ECONNREFUSED')) {
            console.log('Error Type: ECONNREFUSED (Connection Refused)');
            console.log('\nMost Likely Causes:');
            console.log('1. ⚠️  Your IP address is NOT whitelisted in MongoDB Atlas');
            console.log('2. ⚠️  MongoDB cluster might be PAUSED');
            console.log('3. ⚠️  Firewall blocking MongoDB connections');
            console.log('\n📋 Fix Steps:');
            console.log('1. Go to: https://cloud.mongodb.com/');
            console.log('2. Select your project and cluster');
            console.log('3. Click "Network Access" in the left sidebar');
            console.log('4. Click "Add IP Address"');
            console.log('5. Either:');
            console.log('   - Click "Add Current IP Address", OR');
            console.log('   - Add 0.0.0.0/0 (allows from anywhere - for testing only!)');
            console.log('6. Click "Confirm"');
            console.log('7. Wait 1-2 minutes for changes to propagate');
            console.log('8. Run this test again: node test-mongodb.js\n');
        } else if (error.message.includes('authentication failed')) {
            console.log('Error Type: Authentication Failed');
            console.log('Username or password is incorrect.');
            console.log('Get fresh credentials from MongoDB Atlas → Database → Connect');
        } else {
            console.log('Error:', error.message);
        }

        process.exit(1);
    });
