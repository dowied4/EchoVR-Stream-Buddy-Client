# EchoVR-Stream-Buddy-Client
This is the client required to stream your EchoVR data to your twitch account to allow your viewers to interact with the in game overlay to access more detailed stats.
### Releases
https://github.com/dowied4/EchoVR-Stream-Buddy-Client/releases/tag/0.1
## Usage
To run the electron app you must run:
```bash
npm install
npm run electron-dev
```
To package the application for windows you need to run:
```bash
npm run electron-pack
```
This will put the packaged application into the Dist directory.

To be able to run the developer version you need to establish your enviroments with in a file named .env.
Your .env must look like:
```bash
REACT_APP_API_KEY= {Your_firestore_key}
REACT_APP_AUTH_DOMAIN={Your_firestore_domain}
REACT_APP_DATABASE={Your_firestore_database}
REACT_APP_PROJECT_ID={Your_firestore_domain}
REACT_APP_STORAGE_BUCKET={Your_firestore_storage_bucket}
REACT_APP_MESSAGINGID={Your_firestore_messagingid}
REACT_APP_APP_ID={Your_firestore_appId}
REACT_APP_MEASUREMENT={Your_firestore_measurement}
REACT_APP_TWITCH_KEY={Your_twitch_key}
REACT_APP_CLIENT_SECRET={Your_twitch_client_secret}
```
link to twitch auth docs:
https://dev.twitch.tv/docs/authentication

link to firebase docs:
https://firebase.google.com/docs/web/setup#config-object
