import { portfolioData } from '../../data/portfolio';

export const Contact = () => {
  return (
    <div className="text-text-primary">
      <p className="text-text-muted text-xs">// Contact</p>
      <br />
      <div className="flex flex-col gap-2">
        <div className="flex gap-6">
          <span className="text-text-muted min-w-[80px]">Email</span>
          <a
            href={`mailto:${portfolioData.contact.email}`}
            className="text-accent-secondary no-underline hover:underline"
          >
            {portfolioData.contact.email}
          </a>
        </div>
        <div className="flex gap-6">
          <span className="text-text-muted min-w-[80px]">Phone</span>
          <a
            href={`tel:${portfolioData.contact.phone}`}
            className="text-accent-secondary no-underline hover:underline"
          >
            {portfolioData.contact.phone}
          </a>
        </div>
        <div className="flex gap-6">
          <span className="text-text-muted min-w-[80px]">Website</span>
          <a
            href={`https://${portfolioData.contact.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-secondary no-underline hover:underline"
          >
            {portfolioData.contact.website}
          </a>
        </div>
      </div>
      <br />
      <p className="text-text-muted text-xs">
        Type <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded">socials</span> to see
        my social profiles.
      </p>
    </div>
  );
};
