import { portfolioData } from '../../data/portfolio';

export const Projects = () => {
  return (
    <div className="text-text-primary">
      <p className="text-text-muted text-xs">// Projects</p>
      <br />
      <p className="text-accent font-semibold mb-3">Portfolio Projects</p>
      <div className="flex flex-col gap-3 pl-4">
        {portfolioData.portfolioProjects.map((project) => (
          <div key={project.id} className="flex flex-col gap-1">
            <span className="text-text-primary font-medium">{project.title}</span>
            <span className="text-text-muted text-xs">{project.description}</span>
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-secondary text-xs no-underline hover:underline break-all"
            >
              {project.link}
            </a>
          </div>
        ))}
      </div>
      <br />
      <p className="text-accent font-semibold mb-3">Interactive Projects</p>
      <div className="flex flex-col gap-3 pl-4">
        {portfolioData.interactiveProjects.map((project) => (
          <div key={project.id} className="flex flex-col gap-1">
            <span className="text-text-primary font-medium">{project.title}</span>
            <span className="text-text-muted text-xs">{project.description}</span>
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-secondary text-xs no-underline hover:underline break-all"
            >
              {project.link}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
