import { portfolioData } from '../../data/portfolio';
import { ASCII_ART } from './constants';

export const WelcomeMessage = () => {
  return (
    <div className="text-text-primary">
      <pre className="font-mono text-accent text-xs leading-tight m-0 whitespace-pre">
        {ASCII_ART}
      </pre>
      <br />
      <p className="text-accent mb-2">Full-stack Software Engineer @Matrices</p>
      <p className="text-text-secondary mb-2">{portfolioData.tagline}</p>
      <br />
      <p className="text-text-muted">
        Type <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded">help</span> to see
        available commands.
      </p>
    </div>
  );
};
