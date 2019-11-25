import React, { Component } from 'react';
import { Grid, Button, Icon, Message} from 'semantic-ui-react';
import Axios from 'axios';
require("firebase/firestore");

class Recorder extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loaded: false,
			recording: false,
			twitchInfo: {
				login: null,
				id: null,
				image: null,
			}
		 }
		 this.logout = this.logout.bind(this);
		 this.startRecording = this.startRecording.bind(this);
		 this.stopRecording = this.stopRecording.bind(this);
		 this.getFireBaseMatch = this.getFireBaseMatch.bind(this);
		 this.getTwitchInfo = this.getTwitchInfo.bind(this);
		 this.db = null
	}

	componentDidMount(){
		
		if(!this.props.loggedIn){
			this.props.history.push('/')
		}
		this.db = this.props.fb.firestore();
		if (this.props.history.location.uid){
			this.setState({
				loaded: true
			}, this.getTwitchInfo())
		}
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
					console.log(tempUser)
					this.setState({
						twitchInfo: {...this.state.twitchInfo, ...tempUser}
					})
			}))
			.catch(err => console.log(err.response))
		}
	}

	componentDidUpdate(prevProps, prevState){
		if (this.state.match && (prevState.recording !== this.state.recording)) {
			console.log("switch")
			this.db.collection('matchsnaps').doc(this.props.history.location.uid).set(this.state.match)
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
				this.db.collection('matchsnaps').doc(this.props.history.location.uid).set(this.state.match)
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
		this.setState({
			recording: true
		}, () => {
			this.interval = setInterval(() => this.getMatch(), 1000);
		})
	}

	getFireBaseMatch(){
		this.db.collection('matchsnaps').doc(this.props.history.location.uid).get().then(snapShot => {
			this.setState({
				userName: snapShot.data().client_name
			})
			// console.log(snapShot.data())
		})
		.catch((err) => {
			console.warn(err)
		})
	}

	stopRecording(){
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
    }

	render() { 
		let twitchUrl = "https://api.twitch.tv/kraken/oauth2/authorize?response_type=code&client_id=" + process.env.REACT_APP_TWITCH_KEY + "&redirect_uri=http://localhost:3000/record/&scope=user_read"
		if(!this.state.loaded) {
			return null
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
					<Grid.Row>
						{!this.state.twitchInfo.id ? <a href={twitchUrl}><Button icon labelPosition='left' style={{width: 300, marginTop: 150}} color="purple"><Icon name="twitch"/>Connect to Twitch</Button></a>:
						this.state.recording ? (<Button onMouseDown={e => e.preventDefault()} style={{width: 300}} animated='vertical' negative size={"large"} onClick={this.stopRecording}>
							<Button.Content visible>Stop Recording</Button.Content>
							<Button.Content hidden>
								<Icon name='window close' />
							</Button.Content>
						</Button>) :
						(<Button onMouseDown={e => e.preventDefault()} style={{width: 300}} animated='vertical' positive size={"large"} onClick={this.startRecording}>
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