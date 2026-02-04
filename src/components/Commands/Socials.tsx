import { portfolioData } from '../../data/portfolio';

export const Socials = () => {
  return (
    <div className="text-text-primary">
      <p className="text-text-muted text-xs">// Social Links</p>
      <br />
      <div className="flex flex-col gap-2">
        {portfolioData.socialLinks.map((social) => (
          <div key={social.id} className="flex gap-6">
            <span className="text-text-secondary min-w-[100px]">{social.name}</span>
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-secondary no-underline hover:underline break-all"
            >
              {social.url}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
