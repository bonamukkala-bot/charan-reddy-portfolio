export interface CreatorChannel {
  id: string;
  name: string;
  platform: 'Instagram' | 'YouTube' | 'LinkedIn';
  handle: string;
  url: string;
  description: string;
  buttonLabel: string;
}

export const creatorData = {
  headline: 'I teach what I build.',
  copy: 'I make tech content for student developers in India, in Telugu and English: real projects, honest lessons, no fluff.',
  subcopy:
    'Documenting the process of engineering generative AI applications, multi-agent frameworks, and building production software as a student in India.',
  languages: 'Telugu + English',
  audience: 'Student developers in India',
  platforms: 'Instagram + YouTube',
  channels: [
    {
      id: 'ig-main',
      name: 'Charan Insights',
      platform: 'Instagram',
      handle: '@charan.insights',
      url: 'https://www.instagram.com/charan.insights',
      description: 'Engineering mindset, tech perspectives, and student developer journey.',
      buttonLabel: 'Follow on Instagram',
    },
    {
      id: 'linkedin',
      name: 'Charan Bonamukkala',
      platform: 'LinkedIn',
      handle: 'in/bonamukkala-charan',
      url: 'https://www.linkedin.com/in/bonamukkala-charan',
      description: 'Professional profile, projects and experience.',
      buttonLabel: 'Connect on LinkedIn',
    },
    {
      id: 'yt-channel',
      name: 'Charan Reddy’s Insights',
      platform: 'YouTube',
      handle: '@charanreddysinsights',
      url: 'https://www.youtube.com/@charanreddysinsights',
      description: 'In-depth video tutorials, technical walkthroughs, and practical guides in Telugu & English.',
      buttonLabel: 'View YouTube Channel',
    },
  ] as CreatorChannel[],
};
