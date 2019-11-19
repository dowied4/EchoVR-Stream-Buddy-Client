import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import './App.css';
import Signin from './signIn';
import Recorder from './recorder';
import * as firebase from 'firebase/app';

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


function App() {
  return (
    <div className="App">
        <BrowserRouter>
          <Switch>
            <Route exact path='/' render={(props) => <Signin {...props} fb={firebase}/>}/>
            <Route exact path='/record' render={(props) => <Recorder {...props} fb={firebase}/>}/>
          </Switch>
        </BrowserRouter>
    </div>
  );
}

export default App;
