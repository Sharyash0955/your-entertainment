import { GoogleGenAI, Type } from '@google/genai';
import { SeatItem } from '../src/types';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  try {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return geminiClient;
  } catch (err) {
    console.error('Failed to initialize Gemini SDK:', err);
    return null;
  }
}

export interface AISuggestionResult {
  suggestedSeatIds: string[];
  reasoning: string;
  isAiPowered: boolean;
}

/**
 * Intelligent seat suggestion with LLM, gracefully falling back to deterministic heuristic block finder.
 */
export async function suggestSeatsWithAI(
  userPrompt: string,
  availableSeats: SeatItem[]
): Promise<AISuggestionResult> {
  if (availableSeats.length === 0) {
    return {
      suggestedSeatIds: [],
      reasoning: 'Sorry, no available seats remain in this hall.',
      isAiPowered: false,
    };
  }

  const ai = getGeminiClient();

  if (ai) {
    try {
      const seatsSummary = availableSeats.map((s) => ({
        id: s.id,
        row: s.row,
        number: s.number,
        tier: s.tier,
        price: s.price,
      }));

      const systemInstruction = `You are a cinema & live entertainment seat recommendation specialist for a ticketing platform like BookMyShow or District.
Analyze the user's natural language request and select the best matching available seat IDs from the provided list.
- Rows are ordered: Row A & B are VIP / front, C, D, E are PREMIUM / middle, F, G, H are EXECUTIVE / rear.
- Numbers run 1 to 10.
- Aisle seats are 1, 5, 6, 10.
- Center seats are 4, 5, 6, 7.
- If the user asks for N seats "together" or "adjacent", prioritize contiguous seats in the same row.
- Output strictly JSON matching the specified schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `User Request: "${userPrompt}"\n\nCurrently Available Seats:\n${JSON.stringify(seatsSummary)}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedSeatIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'The IDs of the seats chosen for the user',
              },
              reasoning: {
                type: Type.STRING,
                description: 'A brief, friendly explanation of why these seats match the criteria',
              },
            },
            required: ['suggestedSeatIds', 'reasoning'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        // Verify that all suggested IDs actually exist in availableSeats
        const validIds = (parsed.suggestedSeatIds || []).filter((id: string) =>
          availableSeats.some((s) => s.id === id)
        );

        if (validIds.length > 0) {
          return {
            suggestedSeatIds: validIds,
            reasoning: parsed.reasoning || 'Selected according to your criteria by Gemini AI.',
            isAiPowered: true,
          };
        }
      }
    } catch (error) {
      console.warn('Gemini API call failed or timed out, executing graceful fallback:', error);
    }
  }

  // Graceful heuristic fallback if Gemini is unavailable or errors
  return fallbackRuleBasedSeatSuggestion(userPrompt, availableSeats);
}

/**
 * Deterministic heuristic fallback: parses requested count and preferences (front, middle, back, aisle, vip).
 */
export function fallbackRuleBasedSeatSuggestion(
  userPrompt: string,
  availableSeats: SeatItem[]
): AISuggestionResult {
  const promptLower = userPrompt.toLowerCase();

  // Extract count (e.g. "4 seats", "2 together", "for one", "3")
  let count = 2; // default 2
  const countMatch = promptLower.match(/\b(1|2|3|4|5|6|7|8|one|two|three|four|five|six|single|couple|pair)\b/);
  if (countMatch) {
    const word = countMatch[1];
    if (word === 'one' || word === 'single') count = 1;
    else if (word === 'two' || word === 'couple' || word === 'pair') count = 2;
    else if (word === 'three') count = 3;
    else if (word === 'four') count = 4;
    else if (word === 'five') count = 5;
    else if (word === 'six') count = 6;
    else {
      const parsedNum = parseInt(word, 10);
      if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 8) count = parsedNum;
    }
  }

  const wantsFront = promptLower.includes('front') || promptLower.includes('vip');
  const wantsBack = promptLower.includes('back') || promptLower.includes('rear') || promptLower.includes('executive');
  const wantsAisle = promptLower.includes('aisle') || promptLower.includes('edge') || promptLower.includes('corner');
  const wantsCenter = promptLower.includes('center') || promptLower.includes('middle') || promptLower.includes('premium');

  // Group available seats by row
  const rowMap: Record<string, SeatItem[]> = {};
  for (const s of availableSeats) {
    if (!rowMap[s.row]) rowMap[s.row] = [];
    rowMap[s.row].push(s);
  }

  // Row preferences
  let preferredRows = ['C', 'D', 'E', 'B', 'A', 'F', 'G', 'H'];
  if (wantsFront) preferredRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  else if (wantsBack) preferredRows = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];

  // Try to find contiguous seats in the preferred row
  for (const rowLetter of preferredRows) {
    const seatsInRow = rowMap[rowLetter];
    if (!seatsInRow || seatsInRow.length < count) continue;

    // Sort by seat number
    seatsInRow.sort((a, b) => a.number - b.number);

    // Look for contiguous window of size `count`
    for (let i = 0; i <= seatsInRow.length - count; i++) {
      let isContiguous = true;
      for (let j = 0; j < count - 1; j++) {
        if (seatsInRow[i + j + 1].number !== seatsInRow[i + j].number + 1) {
          isContiguous = false;
          break;
        }
      }

      if (isContiguous) {
        const slice = seatsInRow.slice(i, i + count);
        const seatLabels = slice.map((s) => `${s.row}${s.number}`).join(', ');
        return {
          suggestedSeatIds: slice.map((s) => s.id),
          reasoning: `Found ${count} contiguous seat(s) [${seatLabels}] in Row ${rowLetter} (${slice[0].tier} tier) matching your preference.`,
          isAiPowered: false,
        };
      }
    }
  }

  // If contiguous not found, pick the closest available seats
  const selected = availableSeats.slice(0, count);
  const labels = selected.map((s) => `${s.row}${s.number}`).join(', ');
  return {
    suggestedSeatIds: selected.map((s) => s.id),
    reasoning: `Recommended ${count} best available seat(s) [${labels}] (Rule-based recommendation fallback).`,
    isAiPowered: false,
  };
}

