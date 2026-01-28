import { portfolioData } from '../../data/portfolio';

export const Contact = () => {
  return (
    <div className="terminal-contact">
      <p className="section-label">// Contact</p>
      <br />
      <div className="contact-entries">
        <div className="contact-entry">
          <span className="contact-label">Email</span>
          <a href={`mailto:${portfolioData.contact.email}`} className="contact-value">
            {portfolioData.contact.email}
          </a>
        </div>
        <div className="contact-entry">
          <span className="contact-label">Phone</span>
          <a href={`tel:${portfolioData.contact.phone}`} className="contact-value">
            {portfolioData.contact.phone}
          </a>
        </div>
        <div className="contact-entry">
          <span className="contact-label">Website</span>
          <a
            href={`https://${portfolioData.contact.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-value"
          >
            {portfolioData.contact.website}
          </a>
        </div>
      </div>
      <br />
      <p className="contact-hint">
        Type <span className="cmd-highlight">socials</span> to see my social profiles.
      </p>
    </div>
  );
};
