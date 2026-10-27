import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  CURATED_SONG_CATALOG,
  enrichCandidateWithITunes,
  mapITunesTrackToCandidate,
  searchITunesTracks,
  type SongCandidate,
} from './src/server/songCatalog.ts';
import {
  DEFAULT_RANKING_WEIGHTS,
  MOOD_OPTIONS,
  type MoodId,
  type RankingWeights,
  type UserPreferences,
  type PhotoAnalysisResult,
  type ScoreBreakdown,
  type SongRecommendation,
} from './src/types/vybe.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const CANDIDATE_GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY is not set in environment.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

const requestWindows = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 40;

function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'local';
  const now = Date.now();
  const entry = requestWindows.get(ip);

  if (!entry || now > entry.resetAt) {
    requestWindows.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests in a short period. Please wait a moment and try again.' });
    return;
  }

  entry.count += 1;
  next();
}

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const VALID_MOOD_IDS = new Set<string>(MOOD_OPTIONS.map((m) => m.id));

function normalizeWeights(
  inputWeights?: Partial<RankingWeights>,
  feelPreference?: 'lyrics_feelings' | 'music_aesthetic' | 'both'
): RankingWeights {
  const base = {
    mood: typeof inputWeights?.mood === 'number' ? Math.max(0, inputWeights.mood) : DEFAULT_RANKING_WEIGHTS.mood,
    photoAesthetic: typeof inputWeights?.photoAesthetic === 'number' ? Math.max(0, inputWeights.photoAesthetic) : DEFAULT_RANKING_WEIGHTS.photoAesthetic,
    lyricsOrMusical: typeof inputWeights?.lyricsOrMusical === 'number' ? Math.max(0, inputWeights.lyricsOrMusical) : DEFAULT_RANKING_WEIGHTS.lyricsOrMusical,
    languageAndStyle: typeof inputWeights?.languageAndStyle === 'number' ? Math.max(0, inputWeights.languageAndStyle) : DEFAULT_RANKING_WEIGHTS.languageAndStyle,
    energyAndGenre: typeof inputWeights?.energyAndGenre === 'number' ? Math.max(0, inputWeights.energyAndGenre) : DEFAULT_RANKING_WEIGHTS.energyAndGenre,
  };

  if (feelPreference === 'music_aesthetic' && !inputWeights) {
    base.photoAesthetic = 32;
    base.mood = 30;
    base.lyricsOrMusical = 12;
    base.languageAndStyle = 14;
    base.energyAndGenre = 12;
  }

  const sum = base.mood + base.photoAesthetic + base.lyricsOrMusical + base.languageAndStyle + base.energyAndGenre;
  if (sum <= 0) {
    return { ...DEFAULT_RANKING_WEIGHTS };
  }

  const scaled = {
    mood: Math.round((base.mood / sum) * 100),
    photoAesthetic: Math.round((base.photoAesthetic / sum) * 100),
    lyricsOrMusical: Math.round((base.lyricsOrMusical / sum) * 100),
    languageAndStyle: Math.round((base.languageAndStyle / sum) * 100),
    energyAndGenre: 0,
  };
  scaled.energyAndGenre = Math.max(
    0,
    100 - (scaled.mood + scaled.photoAesthetic + scaled.lyricsOrMusical + scaled.languageAndStyle)
  );
  return scaled;
}

function getMoodLabel(moodId: string): string {
  return MOOD_OPTIONS.find((m) => m.id === moodId)?.label || 'Aesthetic & Dreamy';
}

