
const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Use the same logic as the app to get the token
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

async function main() {
    console.log("Testing Drive Connection...");

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error("Missing Client ID/Secret");
        return;
    }

    const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    auth.setCredentials({ refresh_token: REFRESH_TOKEN });
    const drive = google.drive({ version: 'v3', auth });

    try {
        const res = await drive.files.list({
            pageSize: 5,
            fields: 'files(id, name)',
        });
        console.log("Connection Successful! Files found:");
        res.data.files.forEach(f => console.log(`- ${f.name} (${f.id})`));
    } catch (error) {
        console.error("Connection Failed:", error.message);
    }
}

main();
