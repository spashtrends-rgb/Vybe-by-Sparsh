import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Music,
  Upload,
  Image as ImageIcon,
  Play,
  Pause,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Volume2,
  VolumeX,
  Share2,
  Heart,
  CloudRain,
  Flame,
  Moon,
  Sun,
  Feather,
  Clock,
  Compass,
  Zap,
  Smile,
  Wand2,
  Disc3,
  Layers,
  ArrowRight,
  Radio,
  Info,
  CheckCircle2,
  X,
  HardDrive
} from 'lucide-react';
import { GoogleDriveModal } from './components/GoogleDriveModal.tsx';
import {
  BRAND_CONFIG,
  MOOD_OPTIONS,
  PRESET_VIBE_TAGS,
  LANGUAGE_OPTIONS,
  MUSIC_STYLE_OPTIONS,
  FEEL_PREFERENCE_OPTIONS,
  ENERGY_LEVEL_OPTIONS,
  DEFAULT_USER_PREFERENCES,
  DEFAULT_RANKING_WEIGHTS,
  type MoodId,
  type MoodOption,
  type UserPreferences,
  type RankingWeights,
  type PhotoAnalysisResult,
  type SongRecommendation,
  type RecommendationResponse
} from './types/vybe';

const MOOD_ICON_MAP: Record<string, React.ElementType> = {
  Heart,
  CloudRain,
  Sparkles,
  Flame,
  Moon,
  Sun,
  Feather,
  Clock,
  Compass,
  Zap,
  Smile,
  Wand2
};

