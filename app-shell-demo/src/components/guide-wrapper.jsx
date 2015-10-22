import React from 'react';

export default class GuideWrapper extends React.Component {
  render() {
    let guide = this.props.guide;
    if (!guide) {
      return <h3>Loading...</h3>;
    }

    let optionalIntroduction = guide.get('introduction_rendered') ? (
      <div>
        <h4>Introduction</h4>
        <div dangerouslySetInnerHTML={{__html: guide.get('introduction_rendered')}}/>
      </div>) : '';

    let optionalConclusion = guide.get('conclusion_rendered') ? (
      <div>
        <h4>Conclusion</h4>
        <div dangerouslySetInnerHTML={{__html: guide.get('conclusion_rendered')}}/>
      </div>) : '';

    return (
      <div>
        <h1>{guide.get('title')}</h1>
        <h3>By {guide.get('author').get('username')} • Difficulty: {guide.get('difficulty')}</h3>
        {optionalIntroduction}
        {guide.get('steps').map((step, stepCounter) => {
          return (
            <div key={`div-${stepCounter}`}>
              <h4 key={`h4-${stepCounter}`}>{step.get('title') || `Step ${stepCounter + 1}`}</h4>
              <ul key={`ul-${stepCounter}`}>
                {step.get('lines').map((line, lineCounter) => {
                  return <li key={`li-${lineCounter}`}
                             className={`level-${line.get('level')} bullet-${line.get('bullet')}`}
                             dangerouslySetInnerHTML={{__html: line.get('text_rendered')}}/>;
                })}
              </ul>
            </div>
          );
        })}
        {optionalConclusion}
      </div>
    );
  }
}
