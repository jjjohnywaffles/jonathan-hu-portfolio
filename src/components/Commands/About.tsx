import { portfolioData } from '../../data/portfolio';

export const About = () => {
  return (
    <div className="text-text-primary">
      <p className="text-text-muted text-xs">// About Me</p>
      <br />
      <p className="text-text-primary leading-relaxed">{portfolioData.bio}</p>
      <br />
      <p className="text-text-secondary leading-relaxed">{portfolioData.description}</p>
      <br />
      <p className="text-text-muted text-xs">
        Type <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded">experience</span> to
        see my work history, or{' '}
        <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded">contact</span> to get in
        touch.
      </p>
    </div>
  );
};
