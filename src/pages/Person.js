import React, { Component } from 'react';
import {Link} from 'react-router';

import smartify, {WorldAction, WorldState, LocalState} from 'smartify';

import People, {Gender} from 'dealers/People';

import Relationships from 'ui/Relationships';
import StoryEditor from 'ui/StoryEditor';


@smartify
export default class Person extends Component {
    static propTypes = {
        name: WorldState({
            type: React.PropTypes.string,
            resolver: (world, props) => People.personName(world, props.params.personId)
        }),
        setName: WorldAction(
            (world, props, name) => People.setPersonName(world, props.params.personId, name)
        ),
        gender: WorldState({
            type: React.PropTypes.string,
            resolver: (world, props) => People.personGender(world, props.params.personId)
        }),
        setGender: WorldAction(
            (world, props, gender) => People.setPersonGender(world, props.params.personId, gender)
        )
    }

    personId() {
        return parseInt(this.props.params.personId, 10);
    }

    render() {
        return <div>
            <h1>Family Member: {this.props.name}</h1>
            <input value={this.props.name} placeholder="Name" onChange={e => this.props.setName(e.target.value)}/>
            <select value={this.props.gender} onChange={e => this.props.setGender(e.target.value)}>
                <option value="">-</option>
                {Object.values(Gender).map(value => <option value={value} key={value}>{value}</option>)}
            </select>
            <StoryEditor path={People.personPath(this.props.params.personId)} />
            <Relationships gender={this.props.gender} personId={this.props.params.personId}/>
            <Link to="/family">Family</Link>
        </div>;
    }
}
