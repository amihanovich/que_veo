import { createAnthropic } from "@ai-sdk/anthropic";

export const createAiProvider = (apiKey: string) =>
  createAnthropic({ apiKey });
