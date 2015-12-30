import React, { Component } from 'react';
import {Link} from 'react-router';
import smartify, {WorldAction, WorldState, LocalState} from 'smartify';

import People from 'dealers/People';


@smartify
export default class PersonName extends Component {
    static propTypes = {
        name: WorldState({
            type: React.PropTypes.string,
            resolver: (world, props) => People.personName(world, props.id),
            linked: React.PropTypes.bool
        })
    }

    static defaultProps = {
        linked: true
    }

    render() {
        return this.props.linked
            ? <Link to={`/person/${this.props.id}`}>{this.props.name}</Link>
            : <span>{this.props.name}</span>
    }
}
