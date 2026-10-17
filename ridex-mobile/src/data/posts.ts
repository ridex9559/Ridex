import { Post, RiderGroup, Story } from '../types/community';

export const mockStories: Story[] = [
  {
    id: 'st-1',
    userName: 'Elena Rostova',
    authorName: 'Elena Rostova',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    hasUnseen: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'st-2',
    userName: 'Marcus Vance',
    authorName: 'Marcus Vance',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    hasUnseen: true,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'st-3',
    userName: 'Kenji Sato',
    authorName: 'Kenji Sato',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    hasUnseen: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'st-4',
    userName: 'Chloe Bennett',
    authorName: 'Chloe Bennett',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=800&auto=format&fit=crop&q=80',
    hasUnseen: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

export const mockPosts: Post[] = [
  {
    id: 'p-1',
    authorId: 'usr-2',
    userName: 'Elena Rostova',
    authorName: 'Elena Rostova',
    authorRole: 'Master Tourer',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    motorcycleName: 'BMW S1000RR',
    motorcycleModel: 'BMW S1000RR',
    images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    content: 'Crisp alpine morning run up Furka Pass. Zero traffic, fresh asphalt on the western switchbacks. 51° lean angle registered on hairpins 12-16!',
    caption: 'Crisp alpine morning run up Furka Pass. Zero traffic, fresh asphalt on the western switchbacks.',
    likesCount: 148,
    isLiked: false,
    commentsCount: 22,
    ride: {
      title: 'Furka Pass High Speed Ascent',
      distanceKm: 84.5,
      maxSpeedKmh: 194,
      maxLeanAngleDegrees: 51,
    },
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'p-2',
    authorId: 'usr-3',
    userName: 'Marcus Vance',
    authorName: 'Marcus Vance',
    authorRole: 'Trail Leader',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    motorcycleName: 'KTM 890 Adventure R',
    motorcycleModel: 'KTM 890 Adventure R',
    images: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    content: 'Black Forest B500 twilight run with the midnight crew. Smooth sweeping corners and cool mist across the valley.',
    caption: 'Black Forest B500 twilight run with the midnight crew.',
    likesCount: 96,
    isLiked: true,
    commentsCount: 14,
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
];

export const mockGroups: RiderGroup[] = [
  {
    id: 'grp-1',
    name: 'Alpine Twisties & Passes Squad',
    membersCount: 1420,
    region: 'Alps / Switzerland & Italy',
    badge: 'PRO CLUB',
    description: 'Weekly weekend blasts across Stelvio, Grossglockner & Furka Pass. Fast-paced, high lean angle tours.',
  },
  {
    id: 'grp-2',
    name: 'Ducati Superquadro Syndicate',
    membersCount: 840,
    region: 'Europe Wide',
    badge: 'MARQUE',
    description: 'Dedicated to Panigale, Streetfighter & Multistrada V4 riders. Trackdays and canyon tours.',
  },
];

export const MOCK_POSTS = mockPosts;
export const MOCK_STORIES = mockStories;
export const MOCK_GROUPS = mockGroups;
