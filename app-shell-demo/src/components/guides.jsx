import React from 'react';

class GuideItemWrapper extends React.Component {
  render() {
    return <li>{this.props.title}</li>;
  }
}

export default class Guides extends React.Component {
  render() {
    let guides = this.props.guides || [];
    console.log('guides', guides);

    return (
      <ul>
        {guides.map(guide => {
          console.log('guide', guide);
          return <GuideItemWrapper key={guide.guideid} title={guide.title}/>;
        })}
      </ul>
    );
  }
}
