import { portfolioData } from '../../data/portfolio';
import { ASCII_ART } from './constants';

export const WelcomeMessage = () => {
  return (
    <div className="terminal-welcome">
      <pre className="ascii-art">{ASCII_ART}</pre>
      <br />
      <p className="welcome-title">Full-stack Software Engineer @Matrices</p>
      <p className="welcome-tagline">{portfolioData.tagline}</p>
      <br />
      <p className="welcome-hint">
        Type <span className="cmd-highlight">help</span> to see available commands.
      </p>
    </div>
  );
};
