export interface BrandConfig {
  appName: string;
  tagline: string;
  corePromise: string;
}

export const BRAND_CONFIG: BrandConfig = {
  appName: "vybe by sparsh",
  tagline: "Every picture has a vibe. Find its song.",
  corePromise: "Your photo. Your mood. The perfect song.",
};

export type MoodId =
  | 'romantic_love'
  | 'sad_emotional'
  | 'aesthetic_dreamy'
  | 'attitude_confidence'
  | 'mysterious_dark'
  | 'happy_carefree'
  | 'peaceful_healing'
  | 'nostalgic'
  | 'travel_freedom'
  | 'party_hype'
  | 'flirty_charming'
  | 'ai_decide';

export interface MoodOption {
  id: MoodId;
  label: string;
  description: string;
  iconName: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'romantic_love',
    label: 'Romantic Love',
    description: 'Soft, intimate, love-filled songs.',
    iconName: 'Heart',
  },
  {
    id: 'sad_emotional',
    label: 'Sad & Emotional',
    description: 'Heartbreak, longing, and emotional depth.',
    iconName: 'CloudRain',
  },
  {
    id: 'aesthetic_dreamy',
    label: 'Aesthetic & Dreamy',
    description: 'Atmospheric, soft, visually pleasing music.',
    iconName: 'Sparkles',
  },
  {
    id: 'attitude_confidence',
    label: 'Attitude & Confidence',
    description: 'Bold, stylish, confident energy.',
    iconName: 'Flame',
  },
  {
    id: 'mysterious_dark',
    label: 'Mysterious & Dark',
    description: 'Moody, cinematic, mysterious sounds.',
    iconName: 'Moon',
  },
  {
    id: 'happy_carefree',
    label: 'Happy & Carefree',
    description: 'Cheerful, playful, feel-good music.',
    iconName: 'Sun',
  },
  {
    id: 'peaceful_healing',
    label: 'Peaceful & Healing',
    description: 'Calm, soothing, relaxing music.',
    iconName: 'Feather',
  },
  {
    id: 'nostalgic',
    label: 'Nostalgic',
    description: 'Memories, old times, and bittersweet feelings.',
    iconName: 'Clock',
  },
  {
    id: 'travel_freedom',
    label: 'Travel & Freedom',
    description: 'Adventure, sunsets, and open-road energy.',
    iconName: 'Compass',
  },
  {
    id: 'party_hype',
    label: 'Party & Hype',
    description: 'High-energy, upbeat tracks.',
    iconName: 'Zap',
  },
  {
    id: 'flirty_charming',
    label: 'Flirty & Charming',
    description: 'Playful, attractive, subtly romantic songs.',
    iconName: 'Smile',
  },
  {
    id: 'ai_decide',
    label: 'Let AI Decide',
    description: 'Automatically determine the best vibe.',
    iconName: 'Wand2',
  },
];

export const PRESET_VIBE_TAGS = [
  'Aesthetic',
  'Romantic',
  'Dreamy',
  'Sad',
  'Mysterious',
  'Confident',
  'Peaceful',
  'Nostalgic',
  'Cinematic',
  'Energetic',
  'Warm',
  'Late-Night',
  'Golden Hour',
  'Minimalist',
] as const;

export const LANGUAGE_OPTIONS = [
  'Hindi',
  'English',
  'Punjabi',
  'Bhojpuri',
  'Haryanvi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Marathi',
  'Other',
  'Any language',
] as const;

export interface MusicStyleOption {
  id: string;
  label: string;
}

export const MUSIC_STYLE_OPTIONS: MusicStyleOption[] = [
  { id: 'trending_ig', label: 'Trending Instagram songs' },
  { id: 'underrated_gems', label: 'Underrated gems' },
  { id: 'classic_songs', label: 'Classic songs' },
  { id: 'indie_music', label: 'Indie music' },
  { id: 'bollywood_hits', label: 'Bollywood hits' },
  { id: 'international_hits', label: 'International hits' },
  { id: 'lofi_slowed', label: 'Lo-fi and slowed songs' },
  { id: 'romantic_melodies', label: 'Romantic melodies' },
  { id: 'any_style', label: 'Any style — choose for me' },
];

export interface EnergyLevelOption {
  id: 'soft' | 'medium' | 'energetic' | 'auto';
  label: string;
}

export const ENERGY_LEVEL_OPTIONS: EnergyLevelOption[] = [
  { id: 'soft', label: 'Soft and subtle' },
  { id: 'medium', label: 'Medium and smooth' },
  { id: 'energetic', label: 'Powerful and energetic' },
  { id: 'auto', label: 'Whatever fits the photo best' },
];

export interface FeelPreferenceOption {
  id: 'lyrics_feelings' | 'music_aesthetic' | 'both';
  label: string;
}

export const FEEL_PREFERENCE_OPTIONS: FeelPreferenceOption[] = [
  { id: 'lyrics_feelings', label: 'Lyrics that express my feelings' },
  { id: 'music_aesthetic', label: 'Music that matches the aesthetic' },
  { id: 'both', label: 'Both lyrics and music should match' },
];

export interface RankingWeights {
  mood: number;
  photoAesthetic: number;
  lyricsOrMusical: number;
  languageAndStyle: number;
  energyAndGenre: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  mood: 30,
  photoAesthetic: 25,
  lyricsOrMusical: 20,
  languageAndStyle: 15,
  energyAndGenre: 10,
};

export interface UserPreferences {
  languages: string[];
  customLanguage: string;
  musicStyle: string;
  energyLevel: 'soft' | 'medium' | 'energetic' | 'auto';
  feelPreference: 'lyrics_feelings' | 'music_aesthetic' | 'both';
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  languages: ['Any language'],
  customLanguage: '',
  musicStyle: 'any_style',
  energyLevel: 'auto',
  feelPreference: 'both',
};

export interface PhotoAnalysisResult {
  summary: string;
  overallAesthetic: string;
  dominantColors: string[];
  lighting: string;
  setting: string;
  sceneType: string;
  atmosphere: string;
  suggestedTags: string[];
  suggestedMoodId: MoodId;
}

export interface ScoreBreakdown {
  moodScore: number;
  photoAestheticScore: number;
  lyricsOrMusicalScore: number;
  languageAndStyleScore: number;
  energyAndGenreScore: number;
}

export interface SongRecommendation {
  id: string;
  title: string;
  artist: string;
  language: string;
  genre: string;
  releaseYear?: number | null;
  moodTags: string[];
  styleTags: string[];
  energy: string;
  artworkUrl?: string;
  previewUrl?: string | null;
  appleMusicUrl?: string;
  spotifySearchUrl: string;
  youtubeMusicSearchUrl: string;
  lyricsSearchUrl: string;
  instagramSearchQuery: string;
  source: 'curated_catalog' | 'itunes_verified';
  rank: number;
  matchScore: number;
  recommendedMoodLabel: string;
  whyItFits: string;
  suggestedUse: string;
  musicalMoment: string;
  scoreBreakdown: ScoreBreakdown;
  appliedWeights: RankingWeights;
}

export interface RecommendationResponse {
  recommendations: SongRecommendation[];
  reserveRecommendations: SongRecommendation[];
  resolvedMoodId: string;
  resolvedMoodLabel: string;
  dataSourceSummary: {
    liveApiAvailable: boolean;
    itunesVerifiedCount: number;
    curatedCatalogCount: number;
    note: string;
  };
  tradeOffNote?: string;
}
