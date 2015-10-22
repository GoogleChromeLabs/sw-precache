import React from 'react';

export default class GuideWrapper extends React.Component {
  render() {
    let guide = this.props.guide;
    if (!guide) {
      return <h3>Loading...</h3>;
    }

    let optionalIntroduction = guide.get('introduction_rendered') ? (
      <div>
        <h3>Introduction</h3>
        <div dangerouslySetInnerHTML={{__html: guide.get('introduction_rendered')}}/>
      </div>) : '';

    let optionalConclusion = guide.get('conclusion_rendered') ? (
      <div>
        <h3>Conclusion</h3>
        <div dangerouslySetInnerHTML={{__html: guide.get('conclusion_rendered')}}/>
      </div>) : '';

    return (
      <div>
        <h1>{guide.get('title')}</h1>
        <h5>By {guide.get('author').get('username')} • Difficulty: {guide.get('difficulty')}</h5>
        {optionalIntroduction}
        {guide.get('steps').map((step, stepCounter) => {
          return (
            <div key={`div-${stepCounter}`}>
              <h3 key={`h3-${stepCounter}`}>{step.get('title') || `Step ${stepCounter + 1}`}</h3>
              {step.get('media').get('data').map((image, imageCounter) => {
                return (
                  <a key={`a-${imageCounter}`}
                     href={image.get('original')}>
                    <img key={`img-${imageCounter}`}
                         className="card"
                         src={image.get('standard')}/>
                  </a>
                );
              })}
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
