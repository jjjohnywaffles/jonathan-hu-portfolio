import { portfolioData } from '../../data/portfolio';

export const Education = () => {
  return (
    <div className="text-text-primary">
      <p className="text-text-muted text-xs">// Education</p>
      <br />
      {portfolioData.education.map((edu, index) => (
        <div key={edu.id} className="mb-6 last:mb-0">
          <div className="flex justify-between items-baseline gap-4 flex-wrap">
            <span className="text-accent font-semibold">{edu.degree}</span>
            <span className="text-text-muted text-xs">{edu.period}</span>
          </div>
          {edu.minor && <p className="text-accent-secondary text-[13px] mt-1">{edu.minor}</p>}
          <div className="flex justify-between items-baseline gap-4 mt-1 flex-wrap">
            <span className="text-text-secondary">{edu.school}</span>
            <span className="text-text-muted text-xs">{edu.location}</span>
          </div>
          <p className="text-text-muted text-xs mt-3 leading-relaxed">
            <span className="text-text-secondary">Coursework:</span> {edu.coursework}
          </p>
          {index < portfolioData.education.length - 1 && <div className="h-px bg-border my-6" />}
        </div>
      ))}
    </div>
  );
};
