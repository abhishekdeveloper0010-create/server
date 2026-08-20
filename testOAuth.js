require("dotenv").config();

const { google } = require("googleapis");

async function testOAuth() {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
            
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });
        const {token} = await oauth2Client.getAccessToken();
        console.log("ACCESS TOKEN GENERATED", token);
      console.log(token ? "OAuth2 is working!" : "No token received");

    } catch (error) {
        console.error("OAuth2 Error:", error);
    }
}

testOAuth();