/**
 * Multi-turn Gemini AI Chatbot for Movie & Entertainment Concierge
 */
export async function chatWithAI(
  userMessage: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<string> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const systemInstruction = `You are CinePulse / District AI, an expert cinema and live entertainment concierge.
Your role:
- Help users discover currently showing movies (Interstellar IMAX 70mm, Dune: Part Two, Deadpool & Wolverine, Oppenheimer) and live shows (Coldplay Music of the Spheres, Zakir Khan Standup).
- Provide insider seating tips: The IMAX 70mm acoustic and visual sweet spot is Rows C to E, Seats 4 to 7 (middle rows at eye-level with the curved laser screen).
- Recommend food & beverage pairings: Jumbo Caramel Popcorn with Chilled Pepsi, Loaded Nachos with Jalapeño, or Cold Brew Coffee with Truffle Fries.
- Explain venue formats: IMAX Laser 4K, Dolby Atmos spatial sound, Cinépolis VIP luxury recliners, and 4DX moving seats.
- Guide users on booking: Select movie -> choose cinema & showtime -> pick seats -> add snacks -> proceed to payment page!
Keep your answers engaging, polite, well-formatted with markdown and bullet points when listing things, and reasonably concise.`;

      // Build contents array for multi-turn chat
      const contents: any[] = history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      }));

      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn('Gemini chat error, returning fallback:', err);
    }
  }

  // Fallback intelligent responses if Gemini API key isn't active
  const lower = userMessage.toLowerCase();
  if (lower.includes('seat') || lower.includes('best') || lower.includes('row')) {
    return `🍿 **Acoustic & Visual Sweet Spot Tip:** For **IMAX 70mm**, we strongly recommend **Rows C, D, or E (Seats 4 to 7)**. Sitting here places your eye-level right at the geometric center of the curved laser screen, providing a 40-degree field of view with balanced multi-channel Dolby Atmos audio!`;
  }
  if (lower.includes('food') || lower.includes('snack') || lower.includes('meal') || lower.includes('popcorn')) {
    return `🥤 **Snack Recommendations:**\n- **Movie Classic:** Jumbo Caramel & Butter Popcorn Duo with Twin Chilled Pepsi.\n- **Savory Treat:** Loaded Mexican Nachos with warm cheddar cheese & jalapeño salsa.\n- **Gourmet Choice:** Smoked Hotdog paired with Nitro Cold Brew Coffee!`;
  }
  if (lower.includes('movie') || lower.includes('showing') || lower.includes('what') || lower.includes('playing')) {
    return `🎬 **Top Shows Playing Today:**\n1. **Interstellar (10th Anniv IMAX 70mm)** - Sci-Fi Masterpiece (Rating 9.8)\n2. **Dune: Part Two (IMAX Experience)** - Epic Sci-Fi Adventure (Rating 9.6)\n3. **Deadpool & Wolverine** - Action Comedy (Rating 9.3)\n4. **Coldplay: Music of the Spheres Tour** - Live Stadium Concert (Rating 9.9)\n\nWhich one would you like to book?`;
  }
  return `Hello! I'm your **CinePulse AI Concierge**. I can help you pick the best IMAX seats, suggest delicious snack combos, compare showtimes, or guide you through your booking. What movie or live show are you excited about today?`;
}

