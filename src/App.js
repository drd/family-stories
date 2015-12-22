import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router'

import TrixEditor from 'TrixEditor';

import smartify, {WorldAction, WorldState} from 'smartify';

@smartify
export class Story extends Component {

    static propTypes = {
        familyStory: WorldState({
            type: React.PropTypes.string,
            resolver: (w, p) => w.getIn([...p.path, 'Story'])
        }),
        setStory: WorldAction(
            (w, p, s) => w.performAction({
                name: 'Family/setStory',
                transaction: ws => ws.setIn([...p.path, 'Story'], s)
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
            resolver: (w, p) => w.getIn(['Person'])
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
            <ul>{this.props.people.map((p, id) =>
                <li><Link to={`person/${id}`}>{p.get('Name')}</Link></li>
            )}</ul>
            <p><Link to={`person/${this.nextPersonId()}`}>Add new Family member</Link></p>
            <p><Link to="/">home</Link></p>
        </div>;
    }
}

@smartify
export class Person extends Component {
    static propTypes = {
        name: WorldState({
            type: React.PropTypes.string,
            resolver: (w, p) => console.log(p) || w.getIn(['Person', p.params.personId, 'Name'])
        }),
        setName: WorldAction(
            (w, p, n) => w.performAction({
                name: 'Person/setName',
                transaction: ws => ws.setIn(['Person', p.params.personId, 'Name'], n)
            })
        )
    }

    render() {
        return <div>
            <h1>Family Member: {this.props.name}</h1>
            <input value={this.props.name} onChange={e => this.props.setName(e.target.value)}/>
            <Story path={['Person', this.props.params.personId]}/>
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
