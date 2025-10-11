/**
 * Seed data for "Shirley Lenore Thomas" - Example tribute page content
 * Use this to populate demo pages or as placeholder content templates
 */

export const shirleySeedData = {
  person: {
    given_name: "Shirley",
    middle_names: ["Lenore"],
    surname: "Thomas",
    birth_date: "1928-01-01",
    death_date: "2014-12-31",
    birth_place: "Melbourne, Australia",
    profile_image_url: null,
  },

  bio: {
    short_bio: "Shirley Lenore Thomas (1928–2014) was a warm, quick-witted Melbourne matriarch who loved dark chocolate, family card nights, and keeping everyone fed. She worked hard, laughed easily, and stitched together a home that many called their second.",
    long_bio: `Shirley Lenore Thomas was born in Melbourne in 1928, the youngest of three daughters. She grew up during the Depression, learning early the value of resourcefulness and community.

She married young and raised four children while working part-time at the local library. Her home was always open—there was always room for one more at the table, and the kettle was always on.

Shirley had a sharp wit and a generous heart. She loved a good card game, never said no to dark chocolate, and kept the family calendar running like clockwork. Her grandchildren remember her Sunday roasts, her terrible jokes, and the way she made everyone feel like they belonged.

She passed away peacefully in 2014, surrounded by family, leaving behind a legacy of warmth, laughter, and love.`,
    tone: "warm",
    sources: [],
  },

  blockHeaders: {
    bio_overview: "About Shirley",
    quick_facts: "Highlights",
    timeline: "Life Timeline",
    stories_feed: "Stories from Family & Friends",
    audio_memories: "Audio Remembrances",
    photo_gallery: "Photo Albums",
    people_web: "Relationships",
    guestbook_tribute: "Guestbook",
    service_events: "Service & Events",
  },

  guestbookPrompt: "Share a memory of Shirley—one moment, one laugh, one lesson.",

  quickFacts: [
    { label: "Born", value: "Melbourne, 1928" },
    { label: "Favorite Things", value: "Dark chocolate, card games, family gatherings" },
    { label: "Known For", value: "Warm hospitality, quick wit, Sunday roasts" },
    { label: "Legacy", value: "A home that many called their second" },
  ],

  timelineEvents: [
    {
      year: "1928",
      title: "Born in Melbourne",
      description: "Youngest of three daughters, grew up during the Depression",
    },
    {
      year: "1947",
      title: "Started at the Library",
      description: "Began working part-time at the local library",
    },
    {
      year: "1950s",
      title: "Raised Four Children",
      description: "Built a home filled with warmth, laughter, and open doors",
    },
    {
      year: "2014",
      title: "Passed Peacefully",
      description: "Surrounded by family, leaving behind a legacy of love",
    },
  ],

  sampleStories: [
    {
      title: "Sunday Roast Tradition",
      content: "Every Sunday without fail, Shirley would have the whole family over for a roast. The smell of lamb and rosemary would fill the house, and there was always room for unexpected guests. 'The more the merrier,' she'd say, somehow stretching the meal to feed whoever showed up.",
      author_name: "Emma (Granddaughter)",
    },
    {
      title: "The Card Game Champion",
      content: "Nan was ruthless at cards. She'd sit there with that innocent smile, then suddenly play the perfect hand and laugh at our shocked faces. 'Never underestimate an old lady,' she'd say with a wink.",
      author_name: "Michael (Grandson)",
    },
    {
      title: "Always a Cup of Tea Ready",
      content: "I don't think I ever visited Shirley when the kettle wasn't on. Within minutes of arriving, you'd have a cup of tea in your hands and she'd be asking about your life, really listening. She had this gift for making you feel like you were the most important person in the world.",
      author_name: "Patricia (Neighbor)",
    },
  ],

  sampleGuestbookEntries: [
    {
      content: "Shirley taught me that the best gift you can give someone is your time and attention. I'll never forget her kindness.",
      visitor_name: "David Chen",
    },
    {
      content: "The world is a little less bright without Shirley's laugh. She had a way of finding joy in the smallest things.",
      visitor_name: "Margaret Williams",
    },
    {
      content: "One moment I'll always remember: Shirley dancing in the kitchen while making Christmas pudding, flour everywhere, completely in her element. That was her—finding joy in everything she did.",
      visitor_name: "Sarah Thompson",
    },
  ],
} as const;

export type ShirleySeedData = typeof shirleySeedData;
