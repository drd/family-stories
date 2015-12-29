import React, { Component } from 'react';
import {Link} from 'react-router';

import smartify, {WorldAction, WorldState, LocalState} from 'smartify';

import People, {Gender} from 'dealers/People';

import PersonName from 'ui/PersonName';
import PersonFinder from 'ui/PersonFinder';


@smartify class Parent extends Component {
    static propTypes = {
        of: React.PropTypes.number.isRequired,
        gender: React.PropTypes.string.isRequired,
        parent: WorldState({
            type: React.PropTypes.number,
            resolver: (world, props) => People.parentOf(world, props.of, props.gender)
        }),
    }

    render() {
        return this.props.parent ? <PersonName id={this.props.parent}/> : null;
    }
}


class Mother extends Component {
    static propTypes = {
        of: React.PropTypes.number.isRequired,
    }

    render() {
        return <div>
            <h3>Mother</h3>
            <Parent of={this.props.of} gender={Gender.female}/>
        </div>;
    }
}


class Father extends Component {
    static propTypes = {
        of: React.PropTypes.number.isRequired,
    }

    render() {
        return <div>
            <h3>Father</h3>
            <Parent of={this.props.of} gender={Gender.male}/>
        </div>;
    }
}


@smartify
class Children extends Component {
    static propTypes = {
        of: React.PropTypes.number.isRequired,
        offspring: WorldState({
            type: React.PropTypes.object,
            resolver: (world, props) => People.childrenOf(world, props.of)
        }),
    }

    render() {
        return <div>
            <h3>Children</h3>
            {this.props.offspring.map(childId => <PersonName key={childId} id={childId}/>)}
        </div>;
    }
}


@smartify
export default class Relationships extends Component {
    static propTypes = {
        personId: React.PropTypes.number.isRequired,
        gender: React.PropTypes.string,
        relationships: WorldState({
            type: React.PropTypes.object,
            resolver: (world, props) => People.relationshipsOfPerson(world, props.personId)
        }),
        addNewRelationship: WorldAction(
            (world, props, relationship, name, id) => People.addPersonAsRelationship(world, relationship, props.personId, name, id)
        ),
        localState: LocalState({
            name: React.PropTypes.string,
            id: React.PropTypes.number,
            relationship: React.PropTypes.string
        })
    }

    static defaultProps = {
        name: '',
        relationship: ''
    }

    addRelationship(event) {
        event.preventDefault();

        this.props.addNewRelationship(this.props.localState.get('relationship'),
                                      this.props.localState.get('name'),
                                      this.props.localState.get('id'));
        this.props.localState.set('relationship', '');
        this.props.localState.set('name', '');
    }

    relationshipOptions() {
        let options = ['Mother', 'Father'];
        if (this.props.gender) {
            options.push('Daughter', 'Son');
        }
        return options;
    }

    personSelected(selection) {
        if (selection === null) {
            selection = {};
        }
        const {value: id, label: name} = selection;
        this.props.localState.set('name', name);
        this.props.localState.set('id', id);
    }

    render() {
        return <div>
            <h2>Relationships</h2>

            <Father of={this.props.personId}/>
            <Mother of={this.props.personId}/>
            <Children of={this.props.personId}/>

            <hr/>

            <h3>Add relationship</h3>
            <div>
                <p>Relationship: <select onChange={e => this.props.localState.set('relationship', e.target.value)}>
                    <option value="">-</option>
                    {this.relationshipOptions().map(o => <option value={o} key={o}>{o}</option>)}
                </select></p>
                {!this.props.gender && <p><small>Please select a gender in order to add children</small></p>}
                <p>Name: <PersonFinder onChange={this.personSelected.bind(this)} /></p>
                <button onClick={this.addRelationship.bind(this)}>
                    Add relationship
                </button>
            </div>
        </div>
    }
}
