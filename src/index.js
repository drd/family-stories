import 'babel-polyfill';

import React from 'react';
import { render } from 'react-dom';
import { Router, Route, IndexRoute } from 'react-router'
import createBrowserHistory from 'history/lib/createBrowserHistory'


import App from 'App';
import Home from 'pages/Home';
import Family from 'pages/Family';
import Person from 'pages/Person';

import 'trix/dist/trix.css';
import 'react-select/less/select.less';

const history = createBrowserHistory();

import World, {WorldRoot} from 'World';
const initialState = JSON.parse(localStorage.getItem('__world__')) || {
    Family: {},
    Person: [],
};

const world = global.world = new World(initialState);

world.onActionPerformed(() => {
    localStorage.setItem('__world__', JSON.stringify(world.worldState.toJSON()));
});

render((
    <WorldRoot world={world}>
        <Router history={history}>
            <Route path="/" component={App}>
                <IndexRoute component={Home}/>
                <Route path="family" component={Family}/>
                <Route path="person/:personId" component={Person}/>
            </Route>
        </Router>
    </WorldRoot>
), document.getElementById('root'));
