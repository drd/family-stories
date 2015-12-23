import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router';
import Immutable from 'immutable';

import TrixEditor from 'TrixEditor';

import smartify, {WorldAction, WorldState, LocalState} from 'smartify';

@smartify
export class Story extends Component {

    static propTypes = {
        familyStory: WorldState({
            type: React.PropTypes.string,
            resolver: (world, props) => world.getIn([...props.path, 'Story'])
        }),
        setStory: WorldAction(
            (world, props, story) => world.performAction({
                name: `SetStory[${props.path}]`,
                transaction: ws => ws.setIn([...props.path, 'Story'], story)
            })
        )
    }

    componentDidMount() {
        ReactDOM.findDOMNode(this).addEventListener("trix-attachment-add", ({attachment}) => {
            if (attachment.file) {
                console.log('uploading file!!!');
                // var ucFile = uploadcare.fileFrom('object', file);
                // ucFile.done(fileInfo => console.log(fileInfo))
                //       .fail((err, fileInfo) => console.log(err, fileInfo));
            }
        });
    }

    storyChanged(story) {
        this.props.setStory(story);
    }

    render() {
        return <div>
            <TrixEditor value={this.props.familyStory} onChange={this.storyChanged.bind(this)}/>
        </div>;
    }
}

@smartify
export class Family extends Component {

    static propTypes = {
        people: WorldState({
            type: React.PropTypes.object,
            resolver: (world, props) => world.getIn(['Person'])
        })
    }

    nextPersonId() {
        return this.props.people.size;
    }

    render() {
        return <div>
            <h1>Welcome, O'Connells!</h1>
            <Story path={['Family']}/>
            <h2>Family Members:</h2>
            <ul>{this.props.people.map((props, id) =>
                <li><Link to={`person/${id}`}>{props.get('Name')}</Link></li>
            )}</ul>
            <props><Link to={`person/${this.nextPersonId()}`}>Add new Family member</Link></props>
            <props><Link to="/">home</Link></props>
        </div>;
    }
}

@smartify
class PersonName extends Component {
    static propTypes = {
        name: WorldState({
            type: React.PropTypes.string,
            resolver: (world, props) => world.getIn(['Person', props.id, 'Name'])
        })
    }

    render() {
        return <span>{this.props.name}</span>
    }
}

@smartify
class Relationships extends Component {
    static propTypes = {
        personId: React.PropTypes.number.isRequired,
        relationships: WorldState({
            type: React.PropTypes.object,
            resolver: (world, props) => world.getIn(['Person', props.personId, 'Relationships'], [])
        }),
        addRelationship: WorldAction(
            (world, props, relationship, name) => {
                const nextId = world.get('Person').size;
                world.performAction({
                    name: `AddRelationship[${world.getIn(['Person', props.personId, 'Name'])}]`,
                    transaction: ws => ws.updateIn(
                        ['Person', props.personId, 'Relationships', relationship],
                        relationship => relationship === undefined
                            ? Immutable.fromJS([nextId])
                            : relationship.push(nextId)
                        )
                        .setIn(['Person', nextId, 'Name'], name)
                })
            }
        ),
        localState: LocalState({
            name: React.PropTypes.string,
            relationship: React.PropTypes.string
        })
    }

    static defaultProps = {
        name: '',
        relationship: ''
    }

    render() {
        return <div>
            <h2>Relationships</h2>
            {this.props.relationships.map((people, relationshipType) => <div>
                <h3>{relationshipType}</h3>
                <ul>{people.map(id => <li>
                    <Link to={`/person/${id}`}><PersonName id={id}/></Link>
                </li>)}</ul>
            </div>)}
            <hr/>
            <h3>Add relationship</h3>
            <div>
                <p>Relationship: <select onChange={e => this.props.localState.set('relationship', e.target.value)}>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Child">Child</option>
                </select></p>
                <p>Name: <input placeholder="Name" onChange={e => this.props.localState.set('name', e.target.value)}/></p>
                <button onClick={e => this.props.addRelationship(this.props.localState.get('relationship'),
                                                                 this.props.localState.get('name'))}>
                    Add relationship
                </button>
            </div>
        </div>
    }
}

@smartify
export class Person extends Component {
    static propTypes = {
        name: WorldState({
            type: React.PropTypes.string,
            resolver: (world, props) => world.getIn(['Person', props.params.personId, 'Name'])
        }),
        setName: WorldAction(
            (world, props, name) => world.performAction({
                name: 'Person/setName',
                transaction: ws => ws.setIn(['Person', props.params.personId, 'Name'], name)
            })
        )
    }

    render() {
        return <div>
            <h1>Family Member: {this.props.name}</h1>
            <input value={this.props.name} onChange={e => this.props.setName(e.target.value)}/>
            <Story path={['Person', this.props.params.personId]}/>
            <Relationships personId={this.props.params.personId}/>
            <Link to="/family">Family</Link>
        </div>;
    }
}

export class Index extends Component {
    render() {
        return <div>
            <h1>Your family. Your stories.</h1>
            <p>Get started entering your <Link to="family">family tree</Link>!</p>
        </div>;
    }
}

export class App extends Component {
    render() {
        return <div>
            {this.props.children}
        </div>;
    }
};
