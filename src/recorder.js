import React, { Component } from 'react';
import { Grid, Button, Icon } from 'semantic-ui-react';

class recorder extends Component {
	constructor(props) {
		super(props);
		this.state = { 
			loaded: false,
			recording: false
		 }
		 this.logout = this.logout.bind(this);
	}

	componentDidMount(){
		this.setState({
			loaded: true
		})
		console.log("Should be here")
	}

	logout(){
		this.props.history.push('/');
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
					<Grid.Row style={{marginTop: 100, marginBottom: 75}}>
						{this.state.recording ? (<Button style={{width: 200}} animated negative size={"large"} onClick={() => this.setState({ recording: false })}>
							<Button.Content visible>Stop Recording</Button.Content>
							<Button.Content hidden>
								<Icon name='window close' />
							</Button.Content>
						</Button>) :
						(<Button style={{width: 200}} animated positive size={"large"} onClick={() => this.setState({ recording: true })}>
							<Button.Content visible>Start Recording</Button.Content>
							<Button.Content hidden>
								<Icon name='video camera' />
							</Button.Content>
						</Button>)}
					</Grid.Row>
					<Grid.Row>
						<Button style={{width: 200}} onClick={this.logout}>Logout</Button>
					</Grid.Row>
				</Grid>
			);
		}
	}
}
 
export default recorder;