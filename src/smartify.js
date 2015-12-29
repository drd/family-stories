var Immutable = require('immutable');
var React = require('react');
import hoistStatics from 'hoist-non-react-statics';
import World, {Child as WorldChild} from 'World';


const indices = new WeakMap();

const smartify = function(Component, globalDescriptors = {}) {
    if (!Component.propTypes) {
        throw new Error(`Cannot smartify ${Component.displayName || '{unnamed component}'} without propTypes.`);
    }

    let worldResolvers = globalDescriptors.values = globalDescriptors.values || {};
    let worldActions = globalDescriptors.actions = globalDescriptors.actions || {};
    let localState;

    // Classic R.createClass, constructor, anonymous
    const ComponentName = Component.displayName || Component.name || 'Anonymous';

    Object.entries(Component.propTypes).forEach(([name, propType]) => {
        if (propType.__localState__) {
            localState = {name, propType};
        } else if (propType.__worldState__) {
            worldResolvers[name] = propType.resolver;
        } else if (propType.__worldAction__) {
            worldActions[name] = propType.action;
        }
    });

    const smarted = React.createClass({
        mixins: [WorldChild],

        displayName: `Smartified(${Component.displayName})`,

        contextTypes: {
            path: React.PropTypes.array,
            world: React.PropTypes.shape({
                setIn: React.PropTypes.func,
                getIn: React.PropTypes.func
            }),
            previousWorldState: React.PropTypes.object
        },

        childContextTypes: {
            path: React.PropTypes.array,
        },

        getChildContext() {
            return {
                path: this.localPrefix()
            };
        },

        updateLocalIn(updater) {
            return this.world().updateIn(this.localPath(), updater);
        },

        getLocal() {
            return this.getLocalIn([]);
        },

        setLocalIn(path, value) {
            this.world().setIn(
                [...this.localPath(), ...path],
                Immutable.fromJS(value)
            );
        },

        getLocalIn(path) {
            return this.world().getIn(this.localPath().concat(path));
        },

        updateIn(path, updater) {
            return this.world().updateIn(path, updater);
        },

        getIn(path) {
            return this.world().getIn(path);
        },

        _dataProps(world, props, resolvers) {
            return Object.entries(resolvers).reduce((accumulatedProps, [key, resolver]) => {
                // TODO: merge in local props too
                accumulatedProps[key] = resolver(world, this.localProps(props));
                return accumulatedProps;
            }, {});
        },

        _resolveGlobalProps(props, {values, actions} = {}) {
            const propsWithLocals = this.localProps(props);
            const worldStateProps = Object.entries(values || {}).reduce((accumulatedProps, [key, resolver]) => {
                accumulatedProps[key] = resolver(this.world(), propsWithLocals);
                return accumulatedProps;
            }, propsWithLocals);
            return Object.entries(actions || {}).reduce((accumulatedProps, [key, action]) => {
                accumulatedProps[key] = action.bind(null, this.world(), worldStateProps);
                return accumulatedProps;
            }, worldStateProps);
        },

        shouldComponentUpdate(nextProps) {
            // Check for changes in local state.
            var nextData = this.getLocal();
            var prevData = this.world().previousWorldState.getIn(this.localPath()) || Immutable.Map();

            if (!shallowEqual(this.props, nextProps) ||
                              !nextData.equals(prevData) ||
                              this.componentReceivedNewGlobal(nextProps)) {
                console.group('shouldComponentUpdate:', Component.displayName);
                console.log('shallowEqual', shallowEqual(this.props, nextProps));
                console.log('localData', nextData.equals(prevData));
                console.log('new globals', this.componentReceivedNewGlobal(nextProps));
                console.groupEnd('shouldComponentUpdate:', Component.displayName);
                return true;
            }
            return false;
        },

        componentWillMount() {
            this._index = indices.get(Component) || 0;
            indices.set(Component, this._index + 1);

            let initialLocalState;
            if (localState) {
                if (Component.getDefaultProps) {
                    initialLocalState = Component.getDefaultProps()[localState.name]
                } else if (Component.defaultProps) {
                    initialLocalState = Component.defaultProps[localState.name]
                }
            }
            initialLocalState = initialLocalState || {};

            this.populateLocalData(Immutable.fromJS(initialLocalState));
        },

        componentDidMount() {
            this.world().onActionPerformed(() => {
                if (this.componentReceivedNewGlobal(this.props)) {
                    this.forceUpdate();
                }
            });
        },

        componentReceivedNewGlobal(nextProps) {
            const globalValues = globalDescriptors.values || {};
            const nextDataProps = this._dataProps(this.world(), nextProps, globalValues);
            const previousWorld = new World(this.world().previousWorldState);
            previousWorld.stopPerformingActions();
            const prevDataProps = this._dataProps(previousWorld, this.props, globalValues);

            return !Immutable.is(Immutable.fromJS(nextDataProps), Immutable.fromJS(prevDataProps));
        },

        componentWillUnmount() {
            this.world().deleteIn(this.localPath());
        },

        localPath() {
            return this.localPrefix().concat('state');
        },

        localPrefix() {
            return (this.context.path || []).concat((Component.displayName || Component.name || '') + this._index);
        },

        populateLocalData(data) {
            this.world().setIn(this.localPath(), data);
        },

        localProps(givenProps) {
            // Replace localState prop with world-aware thingy
            const localProps = {};
            if (localState) {
                const getIn = (path) => this.getLocalIn(path);
                const setIn = (path, value) => {
                    const prev = this.getLocal();
                    this.setLocalIn(path, value);
                    if (!Immutable.is(prev, this.getLocal())) {
                        this.forceUpdate();
                    }
                };
                localProps[localState.name] = {
                    get: (key) => getIn([key]),
                    getIn,
                    set: (key, value) => setIn([key], value),
                    setIn
                };
            }
            return {...localProps, ...givenProps};
        },

        resolvedProps() {
            const localProps = this.localProps(this.props);
            const resolved = {
                ...this._resolveGlobalProps(localProps, globalDescriptors),
                ...localProps,
            };
            console.log('global', this._resolveGlobalProps(globalDescriptors));
            console.log('local', this.localProps(this.props));
            return resolved;
        },

        render() {
            this._renderCount = this._renderCount ? ++this._renderCount : 1;
            return <Component rc={this._renderCount} {...this.resolvedProps()}>
                {this.props.children}
            </Component>;
        }
    });
    smarted.Pure = Component;

    return hoistStatics(smarted, Component);
};

