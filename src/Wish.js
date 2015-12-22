var Immutable = require('immutable');


function self() {
    return Wish;
}

var Wish = {
    // Please prefer the Look component and use this as a second resort
    look: function (wish, branches) {
        if (!(branches.Available && branches.Pending && branches.Error))
            throw new Error("Wish.look must be given all three of Available, Pending, and Error");
        return branches[wish.get('state')](wish.get('value'));
    },

    isValid(wishMap) {
        return ['Available', 'Error', 'Pending'].includes(wishMap.get('state'));
    },

    retriever: function (wish, blank) {
        return [
            self().look(wish, {
                Available: (v) => (key) => v.get(key),
                Error: (e) => (key) => blank.get(key),
                Pending: () => (key) => blank.get(key)
            }),
            wish.get('state') === 'Error'
        ];
    },

    Available: function (value) {
        return Immutable.Map({
            value: value,
            state: 'Available'
        });
    },

    Error: function (value) {
        return Immutable.Map({
            value: value,
            state: 'Error'
        });
    },

    Pending: function () {
        return Immutable.Map({
            state: 'Pending'
        });
    },

    /*
     * Wish.performOnce looks to see if a Wish already exists at a path
     * in the world, and if it does not exist, it will perform the action
     * in order to create it. However because actions are performed on a
     * separate tick, it is possible that an action not-yet-executed will
     * populate the same path in the world. Wish keeps track of all latent
     * wishes at each path in the world, and then after the World has batched
     * out all the actions, it empties the set tracked.
     */
    performOnce: function (world, path, action) {
        var existing = world.findExistingWish(path);
        if (existing) {
            return existing;
        } else {
            world.trackLatentPath(path);
            world.performAction(action);
            return self().Pending();
        }
    },

    // *** in service of Wish.performOnce()

    seq2: function(wish, wishFactory) {
        return self().look(wish, {
            Pending: () => self().Pending(),
            Error: (e) => self().Error(e),
            Available: (v) => wishFactory(v)
        });
    },

    seq: function(wish, ...listOfWishFactories) {
        return listOfWishFactories.reduce(self().seq2, wish);
    }
};


export default Wish;
