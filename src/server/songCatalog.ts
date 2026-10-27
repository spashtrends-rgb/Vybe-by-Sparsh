export interface PlatformUrls {
  spotifySearchUrl: string;
  youtubeMusicSearchUrl: string;
  lyricsSearchUrl: string;
  instagramSearchQuery: string;
  fallbackLyricsUrl: string;
}

export function buildPlatformUrls(title: string, artist: string): PlatformUrls {
  const query = encodeURIComponent(`${title} ${artist}`);
  const lyricsQuery = encodeURIComponent(`${title} ${artist} official lyrics`);
  return {
    spotifySearchUrl: `https://open.spotify.com/search/${query}`,
    youtubeMusicSearchUrl: `https://music.youtube.com/search?q=${query}`,
    lyricsSearchUrl: `https://genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`,
    instagramSearchQuery: `${title} - ${artist}`,
    fallbackLyricsUrl: `https://www.google.com/search?q=${lyricsQuery}`,
  };
}

export interface CuratedSongItem {
  id: string;
  title: string;
  artist: string;
  language: string;
  genre: string;
  releaseYear: number;
  moodTags: string[];
  styleTags: string[];
  energy: string;
  isInstrumental?: boolean;
  musicalMomentNote: string;
}

export interface SongCandidate {
  id: string;
  title: string;
  artist: string;
  language: string;
  genre: string;
  releaseYear?: number;
  moodTags: string[];
  styleTags: string[];
  energy: string;
  isInstrumental?: boolean;
  musicalMomentNote?: string;
  artworkUrl?: string;
  previewUrl?: string | null;
  appleMusicUrl?: string;
  spotifySearchUrl: string;
  youtubeMusicSearchUrl: string;
  lyricsSearchUrl: string;
  instagramSearchQuery: string;
  source: 'curated_catalog' | 'itunes_verified';
}

