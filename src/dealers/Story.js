const Story = {
    storyPath(path) {
        return [...path, 'Story'];
    },

    storyForPath(world, path) {
        return world.getIn(Story.storyPath(path));
    },

    setStoryForPath(world, path, story) {
        world.performAction({
            name: `SetStory[${path}]`,
            transaction: ws => ws.setIn(Story.storyPath(path), story)
        });
    }
};

export default Story;
