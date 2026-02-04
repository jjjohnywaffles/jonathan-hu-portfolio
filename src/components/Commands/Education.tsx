import { portfolioData } from '../../data/portfolio';

export const Education = () => {
  return (
    <div className="text-text-primary">
      <p className="text-text-muted text-xs">// Education</p>
      <br />
      <div className="flex flex-col gap-6">
        {portfolioData.education.map((edu) => (
          <div key={edu.id} className="pb-6 border-b border-border last:border-b-0 last:pb-0">
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
          </div>
        ))}
      </div>
    </div>
  );
};
