import React, { Component } from 'react';
import smartify, {WorldAction, WorldState, LocalState} from 'smartify';


@smartify
export default class ConfirmedAction extends Component {
    static propTypes = {
        onConfirm: React.PropTypes.func.isRequired,
        local: LocalState({
            attempted: React.PropTypes.bool
        })
    }

    onClick = () => {
        if (this.props.local.get('attempted')) {
            this.props.onConfirm();
        } else {
            this.props.local.set('attempted', true);
        }
    }

    render() {
        return <button onClick={this.onClick}>
            {this.props.local.get('attempted')
             ? 'Are you sure?'
             : this.props.children
            }
        </button>;
    }
}
