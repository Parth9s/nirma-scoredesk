
const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Missing CLIENT_ID or CLIENT_SECRET in env");
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const command = process.argv[2];
const inputCode = process.argv[3];

async function main() {
    if (command === 'url') {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent'
        });
        console.log('AUTH_URL=' + authUrl);
    } else if (command === 'token') {
        if (!inputCode) {
            console.error("Please provide the code");
            process.exit(1);
        }
        try {
            const { tokens } = await oauth2Client.getToken(inputCode);
            console.log('REFRESH_TOKEN=' + tokens.refresh_token);
        } catch (error) {
            console.error('Error exchanging code:', error.message);
            process.exit(1);
        }
    } else {
        console.log("Usage: node auth-helper.js [url|token] [code]");
    }
}

main();
