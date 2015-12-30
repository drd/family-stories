import Immutable from 'immutable';

import {numeric} from 'utils';


export const Gender = {
    male: 'Male',
    female: 'Female'
};


const People = global.People = {
    /*
     *  Where to find a person.
     */
    personPath(id, ...extra) {
        return ['Person', numeric(id).toString(), ...extra];
    },

    personExists(world, id) {
        return !!world.getIn(personPath(id));
    },

    nextPersonId(world) {
        return world.get('Person').size + 1;
    },

    lastPersonId(world) {
        return People.nextPersonId(world) - 1;
    },

    findMatching(world, query) {
        const re = new RegExp(`.*${query}.*`);
        const exact = new RegExp(`^{query}$`);
        const matches = [];
        let exactFound = false;

        world.get('Person').forEach((p, id) => {
            const name = People.personName(world, id);
            if (name.match(re)) {
                matches.push({
                    value: id,
                    label: name
                });

                if (name.match(exact)) {
                    exactFound = true;
                }
            }
        });

        if (!exactFound) {
            matches.push({
                label: query,
                value: undefined
            });
        }

        return matches;
    },

    _addPerson(ws, name, extra) {
        const nextId = People.nextPersonId(ws);
        return ws.setIn(
            People.personNamePath(nextId), name
        ).mergeDeepIn(
            People.personPath(nextId), extra
        );
    },

    /*
     *  Add a person with a name.
     */
    addPerson(world, name, extra) {
        if (!name) {
            console.warn("Attempted to add person without a name");
            return;
        }
        world.performAction({
            name: `AddPerson[${name}]`,
            transaction: ws => People._addPerson(ws, name, extra)
        });
    },

    personNamePath(personId) {
        return People.personPath(personId, 'Name');
    },

    personName(world, personId) {
        return world.getIn(People.personNamePath(personId));
    },

    setPersonName(world, personId, name) {
        world.performAction({
            name: `SetPersonName[${personId}:${name}]`,
            transaction: ws => ws.setIn(People.personNamePath(personId), name)
        });
    },

    personGenderPath(personId) {
        return People.personPath(personId, 'Gender');
    },

    personGender(world, personId) {
        return world.getIn(People.personGenderPath(personId));
    },

    setPersonGender(world, personId, gender) {
        world.performAction({
            name: `SetPersonGender[${personId}:${gender}]`,
            transaction: ws => ws.setIn(People.personGenderPath(personId), gender)
        });
    },

    _addRelationship(ws, type, from, to) {
        return ws.update('Relationships',
            relationships => relationships.push(Immutable.Map({
                type,
                from: numeric(from),
                to: numeric(to)
            }))
        );
    },

    parentPath(childId, gender) {
        return [...People.personPath(childId), gender === Gender.male
            ? 'Father'
            : 'Mother'];
    },

    _addParent(ws, childId, parentId, gender, name) {
        if (!parentId) {
            ws = People._addPerson(ws, name, {Gender: gender});
            parentId = People.lastPersonId(ws);
        }
        [childId, parentId] = [numeric(childId), numeric(parentId)];
        return ws.setIn(People.parentPath(childId, gender), parentId);
    },

    addMother(world, childId, {id: motherId, name}) {
        world.performAction({
            name: 'People/addMother',
            transaction: ws => People._addParent(ws, childId, motherId, Gender.female, name)
        });
    },

    addFather(world, childId, {id: fatherId, name}) {
        world.performAction({
            name: 'People/addFather',
            transaction: ws => People._addParent(ws, childId, fatherId, Gender.male, name)
        });
    },

    _addChild(ws, parentId, childId, name, gender) {
        if (!childId) {
            ws = People._addPerson(ws, name, {Gender: gender});
            childId = People.lastPersonId(ws);
        }
        [childId, parentId] = [numeric(childId), numeric(parentId)];
        return People._addParent(ws, childId, parentId, People.personGender(ws, parentId));
    },

    addDaughter(world, parentId, {id: daughterId, name}) {
        world.performAction({
            name: 'People/addDaughter',
            transaction: ws => People._addChild(ws, parentId, daughterId, name, Gender.female)
        });
    },

    addSon(world, parentId, {id: sonId, name}) {
        world.performAction({
            name: 'People/addSon',
            transaction: ws => People._addChild(ws, parentId, sonId, name, Gender.male)
        });
    },

    childrenOf(world, parentId) {
        parentId = numeric(parentId);
        return world.get('Person').reduce((children, p, id) => {
            if (p.get('Father') === parentId || p.get('Mother') === parentId) {
                return children.push(id);
            }
            return children;
        }, Immutable.List())
    },

    fatherOf(world, childId) {
        return world.getIn(People.parentPath(childId, Gender.male));
    },

    motherOf(world, childId) {
        return world.getIn(People.parentPath(childId, Gender.female));
    },

    parentOf(world, childId, gender) {
        return world.getIn(People.parentPath(childId, gender));
    },

    parentsOf(world, childId) {
        return Immutable.Map({
            Father: People.fatherOf(world, childId),
            Mother: People.motherOf(world, childId),
        });
    },

    relationshipsOfPerson(world, personId) {
        const parents = People.parentsOf(world, personId);

        return parents.mergeDeep({
            Children: People.childrenOf(world, personId)
        });
    },


    /*
     *  Given a person, a name, and a relationship, add a new person
     *  with the given name, related to the first with the given relationship.
     */
    addPersonAsRelationship(world, type, personId, name, id) {
        if (!(type && personId && name)) {
            console.warn(`addPersonAsRelationship: missing type (${type}), personId (${personId}), and/or name (${name}).`);
            return;
        }
        // ick?
        People[`add${type}`](world, personId, {name, id});
    },

    /*
     *  Goodbye, cruel world.
     */
    removePerson(world, personId) {
        world.performAction({
            name: `RemovePerson/${personId}`,
            transaction: ws => People._removePerson(ws, personId)
        });
    },

    _removePerson(ws, personId) {
        return ws
            .deleteIn(People.personPath(personId))
            .update('Person', Person => {
                return Person.map(p => {
                    if (p.get('Father') === personId) {
                        p = p.delete('Father')
                    } else if (p.get('Mother') === personId) {
                        p = p.delete('Mother')
                    }
                    return p;
                })
            });
    }
};

export default People;
