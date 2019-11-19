import React, { Component } from 'react';
import { Grid, Input, Button, Divider, Message, Transition } from 'semantic-ui-react'
require('firebase/auth');

class Signin extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loaded: false,
			error: {
				status: false,
				code: null,
				message: null
			}
		 }
		this.signIn = this.signIn.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.signIn = this.signIn.bind(this);
		this.signUp = this.signUp.bind(this);
	}

	componentDidMount(){
		//Check if an instance of this.props.fb app exists
		if(this.props.fb){
			this.setState({
				loaded: true
			})
		}
	}

	handleChange = e => {
		const name = e.target.name;
		const value = e.target.value;
		this.setState({
			[name]: value
		});
	}

	signIn(){
		// comment out this auth stuff if you want to go to the recording screen to test
		this.props.fb.auth().signInWithEmailAndPassword(this.state.email, this.state.password)
		.then((auth) => {
			//On successful login it pushes to next screen
			console.log(auth)
			this.props.history.push({
				pathname: '/record',
				loggedIn: true,
				uid: auth.user.uid
			})
		})
		.catch(err => {
			console.log(err.code, err.message)
			let tempErr = {
				status: true,
				code: err.code,
				message: err.message
			}
			this.setState({
				error: {...this.state.error, ...tempErr}
			});
		})
	}

	signUp(){
		//idk if we should have predetermined accounts for streamers but this signup is hear if we want it
		this.props.fb.auth().createUserWithEmailAndPassword(this.state.email, this.state.password)
		.catch((err) => {
			console.log(err.code, err.message)
		})
	}

	render() {
		if(!this.state.loaded){
			return null
		} else {
			return (
				<Grid textAlign={'center'} verticalAlign={'middle'}>
					<Grid.Row className="titlebar-window">
						<h5 style={{top: 0, color: "white"}}>EchoVR Stream Buddy</h5>
						<Button
							className="titlebar-close-button"
							circular
							size={"mini"}
							icon="close"
							onClick={() => {console.log("y u no wurk")}}/>
					</Grid.Row>
					<Grid.Row style={{marginTop: 50}}>
						<Grid.Column style={{ maxWidth: 450 }}>
							<Transition visible={this.state.error.status} animation='scale' duration={500}>
								<Message
									name='authError'
									error
									negative
									>
									<Message.Header>An Error Occurred</Message.Header>
									<p>{this.state.error.message}</p>
								</Message>
							</Transition>
							<Input
								fluid icon='user'
								iconPosition='left'
								placeholder='E-mail address'
								type='email'
								name='email'
								onChange={this.handleChange}
								autoComplete='email'
								style={{marginBottom: 30}}
								required
							/>
							<Input
								fluid icon='lock'
								iconPosition='left'
								placeholder='Password'
								type='password'
								name='password'
								onChange={this.handleChange}
								autoComplete='current-password'
								required
							/>
							<Divider style={{marginTop: 50, marginBottom: 25}}/>
							<Button.Group fluid>
								<Button positive onClick={this.signIn}>Sign In</Button>
								<Button.Or />
								<Button onClick={this.signUp}>Sign Up</Button>
							</Button.Group>
						</Grid.Column>
					</Grid.Row>
				</Grid>
			);
		}
	}
}

export default Signin;