export interface CourseChoice {
  id: string;
  label: string;
  isCorrect: boolean;
  feedback: string;
}

export interface CourseModule {
  id: string;
  title: string;
  summary: string;
  body: string;
  bullets: string[];
  question: string;
  choices: CourseChoice[];
}

export interface CoursePack {
  slug: string;
  version: number;
  passThresholdPct: number;
  estimatedMinutes: number;
  modules: CourseModule[];
}

export interface AcademyAttemptPayload {
  kind: 'course_attempt';
  moduleScores: Record<string, number>;
  quizAnswers: Record<string, string>;
  durationSeconds: number;
}
