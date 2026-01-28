import { portfolioData } from '../../data/portfolio';

export const About = () => {
  return (
    <div className="terminal-about">
      <p className="section-label">// About Me</p>
      <br />
      <p className="about-bio">{portfolioData.bio}</p>
      <br />
      <p className="about-description">{portfolioData.description}</p>
      <br />
      <p className="about-hint">
        Type <span className="cmd-highlight">experience</span> to see my work history, or{' '}
        <span className="cmd-highlight">contact</span> to get in touch.
      </p>
    </div>
  );
};
