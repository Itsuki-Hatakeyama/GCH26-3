import { gemini } from "@/lib/gemini";
import { buildSimplifyMessagePrompt } from "@/lib/prompts/simplify-message";
import { buildExplainCodePrompt } from "@/lib/prompts/explain-code";
import { buildQualityScorePrompt, type QualityScoreOutput } from "@/lib/prompts/quality-score";

export interface CommitSummaryResult {
  simplified_message: string;
  code_explanation: string;
  frontend_changes: string | null;
  added_technologies: unknown[] | null;
  removed_technologies: unknown[] | null;
  technology_categories: Record<string, string[]> | null;
  message_quality_score: number | null;
  message_quality_feedback: string | null;
  llm_model: string;
}

export const summaryService = {
  async generate(commitMessage: string, diff: string): Promise<CommitSummaryResult> {
    const [simplifiedMessage, codeExplanation, qualityResult] = await Promise.all([
      gemini.generateText(buildSimplifyMessagePrompt(commitMessage)),
      gemini.generateText(buildExplainCodePrompt(commitMessage, diff)),
      gemini.generateJSON<QualityScoreOutput>(buildQualityScorePrompt(commitMessage)),
    ]);

    const feedback = qualityResult.suggestion
      ? `${qualityResult.feedback}\n改善案: ${qualityResult.suggestion}`
      : qualityResult.feedback;

    return {
      simplified_message: simplifiedMessage.trim(),
      code_explanation: codeExplanation.trim(),
      frontend_changes: null,
      added_technologies: null,
      removed_technologies: null,
      technology_categories: null,
      message_quality_score: qualityResult.score,
      message_quality_feedback: feedback,
      llm_model: "gemini-1.5-flash",
    };
  },
};
