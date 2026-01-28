export interface Education {
  id: string;
  period: string;
  degree: string;
  minor?: string;
  school: string;
  location: string;
  coursework: string;
}

export interface ExperienceSection {
  header?: string;
  points: string[];
}

export interface Experience {
  id: string;
  period: string;
  title: string;
  company: string;
  location: string;
  summary?: string;
  sections?: ExperienceSection[];
  points?: string[]; // Keep for backward compatibility with simpler entries
}

export interface Project {
  id: string;
  title: string;
  description: string;
  link: string;
  category: 'portfolio' | 'interactive';
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  website: string;
}

export interface PortfolioData {
  name: string;
  tagline: string;
  bio: string;
  description: string;
  contact: ContactInfo;
  education: Education[];
  skills: string[][];
  experience: Experience[];
  portfolioProjects: Project[];
  interactiveProjects: Project[];
  socialLinks: SocialLink[];
}
