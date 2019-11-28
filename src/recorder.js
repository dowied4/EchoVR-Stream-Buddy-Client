import React, { Component } from 'react';
import { Grid, Button, Icon, Message, Label, Dimmer, Loader, Dropdown} from 'semantic-ui-react';
import Axios from 'axios';
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
			}
		 }
		 this.logout = this.logout.bind(this);
		 this.startRecording = this.startRecording.bind(this);
		 this.stopRecording = this.stopRecording.bind(this);
		//  this.getFireBaseMatch = this.getFireBaseMatch.bind(this);
		 this.checkTwitch = this.checkTwitch.bind(this);
		 this.getTwitchInfo = this.getTwitchInfo.bind(this);
		 this.onDropDownChange = this.onDropDownChange.bind(this);
		 this.db = null
	}

	componentDidMount(){
		if(!this.props.loggedIn){
			this.props.history.push('/')
		}
		this.db = this.props.fb.firestore();
		if (this.props.history.location.uid){
			// window.addEventListener('beforeunload', (e) => {
			// 	e.preventDefault();
			// 	e.returnValue = '';
			// 	this.db.collection('matchsnaps').doc(this.state.twitchInfo.id).set({active: false}, { merge: true })
			// })
			this.db.collection('users').doc(this.props.history.location.uid).get()
			.then( res => {
				console.log(res.data().verified)
				if (res.data().verified) {
					this.setState({recordOptions: {
						verified: true,
						options: res.data().verified
					}})
				} else {
					console.log('doesnt exist')
				}
			})
			.catch(err => console.log(err))
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
			console.log(user)
			if (!user.exists) {
				this.getTwitchInfo()
			} else {
				let tempUser = {
					login: user.data().login,
					id: user.data().id,
					image: user.data().image
				}
				this.setState({
					recordId: user.data().id,
					twitchInfo: {...this.state.twitchInfo, ...tempUser},
					twitchLoaded: true
				})
			}
		})
		.catch((err) => {
			console.log(err)
		})
	}

	getTwitchInfo(){
		if(this.props.code){
			Axios.post('https://id.twitch.tv/oauth2/token?',null,
			{	params: {
					client_id: process.env.REACT_APP_TWITCH_KEY,
					client_secret: process.env.REACT_APP_CLIENT_SECRET,
					code: this.props.code,
					grant_type: 'authorization_code',
					redirect_uri: 'http://localhost:3000/record/'
			}})
			.then(res => Axios.get('https://api.twitch.tv/helix/users?', {headers: {'Client-ID': process.env.REACT_APP_TWITCH_KEY, 'Authorization': 'Bearer ' + res.data.access_token}})
				.then(user => {
					let userData = user.data.data[0];
					let tempUser = {
						login: userData.display_name,
						id: userData.id,
						image: userData.profile_image_url
					}
					this.db.collection('users').doc(this.props.history.location.uid).set(tempUser)
					console.log(tempUser)
					this.setState({
						recordId: tempUser.id,
						twitchInfo: {...this.state.twitchInfo, ...tempUser},
						twitchLoaded: true
					})
			}))
			.catch(err => console.log(err.response))
		}
	}

	componentDidUpdate(prevProps, prevState){
		if (this.state.match && (prevState.recording !== this.state.recording)) {
			console.log("switch")
			this.db.collection('matchsnaps').doc(this.state.recordId).set(this.state.match, { merge: true })
				.then(() => {
					console.log("Successfully stored")
				})
				.catch((err) => {
					console.warn(err)
				})
		}
		if (this.state.match && prevState.match){
			//We can make these conditions different then game status if we feel that we need to update more often
			if (this.state.recording && (this.state.match.game_status !== prevState.match.game_status) && this.state.match.game_status !== 'round_start' && this.state.match.game_status !== '') {
				this.db.collection('matchsnaps').doc(this.state.recordId).set(this.state.match, { merge: true })
				.then(() => {
					console.log("Successfully stored")
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
		this.props.fb.auth().signOut();
		this.props.history.push('/');
	}

	startRecording(){
		this.db.collection('matchsnaps').doc(this.state.recordId).set({active: true}, { merge: true })
		this.setState({
			recording: true
		}, () => {
			this.interval = setInterval(() => this.getMatch(), 1000);
		})
	}

	// getFireBaseMatch(){
	// 	this.db.collection('matchsnaps').doc(this.state.recordId).get().then(snapShot => {
	// 		this.setState({
	// 			userName: snapShot.data().client_name
	// 		})
	// 		// console.log(snapShot.data())
	// 	})
	// 	.catch((err) => {
	// 		console.warn(err)
	// 	})
	// }

	stopRecording(){
		this.db.collection('matchsnaps').doc(this.state.recordId).set({active: false}, { merge: true })
		this.setState({
			recording: false
		}, () => {
			clearInterval(this.interval);
		})
	}

	getMatch(){
		Axios.get('/session')
		.then((result => {
			console.log(result.data.game_status)
			this.setState({match: result.data})
		}))
		.catch((err) => {
			console.warn(err.response)
		})
	}

	componentWillUnmount() {
		clearInterval(this.interval)
		if(this.state.twitchInfo.id){
			this.db.collection('matchsnaps').doc(this.state.recordId).set({active: false}, { merge: true })
		}
    }

	render() {
		let twitchUrl = "https://api.twitch.tv/kraken/oauth2/authorize?response_type=code&client_id=" + process.env.REACT_APP_TWITCH_KEY + "&redirect_uri=http://localhost:3000/record/&scope=user_read"
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
		if(!this.state.twitchLoaded) {
			return (
				<Grid textAlign={'center'} verticalAlign={'middle'}>
					<Grid.Row className="titlebar-window">
						<h5 style={{top: 0, color: "white"}}>EchoVR Stream Buddy</h5>
						<Button className="titlebar-close-button" circular size={"mini"} icon="close"
						onClick={() => {console.log("hello")}}/>
					</Grid.Row>
					<Dimmer inline='center' active>
						<Loader content='Loading' />
					</Dimmer>
				</Grid>
			);
		} else {
			return (
				<Grid textAlign={'center'} verticalAlign={'middle'}>
					<Grid.Row className="titlebar-window">
						<h5 style={{top: 0, color: "white"}}>EchoVR Stream Buddy</h5>
						<Button className="titlebar-close-button" circular size={"mini"} icon="close"
						onClick={() => {console.log("hello")}}/>
					</Grid.Row>
					<Grid.Row>
						{this.state.twitchInfo.login ? <h1 style={{position: "absolute",color: "white", fontWeight: "bold", top: 20}}>Welcome {this.state.twitchInfo.login}!</h1> : <Message info style={{position: "absolute", top: 120, width: 400}}>To be able to use EchoVR Stream Buddy Extension we will need you to link your twitch account.</Message>}
					</Grid.Row>
					<Grid.Row>
						{this.state.twitchInfo.id ? <img className="twitch-image" src={this.state.twitchInfo.image}/>: null}
					</Grid.Row>
					{this.state.recordOptions.verified ? <Grid.Row><Dropdown onChange={this.onDropDownChange} defaultValue={this.state.recordId} style={{width: 300, position: "absolute", bottom: 30}} selection options={extraOptions}/></Grid.Row> : null}
					<Grid.Row>
						{!this.state.twitchInfo.id ? <a href={twitchUrl}><Button icon labelPosition='left' style={{width: 300}} color="purple"><Icon name="twitch"/>Connect to Twitch</Button></a>:
						this.state.recording ? (<Button onMouseDown={e => e.preventDefault()} style={{width: 300, position: "absolute", bottom: 5}} animated='vertical' negative size={"large"} onClick={this.stopRecording}>
							<Button.Content visible>Stop Recording</Button.Content>
							<Button.Content hidden>
								<Icon name='window close' />
							</Button.Content>
						</Button>) :
						(<Button onMouseDown={e => e.preventDefault()} style={{width: 300, position: "absolute", bottom: 5}} animated='vertical' positive size={"large"} onClick={this.startRecording}>
							<Button.Content visible>Start Recording</Button.Content>
							<Button.Content hidden>
								<Icon name='video camera' />
							</Button.Content>
						</Button>)}
					</Grid.Row>
					<Button onMouseDown={e => e.preventDefault()} animated="fade" style={{width: 300, position: "absolute", bottom: 40}} onClick={this.logout}>
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

/*<Popup
							trigger = {
								<Button onMouseDown={e => e.preventDefault()} animated color="teal">
									<Button.Content visible><Icon name='user'/></Button.Content>
									<Button.Content hidden>UID</Button.Content>
								</Button>
							}
							on='click'
							pinned
							content={this.props.history.location.uid}
							basic
						/>*/ 