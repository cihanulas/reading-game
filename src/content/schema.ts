import type { AgeGroup } from '../lang';

interface QuestionBase {
  id: string;
  prompt: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multipleChoice';
  options: string[];
  answer: number;
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'trueFalse';
  answer: boolean;
}

export interface OrderingQuestion extends QuestionBase {
  type: 'ordering';
  /** Listed in the correct order; the UI shuffles them. */
  items: string[];
}

export interface WordRecallQuestion extends QuestionBase {
  type: 'wordRecall';
  options: string[];
  answer: number;
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | OrderingQuestion | WordRecallQuestion;

export interface GlossaryEntry {
  word: string;
  meaning: string;
}

/** level 0 = placement test text, 1-5 = game levels. */
export interface ReadingText {
  id: string;
  lang: string;
  ageGroup: AgeGroup;
  level: number;
  title: string;
  author: string;
  source: string;
  simplified: boolean;
  body: string;
  glossary: GlossaryEntry[];
  questions: Question[];
}

export const PLACEMENT_LEVEL = 0;
export const MAX_LEVEL = 5;
