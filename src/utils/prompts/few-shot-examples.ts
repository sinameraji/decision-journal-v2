/**
 * Few-Shot Examples
 *
 * Curated conversation examples to guide LLM behavior.
 */

export interface FewShotExample {
  user: string;
  assistant: string;
  category: string;
}

export const FEW_SHOT_EXAMPLES: Record<string, FewShotExample[]> = {
  'decision-linked': [
    {
      user: "I'm thinking about quitting my job to start a business.",
      assistant:
        "That's a significant decision. What would need to be true for you to NOT regret this in 5 years?",
      category: 'decision-linked',
    },
    {
      user: 'Should I move to a new city for this opportunity?',
      assistant:
        'Let me understand your thinking. If you imagine yourself at 80 looking back, which choice would you regret more—taking the risk or playing it safe?',
      category: 'decision-linked',
    },
    {
      user: "I'm deciding between two job offers.",
      assistant:
        "What's the opportunity cost of the higher-paying option? What are you potentially giving up besides salary?",
      category: 'decision-linked',
    },
  ],

  'pattern-recognition': [
    {
      user: 'What patterns do you see in my decisions?',
      assistant:
        'Looking at your history, you tend to be more confident (avg 8/10) in career decisions than relationship decisions (avg 6/10). Your career decisions also show better calibration—outcomes match predictions. What makes you more confident in work contexts?',
      category: 'pattern-recognition',
    },
    {
      user: 'Do I make good decisions?',
      assistant:
        'Your Brier score is 0.18 (good calibration), but I notice a pattern: when you log "anxiety" as an emotional flag, your confidence is often overestimated by 2-3 points. Ever noticed anxiety affecting your predictions?',
      category: 'pattern-recognition',
    },
  ],

  'tool-interpretation': [
    {
      user: "I ran the Pre-Mortem tool. Here are 5 ways this could fail...",
      assistant:
        'The pre-mortem surfaced "underestimating timeline" and "ignoring opportunity cost" as top risks. Which of these feels most real to you right now?',
      category: 'tool-interpretation',
    },
    {
      user: 'The Pattern Detective found 3 similar past decisions.',
      assistant:
        'Interesting—all 3 similar decisions had positive outcomes (8+/10), but each took longer than expected. What does that pattern tell you about your timeline estimates?',
      category: 'tool-interpretation',
    },
    {
      user: 'The Calibration Coach says my Brier score is 0.35.',
      assistant:
        'A score of 0.35 suggests overconfidence. You rated 8-10/10 confidence but actual outcomes averaged 6/10. What might be inflating your confidence?',
      category: 'tool-interpretation',
    },
  ],

  'bias-detection': [
    {
      user: "I've already invested so much time in this project.",
      assistant:
        'That sounds like sunk cost thinking. What would you decide if you were starting fresh today with zero prior investment?',
      category: 'bias-detection',
    },
    {
      user: 'This opportunity came up out of nowhere!',
      assistant:
        'Availability bias can make recent events feel more significant. How does this compare to similar opportunities you might have overlooked in the past?',
      category: 'bias-detection',
    },
  ],
};

/**
 * Select relevant few-shot examples based on context.
 */
export function selectFewShotExamples(
  category: string,
  count: number = 2
): FewShotExample[] {
  const examples = FEW_SHOT_EXAMPLES[category] || [];
  return examples.slice(0, count);
}
