import React, { PropTypes } from 'react';

// There are 2 flows possible for updates:

// 1. regular user flow: User types stuff -> this.editor.value + trix-change -> this.props.onChange
// 2. forced flow (reset...): this.props.value -> this.editor.value (trix-change not triggered)
class TrixEditor extends React.Component {

  // 1. For the first flow we forward trix-change events to this.props.onChange
  componentDidMount() {
    this.editor = document.getElementById(`editor-${this._id}`);
    this._listener = this.trixChanged.bind(this);
    this.editor.addEventListener('trix-change', this._listener);
    this.editor.addEventListener('trix-initialize', this._listener);
  }

  trixChanged(nativeEvent) {
    if (!this.refs.input) {
      setTimeout(() => this.props.onChange(this.refs.input.value, nativeEvent), 0);
    } else {
      this.props.onChange(this.refs.input.value, nativeEvent);
    }
  }

  // 2. Value is not read after initialization (See https://github.com/spiffytech/trix/commit/0e19f2cadb5cd0092fe6b16c25919f0c4ae387de)
  // so for the second flow, we need to check that we are not at the end of the feedback loop
  // of the firt flow and update Trix' value
  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.editor.value) {
      this.editor.value = nextProps.value;
    }
  }

  // We don't need to update on this.props.value changes since Trix won't read it anyway.
  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    this.editor.removeEventListener('trix-change', this._listener);
    this.editor.removeEventListener('trix-initialize', this._listener);
  }

  _id = this._generateId()

  // I don't get it, I guess you took it from someone who did ;)
  _generateId() {
    let timestamp = Date.now();
    let uniqueNumber = 0;

    (() => {
      // If created at same millisecond as previous
      if (timestamp <= uniqueNumber) {
        timestamp = ++uniqueNumber;
      } else {
        uniqueNumber = timestamp;
      }
    })();

    return 'T' + timestamp;
  }

  render() {
    // http://stackoverflow.com/questions/25553910/one-liner-to-take-some-properties-from-object-in-es6
    const forwardedProps = ({ toolbar }) => ({ toolbar });
    return (
      <div>
        <trix-editor id={`editor-${this._id}`} input={`input-${this._id}`}/>
        <input type="hidden"
               ref="input"
               id={`input-${this._id}`}
               value={this.props.value}
               {...forwardedProps(this.props)}/>
      </div>
    );
  }
}

TrixEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  toolbar: PropTypes.object
};


export default TrixEditor;
