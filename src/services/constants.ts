import type { TopicIds } from "../types/index.ts";

// HCS Topic IDs
export const TOPICS: Partial<TopicIds> = {
  QUESTIONS: process.env.NEXT_PUBLIC_NEW_QUESTION_TOPIC_ID,
  ANSWERS: process.env.NEXT_PUBLIC_NEW_ANSWER_TOPIC_ID,
  UPDATES: process.env.NEXT_PUBLIC_NEW_UPDATE_TOPIC_ID,
  ACCEPTANCES: process.env.NEXT_PUBLIC_NEW_ACCEPTANCE_TOPIC_ID,
  COMMENTS: process.env.NEXT_PUBLIC_NEW_COMMENT_TOPIC_ID,
};

// Pinata Gateway
export const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
