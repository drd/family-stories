"use strict";

var _ = require('underscore');
var Immutable = require('immutable');
var React = require('react');

import Wish from 'Wish';
var Logger = console;

const START_TIME = Date.now();

function World (initialWorld) {
    // Instead of WorldState owning a state and the whole WorldState being passed around, which opens
    // the possibility of outside mutation, we can create let the state contain references
    // to functions that close over the WorldState, then pass only the state around:
    this.worldState = this.previousWorldState = Immutable.fromJS(initialWorld || {});
    // Now only the top-level server and client entrypoints need mutable references to the whole
    // WorldState; everything else just has the immutable state, but they can still replace the worldState
    // using these functions.
    this.watchers = [];
    this._pendingActions = [];
    this.actionsEnabled = true;
    // Bind all methods to ourselves. This would be best done by a real object system.
    _.bindAll.apply(_, [this].concat(_.functions(this)));
    this._latentPaths = Immutable.Set();
};

// PUHLEEZE Don't do more of these ad-hoc. Let's find a general solution!
World.prototype.toJS = function() {
    return this.worldState.toJS();
};

World.prototype.getIn = function () {
    return this.worldState.getIn.apply(this.worldState, arguments);
};
World.prototype.get = function () {
    return this.worldState.get.apply(this.worldState, arguments);
};
World.prototype.setIn = function(path, value) {
    return mutateWorld(this, this.worldState.setIn(path, value));
};
World.prototype.updateIn = function(path, updater) {
    return mutateWorld(this, this.worldState.updateIn(path, updater));
};
World.prototype.deleteIn = function(path) {
    return mutateWorld(this, this.worldState.deleteIn(path));
};

function mutateWorld(world, nextState) {
    world.previousWorldState = world.worldState;
    world.worldState = nextState;
    return world;
}

// World.performAction does not immediately perform the action, but instead
// enqueues it to be performed on the next tick, allowing all updates to the
// global state tree to be atomic per render cycle.
// TODO: know if React is currently rendering. if so, performAction can be
// synchronous rather than deferred.
World.prototype.performAction = function performAction(action) {
    if (!action.name) throw new Error("Action has no name.");
    if (this.actionsEnabled) {
        this.enqueueAction(action);
    }
};

// ACHTUNG: this method is essentially a hack which allows us to synchronously
// update controlled form elements in response to a change event.
World.prototype.performActionSync = function performActionSync(action) {
    if (!action.name) throw new Error("Action has no name.");
    // this._pendingActions.forEach(this._reallyPerformAction);
    this._reallyPerformAction(action);
    this.watchers.forEach((watcher) => {
        return watcher.apply();
    });
};

World.prototype.enqueueAction = function enqueueAction(action) {
    this._pendingActions.push(action);
    if (!this.actionsScheduled()) {
        this.scheduleActions();
    }
};

World.prototype.scheduleActions = function() {
    setTimeout(() => {
        // Perform all the actions
        this._reallyPerformActions();
    }, 1);
    this._scheduled = true;
};

World.prototype.actionsScheduled = function actionsScheduled() {
    return this._scheduled;
};

World.prototype._reallyPerformActions = function() {
    this._pendingActions.forEach(this._reallyPerformAction);
    // Reset the queue
    this._pendingActions = [];
    this._scheduled = false;
    this.clearLatentPaths();
    this.watchers.forEach((watcher) => {
        return watcher.apply();
    });
};

var ActionHistoryEntry = {
    // Read action history entries like "entry[0] actions named entry[1] where the last
    // action happened at time entry[2]"
    create(name, count) {
        return Immutable.List([
            count,
            name,
            Date.now() - START_TIME
        ]);
    },
    bump(entry) {
        return ActionHistoryEntry.create(
            entry.get(1), // name
            entry.get(0) + 1 // count
        );
    }
};

World.prototype._reallyPerformAction = function (action) {
    Logger.group('Perform Action:' + action.name);
    if (action.effect) action.effect(this);
    if (action.transaction) {
        mutateWorld(this, action.transaction(this.worldState));
    }
    Logger.groupEnd('Perform Action:' + action.name);
};

// NOTE: this is only called once per batch of actions/per tick
World.prototype.onActionPerformed = function onActionPerformed(fn) {
    this.watchers.push(fn);
};

World.prototype.stopPerformingActions = function () {
    this.actionsEnabled = false;
};

World.prototype.clearLatentPaths = function() {
    this._latentPaths = Immutable.Set();
};

// return either an existing or latent (Pending) wish in the world at the given path
World.prototype.findExistingWish = function(path) {
    var wish = this.getIn(path);
    if (!wish) {
        wish = this.findLatentWish(path);
    }
    return wish;
};

// any path that is latent will return as Pending
World.prototype.findLatentWish = function(path) {
    return this._latentPaths.has(Immutable.List(path))
        ? Wish.Pending()
        // TODO: should this be a wish with a new state Nonexistent/Null/Undefined ?
        : undefined;
};

World.prototype.trackLatentPath = function(path) {
    this._latentPaths = this._latentPaths.add(Immutable.List(path));
};

World.prototype.pathAsPromise = function(path) {
    let getter = () => this.findExistingWish(path);
    return new Promise((resolve, reject) => {
        let wish = getter();
        switch (wish.get('state')) {
            case 'Available':
                resolve(wish.get('value'));
                break;
            case 'Pending':
                this.onActionPerformed(() => {
                    wish = getter();
                    if (wish.get('state') === 'Available') {
                        resolve(wish.get('value'));
                    } else if (wish.get('state') === 'Error') {
                        reject(wish.get('value'));
                    }
                });
                break;
            case 'Error':
                reject(wish.get('value'));
                break;
        }
    });
};


export const Child = {
    contextTypes: {
        IDO_i5_world_do_not_use_this: React.PropTypes.object.isRequired
    },

    world: function () {
        return this.context.IDO_i5_world_do_not_use_this;
    }
};


export const WorldRoot = React.createClass({
    propTypes: {
        world: React.PropTypes.object.isRequired,
        children: React.PropTypes.any.isRequired
    },

    // Legitimate use of IDO_i5_world_do_not_use_this 1/2? :
    // setting the context for everyone else to catch via Worldly
    childContextTypes: {
        IDO_i5_world_do_not_use_this: React.PropTypes.object.isRequired,
    },

    getChildContext() {
        return {
            IDO_i5_world_do_not_use_this: this.props.world
        };
    },

    render() {
        return React.Children.only(this.props.children);
    },
});

export default World;
