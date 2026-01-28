import { portfolioData } from '../../data/portfolio';

export const Education = () => {
  return (
    <div className="terminal-education">
      <p className="section-label">// Education</p>
      <br />
      {portfolioData.education.map((edu, index) => (
        <div key={edu.id} className="education-entry">
          <div className="edu-header">
            <span className="edu-degree">{edu.degree}</span>
            <span className="edu-period">{edu.period}</span>
          </div>
          {edu.minor && <p className="edu-minor">{edu.minor}</p>}
          <div className="edu-school">
            <span>{edu.school}</span>
            <span className="edu-location">{edu.location}</span>
          </div>
          <p className="edu-coursework">
            <span className="coursework-label">Coursework:</span> {edu.coursework}
          </p>
          {index < portfolioData.education.length - 1 && <div className="edu-divider" />}
        </div>
      ))}
    </div>
  );
};