export default smartify;

export function LocalState(map) {
    validateLocalState.__localState__ = true;
    return validateLocalState;

    function validateLocalState(props, propName, componentName) {
        // TODO: Maybe check explicitly for get()/getIn()/set()/setIn() etc.
        var error = React.PropTypes.object.isRequired(props, propName, componentName);
        var localState = props[propName];
        return Object.entries(map).reduce(function(error, [key, type]) {
            if (!error) {
                return type(
                    { [key]: localState.get(key) }, // Only rely on localState.get() interface!
                    key,
                    componentName + '-LocalState'
                );
            }
            return error;
        }, error);
    }
};

export function WorldState({type, resolver}) {
    const derived = (...args) => type(...args);
    derived.resolver = resolver;
    derived.__worldState__ = true;
    return derived;
};

export function WorldAction(action) {
    isFunc.__worldAction__ = true;
    isFunc.action = action;
    return isFunc;

    function isFunc(...args) {
        return React.PropTypes.func(...args);
    }
};



function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }

  if (typeof objA !== 'object' || objA === null ||
      typeof objB !== 'object' || objB === null) {
    return false;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  var bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB);
  for (var i = 0; i < keysA.length; i++) {
    if (!bHasOwnProperty(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
      return false;
    }
  }

  return true;
}
