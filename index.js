const fs = require('fs');
const readline = require('readline');
const { google: gapi } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const { client_secret, client_id, redirect_uris } = require('./credentials.json').installed;

const sheets = returnSheets();
const oAuth2Client = new gapi.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
);

// Generates a URL that gives you a code to generate a new token
function getTokenUrl() {
    let oAuth2Client = new gapi.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]
    );
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });

    console.log('Authorize the app by visiting this url (grab the key)', authUrl);
}

// Use the code from getTokenURL to generate a new token file
function getNewToken() {
    getTokenUrl();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (e, token) => {
            if (e) {
                console.log('Error while trying to recieve access token. Check the inputted code: ', e);
            } else {
                fs.writeFile('token.json', JSON.stringify(token), (e) => {
                    if (e) throw e;
                    console.log('Token stored to token.json.');
                });
            }
        });
    });
}

// Returns a fully secure google sheets API object
function returnSheets() {

    // Creates new OAuth2 auth using credentials
    let auth = new gapi.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]
    );

    // Fully authenticates using generated token
    try {
        auth.setCredentials(require('./token.json'));
    } catch (e) {
        console.error('Generate a token with getNewToken');
    }

    // Creates new Sheets API client for use with the OAuth2 client
    return gapi.sheets({version: 'v4', auth});
}

function spreadsheetGet(range) {
    // Creates new Sheets API client for use with the OAuth2 client
    sheets.spreadsheets.values.get({
        spreadsheetId: '1ByMRe7vmHJFLpt64cm1jqQAjis0-pMZV7UYh6QVA8gE',
        range: range
    }, (e, res) => {
        if (e) return console.error('The API returned an error:', e);
        let names = res.data.values[0];
        let data = res.data.values.slice(-(res.data.values.length-1));
        let output = [];

        for (i in data) {
            output.push({});
        }

        for (i in names) {
            for (x in output) {
                output[x][names[i]] = data[x][i];
            }
        }

        console.log(output);
    });
}

function spreadsheetAppend(range, values) {
    sheets.spreadsheets.values.append({
        spreadsheetId: '1ByMRe7vmHJFLpt64cm1jqQAjis0-pMZV7UYh6QVA8gE',
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values
        }
    }, (e, res) => {
        if (e) {
            throw e;
        } else {
            console.log(`${res.data.updates.updatedRange} cells appended.`);
        }
    });
}

// Get a project up with s credentials.json
// Uncomment one after another
getNewToken();
// spreadsheetGet('A1:B');
// spreadsheetAppend('A1:B', [['Riley', 'Presidency']]);
