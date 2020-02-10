import React, { Component } from 'react';
import { Grid, Button, Icon,Label, Message, Dimmer, Loader, Dropdown, Popup, Checkbox} from 'semantic-ui-react';
import Axios from 'axios';
const path = require('path');
const ipcRenderer = window.require('electron').ipcRenderer
require("firebase/firestore");

class Recorder extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loaded: false,
			recording: false,
			recordId: null,
			twitchInfo: {
				login: null,
				id: null,
				image: null,
			},
			twitchLoaded: false,
			recordOptions: {
				verified: false,
				options: []
			},
			gettingTwitch: false,
			topChecked: false,
			diffTime: new Date()
		 }
		 this.logout = this.logout.bind(this);
		 this.startRecording = this.startRecording.bind(this);
		 this.stopRecording = this.stopRecording.bind(this);
		 this.checkTwitch = this.checkTwitch.bind(this);
		 this.getTwitchInfo = this.getTwitchInfo.bind(this);
		 this.onDropDownChange = this.onDropDownChange.bind(this);
		 this.launchTwitchWindow = this.launchTwitchWindow.bind(this);
		 this.db = null
	}
	
	
	componentDidMount(){
		if(!this.props.loggedIn){
			this.props.history.push('/')
		}
		this.db = this.props.fb.firestore();
		if (this.props.history.location.uid){
			console.log(window.location)
			this.setState({
				loaded: true
			}, this.checkTwitch())
		}
	}

	onDropDownChange = (e, data) => {
        console.log(data.value);
        this.setState({
            recordId: data.value
        });

    }

	checkTwitch(){
		this.db.collection('users').doc(this.props.history.location.uid).get()
		.then((user) => {
			if (!user.exists) {
				ipcRenderer.on('twitch-success', (event, arg)=> {
					console.log('received code: ', arg)
					this.getTwitchInfo(arg)
				})
				this.setState({
					gettingTwitch: true
				})
			} else {
				let tempUser = {
					login: user.data().login,
					id: user.data().id,
					image: user.data().image
				}
				this.db.collection('matchsnaps').doc(user.data().id).get()
				.then((match) => {
					this.setState({
						topChecked: match.data().top
					})
				}
				)
				this.setState({
					recordId: user.data().id,
					twitchInfo: {...this.state.twitchInfo, ...tempUser},
					twitchLoaded: true
				})
				if (user.data().verified) {
					//made it this way so we could access channels for different subcategories like maybe VRL
					this.db.collection('channels').doc('VRML').get()
					.then((channels) => {
							this.setState({recordOptions: {
								verified: true,
								options: channels.data().channels
							}})
						}
					)
					.catch(err=> console.warn(err))
				} else {
					console.log('doesnt exist')
				}
			}
		})
		.catch((err) => {
			console.log(err)
		})
	}
	launchTwitchWindow(twitchUrl){
		ipcRenderer.send('request-twitch-auth', 'ping')
	}

	getTwitchInfo(code){
		Axios.post('https://id.twitch.tv/oauth2/token?',null,
		{	params: {
				client_id: process.env.REACT_APP_TWITCH_KEY,
				client_secret: process.env.REACT_APP_CLIENT_SECRET,
				code: code,
				grant_type: 'authorization_code',
				redirect_uri: 'http://localhost:3000/record/'
		}})
		.then(res => Axios.get('https://api.twitch.tv/helix/users?', {headers: {'Client-ID': process.env.REACT_APP_TWITCH_KEY, 'Authorization': 'Bearer ' + res.data.access_token}})
			.then(user => {
				let userData = user.data.data[0];
				let tempUser = {
					login: userData.display_name,
					id: userData.id,
					image: userData.profile_image_url,
					verified: false
				}
				this.db.collection('users').doc(this.props.history.location.uid).set(tempUser)
				this.setState({
					recordId: tempUser.id,
					twitchInfo: {...this.state.twitchInfo, ...tempUser},
					twitchLoaded: true
				})
		}))
		.catch(err => console.log(err.response))
	}
	componentDidUpdate(prevProps, prevState){
		// console.log('%c 🦑 prevState: ', 'font-size:20px;background-color: #B03734;color:#fff;', prevState);
		// console.log('%c 🥘 newState: ', 'font-size:20px;background-color: #3F7CFF;color:#fff;', this.state);

		if (this.state.match && prevState.match){
			//We can make these conditions different then game status if we feel that we need to update more often
			if (this.state.recording && (this.state.match.game_status !== prevState.match.game_status) && this.state.match.game_status !== 'round_start' && this.state.match.game_status !== '') {
				let match = this.state.match
				match.top = this.state.topChecked
				console.log('%c 🥞 match: ', 'font-size:20px;background-color: #FFDD4D;color:#fff;', match);

				this.db.collection('matchsnaps').doc(this.state.recordId).set(match, { merge: true })
				.then(() => {
					console.log("Successfully stored")
					let today = new Date();
					this.setState({
						diffTime: today
					})
				})
				.catch((err) => {
					console.warn(err)
				})
				// console.log(this.state.match)
			}
		}
		if(prevProps.loggedIn !== this.props.loggedIn){
			if(!this.props.loggedIn){
				this.props.history.push({
					pathname: '/'
				})
			}}
	}

	logout(){
		if (this.state.twitchInfo){
			this.db.collection('matchsnaps').doc(this.state.twitchInfo.id).set({active: false}, { merge: true })
		}
		this.props.fb.auth().signOut();
		this.props.history.push('/');
	}

	getMatch(first){
		Axios.get('/session')
		.then((result => {
			if (first) {
				clearInterval(this.interval)
				let match = result.data
				match.top = this.state.topChecked
				this.db.collection('matchsnaps').doc(this.state.recordId).set(match, { merge: true })
				.then(() => {
					console.log("Successfully stored")
					let today = new Date();
					this.setState({
						diffTime: today
					})
				})
				.catch(err => console.error(err))
				this.interval = setInterval(() => this.getMatch(false), 1000)
			}
			this.setState({match: result.data, validData: true})
		}))
		.catch((err) => {
			console.warn(err.response)
			clearInterval(this.interval)
			this.interval = setInterval(() => this.getMatch(true), 1000)
			this.setState({validData: false})
		})
	}

	startRecording(){
		this.db.collection('matchsnaps').doc(this.state.recordId).set({active: true}, { merge: true })
		this.setState({
			recording: true
		}, () => {
			this.getMatch(true)
		})
	}

	stopRecording(){
		this.db.collection('matchsnaps').doc(this.state.recordId).set({active: false}, { merge: true })
		this.setState({
			recording: false
		}, () => {
			clearInterval(this.interval);
		})
	}


	statusBar(){
		var snapString;
		let today = new Date();
		let timeGap =  (today.getTime() - this.state.diffTime.getTime())/(60000);
		if (timeGap >= 2){
			snapString = Math.ceil(timeGap) + " Minutes Ago"
		} else if (timeGap < 1) {
			let time = Math.ceil(timeGap * 60)
			if (time > 1) {
				snapString = Math.ceil(timeGap * 60) + " Seconds Ago"
			} else {
				snapString = "1 Second Ago"
			}
			
		} else {
			snapString = "1 Minute Ago"
		}
		if(!timeGap){
			snapString = "No Match Data Sent Yet!"
		}
		if (!this.state.recording) {
			return <Popup header="Not Recording"  trigger={<Label circular empty color="red" style={{position: "absolute", top: 310, left: 220, zIndex: 10}}/>} position='left center'/>
		} else if (this.state.recording && this.state.validData) {
			return <Popup header="Last Snapshot: " content={snapString}  trigger={<Label circular empty color="green" style={{position: "absolute", top: 310, left: 220, zIndex: 10}}/>} position='left center'/>
		} else {
			return <Popup header="No Match Found" content={"Since: " + snapString} trigger={<Label circular empty color="yellow" style={{position: "absolute", top: 310, left: 220, zIndex: 10}}/>} position='left center'/>
		}
	}

	

	componentWillUnmount() {
		clearInterval(this.interval)
		if(this.state.twitchInfo.id){
			this.db.collection('matchsnaps').doc(this.state.recordId).set({active: false}, { merge: true })
		}
    }

	render() {
		let redir = process.env.NODE_ENV === 'development' ? "http://localhost:3000/record/" : `file://${path.join(__dirname, '../build/index.html')}`
		console.log(redir)
		const extraOptions = [];
		if(this.state.recordOptions.verified){
			let tempObj;
			tempObj = {
				key: this.state.twitchInfo.login,
				text: this.state.twitchInfo.login,
				value: this.state.twitchInfo.id
			}
			extraOptions.push(tempObj)
			this.state.recordOptions.options.map((value, index) => {
				tempObj = {
					key: value.name,
					text: value.name,
					value: value.id
				}
				extraOptions.push(tempObj)
			})
		}
		if(!this.state.loaded || (!this.state.twitchLoaded && !this.state.gettingTwitch)) {
			return (
				<Grid textAlign={'center'} verticalAlign={'middle'}>
					<div className="titlebar-window">
						<h5 className="title">EchoVR Stream Buddy</h5>
					</div>
					<div className='titlebar-close-button-div'>
						<Button className='titlebar-close-button' color="red" circular size={"mini"} icon="close" onClick={() => {
							window.close()
							
						}}/>
					</div>
					<Dimmer inline='center' active>
						<Loader content='Loading' />
					</Dimmer>
				</Grid>
			);
		} else {
			return (
				<Grid textAlign={'center'} verticalAlign={'middle'}>
					<div className="titlebar-window">
						<h5 className="title">EchoVR Stream Buddy</h5>
					</div>
					<div className='titlebar-close-button-div'>
						<Button className='titlebar-close-button' color="red" circular size={"mini"} icon="close" onClick={() => {
							if(this.state.twitchInfo){
								this.db.collection('matchsnaps').doc(this.state.twitchInfo.id).set({active: false}, { merge: true })
							}
							setTimeout(() =>  {window.close()}, 1000)
						}}/>
					</div>
					<Grid.Row>
						{this.state.twitchInfo.login ? <h1 style={{position: "absolute",color: "white", fontWeight: "bold", top: 20}}>Welcome {this.state.twitchInfo.login}!</h1> : <Message info style={{position: "absolute", top: 120, width: 400}}>To be able to use EchoVR Stream Buddy Extension we will need you to link your twitch account.</Message>}
					</Grid.Row>
					{this.state.twitchInfo.login ?
					<Grid style={{position: "absolute", top: "410px", left: "15px"}}>
						<Grid.Row columns={2}>
							<Grid.Column>
								<h5 style={{color: "white"}}>Use Top Overlay</h5>
							</Grid.Column>
							<Grid.Column>
								<Checkbox checked={this.state.topChecked} onChange={(e, data) => {
									this.setState({
										topChecked: data.checked
									})
								}} style={{paddingTop: "5px"}}  toggle/>
							</Grid.Column>
						</Grid.Row>
					</Grid> : null}
					{this.state.twitchInfo.login ? this.statusBar() : null}
					{this.state.validData && this.state.recording ? <p style={{fontSize: "75%",color: 'white', position: 'absolute', top: 310, left: 245}}>{this.state.match.sessionid}</p> : 
					<p style={{fontSize: "75%",color: 'white', position: 'absolute', top: 310, left: 320}}>{!this.state.recording ? "Not Recording" : "No Match Data"}</p>}
					<Grid.Row>
						{this.state.twitchInfo.id ? <img className="twitch-image" src={this.state.twitchInfo.image}/>: null}
					</Grid.Row>
					{this.state.recordOptions.verified ? <Grid.Row><Dropdown onChange={this.onDropDownChange} defaultValue={this.state.recordId} style={{width: 300, position: "absolute", bottom: 20}} selection options={extraOptions}/></Grid.Row> : null}
					<Grid.Row>
						
						{!this.state.twitchInfo.id ? <Button onClick={() => this.launchTwitchWindow()} icon labelPosition='left' style={{width: 300, top: 200}} color="purple"><Icon name="twitch"/>Connect to Twitch</Button>:
						this.state.recording ? (<Button onMouseDown={e => e.preventDefault()} style={{width: 300, position: "absolute", bottom: -15}} animated='vertical' negative size={"large"} onClick={this.stopRecording}>
							<Button.Content visible>Stop Recording</Button.Content>
							<Button.Content hidden>
								<Icon name='window close' />
							</Button.Content>
						</Button>) :
						(<Button onMouseDown={e => e.preventDefault()} style={{width: 300, position: "absolute", bottom: -15}} animated='vertical' positive size={"large"} onClick={this.startRecording}>
							<Button.Content visible>Start Recording</Button.Content>
							<Button.Content hidden>
								<Icon name='video camera' />
							</Button.Content>
						</Button>)}
					</Grid.Row>
					<Button onMouseDown={e => e.preventDefault()} animated="fade" style={{width: 300, position: "absolute", bottom: 25}} onClick={this.logout}>
						<Button.Content visible>Logout</Button.Content>
						<Button.Content hidden>
							<Icon name='sign-out'/>
						</Button.Content>
					</Button>
				</Grid>
			);
		}
	}
}
export default Recorder;