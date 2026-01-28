import type { PortfolioData } from '../types';

export const portfolioData: PortfolioData = {
  name: 'Jonathan Hu',
  tagline: 'CU Boulder Bachelors in Applied Computer Science • NYU Bachelors in Applied Psychology',
  bio: "I'm a Software Engineer at Matrices, focused on building reliable and performant web applications. I work across the stack with TypeScript and React (Next.js), PostgreSQL, and modern tooling, with a strong foundation in Python, SQL, C, and C++.",
  description:
    "I'm also passionate about data analytics and data science. Deriving insights from complex datasets, creating clear visualizations, and applying machine learning where it adds value. I enjoy solving complex problems end-to-end—from data modeling and APIs to front-end UX—while keeping solutions maintainable and user-focused. My background in Applied Computer Science and Psychology helps me bridge analytics and product engineering to deliver practical, thoughtful software.",

  contact: {
    phone: '916-960-3725',
    email: 'jonathan.q.hu@gmail.com',
    website: 'jjjohnywaffles.github.io',
  },

  education: [
    {
      id: 'cu-boulder',
      period: '2023 - 2024',
      degree: 'Bachelor of Applied Computer Science',
      school: 'University of Colorado Boulder',
      location: 'Boulder, Colorado',
      coursework:
        'Datamining, Data Structures, Computer Systems, Data Science Algorithms, Database Design, Discrete Structures, Algorithms, Information Visualization, Software Development, Principles of Programming',
    },
    {
      id: 'nyu',
      period: '2019 - 2022',
      degree: 'Bachelor of Applied Psychology',
      minor: 'Minor in Computer Science',
      school: 'New York University',
      location: 'New York City, New York',
      coursework:
        'Operating Systems, Computer Systems Orgs, Data Structures, Algorithms, Research Methods',
    },
    {
      id: 'highschool',
      period: '2014 - 2018',
      degree: 'High School Diploma',
      school: 'Miraloma High School',
      location: 'Carmichael, California',
      coursework: 'General Education',
    },
  ],

  skills: [
    ['TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js'],
    ['Zustand', 'Tailwind CSS', 'Drizzle ORM', 'Zod', 'PostgreSQL'],
    ['SQL', 'Python', 'MongoDB', 'Git', 'Tableau'],
  ],

  experience: [
    {
      id: 'matrices',
      period: '2025 - Present',
      title: 'Software Engineer',
      company: 'Matrices',
      location: 'San Francisco, CA',
      summary: 'Building RL solutions for AI Labs and Foundational Model Builders.',
      sections: [
        {
          header: 'Lead Full-stack Development',
          points: [
            'Solely designed and implemented a complete, production-grade reinforcement learning environment using Next.js, React, and TypeScript.',
            'Designed and implemented mock backend architecture using Zustand for state management, integrated with full platform infrastructure including session management, event logging, and JSON patch-based state tracking.',
            'Built comprehensive data generation system to seed realistic, diverse test scenarios.',
          ],
        },
        {
          header: 'Core Infrastructure Feature and Code Owner',
          points: [
            'Took ownership of an entire critical infrastructure feature used across all company products.',
            'Became the sole contributor responsible for the majority of implementations across the platform.',
            'Built complex state comparison logic using JSON diff algorithms and custom validation functions.',
            'Created reusable patterns and modular utilities adopted across all site implementations.',
            'Designed database schema and queries for efficient data retrieval and storage using PostgreSQL and Drizzle ORM.',
          ],
        },
        {
          header: 'Technical Project Manager',
          points: [
            'Managed multiple engineers through individual 1:1 meetings, providing technical guidance and mentorship.',
            'Guided engineers through their own product implementations and infrastructure integrations.',
            'Facilitated knowledge transfer of complex architectural patterns and best practices.',
          ],
        },
        {
          header: 'Key Achievements',
          points: [
            'End-to-end ownership from design through implementation.',
            'Infrastructure impact with reusable systems adopted platform-wide.',
            'Balanced full-stack development with engineering leadership.',
            'Built scalable systems for large-scale testing scenarios.',
          ],
        },
      ],
    },
    {
      id: 'acts',
      period: '2021 - 2023',
      title: 'Data Analyst',
      company: 'Advocacy and Community-Based Trauma Studies (ACTS) Lab',
      location: 'New York, NY',
      summary: 'Building data pipelines and ML tools for trauma research.',
      points: [
        'Developed Python scripts for advanced data preprocessing and applied statistical and machine learning techniques',
        'Collaborated with teams to analyze interview transcripts, uncovering key themes for trauma treatment strategies',
        'Designed Python-based tools to automate data recording, significantly boosting efficiency',
      ],
    },
    {
      id: 'lilo',
      period: '2021 - 2022',
      title: 'Data Analyst Intern',
      company: 'Lilo',
      location: 'New York, NY',
      summary: 'Driving product decisions through user analytics and visualization.',
      points: [
        'Designed programs for user base analysis, enhancing insights and operational efficiency',
        'Created dynamic visualizations in Python and Tableau, guiding executive decision-making',
        'Analyzed user trends and engagement metrics, improving user experience',
      ],
    },
    {
      id: 'pnda',
      period: '2020 - 2021',
      title: 'Graphic Designer and Social Media Manager',
      company: 'PNDA LahiArts',
      location: 'Sacramento, CA',
      summary: 'Creating visual content and campaigns for Asian arts awareness.',
      points: [
        'Designed graphics for social media campaigns, promoting events and Asian arts awareness',
        'Coordinated event planning and graphic design tasks with team members',
        'Improved brand visibility and streamlined communication processes',
      ],
    },
  ],

  portfolioProjects: [
    {
      id: 'data-analytics',
      title: 'Data Analytics',
      description: 'Data analysis functions and utilities',
      link: 'https://github.com/jjjohnywaffles/Data-Analysis-Functions',
      category: 'portfolio',
    },
    {
      id: 'database',
      title: 'Database Design',
      description: 'Database design projects',
      link: 'https://github.com/jjjohnywaffles/Database',
      category: 'portfolio',
    },
    {
      id: 'algorithms',
      title: 'Algorithms',
      description: 'Algorithm implementations',
      link: 'https://github.com/jjjohnywaffles/Algorithms',
      category: 'portfolio',
    },
    {
      id: 'software-dev',
      title: 'Software Development',
      description: 'Software development projects',
      link: 'https://github.com/KatieWoe/bbcourts',
      category: 'portfolio',
    },
    {
      id: 'app-dev',
      title: 'App Development',
      description: 'Mobile app development',
      link: 'https://github.com/jjjohnywaffles/FoodFinder',
      category: 'portfolio',
    },
  ],

  interactiveProjects: [
    {
      id: 'flappy-bird',
      title: 'Flappy Bird',
      description: 'Classic flappy bird game clone',
      link: 'https://jjjohnywaffles.github.io/interactive_projects/FlappyBird/flappybird.html',
      category: 'interactive',
    },
    {
      id: 'card-centering',
      title: 'Card Centering Calculator',
      description: 'Tool for calculating card centering grades',
      link: 'https://jjjohnywaffles.github.io/interactive_projects/CardCentering/cardcentering.html',
      category: 'interactive',
    },
  ],

  socialLinks: [
    {
      id: 'github',
      name: 'GitHub',
      url: 'https://github.com/jjjohnywaffles',
      icon: 'github',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/jonathan-q-hu/',
      icon: 'linkedin',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: 'https://www.youtube.com/@JohnyHV2',
      icon: 'youtube',
    },
    {
      id: 'handshake',
      name: 'Handshake',
      url: 'https://app.joinhandshake.com/profiles/46717508',
      icon: 'handshake',
    },
  ],
};
