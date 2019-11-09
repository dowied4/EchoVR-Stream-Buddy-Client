import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import './App.css';
import signIn from './signIn';
import recorder from './recorder';


function App() {
  return (
    <div className="App">
        <BrowserRouter>
          <Switch>
            <Route exact path='/' component={signIn}/>
            <Route exact path='/record' component={recorder}/>
          </Switch>
        </BrowserRouter>
    </div>
  );
}

export default App;
