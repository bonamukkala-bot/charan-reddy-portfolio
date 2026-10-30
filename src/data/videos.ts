export interface ShowcaseVideo {
  platform: 'youtube' | 'instagram';
  id: string;
  title: string;
  url: string;
}

export const showcaseVideos: ShowcaseVideo[] = [
  { platform: 'youtube', id: 'GWJK1inbQxk', title: 'Build Your Portfolio Website', url: 'https://youtu.be/GWJK1inbQxk' },
  { platform: 'instagram', id: 'DRwuY8zE2yj', title: '30 Days 30 AI Tools: Day 4', url: 'https://www.instagram.com/reel/DRwuY8zE2yj/' },
  { platform: 'instagram', id: 'DZ_tno9xUju', title: 'Client Project', url: 'https://www.instagram.com/reel/DZ_tno9xUju/' },
  { platform: 'instagram', id: 'DSpthswk5mu', title: 'Text to Cinematic Video with Telugu Heroes', url: 'https://www.instagram.com/reel/DSpthswk5mu/' },
  { platform: 'instagram', id: 'DYPQdKLo8ZV', title: 'IPL Win Predictor Project', url: 'https://www.instagram.com/reel/DYPQdKLo8ZV/' },
  { platform: 'instagram', id: 'Dbiv-y3z0JS', title: 'How to Get Your Website Indexed on Google', url: 'https://www.instagram.com/reel/Dbiv-y3z0JS/' },
];
