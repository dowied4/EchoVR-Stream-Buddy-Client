const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request')
const jsonwebtoken = require('jsonwebtoken')
const Axios = require('axios')

admin.initializeApp();
const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.getMatchData = functions.https.onRequest((req, res) => {
		res.set('Access-Control-Allow-Origin', '*');
		if (req.method === 'OPTIONS') {
			// Send response to OPTIONS requests
			res.set('Access-Control-Allow-Methods', 'GET');
			res.set('Access-Control-Allow-Headers', '*');
			res.set('Access-Control-Max-Age', '3600');
			res.status(204).send('');
		  } else {
			if(req.method !== "GET") {
			return res.status(500).json({
				message: "Incorrect endpoint method"
			});
			} else {
			let twitch = req.header('Twitch-ID');
			if (!twitch) {
				return res.status(500).json({
					message: 'No twitch ID was presented'
				})
			} else {
				db.collection('matchsnaps').doc(twitch).get()
				.then(match => {
					if(match.exists){
						console.log(match.data())
						if(match.data().active){
							return res.status(200).json({
								message: "valid res",
								match: match.data()
							})
						} else {
							return res.status(500).json({
								message: "Streamer is not active",
							})
						}
						
					} else {
						return res.status(500).json({
							message: "User doesnt have any matches"
						})
					}
					
				})
				.catch(err => {
					console.log(err)
					return res.status(500).json({
						message: err
					})
				})
			}
		}
		
		}
	
})

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
		//Remove unneccesary properties
		delete match["last_score"]
		delete match["disc"]
		match.teams = match.teams.map(team => {
			team.players = team.players.map(player => {
				player = {
					name: player.name,
					stats: player.stats
				}
				return player
			})
			return team
		})
		// console.log(match)

		const body = JSON.stringify({
			content_type: 'application/json',
			message: JSON.stringify(match),
			targets:['broadcast']
		});
		console.log(headers, payload)
		let url = 'https://api.twitch.tv/extensions/message/'+ id
		Axios.post(
			url,
			body, 
			{
				headers: headers
			})
		.then(res => {
			console.log(res)
			return match
		})
		.catch(err => {
			console.log(err)
			return match
		})
	} else {
		return false;
	}
});