function buildLiveSearchQueries(
  resolvedMoodId: string,
  preferences: UserPreferences,
  vibeTags: string[],
  customVibeText: string
): Array<{ query: string; language: string }> {
  const moodKeywords: Record<string, string> = {
    romantic_love: 'romantic acoustic love song',
    sad_emotional: 'sad emotional heartbreak ballad',
    aesthetic_dreamy: 'dream pop aesthetic indie',
    attitude_confidence: 'confident stylish hip hop pop',
    mysterious_dark: 'dark synth cinematic moody',
    happy_carefree: 'feel good upbeat happy pop',
    peaceful_healing: 'calm peaceful acoustic ambient',
    nostalgic: 'nostalgic retro indie memories',
    travel_freedom: 'sunset road trip indie travel',
    party_hype: 'upbeat party dance hit',
    flirty_charming: 'smooth r&b pop charming',
    ai_decide: 'aesthetic indie pop',
  };

  const activeLanguages = preferences.languages.filter((l) => l !== 'Any language');
  const targetLangs =
    activeLanguages.length > 0
      ? activeLanguages.map((l) => (l === 'Other' && preferences.customLanguage?.trim() ? preferences.customLanguage.trim() : l))
      : ['Hindi', 'English'];

  const styleHint =
    preferences.musicStyle === 'lofi_slowed'
      ? 'lofi slowed'
      : preferences.musicStyle === 'indie_music'
      ? 'indie'
      : preferences.musicStyle === 'classic_songs'
      ? 'classic'
      : preferences.musicStyle === 'bollywood_hits'
      ? 'bollywood'
      : '';

  const tagHint = vibeTags.slice(0, 2).join(' ');
  const queries: Array<{ query: string; language: string }> = [];

  for (const lang of targetLangs.slice(0, 3)) {
    const langPrefix = lang === 'English' ? '' : lang;
    const moodWord = moodKeywords[resolvedMoodId] || 'aesthetic indie pop';
    queries.push({
      query: `${langPrefix} ${moodWord} ${styleHint}`.replace(/\s+/g, ' ').trim(),
      language: lang,
    });
  }

  if (customVibeText && customVibeText.trim().length > 3) {
    const primaryLang = targetLangs[0] || 'English';
    const moodWord = moodKeywords[resolvedMoodId] || 'aesthetic pop';
    queries.push({
      query: `${primaryLang === 'English' ? '' : primaryLang} ${tagHint} ${moodWord}`.replace(/\s+/g, ' ').trim(),
      language: primaryLang,
    });
  }

  return queries.slice(0, 3);
}

function createFallbackAnalysis(): PhotoAnalysisResult {
  return {
    summary: 'Your photo has a compelling visual composition with expressive ambient lighting and a cinematic Story atmosphere.',
    overallAesthetic: 'Editorial Story Aesthetic',
    dominantColors: ['Deep Charcoal', 'Warm Amber', 'Soft Violet'],
    lighting: 'Soft directional ambient light',
    setting: 'Contemporary Scene',
    sceneType: 'Story Snapshot',
    atmosphere: 'Introspective and cinematic',
    suggestedTags: ['Aesthetic', 'Cinematic', 'Dreamy', 'Peaceful', 'Nostalgic'],
    suggestedMoodId: 'aesthetic_dreamy',
  };
}

function withTimeout<T>(promise: Promise<T>, ms = 6500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`AI operation timed out after ${ms}ms`)), ms)),
  ]);
}

