import { portfolioData } from '../../data/portfolio';

export const Skills = () => {
  const allSkills = portfolioData.skills.flat();

  return (
    <div className="terminal-skills">
      <p className="section-label">// Technical Skills</p>
      <br />
      <div className="skills-grid">
        {allSkills.map((skill) => (
          <span key={skill} className="skill-item">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};
