import React, { Component } from 'react';
import Select from 'react-select';
import smartify, {WorldAction, WorldState, LocalState} from 'smartify';


@smartify
export default class PersonFinder extends Component {
    static propTypes = {
        matchingPeople: WorldAction(
            (world, props, query) => People.findMatching(world, query)
        ),
        local: LocalState({
            query: React.PropTypes.string,
            selected: React.PropTypes.object,
        })
    }

    static defaultProps = {
        local: {
            query: '',
            selected: {}
        }
    }

    choosePerson(selection) {
        if (selection === null) {
            selection = {};
        }
        this.props.local.set('selected', selection);
        this.props.onChange(selection);
    }

    loadOptions(input, callback) {
        this.props.local.set('query', input);
        callback(null, {options: this.props.matchingPeople(input)});
    }

    render() {
        return <Select.Async loadOptions={this.loadOptions.bind(this)}
                             clearable
                             ignoreCase={false}
                             value={this.props.local.get('selected').toJS()}
                             onChange={this.choosePerson.bind(this)}/>;
    }


}
