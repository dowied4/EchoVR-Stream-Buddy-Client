const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request')
const jsonwebtoken = require('jsonwebtoken')

admin.initializeApp();
const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.sendMatchData = functions.firestore
.document('matchsnaps/{uid}').onWrite((change, context) => {
	const match = change.after.data();
	const id = context.params.uid;
	if (match.active === true) {

		const payload ={
			exp: Math.floor(Date.now() / 1000) + 30,
			channel_id: id,
			user_id: functions.config().echovrconnect.user_id,
			role: 'external',
			pubsub_perms: {
				send: [
					"broadcast"
				]
			}
		}
		const secret = new Buffer(functions.config().echovrconnect.secret, 'base64')
		const tokenized = jsonwebtoken.sign(payload, secret, {algorithm: 'HS256'})
		const headers= {
			'Client-ID': functions.config().echovrconnect.client_id,
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + tokenized
		}
		const body = JSON.stringify({
			content_type: 'application/json',
			message: JSON.stringify(match),
			targets:['broadcast']
		});
		console.log(headers, payload)
		let url = 'https://api.twitch.tv/extensions/message/'+ id
		request(url, {
			method: 'POST',
			headers,
			body
		}, (err, res) => {
			if (err) {
				console.log(id, err);
			  } else {
				console.log(res.statusCode, res.statusMessage, res.status-line)
			  }
		})
		return match
	}
});
