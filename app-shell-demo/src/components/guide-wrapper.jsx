import React from 'react';

export default class GuideWrapper extends React.Component {
  render() {
    let guide = this.props.guide;
    if (!guide) {
      return <h3>Loading...</h3>;
    }

    let optionalIntroduction = guide.get('introduction_rendered') ? (
      <section>
        <header>Introduction</header>
        <div dangerouslySetInnerHTML={{__html: guide.get('introduction_rendered')}}/>
      </section>) : '';

    let optionalConclusion = guide.get('conclusion_rendered') ? (
      <section>
        <header>Conclusion</header>
        <div dangerouslySetInnerHTML={{__html: guide.get('conclusion_rendered')}}/>
      </section>) : '';

    return (
      <div>
        <h1>{guide.get('title')}</h1>
        <h5>By {guide.get('author').get('username')} • Difficulty: {guide.get('difficulty')}</h5>
        {optionalIntroduction}
        {guide.get('steps').map((step, stepCounter) => {
          return (
            <section key={`section-${stepCounter}`}>
              <header key={`header-${stepCounter}`}>{step.get('title') || `Step ${stepCounter + 1}`}</header>
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
            </section>
          );
        })}
        {optionalConclusion}
      </div>
    );
  }
}
