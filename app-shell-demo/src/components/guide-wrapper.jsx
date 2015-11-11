import React from 'react';
import {Link} from 'react-router';

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
        <div id="title-bar">
          <Link to="/" title="Back to Guides">
            <img id="back-arrow" src="/images/ic_arrow_back_white_24dp_2x.png"/>
          </Link>
          {guide.get('title')}
        </div>
        <h5 className="attribution">By {guide.get('author').get('username')} • Difficulty: {guide.get('difficulty')}</h5>
        {optionalIntroduction}
        {guide.get('steps').map((step, stepCounter) => {
          return (
            <section key={`section-${stepCounter}`}>
              <header key={`header-${stepCounter}`}>{step.get('title') || `Step ${stepCounter + 1}`}</header>
              {step.get('media').get('data').map((image, imageCounter) => {
                if (image && image.get && image.get('standard')) {
                  return (
                    <a key={`a-${imageCounter}`}
                       href={image.get('original')}>
                      <img key={`img-${imageCounter}`}
                           className="card"
                           src={image.get('standard')}/>
                    </a>
                  );
                }
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