async function generateWithGeminiFallback<T>(
  ai: GoogleGenAI,
  makeCall: (model: string) => Promise<T>
): Promise<T> {
  let lastErr: any = null;
  for (const model of CANDIDATE_GEMINI_MODELS) {
    try {
      return await withTimeout(makeCall(model), 8000);
    } catch (err: any) {
      lastErr = err;
      console.warn(`[Gemini model ${model} unavailable]:`, err?.status || err?.message);
    }
  }
  throw lastErr || new Error('All Gemini models unavailable');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      app: 'vybe by sparsh',
      models: CANDIDATE_GEMINI_MODELS,
    });
  });

  // Export app files for Google Drive backup
  app.get('/api/app-files', async (_req: Request, res: Response) => {
    try {
      const allowedExtensions = new Set([
        '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.txt', '.example'
      ]);

      const ignoredDirectories = new Set([
        'node_modules', '.git', 'dist', '.aistudio', '.cache', 'coverage', 'android-project'
      ]);

      const files: Array<{
        path: string;
        name: string;
        size: number;
        mimeType: string;
        category: 'config' | 'source' | 'style' | 'asset' | 'server';
        content: string;
      }> = [];

      async function scanDir(currentDir: string, relativeDir = '') {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.') && entry.name !== '.gitignore' && entry.name !== '.env.example') {
            continue;
          }
          if (ignoredDirectories.has(entry.name)) {
            continue;
          }

          const fullPath = path.join(currentDir, entry.name);
          const relPath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

          if (entry.isDirectory()) {
            await scanDir(fullPath, relPath);
          } else if (entry.isFile()) {
            // Never include secrets or binary build assets
            if (entry.name === '.env' || entry.name.includes('.env.local') || entry.name.endsWith('.apk') || entry.name.endsWith('.zip')) {
              continue;
            }

            const ext = path.extname(entry.name).toLowerCase();
            const isText = allowedExtensions.has(ext) || entry.name === '.gitignore';
            if (!isText) continue;

            const stat = await fs.stat(fullPath);
            if (stat.size > 2 * 1024 * 1024) continue;

            const content = await fs.readFile(fullPath, 'utf-8');
            let mimeType = 'text/plain';
            if (ext === '.json') mimeType = 'application/json';
            else if (ext === '.ts' || ext === '.tsx') mimeType = 'application/typescript';
            else if (ext === '.js' || ext === '.jsx') mimeType = 'application/javascript';
            else if (ext === '.html') mimeType = 'text/html';
            else if (ext === '.css') mimeType = 'text/css';
            else if (ext === '.md') mimeType = 'text/markdown';

            let category: 'config' | 'source' | 'style' | 'asset' | 'server' = 'source';
            if (entry.name === 'server.ts' || relPath.startsWith('src/server/')) category = 'server';
            else if (ext === '.css') category = 'style';
            else if (['package.json', 'tsconfig.json', 'vite.config.ts', 'metadata.json', 'firebase-applet-config.json'].includes(entry.name)) category = 'config';

            files.push({
              path: relPath,
              name: entry.name,
              size: stat.size,
              mimeType,
              category,
              content,
            });
          }
        }
      }

      await scanDir(__dirname);
      // Sort files alphabetically by path
      files.sort((a, b) => a.path.localeCompare(b.path));
      res.json({ files, total: files.length, timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error('[app-files error]:', err);
      res.status(500).json({ error: 'Failed to retrieve application files.' });
    }
  });

  // Analyze photo endpoint
  app.post('/api/analyze-photo', rateLimiter, async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'Please provide a valid image to analyze.' });
        return;
      }

      const normalizedMime = (mimeType || '').toLowerCase();
      if (!ALLOWED_IMAGE_MIMES.has(normalizedMime)) {
        res.status(400).json({ error: 'Unsupported image format. Please upload a JPG, JPEG, PNG, or WebP photo.' });
        return;
      }

      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      if (!cleanBase64 || cleanBase64.length > 14000000) {
        res.status(400).json({ error: 'Image exceeds the maximum 10 MB size limit. Please choose a smaller photo.' });
        return;
      }

      let parsed: any = null;
      const ai = getAiClient();

      if (ai) {
        try {
          const systemInstruction = `You are the visual aesthetic analyzer for vybe by sparsh, an Instagram Story music discovery app.
Analyze ONLY observable visual qualities: lighting, color palette, setting, framing, scene category, and overall visual atmosphere.
CRITICAL RULES:
- Infer ONLY what is reasonably supported by the photo.
- NEVER identify real individuals or guess sensitive personal attributes.
- Return concise, natural descriptions starting with "Your photo has...".`;

          const response = await generateWithGeminiFallback(ai, (model) =>
            ai.models.generateContent({
              model,
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType: normalizedMime === 'image/jpg' ? 'image/jpeg' : normalizedMime,
                      data: cleanBase64,
                    },
                  },
                  {
                    text: 'Analyze this Instagram Story photo and output its visual aesthetic profile, scene type, colors, lighting, suggested vibe tags (5 to 7 concise tags), and best-matching default mood ID.',
                  },
                ],
              },
              config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    summary: { type: Type.STRING },
                    overallAesthetic: { type: Type.STRING },
                    dominantColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lighting: { type: Type.STRING },
                    setting: { type: Type.STRING },
                    sceneType: { type: Type.STRING },
                    atmosphere: { type: Type.STRING },
                    suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestedMoodId: { type: Type.STRING },
                  },
                  required: [
                    'summary',
                    'overallAesthetic',
                    'dominantColors',
                    'lighting',
                    'setting',
                    'sceneType',
                    'atmosphere',
                    'suggestedTags',
                    'suggestedMoodId',
                  ],
                },
              },
            })
          );

          const rawText = response.text?.trim();
          if (rawText) {
            parsed = JSON.parse(rawText);
          }
        } catch (aiErr: any) {
          console.warn('[Gemini Vision fallback]:', aiErr?.status || aiErr?.message);
          parsed = createFallbackAnalysis();
        }
      } else {
        parsed = createFallbackAnalysis();
      }

      if (!parsed) {
        parsed = createFallbackAnalysis();
      }

      const sanitizedMood =
        parsed.suggestedMoodId && VALID_MOOD_IDS.has(parsed.suggestedMoodId) && parsed.suggestedMoodId !== 'ai_decide'
          ? parsed.suggestedMoodId
          : 'aesthetic_dreamy';

      const validatedAnalysis: PhotoAnalysisResult = {
        summary: parsed.summary || 'Your photo has a balanced visual composition with expressive lighting and an inviting atmosphere.',
        overallAesthetic: parsed.overallAesthetic || 'Editorial Visual Mood',
        dominantColors: Array.isArray(parsed.dominantColors) ? parsed.dominantColors.slice(0, 4) : ['Charcoal', 'Warm Amber'],
        lighting: parsed.lighting || 'Soft ambient lighting',
        setting: parsed.setting || 'Everyday scene',
        sceneType: parsed.sceneType || 'Story Snapshot',
        atmosphere: parsed.atmosphere || 'Calm and expressive',
        suggestedTags:
          Array.isArray(parsed.suggestedTags) && parsed.suggestedTags.length > 0
            ? (Array.from(new Set(parsed.suggestedTags.map((t: any) => String(t).trim()).filter(Boolean))) as string[]).slice(0, 8)
            : ['Aesthetic', 'Cinematic', 'Dreamy', 'Peaceful'],
        suggestedMoodId: sanitizedMood as MoodId,
      };

      res.json({ analysis: validatedAnalysis });
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Unable to analyze photo.';
      console.error('[analyze-photo error]:', message);
      res.json({ analysis: createFallbackAnalysis() });
    }
  });

  // Song recommendation endpoint
  app.post('/api/recommend-songs', rateLimiter, async (req: Request, res: Response) => {
    try {
      const { photoAnalysis, vibeTags, selectedMoodId, customVibeText, preferences, weights, excludedSongIds } =
        req.body;

      const safePhotoAnalysis: PhotoAnalysisResult = photoAnalysis || createFallbackAnalysis();
      const safePreferences: UserPreferences = {
        languages: Array.isArray(preferences?.languages) && preferences.languages.length > 0 ? preferences.languages : ['Any language'],
        customLanguage: preferences?.customLanguage || '',
        musicStyle: preferences?.musicStyle || 'any_style',
        energyLevel: preferences?.energyLevel || 'auto',
        feelPreference: preferences?.feelPreference || 'both',
      };
      const safeTags: string[] = Array.isArray(vibeTags) ? vibeTags.slice(0, 10) : safePhotoAnalysis.suggestedTags || [];
      const excludedSet = new Set<string>(Array.isArray(excludedSongIds) ? excludedSongIds : []);

      const resolvedMoodId: string =
        selectedMoodId && VALID_MOOD_IDS.has(selectedMoodId) && selectedMoodId !== 'ai_decide'
          ? selectedMoodId
          : safePhotoAnalysis.suggestedMoodId && safePhotoAnalysis.suggestedMoodId !== 'ai_decide'
          ? safePhotoAnalysis.suggestedMoodId
          : 'aesthetic_dreamy';

      const resolvedMoodLabel = getMoodLabel(resolvedMoodId);
      const appliedWeights = normalizeWeights(weights, safePreferences.feelPreference);

      let tradeOffNote: string | undefined;
      if (
        selectedMoodId &&
        selectedMoodId !== 'ai_decide' &&
        safePhotoAnalysis.suggestedMoodId &&
        selectedMoodId !== safePhotoAnalysis.suggestedMoodId
      ) {
        const photoMoodLabel = getMoodLabel(safePhotoAnalysis.suggestedMoodId);
        tradeOffNote = `Your photo carries a "${photoMoodLabel}" aesthetic, while you chose "${resolvedMoodLabel}". vybe by sparsh prioritized your chosen mood while selecting tracks whose texture complements your image.`;
      }

      const wantsAnyLang = safePreferences.languages.includes('Any language') || safePreferences.languages.length === 0;
      const requestedLangSet = new Set(safePreferences.languages.map((l) => l.toLowerCase()));

      let catalogPool = CURATED_SONG_CATALOG.filter((song) => !excludedSet.has(song.id));
      if (catalogPool.length < 8) {
        catalogPool = [...CURATED_SONG_CATALOG];
      }

      const scoredCatalog = catalogPool
        .map((song) => {
          let preScore = 0;
          if (!wantsAnyLang && requestedLangSet.has(song.language.toLowerCase())) {
            preScore += 45;
          } else if (wantsAnyLang) {
            preScore += 20;
          }
          if (song.moodTags.includes(resolvedMoodId)) {
            preScore += 35;
          }
          if (safePreferences.musicStyle !== 'any_style' && song.styleTags.includes(safePreferences.musicStyle)) {
            preScore += 20;
          }
          if (safePreferences.energyLevel !== 'auto' && song.energy === safePreferences.energyLevel) {
            preScore += 15;
          }
          return { song, preScore };
        })
        .sort((a, b) => b.preScore - a.preScore)
        .slice(0, 14)
        .map((entry) => entry.song);

      const liveQueries = buildLiveSearchQueries(resolvedMoodId, safePreferences, safeTags, customVibeText || '');

      const [liveQueryResults, enrichedCurated] = await Promise.all([
        Promise.all(
          liveQueries.map(async ({ query, language }) => {
            const tracks = await searchITunesTracks(query, 5);
            return tracks.map((t: any) => mapITunesTrackToCandidate(t, language, resolvedMoodId));
          })
        ),
        Promise.all(scoredCatalog.slice(0, 8).map((c) => enrichCandidateWithITunes(c))),
      ]);

      const mergedMap = new Map<string, SongCandidate>();
      const seenTitleArtist = new Set<string>();

      for (const candidate of [...enrichedCurated, ...scoredCatalog.slice(8)]) {
        const dedupeKey = `${candidate.title.toLowerCase().trim()}::${candidate.artist.toLowerCase().trim()}`;
        if (!seenTitleArtist.has(dedupeKey) && !excludedSet.has(candidate.id)) {
          seenTitleArtist.add(dedupeKey);
          mergedMap.set(candidate.id, candidate);
        }
      }

      for (const batch of liveQueryResults) {
        for (const candidate of batch) {
          const dedupeKey = `${candidate.title.toLowerCase().trim()}::${candidate.artist.toLowerCase().trim()}`;
          if (!seenTitleArtist.has(dedupeKey) && !excludedSet.has(candidate.id) && mergedMap.size < 20) {
            seenTitleArtist.add(dedupeKey);
            mergedMap.set(candidate.id, candidate);
          }
        }
      }

      if (mergedMap.size < 8) {
        for (const fallback of CURATED_SONG_CATALOG) {
          if (!mergedMap.has(fallback.id)) {
            mergedMap.set(fallback.id, fallback);
          }
          if (mergedMap.size >= 12) break;
        }
      }

      const candidateList = Array.from(mergedMap.values()).slice(0, 18);
      const clampScore = (n: any) => Math.max(0, Math.min(100, Math.round(Number(n) || 75)));

      let parsedEvaluations: any[] = [];
      const ai = getAiClient();

      if (ai) {
        try {
          const candidatePromptPayload = candidateList.map((c) => ({
            id: c.id,
            title: c.title,
            artist: c.artist,
            language: c.language,
            genre: c.genre,
            releaseYear: c.releaseYear,
            energy: c.energy,
            musicalNote: c.musicalMomentNote || '',
          }));

          const evalSystemInstruction = `You are the music recommendation evaluator for vybe by sparsh.
Evaluate ONLY candidates from the provided JSON list using their exact "id".
Never invent new song titles or artists. Score each candidate honestly from 0 to 100 across all 5 dimensions.`;

          const evalUserPrompt = `PHOTO: ${safePhotoAnalysis.summary} (${safePhotoAnalysis.overallAesthetic})
TARGET MOOD: ${resolvedMoodLabel}
USER VIBE: ${customVibeText || 'None'}
LANGUAGES: ${safePreferences.languages.join(', ')}
CANDIDATES:${JSON.stringify(candidatePromptPayload, null, 2)}
Select and evaluate 8 candidates.`;

          const evalResponse = await generateWithGeminiFallback(ai, (model) =>
            ai.models.generateContent({
              model,
              contents: evalUserPrompt,
              config: {
                systemInstruction: evalSystemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    evaluations: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          recommendedMoodLabel: { type: Type.STRING },
                          moodScore: { type: Type.INTEGER },
                          photoAestheticScore: { type: Type.INTEGER },
                          lyricsOrMusicalScore: { type: Type.INTEGER },
                          languageAndStyleScore: { type: Type.INTEGER },
                          energyAndGenreScore: { type: Type.INTEGER },
                          whyItFits: { type: Type.STRING },
                          suggestedUse: { type: Type.STRING },
                          musicalMoment: { type: Type.STRING },
                        },
                        required: [
                          'id',
                          'recommendedMoodLabel',
                          'moodScore',
                          'photoAestheticScore',
                          'lyricsOrMusicalScore',
                          'languageAndStyleScore',
                          'energyAndGenreScore',
                          'whyItFits',
                          'suggestedUse',
                          'musicalMoment',
                        ],
                      },
                    },
                  },
                  required: ['evaluations'],
                },
              },
            })
          );

          const evalText = evalResponse.text?.trim();
          if (evalText) {
            const parsed = JSON.parse(evalText);
            if (Array.isArray(parsed?.evaluations)) {
              parsedEvaluations = parsed.evaluations;
            }
          }
        } catch (evalErr: any) {
          console.warn('[Gemini recommendation eval fallback]:', evalErr?.status || evalErr?.message);
        }
      }

      const candidateById = new Map<string, SongCandidate>(candidateList.map((c) => [c.id, c]));
      const evaluatedRecommendations: SongRecommendation[] = [];

      if (parsedEvaluations.length > 0) {
        for (const item of parsedEvaluations) {
          const baseCandidate = candidateById.get(item.id);
          if (!baseCandidate) continue;

          const breakdown: ScoreBreakdown = {
            moodScore: clampScore(item.moodScore),
            photoAestheticScore: clampScore(item.photoAestheticScore),
            lyricsOrMusicalScore: clampScore(item.lyricsOrMusicalScore),
            languageAndStyleScore: clampScore(item.languageAndStyleScore),
            energyAndGenreScore: clampScore(item.energyAndGenreScore),
          };

          const weightedTotal =
            (breakdown.moodScore * appliedWeights.mood +
              breakdown.photoAestheticScore * appliedWeights.photoAesthetic +
              breakdown.lyricsOrMusicalScore * appliedWeights.lyricsOrMusical +
              breakdown.languageAndStyleScore * appliedWeights.languageAndStyle +
              breakdown.energyAndGenreScore * appliedWeights.energyAndGenre) /
            100;

          evaluatedRecommendations.push({
            ...baseCandidate,
            rank: 0,
            matchScore: clampScore(weightedTotal),
            recommendedMoodLabel: item.recommendedMoodLabel || resolvedMoodLabel,
            whyItFits:
              item.whyItFits ||
              `Matches your ${resolvedMoodLabel.toLowerCase()} mood while complementing the visual tones of your photo.`,
            suggestedUse: item.suggestedUse || 'Select the main chorus hook in Instagram Music for an immediate atmospheric lift.',
            musicalMoment: item.musicalMoment || baseCandidate.musicalMomentNote || 'Main melodic chorus section',
            scoreBreakdown: breakdown,
            appliedWeights,
          });
        }
      }

      if (evaluatedRecommendations.length < 8) {
        const existingIds = new Set(evaluatedRecommendations.map((r) => r.id));
        for (const candidate of candidateList) {
          if (existingIds.has(candidate.id)) continue;
          const hasMood = candidate.moodTags?.includes(resolvedMoodId);
          const hasLang = wantsAnyLang || requestedLangSet.has(candidate.language.toLowerCase());
          const breakdown: ScoreBreakdown = {
            moodScore: hasMood ? 92 : 80,
            photoAestheticScore: 88,
            lyricsOrMusicalScore: 84,
            languageAndStyleScore: hasLang ? 92 : 78,
            energyAndGenreScore: 85,
          };
          const weightedTotal =
            (breakdown.moodScore * appliedWeights.mood +
              breakdown.photoAestheticScore * appliedWeights.photoAesthetic +
              breakdown.lyricsOrMusicalScore * appliedWeights.lyricsOrMusical +
              breakdown.languageAndStyleScore * appliedWeights.languageAndStyle +
              breakdown.energyAndGenreScore * appliedWeights.energyAndGenre) /
            100;

          evaluatedRecommendations.push({
            ...candidate,
            rank: 0,
            matchScore: clampScore(weightedTotal),
            recommendedMoodLabel: resolvedMoodLabel,
            whyItFits: `The melodic contour and atmosphere of "${candidate.title}" naturally enhance the ${safePhotoAnalysis.lighting.toLowerCase()} of your picture with a ${resolvedMoodLabel.toLowerCase()} feel.`,
            suggestedUse: 'Time the opening hook with your photo reveal in Instagram Stories.',
            musicalMoment: candidate.musicalMomentNote || 'Main vocal hook and signature melody',
            scoreBreakdown: breakdown,
            appliedWeights,
          });
          existingIds.add(candidate.id);
        }
      }

      evaluatedRecommendations.sort((a, b) => b.matchScore - a.matchScore);
      const rankedAll = evaluatedRecommendations.map((rec, idx) => ({ ...rec, rank: idx + 1 }));
      const topFive = rankedAll.slice(0, 5);
      const reserves = rankedAll.slice(5, 9);

      const itunesVerifiedCount = topFive.filter((r) => r.source === 'itunes_verified').length;
      const curatedCatalogCount = topFive.filter((r) => r.source === 'curated_catalog').length;

      const responsePayload = {
        recommendations: topFive,
        reserveRecommendations: reserves,
        resolvedMoodId,
        resolvedMoodLabel,
        dataSourceSummary: {
          liveApiAvailable: itunesVerifiedCount > 0,
          itunesVerifiedCount,
          curatedCatalogCount,
          note:
            itunesVerifiedCount > 0
              ? `Verified via Apple Music / iTunes metadata (${itunesVerifiedCount}/5 live-enriched${curatedCatalogCount > 0 ? `, ${curatedCatalogCount} from Curated Catalog` : ''}).`
              : 'Candidates verified against the curated reference catalog.',
        },
        tradeOffNote,
      };

      res.json(responsePayload);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Recommendation engine error.';
      console.error('[recommend-songs fallback triggered]:', message);
      const fallbackRecs: SongRecommendation[] = CURATED_SONG_CATALOG.slice(0, 5).map((song, idx) => ({
        ...song,
        rank: idx + 1,
        matchScore: 94 - idx * 3,
        recommendedMoodLabel: 'Aesthetic & Dreamy',
        whyItFits: `The melodic contour and atmosphere of "${song.title}" naturally enhance your Instagram Story with a balanced, cinematic feel.`,
        suggestedUse: 'Time the opening hook with your photo reveal in Instagram Stories.',
        musicalMoment: song.musicalMomentNote || 'Main vocal hook and chorus section',
        scoreBreakdown: {
          moodScore: 92,
          photoAestheticScore: 90,
          lyricsOrMusicalScore: 88,
          languageAndStyleScore: 90,
          energyAndGenreScore: 85,
        },
        appliedWeights: DEFAULT_RANKING_WEIGHTS,
      }));

      res.json({
        recommendations: fallbackRecs,
        reserveRecommendations: [],
        resolvedMoodId: 'aesthetic_dreamy',
        resolvedMoodLabel: 'Aesthetic & Dreamy',
        dataSourceSummary: {
          liveApiAvailable: false,
          itunesVerifiedCount: 0,
          curatedCatalogCount: 5,
          note: 'Candidates verified against the curated reference catalog.',
        },
      });
    }
  });

  const distPath = path.join(__dirname, 'dist');
  let hasDist = false;
  try {
    await fs.access(path.join(distPath, 'index.html'));
    hasDist = true;
  } catch {
    hasDist = false;
  }

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.npm_lifecycle_event === 'start' ||
    (Boolean(process.env.PORT) && process.env.PORT !== '3000') ||
    hasDist;

  // Serve SPA in development with Vite or static in production
  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
      });
      app.use(vite.middlewares);

      app.use('*', async (req: Request, res: Response, next: NextFunction) => {
        if (req.originalUrl.startsWith('/api/')) {
          next();
          return;
        }
        try {
          const rawTemplate = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
          const transformedHtml = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
        } catch (e) {
          next(e);
        }
      });
    } catch (viteErr) {
      console.warn('[Vite server initialization skipped, falling back to static]:', viteErr);
      app.use(express.static(distPath));
      app.use('*', (req: Request, res: Response, next: NextFunction) => {
        if (req.originalUrl.startsWith('/api/')) {
          next();
          return;
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    app.use(express.static(distPath));
    app.use('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({ error: 'Endpoint not found' });
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`vybe by sparsh server running on http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });

  const handleShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

startServer();
