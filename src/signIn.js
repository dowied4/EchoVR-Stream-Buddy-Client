import React, { Component } from 'react';
import { Grid, Input, Button, Icon, Divider } from 'semantic-ui-react';

class signIn extends Component {
	constructor(props) {
		super(props);
		this.state = { 
			loaded: false
		 }
		this.signIn = this.signIn.bind(this);
	}

	componentDidMount(){
		this.setState({
			loaded: true
		})
	}

	signIn(){
		console.log("sign in")
		console.log(this.props.history)
		this.props.history.push('/record')
	}
	render() {
		if(!this.state.loaded){
			return null
		} else {
			return (
				<Grid textAlign={'center'} verticalAlign={'middle'}>
					<Grid.Row className="titlebar-window">
						<h5 style={{top: 0, color: "white"}}>EchoVR Stream Buddy</h5>
						<Button className="titlebar-close-button" circular size={"mini"} icon="close"
						onClick={() => {console.log("hello")}}/>
					</Grid.Row>
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
								<Button>Sign Up</Button>
							</Button.Group>
						</Grid.Column>
					</Grid.Row>
				</Grid>
			);
		}
	}
}
 
export default signIn;