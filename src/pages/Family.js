import React, { Component } from 'react';
import {Link} from 'react-router';

import smartify, {WorldAction, WorldState, LocalState} from 'smartify';

import ConfirmedAction from 'ui/ConfirmedAction';
import StoryEditor from 'ui/StoryEditor';


@smartify
export default class Family extends Component {

    static propTypes = {
        people: WorldState({
            type: React.PropTypes.object,
            resolver: (world, props) => world.getIn(['Person'])
        }),
        removePerson: WorldAction(
            (world, props, id) => world.deleteIn(['Person', id])
        )
    }

    nextPersonId() {
        return this.props.people.size;
    }

    removePerson(personId) {
        this.props.removePerson(personId);
    }

    render() {
        return <div>
            <h1>Welcome, O'Connells!</h1>
            <StoryEditor path={['Family']}/>
            <h2>Family Members:</h2>
            <ul>{this.props.people.map((props, id) =>
                <li key={id}>
                    <Link to={`person/${id}`}>{props.get('Name')}</Link>
                    <ConfirmedAction onConfirm={this.removePerson}>
                        Remove
                    </ConfirmedAction>
                </li>
            )}</ul>
            <props><Link to={`person/${this.nextPersonId()}`}>Add new Family member</Link></props>
            <props><Link to="/">home</Link></props>
        </div>;
    }
}
