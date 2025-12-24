
const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' }); // Try .env.local first (Next.js default)
require('dotenv').config(); // Fallback to .env

// YOU MUST SET THESE!
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

// Note: You must add 'https://developers.google.com/oauthplayground' to your 
// "Authorized redirect URIs" in the Google Cloud Console for this Client ID.

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function getAccessToken() {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Force new refresh token
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    rl.question('Enter the code from that page here: ', async (code) => {
        try {
            const { tokens } = await oauth2Client.getToken(code);
            console.log('\nSUCCESS! Here are your tokens:\n');
            console.log('Refresh Token (SAVE THIS):', tokens.refresh_token);
            console.log('Access Token:', tokens.access_token);
            console.log('\nexpiry_date:', tokens.expiry_date);
        } catch (error) {
            console.error('Error retrieving access token:', error.message);
        }
        rl.close();
    });
}

getAccessToken();
