export const GAME_CATALOG = [
  {
    id: 'rov_cat',
    slug: 'rov',
    name: 'ROV',
    serviceCode: 'rov',
    image: 'https://img.rdcw.co.th/images/62ad809c841b6894ceee914b827c29ab2dc67a719fea1fd6daa0ac14da6bc42e.png',
    accent: 'text-green-700',
  },
  {
    id: 'freefire_cat',
    slug: 'freefire',
    name: 'Free Fire',
    serviceCode: 'freefire',
    image: 'https://placehold.co/320x320/fef08a/2563eb?text=Free+Fire',
  },
  {
    id: 'undawn_cat',
    slug: 'undawn',
    name: 'Undawn',
    serviceCode: 'undawn',
    image: 'https://placehold.co/320x320/fed7aa/2563eb?text=Undawn',
  },
  {
    id: 'codm_cat',
    slug: 'call-of-duty-mobile',
    name: 'Call of Duty mobile',
    serviceCode: '',
    image: 'https://placehold.co/320x320/bae6fd/2563eb?text=Call+of+Duty',
  },
  {
    id: 'deltaforce_cat',
    slug: 'delta-force',
    name: 'Delta Force',
    serviceCode: '',
    image: 'https://placehold.co/320x320/cbd5e1/2563eb?text=Delta+Force',
  },
  {
    id: 'haikyu_cat',
    slug: 'haikyu-fly-high',
    name: 'Haikyu Fly High',
    serviceCode: '',
    image: 'https://placehold.co/320x320/fed7aa/2563eb?text=Haikyu',
  },
  {
    id: 'pubg_cat',
    slug: 'pubg-mobile',
    name: 'PubG Mobile',
    serviceCode: '',
    image: 'https://placehold.co/320x320/dbeafe/2563eb?text=PUBG+Mobile',
  },
  {
    id: 'mlbb_cat',
    slug: 'mobile-legends',
    name: 'Mobile Legends',
    serviceCode: '',
    image: 'https://placehold.co/320x320/fecaca/2563eb?text=Mobile+Legends',
  },
  {
    id: 'valorant_cat',
    slug: 'valorant',
    name: 'Valorant',
    serviceCode: '',
    image: 'https://placehold.co/320x320/f8fafc/f43f5e?text=VALORANT',
  },
  {
    id: 'heartopia_cat',
    slug: 'heartopia',
    name: 'Heartopia',
    serviceCode: '',
    image: 'https://placehold.co/320x320/fce7f3/2563eb?text=Heartopia',
  },
];

export function findGameBySlug(slug) {
  return GAME_CATALOG.find((game) => game.slug === slug);
}
