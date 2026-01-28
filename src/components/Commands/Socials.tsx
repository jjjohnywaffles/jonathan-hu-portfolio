import { portfolioData } from '../../data/portfolio';

export const Socials = () => {
  return (
    <div className="terminal-socials">
      <p className="section-label">// Social Links</p>
      <br />
      <div className="socials-list">
        {portfolioData.socialLinks.map((social) => (
          <div key={social.id} className="social-entry">
            <span className="social-name">{social.name}</span>
            <a href={social.url} target="_blank" rel="noopener noreferrer" className="social-link">
              {social.url}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
