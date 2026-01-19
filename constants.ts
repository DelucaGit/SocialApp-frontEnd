import { User, Post, Comment } from './types';

export const MOCK_USERS: Record<string, User> = {
  'u1': {
    id: 'u1',
    username: 'tech_guru',
    displayName: 'Tech Guru',
    avatar: 'https://picsum.photos/seed/u1/150/150',
    bio: 'Obsessed with the latest gadgets and AI breakthroughs. Building the future.',
    friends: ['u2', 'u3'],
  },
  'u2': {
    id: 'u2',
    username: 'travel_junkie',
    displayName: 'Wanderlust',
    avatar: 'https://picsum.photos/seed/u2/150/150',
    bio: 'Traveling the world one city at a time. Currently in Tokyo.',
    friends: ['u1'],
  },
  'u3': {
    id: 'u3',
    username: 'meme_lord',
    displayName: 'The Jokester',
    avatar: 'https://picsum.photos/seed/u3/150/150',
    bio: 'Here for the laughs. 🐸☕',
    friends: [],
  },
  'curr': {
    id: 'curr',
    username: 'current_user',
    displayName: 'You',
    avatar: 'https://picsum.photos/seed/curr/150/150',
    bio: 'Just a regular user exploring the app.',
    friends: ['u1'],
  }
};

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: 'u1',
    title: 'The future of AI is closer than we think',
    content: 'Just read an interesting paper on AGI development. The pace of innovation is accelerating exponentially.',
    commentCount: 89,
    timestamp: '5 hours ago'
  },
  {
    id: 'p2',
    authorId: 'u2',
    title: 'Sunset in Santorini 🌅',
    content: 'One of the most beautiful views I have ever seen. Highly recommend visiting off-season.',
    commentCount: 42,
    timestamp: '8 hours ago'
  },
  {
    id: 'p3',
    authorId: 'u3',
    title: 'My cat trying to catch the laser pointer',
    content: 'He never learns...',
    commentCount: 512,
    timestamp: '1 day ago'
  },
  {
    id: 'p4',
    authorId: 'u1',
    title: 'Tailwind vs Styled Components?',
    content: 'Starting a new project and wondering what the community preference is in 2024. I like the utility-first approach of Tailwind.',
    commentCount: 156,
    timestamp: '2 days ago'
  },
  {
    id: 'p5',
    authorId: 'u2',
    title: 'Homemade Ramen 🍜',
    content: 'Took me 12 hours to make the broth but totally worth it.',
    commentCount: 204,
    timestamp: '2 days ago'
  }
];

export const MOCK_COMMENTS: Comment[] = [
    {
        id: 'c1',
        postId: 'p1',
        authorId: 'u2',
        content: 'I agree! The speed of new models coming out is insane.',
        timestamp: '4 hours ago',
        replies: [
            {
                id: 'c1-1',
                postId: 'p1',
                authorId: 'u3',
                content: 'But what about the safety concerns?',
                timestamp: '3 hours ago',
                replies: [
                     {
                        id: 'c1-1-1',
                        postId: 'p1',
                        authorId: 'u1',
                        content: 'Alignment is definitely the biggest challenge right now.',
                        timestamp: '2 hours ago',
                        replies: []
                    }
                ]
            }
        ]
    },
    {
        id: 'c2',
        postId: 'p1',
        authorId: 'u3',
        content: 'Can it generate memes though?',
        timestamp: '4 hours ago',
        replies: []
    },
    {
        id: 'c3',
        postId: 'p2',
        authorId: 'u1',
        content: 'Added to my bucket list! 😍',
        timestamp: '7 hours ago',
        replies: []
    }
];