const RAW_CURATED_CATALOG: CuratedSongItem[] = [
  {
    id: "cat-hi-heeriye",
    title: "Heeriye",
    artist: "Jasleen Royal, Arijit Singh",
    language: "Hindi",
    genre: "Dreamy Romantic Pop",
    releaseYear: 2023,
    moodTags: ["romantic_love", "aesthetic_dreamy", "flirty_charming"],
    styleTags: ["bollywood_hits", "romantic_melodies", "trending_ig"],
    energy: "medium",
    musicalMomentNote: "Warm acoustic chorus hook with airy harmonies ideal for golden-hour or soft portrait reveals."
  },
  {
    id: "cat-hi-kesariya",
    title: "Kesariya",
    artist: "Pritam, Arijit Singh, Amitabh Bhattacharya",
    language: "Hindi",
    genre: "Modern Bollywood Romance",
    releaseYear: 2022,
    moodTags: ["romantic_love", "happy_carefree", "aesthetic_dreamy"],
    styleTags: ["bollywood_hits", "romantic_melodies", "trending_ig"],
    energy: "medium",
    musicalMomentNote: "Soaring melodic refrain that pairs naturally with warm sunlight, festive colors, and couple frames."
  },
  {
    id: "cat-hi-gul",
    title: "Gul",
    artist: "Anuv Jain",
    language: "Hindi",
    genre: "Indie Acoustic Folk",
    releaseYear: 2021,
    moodTags: ["peaceful_healing", "sad_emotional", "nostalgic", "aesthetic_dreamy"],
    styleTags: ["indie_music", "underrated_gems", "lofi_slowed"],
    energy: "soft",
    musicalMomentNote: "Intimate fingerpicked guitar build that complements quiet window light, rain, and reflective moments."
  },
  {
    id: "cat-hi-alag-aasmaan",
    title: "Alag Aasmaan",
    artist: "Anuv Jain",
    language: "Hindi",
    genre: "Indie Singer-Songwriter",
    releaseYear: 2020,
    moodTags: ["nostalgic", "sad_emotional", "travel_freedom", "peaceful_healing"],
    styleTags: ["indie_music", "romantic_melodies"],
    energy: "soft",
    musicalMomentNote: "Gentle ukulele-driven melody suited for sky shots, train windows, and bittersweet farewells."
  },
  {
    id: "cat-hi-kasoor",
    title: "Kasoor",
    artist: "Prateek Kuhad",
    language: "Hindi",
    genre: "Indie Pop",
    releaseYear: 2020,
    moodTags: ["romantic_love", "flirty_charming", "happy_carefree", "aesthetic_dreamy"],
    styleTags: ["indie_music", "romantic_melodies"],
    energy: "soft",
    musicalMomentNote: "Warm, conversational acoustic groove perfect for candid smiles, coffee dates, and cozy indoor snaps."
  },
  {
    id: "cat-hi-kho-gaye",
    title: "Kho Gaye Hum Kahan",
    artist: "Jasleen Royal, Prateek Kuhad",
    language: "Hindi",
    genre: "Dreamy Indie Soundtrack",
    releaseYear: 2016,
    moodTags: ["nostalgic", "aesthetic_dreamy", "peaceful_healing", "romantic_love"],
    styleTags: ["bollywood_hits", "indie_music", "lofi_slowed"],
    energy: "soft",
    musicalMomentNote: "Hazy nocturnal piano and vocal duet tailored for late-night drives, city lights, and throwback memories."
  },
  {
    id: "cat-hi-tum-se-hi",
    title: "Tum Se Hi",
    artist: "Pritam, Mohit Chauhan",
    language: "Hindi",
    genre: "Classic Bollywood Romance",
    releaseYear: 2007,
    moodTags: ["romantic_love", "nostalgic", "happy_carefree"],
    styleTags: ["classic_songs", "bollywood_hits", "romantic_melodies"],
    energy: "medium",
    musicalMomentNote: "Timeless flute intro and heartfelt vocals that elevate monsoon scenes and classic romantic portraits."
  },
  {
    id: "cat-hi-safar",
    title: "Ilahi",
    artist: "Pritam, Arijit Singh",
    language: "Hindi",
    genre: "Travel Uplifting Pop-Rock",
    releaseYear: 2013,
    moodTags: ["travel_freedom", "happy_carefree", "attitude_confidence"],
    styleTags: ["bollywood_hits", "classic_songs", "trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Driving acoustic-rock rhythm built for mountain roads, airport departures, and wide scenic horizons."
  },
  {
    id: "cat-hi-apna-bana-le",
    title: "Apna Bana Le",
    artist: "Sachin-Jigar, Arijit Singh",
    language: "Hindi",
    genre: "Soulful Romantic Ballad",
    releaseYear: 2022,
    moodTags: ["romantic_love", "sad_emotional", "peaceful_healing"],
    styleTags: ["bollywood_hits", "romantic_melodies", "trending_ig"],
    energy: "soft",
    musicalMomentNote: "Tender orchestral swell that brings emotional warmth to close-up portraits and dusk landscapes."
  },
  {
    id: "cat-hi-kala-chashma",
    title: "Tauba Tauba",
    artist: "Karan Aujla",
    language: "Punjabi",
    genre: "Modern Punjabi Dance Pop",
    releaseYear: 2024,
    moodTags: ["party_hype", "attitude_confidence", "flirty_charming", "happy_carefree"],
    styleTags: ["trending_ig", "bollywood_hits"],
    energy: "energetic",
    musicalMomentNote: "Crisp percussive groove and swaggering hook designed for sharp outfits, night-out stories, and mirror selfies."
  },
  {
    id: "cat-en-midnight-city",
    title: "Midnight City",
    artist: "M83",
    language: "English",
    genre: "Synthwave / Electronic Indie",
    releaseYear: 2011,
    moodTags: ["nostalgic", "travel_freedom", "mysterious_dark", "party_hype"],
    styleTags: ["international_hits", "indie_music", "classic_songs"],
    energy: "energetic",
    musicalMomentNote: "Iconic neon synth lead that transforms city skylines, night highways, and rooftop views into cinema."
  },
  {
    id: "cat-en-sunsetz",
    title: "Sunsetz",
    artist: "Cigarettes After Sex",
    language: "English",
    genre: "Ambient Dream Pop",
    releaseYear: 2017,
    moodTags: ["aesthetic_dreamy", "mysterious_dark", "romantic_love", "nostalgic"],
    styleTags: ["indie_music", "lofi_slowed", "trending_ig"],
    energy: "soft",
    musicalMomentNote: "Reverb-drenched guitar shimmer ideal for moody silhouettes, twilight skies, and black-and-white frames."
  },
  {
    id: "cat-en-golden-hour",
    title: "golden hour",
    artist: "JVKE",
    language: "English",
    genre: "Cinematic Piano Pop",
    releaseYear: 2022,
    moodTags: ["aesthetic_dreamy", "romantic_love", "peaceful_healing"],
    styleTags: ["international_hits", "trending_ig", "romantic_melodies"],
    energy: "medium",
    musicalMomentNote: "Cascading piano arpeggios that bloom right as sunlit clouds, ocean horizons, or radiant portraits appear."
  },
  {
    id: "cat-en-birds-of-a-feather",
    title: "BIRDS OF A FEATHER",
    artist: "Billie Eilish",
    language: "English",
    genre: "Alt-Pop",
    releaseYear: 2024,
    moodTags: ["romantic_love", "happy_carefree", "nostalgic", "aesthetic_dreamy"],
    styleTags: ["international_hits", "trending_ig"],
    energy: "medium",
    musicalMomentNote: "Breezy, sunlit rhythm paired with deeply affectionate vocals—effortless for everyday memories and friendships."
  },
  {
    id: "cat-en-espresso",
    title: "Espresso",
    artist: "Sabrina Carpenter",
    language: "English",
    genre: "Nu-Disco Pop",
    releaseYear: 2024,
    moodTags: ["flirty_charming", "attitude_confidence", "happy_carefree", "party_hype"],
    styleTags: ["international_hits", "trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Playful funk bassline with confident charm made for vacation snaps, cafe fits, and sunny selfies."
  },
  {
    id: "cat-en-starboy",
    title: "Starboy",
    artist: "The Weeknd, Daft Punk",
    language: "English",
    genre: "Dark Electro-R&B",
    releaseYear: 2016,
    moodTags: ["attitude_confidence", "mysterious_dark", "party_hype"],
    styleTags: ["international_hits", "trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Sleek robotic pulse and dark luxury atmosphere that sharpens monochrome outfits, cars, and urban architecture."
  },
  {
    id: "cat-en-after-dark",
    title: "After Dark",
    artist: "Mr.Kitty",
    language: "English",
    genre: "Dark Synthpop",
    releaseYear: 2014,
    moodTags: ["mysterious_dark", "aesthetic_dreamy", "nostalgic"],
    styleTags: ["underrated_gems", "lofi_slowed", "trending_ig"],
    energy: "medium",
    musicalMomentNote: "Hypnotic late-night synth progression crafted for rain-slicked streets, neon reflections, and nocturnal moods."
  },
  {
    id: "cat-en-sweater-weather",
    title: "Sweater Weather",
    artist: "The Neighbourhood",
    language: "English",
    genre: "Alternative Indie",
    releaseYear: 2013,
    moodTags: ["aesthetic_dreamy", "flirty_charming", "nostalgic", "mysterious_dark"],
    styleTags: ["indie_music", "international_hits", "classic_songs"],
    energy: "medium",
    musicalMomentNote: "Cool, laid-back indie groove suited for autumn layers, overcast beaches, and effortlessly stylish frames."
  },
  {
    id: "cat-en-night-changes",
    title: "Night Changes",
    artist: "One Direction",
    language: "English",
    genre: "Soft Pop Ballad",
    releaseYear: 2014,
    moodTags: ["nostalgic", "romantic_love", "sad_emotional"],
    styleTags: ["international_hits", "classic_songs", "romantic_melodies"],
    energy: "soft",
    musicalMomentNote: "Warm nostalgic chorus that turns graduation photos, old camera-roll throwbacks, and evening walks into keepsakes."
  },
  {
    id: "cat-en-glimpse-of-us",
    title: "Glimpse of Us",
    artist: "Joji",
    language: "English",
    genre: "Melancholic Piano Ballad",
    releaseYear: 2022,
    moodTags: ["sad_emotional", "nostalgic"],
    styleTags: ["international_hits", "lofi_slowed"],
    energy: "soft",
    musicalMomentNote: "Sparse, aching piano chords for quiet solitude, dim bedrooms, and deeply emotional storytelling."
  },
  {
    id: "cat-en-sunset-lover",
    title: "Sunset Lover",
    artist: "Petit Biscuit",
    language: "English",
    genre: "Chillwave / Ambient Electronic",
    releaseYear: 2015,
    moodTags: ["travel_freedom", "peaceful_healing", "aesthetic_dreamy", "happy_carefree"],
    styleTags: ["indie_music", "lofi_slowed", "trending_ig"],
    energy: "medium",
    isInstrumental: true,
    musicalMomentNote: "Sun-drenched plucked guitar and vocal chops with minimal lyrics—lets coastal views and travel visuals breathe."
  },
  {
    id: "cat-en-snowfall",
    title: "snowfall",
    artist: "Øneheart, reidenshi",
    language: "English",
    genre: "Ambient Lo-Fi Instrumental",
    releaseYear: 2022,
    moodTags: ["peaceful_healing", "sad_emotional", "mysterious_dark", "aesthetic_dreamy"],
    styleTags: ["lofi_slowed", "underrated_gems", "trending_ig"],
    energy: "soft",
    isInstrumental: true,
    musicalMomentNote: "Pure atmospheric ambient pad texture with zero lyrical distraction, wrapping misty or nocturnal photos in calm."
  },
  {
    id: "cat-pa-softly",
    title: "Softly",
    artist: "Karan Aujla, Ikky",
    language: "Punjabi",
    genre: "Smooth Punjabi Pop-R&B",
    releaseYear: 2023,
    moodTags: ["flirty_charming", "attitude_confidence", "romantic_love"],
    styleTags: ["trending_ig", "international_hits"],
    energy: "medium",
    musicalMomentNote: "Silky bassline and effortless bounce ideal for sharp fits, golden-hour portraits, and subtle flex stories."
  },
  {
    id: "cat-pa-hass-hass",
    title: "Hass Hass",
    artist: "Diljit Dosanjh, Sia, Greg Kurstin",
    language: "Punjabi",
    genre: "Global Pop Fusion",
    releaseYear: 2023,
    moodTags: ["happy_carefree", "flirty_charming", "romantic_love", "party_hype"],
    styleTags: ["trending_ig", "international_hits"],
    energy: "energetic",
    musicalMomentNote: "Bright, infectious upbeat groove that brings instant warmth to group photos, celebrations, and travel reels."
  },
  {
    id: "cat-pa-with-you",
    title: "With You",
    artist: "AP Dhillon",
    language: "Punjabi",
    genre: "Synth-R&B Punjabi Pop",
    releaseYear: 2023,
    moodTags: ["romantic_love", "aesthetic_dreamy", "travel_freedom"],
    styleTags: ["trending_ig", "romantic_melodies", "indie_music"],
    energy: "medium",
    musicalMomentNote: "Lush retro-synth atmosphere tailored for rainy drives, scenic getaways, and understated romance."
  },
  {
    id: "cat-pa-lover",
    title: "Lover",
    artist: "Diljit Dosanjh",
    language: "Punjabi",
    genre: "Modern Punjabi Pop",
    releaseYear: 2021,
    moodTags: ["attitude_confidence", "flirty_charming", "party_hype"],
    styleTags: ["trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Polished synth-bass drop that elevates evening outfits, rooftop lounges, and confident portraits."
  },
  {
    id: "cat-pa-qismat",
    title: "Qismat",
    artist: "Ammy Virk, B Praak, Jaani",
    language: "Punjabi",
    genre: "Emotional Punjabi Ballad",
    releaseYear: 2017,
    moodTags: ["sad_emotional", "nostalgic"],
    styleTags: ["classic_songs", "romantic_melodies"],
    energy: "soft",
    musicalMomentNote: "Deeply expressive vocal melody suited for heartfelt longing and dramatic monochrome frames."
  },
  {
    id: "cat-ta-vaseegara",
    title: "Vaseegara",
    artist: "Bombay Jayashri, Harris Jayaraj",
    language: "Tamil",
    genre: "Classic Tamil Melody",
    releaseYear: 2001,
    moodTags: ["romantic_love", "aesthetic_dreamy", "nostalgic", "peaceful_healing"],
    styleTags: ["classic_songs", "romantic_melodies"],
    energy: "soft",
    musicalMomentNote: "Velvety acoustic guitar intro and timeless carnatic-pop phrasing perfect for graceful saree portraits and soft light."
  },
  {
    id: "cat-ta-katchi-sera",
    title: "Katchi Sera",
    artist: "Sai Abhyankkar",
    language: "Tamil",
    genre: "Tamil Indie Pop Fusion",
    releaseYear: 2024,
    moodTags: ["flirty_charming", "happy_carefree", "romantic_love", "party_hype"],
    styleTags: ["trending_ig", "indie_music"],
    energy: "energetic",
    musicalMomentNote: "Vibrant rhythmic percussive hook that lights up festive wear, candid smiles, and lively Story transitions."
  },
  {
    id: "cat-ta-munbe-vaa",
    title: "Munbe Vaa",
    artist: "Shreya Ghoshal, Naresh Iyer, A.R. Rahman",
    language: "Tamil",
    genre: "Orchestral Romantic Melody",
    releaseYear: 2006,
    moodTags: ["romantic_love", "peaceful_healing", "nostalgic"],
    styleTags: ["classic_songs", "romantic_melodies"],
    energy: "soft",
    musicalMomentNote: "Ethereal vocal opening that brings serene elegance to twilight skies and intimate portraits."
  },
  {
    id: "cat-ta-hukum",
    title: "Hukum - Thalaivar Alappara",
    artist: "Anirudh Ravichander",
    language: "Tamil",
    genre: "High-Octane Action Score",
    releaseYear: 2023,
    moodTags: ["attitude_confidence", "party_hype", "mysterious_dark"],
    styleTags: ["trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Commanding brass and heavy percussion crafted for bold silhouettes, sunglasses, and unapologetic attitude."
  },
  {
    id: "cat-te-samajavaragamana",
    title: "Samajavaragamana",
    artist: "Sid Sriram, Thaman S",
    language: "Telugu",
    genre: "Contemporary Telugu Melody",
    releaseYear: 2019,
    moodTags: ["romantic_love", "flirty_charming", "aesthetic_dreamy"],
    styleTags: ["romantic_melodies", "trending_ig"],
    energy: "medium",
    musicalMomentNote: "Fluid classical-inflected vocal run over crisp modern beats—effortless for stylish portraits and warm lighting."
  },
  {
    id: "cat-te-inkem-inkem",
    title: "Inkem Inkem Inkem Kaavaale",
    artist: "Sid Sriram, Gopi Sundar",
    language: "Telugu",
    genre: "Acoustic Romantic Melody",
    releaseYear: 2018,
    moodTags: ["romantic_love", "peaceful_healing", "flirty_charming"],
    styleTags: ["romantic_melodies", "classic_songs"],
    energy: "soft",
    musicalMomentNote: "Gentle breezy arrangement that flatters sunlit outdoor moments, traditional attire, and warm smiles."
  },
  {
    id: "cat-te-oo-antava",
    title: "Kurchi Madathapetti",
    artist: "Thaman S, Sri Krishna, Sahithi Chaganti",
    language: "Telugu",
    genre: "High-Energy Mass Beats",
    releaseYear: 2024,
    moodTags: ["party_hype", "attitude_confidence", "happy_carefree"],
    styleTags: ["trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Explosive folk-percussion energy for celebration stories, group outings, and high-impact frames."
  },
  {
    id: "cat-ml-malare",
    title: "Malare",
    artist: "Vijay Yesudas, Rajesh Murugesan",
    language: "Malayalam",
    genre: "Soulful Malayalam Melody",
    releaseYear: 2015,
    moodTags: ["nostalgic", "romantic_love", "peaceful_healing", "aesthetic_dreamy"],
    styleTags: ["classic_songs", "romantic_melodies"],
    energy: "soft",
    musicalMomentNote: "Warm violin and tender vocal phrasing ideal for lush greenery, misty hills, campus memories, and rain."
  },
  {
    id: "cat-ml-darshana",
    title: "Darshana",
    artist: "Hesham Abdul Wahab, Darshana Rajendran",
    language: "Malayalam",
    genre: "Acoustic Indie Film Melody",
    releaseYear: 2021,
    moodTags: ["romantic_love", "nostalgic", "aesthetic_dreamy"],
    styleTags: ["trending_ig", "romantic_melodies", "indie_music"],
    energy: "soft",
    musicalMomentNote: "Heartfelt acoustic crescendo that pairs beautifully with natural unposed portraits and nostalgic warmth."
  },
  {
    id: "cat-ml-illuminati",
    title: "Illuminati",
    artist: "Sushin Shyam, Dabzee",
    language: "Malayalam",
    genre: "Electro-Rap Anthem",
    releaseYear: 2024,
    moodTags: ["party_hype", "attitude_confidence", "happy_carefree"],
    styleTags: ["trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Propulsive synth bass and swaggering vocal delivery made for night outs, road trips, and bold group shots."
  },
  {
    id: "cat-bn-amake-amar-moto",
    title: "Amake Amar Moto Thakte Dao",
    artist: "Anupam Roy",
    language: "Bengali",
    genre: "Bengali Indie Rock Ballad",
    releaseYear: 2010,
    moodTags: ["sad_emotional", "nostalgic", "peaceful_healing", "mysterious_dark"],
    styleTags: ["classic_songs", "indie_music"],
    energy: "soft",
    musicalMomentNote: "Poetic, introspective melody that resonates with solitary cafe tables, rainy windows, and quiet dusk."
  },
  {
    id: "cat-bn-tomake-chai",
    title: "Tomake Chai",
    artist: "Arijit Singh, Indraadip Dasgupta",
    language: "Bengali",
    genre: "Romantic Bengali Ballad",
    releaseYear: 2017,
    moodTags: ["romantic_love", "sad_emotional", "aesthetic_dreamy"],
    styleTags: ["romantic_melodies", "classic_songs"],
    energy: "soft",
    musicalMomentNote: "Sweeping emotional chorus suited for warm golden light, riverfronts, and tender close-ups."
  },
  {
    id: "cat-bn-boba-tunnel",
    title: "Boba Tunnel",
    artist: "Anupam Roy",
    language: "Bengali",
    genre: "Atmospheric Bengali Alternative",
    releaseYear: 2012,
    moodTags: ["mysterious_dark", "nostalgic", "aesthetic_dreamy"],
    styleTags: ["underrated_gems", "indie_music"],
    energy: "soft",
    musicalMomentNote: "Haunting acoustic atmosphere crafted for moody monochrome photography and contemplative evening scenes."
  },
  {
    id: "cat-mr-kadhi-tu",
    title: "Kadhi Tu",
    artist: "Hrishikesh Ranade, Vishwajeet Joshi",
    language: "Marathi",
    genre: "Breezy Marathi Romantic Pop",
    releaseYear: 2013,
    moodTags: ["romantic_love", "peaceful_healing", "nostalgic", "aesthetic_dreamy"],
    styleTags: ["romantic_melodies", "classic_songs", "underrated_gems"],
    energy: "soft",
    musicalMomentNote: "Fresh monsoon-breeze acoustic texture ideal for rainy balconies, greenery, and soft candid smiles."
  },
  {
    id: "cat-mr-sairat-zaala-ji",
    title: "Sairat Zaala Ji",
    artist: "Ajay-Atul, Chinmayi Sripada, Ajay Gogavale",
    language: "Marathi",
    genre: "Cinematic Symphonic Romance",
    releaseYear: 2016,
    moodTags: ["romantic_love", "aesthetic_dreamy", "travel_freedom"],
    styleTags: ["classic_songs", "romantic_melodies"],
    energy: "medium",
    musicalMomentNote: "Grand orchestral strings recorded in Hollywood—turns wide landscapes and dramatic sunsets into epic cinema."
  },
  {
    id: "cat-mr-zingaat",
    title: "Zingaat",
    artist: "Ajay-Atul",
    language: "Marathi",
    genre: "Festive High-Energy Folk Dance",
    releaseYear: 2016,
    moodTags: ["party_hype", "happy_carefree"],
    styleTags: ["classic_songs", "trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Unstoppable celebratory brass and rhythm section built for joyous group moments and festive celebrations."
  },
  {
    id: "cat-bh-kamariya-kare-lapalap",
    title: "Lollipop Lagelu",
    artist: "Pawan Singh",
    language: "Bhojpuri",
    genre: "Bhojpuri Dance Anthem",
    releaseYear: 2008,
    moodTags: ["party_hype", "happy_carefree", "attitude_confidence"],
    styleTags: ["classic_songs", "trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Iconic upbeat celebratory synth hook for lively parties, playful friend-group selfies, and fun hype moments."
  },
  {
    id: "cat-bh-rinkiya-ke-papa",
    title: "Rinkiya Ke Papa",
    artist: "Manoj Tiwari",
    language: "Bhojpuri",
    genre: "Playful Bhojpuri Folk-Pop",
    releaseYear: 2009,
    moodTags: ["happy_carefree", "party_hype", "flirty_charming"],
    styleTags: ["classic_songs"],
    energy: "energetic",
    musicalMomentNote: "Cheerful rhythmic groove suited for light-hearted, humorous, and carefree everyday stories."
  },
  {
    id: "cat-hr-52-gaj",
    title: "52 Gaj Ka Daman",
    artist: "Renuka Panwar, Aman Jaji",
    language: "Haryanvi",
    genre: "Modern Haryanvi Folk-Pop",
    releaseYear: 2020,
    moodTags: ["attitude_confidence", "party_hype", "happy_carefree", "flirty_charming"],
    styleTags: ["trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Crisp folk-beat swagger perfect for traditional outfits, wedding festivities, and bold confident poses."
  },
  {
    id: "cat-hr-gypsy",
    title: "Gypsy",
    artist: "GD Kaur",
    language: "Haryanvi",
    genre: "Upbeat Haryanvi Pop",
    releaseYear: 2022,
    moodTags: ["flirty_charming", "happy_carefree", "attitude_confidence"],
    styleTags: ["trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Catchy rhythmic bounce that complements vibrant ethnic fashion and cheerful mirror selfies."
  },
  {
    id: "cat-hr-rao-sahab",
    title: "Systumm",
    artist: "DG Immortals",
    language: "Haryanvi",
    genre: "Haryanvi Hip-Hop",
    releaseYear: 2023,
    moodTags: ["attitude_confidence", "party_hype"],
    styleTags: ["trending_ig"],
    energy: "energetic",
    musicalMomentNote: "Heavy bassline and bold attitude built for road-presence SUV shots, gym fits, and confident street visuals."
  }
];

export const CURATED_SONG_CATALOG: SongCandidate[] = RAW_CURATED_CATALOG.map((item) => {
  const urls = buildPlatformUrls(item.title, item.artist);
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    language: item.language,
    genre: item.genre,
    releaseYear: item.releaseYear,
    moodTags: item.moodTags,
    styleTags: item.styleTags,
    energy: item.energy,
    isInstrumental: item.isInstrumental,
    musicalMomentNote: item.musicalMomentNote,
    spotifySearchUrl: urls.spotifySearchUrl,
    youtubeMusicSearchUrl: urls.youtubeMusicSearchUrl,
    lyricsSearchUrl: urls.lyricsSearchUrl,
    instagramSearchQuery: urls.instagramSearchQuery,
    source: 'curated_catalog',
  };
});

const itunesCache = new Map<string, { timestamp: number; results: any[] }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export async function searchITunesTracks(query: string, limit = 8): Promise<any[]> {
  const cacheKey = `${query.toLowerCase().trim()}::${limit}`;
  const cached = itunesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.results;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3200);

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    itunesCache.set(cacheKey, { timestamp: Date.now(), results });
    return results;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function enrichCandidateWithITunes(candidate: SongCandidate): Promise<SongCandidate> {
  const matches = await searchITunesTracks(`${candidate.title} ${candidate.artist}`, 3);
  if (!matches.length) return candidate;

  const normalizedTitle = candidate.title.toLowerCase();
  const best =
    matches.find((m: any) => m.trackName?.toLowerCase().includes(normalizedTitle)) || matches[0];
  if (!best) return candidate;

  const highResArt = best.artworkUrl100
    ? best.artworkUrl100.replace("100x100bb", "600x600bb")
    : undefined;
  const year = best.releaseDate ? new Date(best.releaseDate).getFullYear() : candidate.releaseYear;

  return {
    ...candidate,
    artworkUrl: highResArt || candidate.artworkUrl,
    previewUrl: best.previewUrl || candidate.previewUrl,
    appleMusicUrl: best.trackViewUrl || candidate.appleMusicUrl,
    releaseYear: Number.isFinite(year) ? year : candidate.releaseYear,
    source: "itunes_verified",
  };
}

export function mapITunesTrackToCandidate(
  track: any,
  inferredLanguage: string,
  targetMood: string
): SongCandidate {
  const urls = buildPlatformUrls(track.trackName, track.artistName);
  const highResArt = track.artworkUrl100
    ? track.artworkUrl100.replace("100x100bb", "600x600bb")
    : undefined;
  const year = track.releaseDate ? new Date(track.releaseDate).getFullYear() : undefined;

  return {
    id: `itunes-${track.trackId}`,
    title: track.trackName,
    artist: track.artistName,
    language: inferredLanguage,
    genre: track.primaryGenreName || "Contemporary Music",
    releaseYear: Number.isFinite(year) ? year : undefined,
    moodTags: [targetMood],
    styleTags: ["any_style"],
    energy: "medium",
    artworkUrl: highResArt,
    previewUrl: track.previewUrl,
    appleMusicUrl: track.trackViewUrl,
    spotifySearchUrl: urls.spotifySearchUrl,
    youtubeMusicSearchUrl: urls.youtubeMusicSearchUrl,
    lyricsSearchUrl: urls.lyricsSearchUrl,
    instagramSearchQuery: urls.instagramSearchQuery,
    source: "itunes_verified",
  };
}
