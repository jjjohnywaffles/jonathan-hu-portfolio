import { portfolioData } from '../../data/portfolio';

export const Projects = () => {
  return (
    <div className="terminal-projects">
      <p className="section-label">// Projects</p>
      <br />
      <p className="projects-category">Portfolio Projects</p>
      <div className="projects-list">
        {portfolioData.portfolioProjects.map((project) => (
          <div key={project.id} className="project-entry">
            <span className="project-title">{project.title}</span>
            <span className="project-desc">{project.description}</span>
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="project-link"
            >
              {project.link}
            </a>
          </div>
        ))}
      </div>
      <br />
      <p className="projects-category">Interactive Projects</p>
      <div className="projects-list">
        {portfolioData.interactiveProjects.map((project) => (
          <div key={project.id} className="project-entry">
            <span className="project-title">{project.title}</span>
            <span className="project-desc">{project.description}</span>
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="project-link"
            >
              {project.link}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
