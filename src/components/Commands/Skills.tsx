import { portfolioData } from '../../data/portfolio';

export const Skills = () => {
  const allSkills = portfolioData.skills.flat();

  return (
    <div className="text-text-primary">
      <p className="text-text-muted text-xs">// Technical Skills</p>
      <br />
      <div className="flex flex-wrap gap-2 mt-2">
        {allSkills.map((skill) => (
          <span
            key={skill}
            className="text-accent-secondary bg-accent-secondary/10 px-3 py-1 rounded text-[13px] border border-accent-secondary/20"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};
