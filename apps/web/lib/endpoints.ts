// The only place API paths and page routes are written as strings.

export const api = {
  register: "/auth/register",
  login: "/auth/login",
  me: "/auth/me",
  quizzes: "/quizzes",
  quiz: (id: string) => `/quizzes/${id}`,
  quizQuestions: (id: string) => `/quizzes/${id}/questions`,
  quizQuestion: (id: string, qid: string) => `/quizzes/${id}/questions/${qid}`,
  publish: (id: string) => `/quizzes/${id}/publish`,
  publicQuiz: (permalink: string) => `/public/quizzes/${permalink}`,
  submit: (permalink: string) => `/public/quizzes/${permalink}/submit`,
} as const;

export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  newQuiz: "/quizzes/new",
  editQuiz: (id: string) => `/quizzes/${id}/edit`,
  take: (permalink: string) => `/q/${permalink}`,
} as const;
