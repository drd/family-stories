import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import smartify, {WorldAction, WorldState, LocalState} from 'smartify';

import Story from 'dealers/Story';
import TrixEditor from 'ui/TrixEditor';


@smartify
export default class StoryEditor extends Component {

    static propTypes = {
        familyStory: WorldState({
            type: React.PropTypes.string,
            resolver: (world, props) => Story.storyForPath(world, props.path)
        }),
        setStory: WorldAction(
            (world, props, story) => Story.setStoryForPath(world, props.path, story)
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
        return <div className="story-editor">
            <TrixEditor value={this.props.familyStory} onChange={this.storyChanged.bind(this)}/>
        </div>;
    }
}
