import React, { Component } from 'react';
import { HashRouter, Route, Switch } from "react-router-dom";
import './App.css';
import Signin from './signIn';
import Recorder from './recorder';
import * as firebase from 'firebase/app';
const ipcRenderer = window.require('electron').ipcRenderer

var config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGINGID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT
};

firebase.initializeApp(config)



class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      user: null,
      loggedIn: false,
      loaded: false,
      code: null
     }
    this.Authed = this.Authed.bind(this)
  }
  Authed() {
    firebase.auth().onAuthStateChanged((user) => {
      if(user){
        this.setState({
          user: user,
          loggedIn: true
        })
      } else {
        console.log('no user')
        this.setState({
          user: null,
          loggedIn: false
        })
      }
    })
  }

  componentDidMount(){
    this.Authed()
    this.setState({
      loaded: true
    })
  }

  render() {
    if(this.state.loaded){
      console.log("Trying to render application")
      return(
          <div className="App">
          <HashRouter>
            <Switch>
              <Route exact path='/' render={(props) => <Signin user={this.state.user} loggedIn={this.state.loggedIn} {...props} fb={firebase}/>}/>
              <Route exact path='/record' render={(props) => <Recorder code={this.state.code} loggedIn={this.state.loggedIn} getUser={this.Authed} {...props} fb={firebase}/>}/>
            </Switch>
          </HashRouter>
        </div>
      );
    } else {
      return (
          null
      );
    }
  }
}
export default App;


