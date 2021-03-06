import React, { Component } from 'react';
import { Grid, Input, Button, Divider, Message, Transition, Icon } from 'semantic-ui-react'
const ipcRenderer = window.require('electron').ipcRenderer
require('firebase/auth');

class Signin extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loaded: false,
			email: '',
			password: '',
			confirmPass: '',
			signingUp: false,
			success: false,
			error: {
				status: false,
				code: null,
				message: null,
			}
		}
		this.signIn = this.signIn.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.signIn = this.signIn.bind(this);
		this.signUp = this.signUp.bind(this);
	}

	componentDidMount(){
		ipcRenderer.on('update-complete', () => {
			console.log('Update complete')
			if(this.props.fb){
				this.setState({
					loaded: true,
					updating: false
				})
			}
		})
		//Check if an instance of this.props.fb app exists
		console.log("Rendering main component")
	}

	componentDidUpdate(prevProps, prevState){
		if(prevProps.loggedIn !== this.props.loggedIn){
			if(this.props.loggedIn){
				let user = this.props.user;
				this.props.history.push({
					pathname: '/record',
					uid: user.uid
				})
			}}
	}

	handleChange = e => {
		const name = e.target.name;
		const value = e.target.value;
		this.setState({
			[name]: value
		});
	}

	handleKeyPress = e => {
		if(e.key === 'Enter'){
		  this.signIn()
		}
	  }

	signIn(){
		// comment out this auth stuff if you want to go to the recording screen to test
		this.props.fb.auth().signInWithEmailAndPassword(this.state.email, this.state.password)
		.then((auth) => {
			//On successful login it pushes to next screen
			this.props.history.push({
				pathname: '/record',
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
		let passTest = (this.state.password === this.state.confirmPass) && this.state.password !== ''
		console.log(this.state)
		let emailTest = (/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.state.email))
		if(emailTest && passTest){
			console.log("Passwords Match")
			this.props.fb.auth().createUserWithEmailAndPassword(this.state.email, this.state.password)
			.catch((err) => {
				console.log(err.code, err.message)
			})
			this.setState({
				success: true
			});
			setTimeout(() => {
				this.setState({
					signingUp: false
				})
			}, 2000);
			setTimeout(()=>{
				this.setState({
					success: false
				})
			}, 15000)
		} else {
			let tempErr = {
				status: true,
				code: 420,
				message: ''
			}
			if(!passTest){
				tempErr.message = "Passwords dont match"
			} else {
				tempErr.message = "Invalid Email"
			}
			console.log(tempErr)
			this.setState({
				error: {
					status: true,
					code: 420,
					message: tempErr.message
				}
			});
			setTimeout(()=>{
				this.setState({
					error:{status: false}
				})
			}, 2000)
		}
	}

	render() {
		if(!this.state.loaded){
			return null
		} else  if(!this.state.signingUp){
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
					<Transition visible={this.state.error.status} animation='scale' duration={500}>
						<Message
							name='authError'
							error
							negative
							style={{position: "absolute", top: "75px"}}
							>
							<Message.Header>An Error Occurred</Message.Header>
							<p>{this.state.error.message}</p>
						</Message>
					</Transition>
					<Transition visible={this.state.success} animation='scale' duration={500}>
						<Message
							positive
							style={{position: "absolute", top: "75px"}}
							>
							<Message.Header>Success!</Message.Header>
							<p>Your account has now been created. Please sign in.</p>
						</Message>
					</Transition>
					<Grid.Row style={{marginTop: 150}}>
						<Grid.Column style={{ maxWidth: 450 }}>
							<Input
								fluid icon='user'
								iconPosition='left'
								placeholder='E-mail address'
								type='email'
								name='email'
								onChange={this.handleChange}
								autoComplete='email'
								style={{marginBottom: 50}}
								required
							/>
							<Input
								fluid icon='lock'
								iconPosition='left'
								placeholder='Password'
								type='password'
								name='password'
								style={{marginBottom: 75}}
								onChange={this.handleChange}
								autoComplete='current-password'
								onKeyPress={this.handleKeyPress}
								required
							/>
							<Divider style={{marginTop: 50, marginBottom: 25}}/>
							<Button.Group fluid>
								<Button positive onClick={this.signIn}>Sign In</Button>
								<Button.Or />
								<Button onClick={()=>this.setState({signingUp: true,success: false, error: {status:false}})}>Sign Up</Button>
							</Button.Group>
						</Grid.Column>
					</Grid.Row>
				</Grid>
			);
		} else {
			return(
				<Grid textAlign={'center'} verticalAlign={'middle'}>
					<div className="titlebar-window">
						<h5 className="title">EchoVR Stream Buddy</h5>
					</div>
					<div className='titlebar-close-button-div'>
						<Button className='titlebar-close-button' color="red" circular size={"mini"} icon="close" onClick={() => {
							window.close()
						}}/>
					</div>
					<Grid.Row>
						<Button size={"mini"} animated style={{position: "absolute", left: "40px", top: "20px"}} onClick={() => this.setState({signingUp: false, error: {status:false}})}>
							<Button.Content visible><Icon name='arrow left'/></Button.Content>
							<Button.Content hidden>Back</Button.Content>
						</Button>
					</Grid.Row>
					<Transition visible={this.state.error.status} animation='scale' duration={500}>
						<Message
							name='authError'
							error
							negative
							style={{position: "absolute", top: "20px"}}
							>
							<Message.Header>An Error Occurred</Message.Header>
							<p>{this.state.error.message}</p>
						</Message>
					</Transition>
					<Transition visible={this.state.success} animation='scale' duration={500}>
						<Message
							positive
							style={{position: "absolute", top: "25px"}}
							>
							<Message.Header>Success!</Message.Header>
						</Message>
					</Transition>
					<Grid.Row style={{marginTop: 50}}>
						<Grid.Column style={{ maxWidth: 450 }}>
							<Input
								fluid icon='user'
								iconPosition='left'
								placeholder='E-mail address'
								type='email'
								name='email'
								onChange={this.handleChange}
								autoComplete='email'
								style={{marginBottom: 50}}
								required
							/>
							<Input
								fluid icon='lock'
								iconPosition='left'
								placeholder='Password'
								type='password'
								name='password'
								style={{marginBottom: 50}}
								onChange={this.handleChange}
								autoComplete='current-password'
								required
							/>
							<Input
								fluid icon='lock'
								iconPosition='left'
								placeholder='Confirm Password'
								type='password'
								name='confirmPass'
								onChange={this.handleChange}
								autoComplete='current-password'
								required
							/>
							<Divider style={{marginTop: 75, marginBottom: 20}}/>
							<Button.Group fluid>
								<Button disabled >Sign In</Button>
								<Button.Or />
								<Button positive onClick={this.signUp}>Sign Up</Button>
							</Button.Group>
						</Grid.Column>
					</Grid.Row>
				</Grid>
			);
		}
	}
}

export default Signin;