export default function App() {
  // App navigation state: 'welcome' | 'upload' | 'analyzing' | 'analysis_result' | 'preferences' | 'recommending' | 'recommendations'
  const [currentStep, setCurrentStep] = useState<'welcome' | 'upload' | 'analyzing' | 'analysis_result' | 'preferences' | 'recommending' | 'recommendations'>('welcome');

  // Photo state
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);
  const [activeVibeTags, setActiveVibeTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');

  // Mood & Preferences
  const [selectedMoodId, setSelectedMoodId] = useState<MoodId>('aesthetic_dreamy');
  const [customVibeText, setCustomVibeText] = useState<string>('');
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [rankingWeights, setRankingWeights] = useState<RankingWeights>(DEFAULT_RANKING_WEIGHTS);
  const [showWeightsModal, setShowWeightsModal] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);

  // Recommendations state
  const [recommendationData, setRecommendationData] = useState<RecommendationResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [activeScoreModalSong, setActiveScoreModalSong] = useState<SongRecommendation | null>(null);
  const [showMoreMatches, setShowMoreMatches] = useState<boolean>(false);

  // Audio preview playback
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Handle file selection
  const processImageFile = (file: File) => {
    setUploadError(null);
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setUploadError('Please select a JPG, JPEG, PNG, or WebP photo.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size must be under 10 MB.');
      return;
    }

    setSelectedImageFile(file);
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreviewUrl(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Step 2 -> 3: Analyze Photo
  const handleAnalyzePhoto = async () => {
    if (!imageBase64) {
      setUploadError('Please choose or take a photo first.');
      return;
    }

    setCurrentStep('analyzing');
    setUploadError(null);

    try {
      const response = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: imageMimeType,
        }),
      });

      const data = await response.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
        setActiveVibeTags(data.analysis.suggestedTags || []);
        if (data.analysis.suggestedMoodId) {
          setSelectedMoodId(data.analysis.suggestedMoodId);
        }
        setCurrentStep('analysis_result');
      } else {
        throw new Error(data.error || 'Failed to analyze photo');
      }
    } catch (err: any) {
      console.warn('API error, applying aesthetic fallback:', err);
      // Fallback aesthetic profile
      const fallbackAnalysis: PhotoAnalysisResult = {
        summary: 'Your photo exhibits striking contrast, expressive mood, and cinematic composition ideal for an Instagram Story.',
        overallAesthetic: 'Cinematic Dream Pop',
        dominantColors: ['Deep Obsidian', 'Warm Violet', 'Soft Amber'],
        lighting: 'Atmospheric ambient glow',
        setting: 'Everyday Story Scene',
        sceneType: 'Visual Story Frame',
        atmosphere: 'Introspective & expressive',
        suggestedTags: ['Aesthetic', 'Cinematic', 'Dreamy', 'Late-Night', 'Peaceful'],
        suggestedMoodId: 'aesthetic_dreamy',
      };
      setAnalysisResult(fallbackAnalysis);
      setActiveVibeTags(fallbackAnalysis.suggestedTags);
      setSelectedMoodId('aesthetic_dreamy');
      setCurrentStep('analysis_result');
    }
  };

  // Step 4 -> 5: Generate Recommendations
  const handleGenerateRecommendations = async () => {
    setCurrentStep('recommending');

    try {
      const response = await fetch('/api/recommend-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoAnalysis: analysisResult,
          vibeTags: activeVibeTags,
          selectedMoodId,
          customVibeText,
          preferences: userPreferences,
          weights: rankingWeights,
        }),
      });

      const data = await response.json();
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendationData(data);
        setCurrentStep('recommendations');
      } else {
        throw new Error('No songs returned');
      }
    } catch (err) {
      console.warn('Error fetching recommendations, using curated set:', err);
      // If error occurs, trigger retry or safe default
      setCurrentStep('preferences');
    }
  };

  // Audio preview playback toggle
  const handleTogglePlay = (song: SongRecommendation) => {
    if (!song.previewUrl) {
      // Direct user to Spotify or Apple Music if no 30s preview available
      window.open(song.spotifySearchUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (playingSongId === song.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingSongId(null);
      setAudioProgress(0);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(song.previewUrl);
      audioRef.current = newAudio;
      setPlayingSongId(song.id);
      setAudioProgress(0);

      newAudio.play().catch((e) => {
        console.warn('Audio play prevented:', e);
        setPlayingSongId(null);
      });

      newAudio.ontimeupdate = () => {
        if (newAudio.duration > 0) {
          setAudioProgress((newAudio.currentTime / newAudio.duration) * 100);
        }
      };

      newAudio.onended = () => {
        setPlayingSongId(null);
        setAudioProgress(0);
      };
    }
  };

  // Copy to clipboard for Instagram Story Music Sticker
  const handleCopySong = (song: SongRecommendation) => {
    const textToCopy = `${song.title} - ${song.artist}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(song.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  // Copy full curated summary share
  const handleShareSummary = () => {
    if (!recommendationData) return;
    const moodName = recommendationData.resolvedMoodLabel;
    const songList = recommendationData.recommendations
      .map((s, i) => `${i + 1}. ${s.title} — ${s.artist} (${s.matchScore}% Match)`)
      .join('\n');
    const shareText = `🎵 VYBE by Sparsh Story Song Matches\nMood: ${moodName}\n\n${songList}\n\nCurated by vybe by sparsh ✨`;
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Tag toggling
  const handleToggleTag = (tag: string) => {
    if (activeVibeTags.includes(tag)) {
      setActiveVibeTags(activeVibeTags.filter((t) => t !== tag));
    } else {
      setActiveVibeTags([...activeVibeTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTagInput.trim() && !activeVibeTags.includes(customTagInput.trim())) {
      setActiveVibeTags([...activeVibeTags, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  // Language multi-select toggle
  const handleToggleLanguage = (lang: string) => {
    if (lang === 'Any language') {
      setUserPreferences({ ...userPreferences, languages: ['Any language'] });
      return;
    }
    const current = userPreferences.languages.filter((l) => l !== 'Any language');
    let next: string[];
    if (current.includes(lang)) {
      next = current.filter((l) => l !== lang);
      if (next.length === 0) next = ['Any language'];
    } else {
      next = [...current, lang];
    }
    setUserPreferences({ ...userPreferences, languages: next });
  };

  // Reset entire flow
  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingSongId(null);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setImageBase64(null);
    setAnalysisResult(null);
    setRecommendationData(null);
    setShowMoreMatches(false);
    setCurrentStep('welcome');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#09090b]/80 border-b border-zinc-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#0d0d12] rounded-[7px] flex items-center justify-center">
                <Music className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                  vybe by sparsh
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                Instagram Story Song Matcher
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDriveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/50 shadow-sm transition cursor-pointer"
              title="Google Drive: Backup all app files"
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Google Drive</span>
              <span className="sm:hidden">Drive</span>
            </button>

            {currentStep !== 'welcome' && currentStep !== 'upload' && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Photo</span>
              </button>
            )}
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Ready to curate" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col justify-center">
        {/* STEP 1: WELCOME SCREEN */}
        {currentStep === 'welcome' && (
          <div className="flex flex-col items-center text-center max-w-xl mx-auto py-8 space-y-8 animate-fadeIn">
            {/* Subtle Glowing Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold backdrop-blur-md shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Every picture has a vibe. Find its song.</span>
            </div>

            {/* Hero Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Your Story Deserves the{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                  Perfect Song.
                </span>
              </h1>
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
                Upload your picture, tell us your vibe, and discover songs that match your moment.
              </p>
            </div>

            {/* Visual Teaser Cards (Sample recommendations) */}
            <div className="w-full grid grid-cols-2 gap-3 max-w-md pt-2">
              <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md text-left flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-700/40 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-purple-400" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">golden hour</p>
                  <p className="text-[11px] text-zinc-400 truncate">JVKE • Golden Hour Vibe</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md text-left flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-700/40 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">Heeriye</p>
                  <p className="text-[11px] text-zinc-400 truncate">Jasleen Royal • Dreamy Romance</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="w-full max-w-xs pt-2">
              <button
                onClick={() => setCurrentStep('upload')}
                className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:scale-[0.98] transition-all shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 group"
              >
                <span>Find My Song</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-xs text-zinc-400 mt-3 font-medium">
                Made for your mood. Matched to your moment.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD PHOTO */}
        {currentStep === 'upload' && (
          <div className="max-w-md mx-auto w-full space-y-6 py-4 animate-fadeIn">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-white">Choose Your Story Photo</h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Upload the picture you want to post on your Instagram Story.
              </p>
            </div>

            {/* Dropzone / Preview */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 transition-all duration-200 flex flex-col items-center justify-center min-h-[300px] overflow-hidden ${
                isDragging
                  ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
                  : imagePreviewUrl
                  ? 'border-purple-500/50 bg-zinc-950/60'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {imagePreviewUrl ? (
                <div className="relative w-full flex flex-col items-center">
                  <div className="relative max-h-72 w-full rounded-xl overflow-hidden shadow-2xl border border-zinc-700/60">
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded preview"
                      className="w-full h-auto max-h-72 object-contain bg-black/40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] text-zinc-200 font-medium">
                      Tap to replace photo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-4 py-6">
                  <div className="w-16 h-16 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-200">
                      Tap to upload or drag & drop photo
                    </p>
                    <p className="text-xs text-zinc-400">
                      Supports JPG, PNG, and WebP (up to 10 MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs text-center">
                {uploadError}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                disabled={!imageBase64}
                onClick={handleAnalyzePhoto}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Analyze My Photo</span>
              </button>

              <button
                onClick={() => setCurrentStep('welcome')}
                className="w-full py-2.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
              >
                Back to start
              </button>
            </div>
          </div>
        )}

        {/* STEP 3A: ANALYZING LOADER */}
        {currentStep === 'analyzing' && (
          <div className="max-w-md mx-auto w-full py-16 flex flex-col items-center text-center space-y-6 animate-fadeIn">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-indigo-500/20 border-b-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <div className="w-full h-full flex items-center justify-center">
                <Disc3 className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Analyzing Your Photo's Aesthetic</h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto">
                Reading lighting, dominant palette, composition, and emotional vibe with AI...
              </p>
            </div>
          </div>
        )}

        {/* STEP 3B: PHOTO ANALYSIS RESULTS */}
        {currentStep === 'analysis_result' && analysisResult && (
          <div className="max-w-lg mx-auto w-full space-y-6 py-4 animate-fadeIn">
            <div className="text-center space-y-1">
              <span className="text-xs uppercase tracking-wider font-bold text-purple-400">
                Visual Aesthetic Profile
              </span>
              <h2 className="text-2xl font-bold text-white">Here's What VYBE Sees</h2>
            </div>

            {/* Photo Card with Aesthetic Badge */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden p-4 space-y-4 shadow-xl">
              <div className="flex gap-4 items-center">
                {imagePreviewUrl && (
                  <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-700/80 bg-black">
                    <img src={imagePreviewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="space-y-1">
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {analysisResult.overallAesthetic}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {analysisResult.summary}
                  </p>
                </div>
              </div>

              {/* Extracted Visual Traits */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Lighting</span>
                  <span className="font-medium text-zinc-200">{analysisResult.lighting}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Atmosphere</span>
                  <span className="font-medium text-zinc-200">{analysisResult.atmosphere}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850 col-span-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Color Palette</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.dominantColors.map((color, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-zinc-800/90 text-[11px] text-zinc-300">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vibe Tags Customization */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-zinc-300 block">
                  Aesthetic Tags (Tap to customize)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_VIBE_TAGS.map((tag) => {
                    const isSelected = activeVibeTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/40'
                            : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Tag */}
                <form onSubmit={handleAddCustomTag} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    placeholder="Add your own tag (e.g. Goa Trip)..."
                    className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            {/* Next Button */}
            <div className="pt-2">
              <button
                onClick={() => setCurrentStep('preferences')}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
              >
                <span>Confirm Vibe & Choose Mood</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: MOOD & USER PREFERENCES */}
        {currentStep === 'preferences' && (
          <div className="max-w-xl mx-auto w-full space-y-6 py-4 animate-fadeIn">
            <div className="text-center space-y-1">
              <span className="text-xs uppercase tracking-wider font-bold text-purple-400">
                Step 2 of 2
              </span>
              <h2 className="text-2xl font-bold text-white">How Do You Want This Story to Feel?</h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Select your desired mood and soundtrack preferences.
              </p>
            </div>

            {/* Mood Options Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                Primary Mood
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {MOOD_OPTIONS.map((mood) => {
                  const Icon = MOOD_ICON_MAP[mood.iconName] || Sparkles;
                  const isSelected = selectedMoodId === mood.id;
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => setSelectedMoodId(mood.id)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-purple-500 bg-purple-950/40 ring-1 ring-purple-500 shadow-md shadow-purple-950/50'
                          : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-200">{mood.label}</div>
                        <div className="text-[10px] text-zinc-400 leading-tight mt-0.5 line-clamp-2">
                          {mood.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Custom Vibe Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Custom Vibe or Context (Optional)
              </label>
              <input
                type="text"
                value={customVibeText}
                onChange={(e) => setCustomVibeText(e.target.value)}
                placeholder="e.g. late night drive in Bandra, cozy cafe date, high-energy gym reel..."
                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Languages Multi-Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Music Languages
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = userPreferences.languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleToggleLanguage(lang)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                          : 'bg-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Music Style & Feel Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Music Style</label>
                <select
                  value={userPreferences.musicStyle}
                  onChange={(e) =>
                    setUserPreferences({ ...userPreferences, musicStyle: e.target.value })
                  }
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                >
                  {MUSIC_STYLE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-zinc-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Focus</label>
                <select
                  value={userPreferences.feelPreference}
                  onChange={(e) =>
                    setUserPreferences({
                      ...userPreferences,
                      feelPreference: e.target.value as any,
                    })
                  }
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                >
                  {FEEL_PREFERENCE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-zinc-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Weights Button */}
            <div className="flex justify-between items-center pt-1 text-xs">
              <button
                type="button"
                onClick={() => setShowWeightsModal(true)}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-purple-400 transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Algorithm Weights</span>
              </button>
            </div>

            {/* Generate Button */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleGenerateRecommendations}
                className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:scale-[0.98] transition-all shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-5 h-5 text-purple-300" />
                <span>Generate Song Matches</span>
              </button>

              <button
                onClick={() => setCurrentStep('analysis_result')}
                className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 transition"
              >
                Back to photo aesthetic
              </button>
            </div>
          </div>
        )}

        {/* STEP 5A: RECOMMENDING LOADER */}
        {currentStep === 'recommending' && (
          <div className="max-w-md mx-auto w-full py-16 flex flex-col items-center text-center space-y-6 animate-fadeIn">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-8 h-8 text-indigo-400 animate-bounce" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Finding Your Perfect Story Songs</h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto">
                Comparing photo visual warmth, lyrical resonance, and verified Instagram Music availability...
              </p>
            </div>
          </div>
        )}

        {/* STEP 5B: RECOMMENDATIONS SCREEN */}
        {currentStep === 'recommendations' && recommendationData && (
          <div className="max-w-2xl mx-auto w-full space-y-6 py-4 animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-purple-400">
                  Recommended For Your Story
                </span>
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  <span>Top Song Matches</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {recommendationData.resolvedMoodLabel}
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareSummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share List</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setCurrentStep('preferences')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Refine</span>
                </button>
              </div>
            </div>

            {/* Tradeoff Note if Photo & Chosen Mood Diverge */}
            {recommendationData.tradeOffNote && (
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>{recommendationData.tradeOffNote}</span>
              </div>
            )}

            {/* Song Cards List */}
            <div className="space-y-4">
              {recommendationData.recommendations.map((song, idx) => {
                const isPlaying = playingSongId === song.id;
                const isCopied = copiedId === song.id;

                return (
                  <div
                    key={song.id}
                    className="group relative bg-zinc-900/70 hover:bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-lg hover:shadow-purple-950/20"
                  >
                    {/* Top Row: Rank, Title, Artwork, Match Score */}
                    <div className="flex items-start gap-3.5">
                      {/* Album Artwork or Vinyl Placeholder */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 border border-zinc-700/80 shadow-md">
                        {song.artworkUrl ? (
                          <img
                            src={song.artworkUrl}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-900 to-indigo-900">
                            <Disc3 className="w-8 h-8 text-purple-300" />
                          </div>
                        )}

                        {/* Play/Pause Audio Button overlay */}
                        <button
                          onClick={() => handleTogglePlay(song)}
                          className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center transition opacity-90 sm:opacity-0 group-hover:opacity-100"
                          title={song.previewUrl ? 'Play 30s preview' : 'Search on Spotify'}
                        >
                          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform active:scale-90 transition">
                            {isPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current translate-x-0.5" />
                            )}
                          </div>
                        </button>
                      </div>

                      {/* Song Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-purple-400">#{song.rank}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                              {song.language}
                            </span>
                            <span className="text-xs text-zinc-400 truncate">{song.genre}</span>
                          </div>

                          {/* Match Score Badge (Click for breakdown) */}
                          <button
                            onClick={() => setActiveScoreModalSong(song)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition flex-shrink-0"
                            title="Click to view match score breakdown"
                          >
                            <span>{song.matchScore}% Match</span>
                            <Info className="w-3 h-3 text-emerald-400" />
                          </button>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-white truncate mt-1">
                          {song.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-300 truncate">{song.artist}</p>

                        {/* Audio Progress Bar if playing */}
                        {isPlaying && (
                          <div className="mt-2.5 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-purple-500 h-full transition-all duration-150"
                              style={{ width: `${audioProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Why it fits & Instagram Timing */}
                    <div className="mt-3.5 pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
                      <div className="text-zinc-300 leading-relaxed">
                        <span className="font-semibold text-zinc-200">Why it fits: </span>
                        {song.whyItFits}
                      </div>

                      <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-900/30 text-purple-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-purple-300">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>Instagram Story Tip</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-zinc-300">{song.suggestedUse}</p>
                        <p className="text-[11px] text-purple-300 font-medium">
                          <span className="text-zinc-400">Best Section: </span>
                          {song.musicalMoment}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2">
                      {/* Copy Title Button for Instagram Music */}
                      <button
                        onClick={() => handleCopySong(song)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-900/20'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy for Instagram Story</span>
                          </>
                        )}
                      </button>

                      {/* External Music Links */}
                      <div className="flex items-center gap-2">
                        <a
                          href={song.spotifySearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition flex items-center gap-1"
                        >
                          <span>Spotify</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </a>

                        <a
                          href={song.youtubeMusicSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition flex items-center gap-1"
                        >
                          <span>YouTube</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </a>

                        <a
                          href={song.lyricsSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition flex items-center gap-1"
                        >
                          <span>Lyrics</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show More Reserve Matches */}
            {recommendationData.reserveRecommendations.length > 0 && (
              <div className="pt-2 text-center">
                {!showMoreMatches ? (
                  <button
                    onClick={() => setShowMoreMatches(true)}
                    className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition inline-flex items-center gap-2"
                  >
                    <span>Show 4 More Matches</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="space-y-4 text-left">
                    <h3 className="text-sm font-bold text-zinc-300 pt-4 border-t border-zinc-800">
                      Additional Curated Matches
                    </h3>
                    {recommendationData.reserveRecommendations.map((song) => (
                      <div
                        key={song.id}
                        className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="truncate">
                          <p className="font-bold text-white truncate">{song.title}</p>
                          <p className="text-zinc-400 truncate">{song.artist} • {song.language}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleCopySong(song)}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-purple-600 text-zinc-200 text-xs transition"
                          >
                            Copy
                          </button>
                          <a
                            href={song.spotifySearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer restart CTA */}
            <div className="pt-6 border-t border-zinc-800 text-center space-y-3">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Another Picture</span>
              </button>
              <p className="text-[11px] text-zinc-400">
                vybe by sparsh • Every picture has a vibe. Find its song.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* MATCH SCORE BREAKDOWN MODAL */}
      {activeScoreModalSong && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-400">
                  Match Score Algorithm
                </span>
                <h3 className="text-base font-bold text-white truncate">
                  {activeScoreModalSong.title}
                </h3>
                <p className="text-xs text-zinc-400">{activeScoreModalSong.artist}</p>
              </div>
              <button
                onClick={() => setActiveScoreModalSong(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">Overall Match</span>
              <span className="text-lg font-extrabold text-emerald-400">
                {activeScoreModalSong.matchScore}%
              </span>
            </div>

            {/* Dimensional Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Target Mood Alignment ({activeScoreModalSong.appliedWeights.mood}%)</span>
                  <span className="font-bold text-purple-300">
                    {activeScoreModalSong.scoreBreakdown.moodScore}%
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${activeScoreModalSong.scoreBreakdown.moodScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Photo Aesthetic Harmony ({activeScoreModalSong.appliedWeights.photoAesthetic}%)</span>
                  <span className="font-bold text-indigo-300">
                    {activeScoreModalSong.scoreBreakdown.photoAestheticScore}%
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${activeScoreModalSong.scoreBreakdown.photoAestheticScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Lyrics / Melody Texture ({activeScoreModalSong.appliedWeights.lyricsOrMusical}%)</span>
                  <span className="font-bold text-cyan-300">
                    {activeScoreModalSong.scoreBreakdown.lyricsOrMusicalScore}%
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${activeScoreModalSong.scoreBreakdown.lyricsOrMusicalScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Language & Style Match ({activeScoreModalSong.appliedWeights.languageAndStyle}%)</span>
                  <span className="font-bold text-emerald-300">
                    {activeScoreModalSong.scoreBreakdown.languageAndStyleScore}%
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${activeScoreModalSong.scoreBreakdown.languageAndStyleScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Energy & Genre Fit ({activeScoreModalSong.appliedWeights.energyAndGenre}%)</span>
                  <span className="font-bold text-amber-300">
                    {activeScoreModalSong.scoreBreakdown.energyAndGenreScore}%
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${activeScoreModalSong.scoreBreakdown.energyAndGenreScore}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveScoreModalSong(null)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ALGORITHM WEIGHTS MODAL */}
      {showWeightsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Adjust Ranking Weights</span>
              </h3>
              <button
                onClick={() => setShowWeightsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Customize how VYBE prioritizes different factors when picking your Story soundtrack.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Chosen Mood Importance</span>
                  <span className="font-bold text-purple-400">{rankingWeights.mood}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={rankingWeights.mood}
                  onChange={(e) =>
                    setRankingWeights({ ...rankingWeights, mood: Number(e.target.value) })
                  }
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Visual Photo Aesthetic</span>
                  <span className="font-bold text-indigo-400">{rankingWeights.photoAesthetic}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={rankingWeights.photoAesthetic}
                  onChange={(e) =>
                    setRankingWeights({ ...rankingWeights, photoAesthetic: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Lyrics & Melody Fit</span>
                  <span className="font-bold text-cyan-400">{rankingWeights.lyricsOrMusical}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={rankingWeights.lyricsOrMusical}
                  onChange={(e) =>
                    setRankingWeights({
                      ...rankingWeights,
                      lyricsOrMusical: Number(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Language Preference</span>
                  <span className="font-bold text-emerald-400">{rankingWeights.languageAndStyle}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={rankingWeights.languageAndStyle}
                  onChange={(e) =>
                    setRankingWeights({
                      ...rankingWeights,
                      languageAndStyle: Number(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRankingWeights(DEFAULT_RANKING_WEIGHTS)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={() => setShowWeightsModal(false)}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Upload / Backup Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
      />
    </div>
  );
}
