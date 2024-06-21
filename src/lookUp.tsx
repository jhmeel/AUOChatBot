import { findBestMatch } from "string-similarity";
import { qa } from "./q";

function preprocessText(text: string): string[] {
  // Tokenize and normalize text
  return text.toLowerCase().match(/[\w'-]+/g) || [];
}

// Function to find the answer based on query
export function findAnswer(query: string): string {
  // Preprocess the query
  const processedQuery = preprocessText(query);

  // Check for exact match first
  const exactMatch = qa.find(
    (item) =>
      preprocessText(item.question).join(" ") === processedQuery.join(" ")
  );
  if (exactMatch) {
    return exactMatch.answer;
  }

  // Compute similarity scores and filter out low similarity scores
  const filteredQA = qa.filter((item) => {
    const processedQuestion = preprocessText(item.question);
    const similarity = findBestMatch(
      processedQuery.join(" "),
      processedQuestion
    ).bestMatch.rating;

    // Adjust threshold dynamically based on query length
    const threshold = processedQuery.length > 4 ? 0.4 : 0.5; // Adjust threshold based on query length
    return similarity >= threshold;
  });

  // Sort by similarity score (descending)
  const sortedScores = filteredQA
    .map((item) => ({
      ...item,
      similarity: findBestMatch(
        processedQuery.join(" "),
        preprocessText(item.question)
      ).bestMatch.rating,
    }))
    .sort((a, b) => b.similarity - a.similarity);

  // Get the best match
  const bestMatch = sortedScores[0];

  if (bestMatch && bestMatch.similarity >= 0.5) {
    // Ensure similarity threshold is met
    return bestMatch.answer;
  } else {
    return "Sorry, I couldn't find an answer to your question.";
  }
}

export function readTextOut(text: string): void {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  } else {
    console.error("Speech synthesis not supported by your browser.");
  }
}
