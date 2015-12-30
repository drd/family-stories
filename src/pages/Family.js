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
            resolver: (world, props) => world.get('Person')
        }),
        nextPersonId: WorldState({
            type: React.PropTypes.number,
            resolver: (world, props) => People.nextPersonId(world)
        }),
        removePerson: WorldAction(
            (world, props, id) => People.removePerson(world, id)
        )
    }

    removePerson = (personId) => {
        this.props.removePerson(personId);
    }

    render() {
        return <div>
            <h1>Welcome, O'Connells!</h1>
            <StoryEditor path={['Family']}/>
            <h2>Family Members:</h2>
            <ul>{this.props.people.toList().map((props, id) =>
                <li key={id}>
                    <Link to={`person/${id}`}>{props.get('Name')}</Link>
                    <ConfirmedAction onConfirm={() => this.removePerson(id)}>
                        Remove
                    </ConfirmedAction>
                </li>
            )}</ul>
        <p><Link to={`/person/${this.props.nextPersonId}`}>Add new Family member</Link></p>
            <p><Link to="/">home</Link></p>
        </div>;
    }
}
