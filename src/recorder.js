import React, { Component } from 'react';
import { Grid, Button, Icon, Popup } from 'semantic-ui-react';
import Axios from 'axios';
require("firebase/firestore");

class Recorder extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loaded: false,
			recording: false
		 }
		 this.logout = this.logout.bind(this);
		 this.startRecording = this.startRecording.bind(this);
		 this.stopRecording = this.stopRecording.bind(this);
		 this.getFireBaseMatch = this.getFireBaseMatch.bind(this);
		 this.db = null
	}

	componentDidMount(){
		if(!this.props.history.location.loggedIn){
			this.props.history.push('/')
		}
		this.db = this.props.fb.firestore();
		if (this.props.history.location.uid){
			this.setState({
				loaded: true
			}, this.getFireBaseMatch())
		}
	}

	componentDidUpdate(prevProps, prevState){
		if (this.state.match && prevState.match){
			//We can make these conditions different then game status if we feel that we need to update more often
			if(this.state.recording && (this.state.match.game_status !== prevState.match.game_status)){
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
						{this.state.userName ? <h1 style={{color: "white", fontWeight: "bold", marginTop: 20}}>Welcome {this.state.userName}!</h1> : null}
					</Grid.Row>
					<Grid.Row style={{marginTop: 100, marginBottom: 150}}>
						<Popup
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
						/>
						{this.state.recording ? (<Button onMouseDown={e => e.preventDefault()} style={{width: 240}} animated='vertical' negative size={"large"} onClick={this.stopRecording}>
							<Button.Content visible>Stop Recording</Button.Content>
							<Button.Content hidden>
								<Icon name='window close' />
							</Button.Content>
						</Button>) :
						(<Button onMouseDown={e => e.preventDefault()} style={{width: 240}} animated='vertical' positive size={"large"} onClick={this.startRecording}>
							<Button.Content visible>Start Recording</Button.Content>
							<Button.Content hidden>
								<Icon name='video camera' />
							</Button.Content>
						</Button>)}
					</Grid.Row>
					<Grid.Row>
						<Button onMouseDown={e => e.preventDefault()} animated="fade" style={{width: 300}} onClick={this.logout}>
							<Button.Content visible>Logout</Button.Content>
							<Button.Content hidden>
								<Icon name='sign-out'/>
							</Button.Content>
						</Button>
					</Grid.Row>
				</Grid>
			);
		}
	}
}
 
export default Recorder;