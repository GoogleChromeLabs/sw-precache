import React from 'react';

export default class GuidesWrapper extends React.Component {
  render() {
    let guide = this.props.guide;
    if (!guide) {
      return <h3>Loading...</h3>;
    }

    return (
      <div>
        <h1>{guide.get('title')}</h1>
        <h3>By {guide.get('author').get('username')} • Difficulty: {guide.get('difficulty')}</h3>
        <h4>Introduction</h4>
        <div dangerouslySetInnerHTML={{__html: guide.get('introduction_rendered')}}/>
        {guide.get('steps').map((step, stepCounter) => {
          return (
            <div>
              <h4>{step.get('title') || `Step ${stepCounter + 1}`}</h4>
              <ul>
                {step.get('lines').map((line, lineCounter) => {
                  return <li key={`${stepCounter}-${lineCounter}`}
                             className={`level-${line.get('level')} bullet-${line.get('bullet')}`}
                             dangerouslySetInnerHTML={{__html: line.get('text_rendered')}}/>;
                })}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }
}
