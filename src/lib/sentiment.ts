// Simple sentiment analysis using keyword matching
// In production, you might want to use a more sophisticated service like AWS Comprehend or Google Cloud Natural Language

const POSITIVE_KEYWORDS = [
  "amazing",
  "awesome",
  "excellent",
  "fantastic",
  "great",
  "good",
  "love",
  "perfect",
  "wonderful",
  "outstanding",
  "superb",
  "brilliant",
  "impressive",
  "satisfied",
  "happy",
  "pleased",
  "delighted",
  "recommend",
  "beautiful",
  "best",
  "incredible",
  "phenomenal",
  "marvelous",
  "spectacular",
  "terrific",
  "nice",
  "cool",
  "solid",
];

const NEGATIVE_KEYWORDS = [
  "awful",
  "bad",
  "terrible",
  "horrible",
  "worst",
  "hate",
  "disgusting",
  "annoying",
  "frustrated",
  "disappointed",
  "poor",
  "useless",
  "pathetic",
  "ridiculous",
  "stupid",
  "waste",
  "fail",
  "sucks",
  "boring",
  "slow",
  "broken",
  "ugly",
  "rude",
  "unprofessional",
  "scam",
  "fake",
  "overpriced",
  "expensive",
];

const INTENSIFIERS = [
  "very",
  "extremely",
  "really",
  "super",
  "absolutely",
  "totally",
  "completely",
];

export type Sentiment = "positive" | "negative" | "neutral";

export interface SentimentResult {
  sentiment: Sentiment;
  confidence: number;
  positiveScore: number;
  negativeScore: number;
}

export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return {
      sentiment: "neutral",
      confidence: 0,
      positiveScore: 0,
      negativeScore: 0,
    };
  }

  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/);

  let positiveScore = 0;
  let negativeScore = 0;
  let intensifierMultiplier = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check for intensifiers
    if (INTENSIFIERS.includes(word)) {
      intensifierMultiplier = 1.5;
      continue;
    }

    // Check for positive keywords
    if (POSITIVE_KEYWORDS.includes(word)) {
      positiveScore += 1 * intensifierMultiplier;
    }

    // Check for negative keywords
    if (NEGATIVE_KEYWORDS.includes(word)) {
      negativeScore += 1 * intensifierMultiplier;
    }

    // Reset intensifier after each word
    intensifierMultiplier = 1;
  }

  // Normalize scores
  const totalWords = words.length;
  const normalizedPositive = positiveScore / totalWords;
  const normalizedNegative = negativeScore / totalWords;

  // Determine sentiment
  let sentiment: Sentiment = "neutral";
  let confidence = 0;

  if (normalizedPositive > normalizedNegative) {
    sentiment = "positive";
    confidence = Math.min(
      normalizedPositive / (normalizedPositive + normalizedNegative),
      1
    );
  } else if (normalizedNegative > normalizedPositive) {
    sentiment = "negative";
    confidence = Math.min(
      normalizedNegative / (normalizedPositive + normalizedNegative),
      1
    );
  } else {
    confidence = 0;
  }

  return {
    sentiment,
    confidence,
    positiveScore: normalizedPositive,
    negativeScore: normalizedNegative,
  };
}

export function analyzeBulkSentiment(texts: string[]): {
  results: SentimentResult[];
  summary: {
    positive: number;
    negative: number;
    neutral: number;
    averageConfidence: number;
  };
} {
  const results = texts.map(analyzeSentiment);

  const summary = results.reduce(
    (acc, result) => {
      acc[result.sentiment]++;
      acc.averageConfidence += result.confidence;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0, averageConfidence: 0 }
  );

  summary.averageConfidence = summary.averageConfidence / results.length;

  return { results, summary };
}

export function getSentimentColor(sentiment: Sentiment): string {
  switch (sentiment) {
    case "positive":
      return "text-green-600";
    case "negative":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

export function getSentimentBadgeColor(sentiment: Sentiment): string {
  switch (sentiment) {
    case "positive":
      return "bg-green-100 text-green-800";
    case "negative":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
