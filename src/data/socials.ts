export interface SocialLink {
  name: string;
  url: string;
  handle: string;
  description?: string;
  isPrimary?: boolean;
}

export const socialLinks: SocialLink[] = [
  {
    name: 'GitHub',
    url: 'https://github.com/bonamukkala-bot',
    handle: '@bonamukkala-bot',
    description: 'Repositories, agents, and source code',
    isPrimary: true,
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/bonamukkala-charan',
    handle: 'bonamukkala-charan',
    description: 'Professional updates and engineering network',
    isPrimary: true,
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/charan.insights',
    handle: '@charan.insights',
    description: 'Tech perspectives and development journey',
    isPrimary: true,
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@charanreddysinsights',
    handle: '@charanreddysinsights',
    description: 'Telugu & English coding tutorials and insights',
    isPrimary: true,
  },
];
