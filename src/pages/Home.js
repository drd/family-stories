import React, { Component } from 'react';
import {Link} from 'react-router';

import smartify, {WorldAction, WorldState, LocalState} from 'smartify';


export default class Home extends Component {
    render() {
        return <div>
            <h1>Your family. Your stories.</h1>
            <p>Get started entering your <Link to="family">family tree</Link>!</p>
        </div>;
    }
}
