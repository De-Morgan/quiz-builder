# Quiz Builder — Product Requirements Document

## Overview

Quiz Builder lets authenticated users create quizzes and share them with anonymous visitors, who can take the quiz without signing in and immediately see their score.

## Problem statement

Creating and sharing a lightweight quiz today requires either a heavyweight survey tool or custom one-off code. Quiz Builder should let a signed-in user assemble a quiz in minutes and distribute it via a short, shareable link, with no signup friction for the people taking it.

## Goals

- Let authenticated users create, edit, and publish quizzes.
- Let anonymous visitors take a published quiz via a short permalink and see an immediate score.
- Keep the API fully decoupled from the client, so any front end (web, mobile, etc.) can be built against it without server changes.

## Non-goals

- Recording or persisting visitor answers or results.
- Quiz analytics, leaderboards, or result history for authors.
- Editing a quiz after it has been published (only deletion is supported post-publish).

## User personas

- **Quiz author** — an authenticated user who creates and manages their own quizzes.
- **Visitor** — an unauthenticated person who follows a shared permalink to take a quiz.

## User stories

- As a visitor, I can register and sign in with email and password (or via a third-party auth provider such as Auth0/Firebase) so I can create quizzes.
- As an author, I can create a quiz with a title and 1–10 questions, each with 1–5 possible answers.
- As an author, I can mark a question as single-correct-answer or multiple-correct-answer.
- As an author, I can publish a quiz, at which point it receives a permalink and can no longer be edited (only deleted).
- As an author, I only see and manage my own quizzes.
- As a visitor, I can open a quiz via its permalink without signing in and answer its questions.
- As a visitor, for multiple-answer questions I must select **all** correct answers for the question to count as correct.
- As a visitor, after completing a quiz I see my score, e.g. "You answered 5/8 questions correctly."

## Functional requirements

| #    | Requirement                                                                                                                                                                                               |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR1  | Users must authenticate to create a quiz; authenticated users can create any number of quizzes.                                                                                                           |
| FR2  | Each user can only view and manage their own quizzes (they may still take other users' quizzes as a visitor).                                                                                             |
| FR3  | A quiz consists of a title and a list of questions.                                                                                                                                                       |
| FR4  | Each question has question text and a list of possible answers.                                                                                                                                           |
| FR5  | Each question is either single-answer or multiple-answer; visitors must be able to tell which type they're answering, and the UI must prevent selecting more than one answer on a single-answer question. |
| FR6  | A quiz can be published. On publish, it is assigned a permalink and becomes shareable.                                                                                                                    |
| FR7  | The permalink is a randomly generated 6-character alphanumeric sequence.                                                                                                                                  |
| FR8  | Once published, a quiz cannot be edited by its author — only deleted.                                                                                                                                     |
| FR9  | Visitors do not need to be authenticated to take a quiz via its permalink.                                                                                                                                |
| FR10 | On completion, the visitor sees their score as a count of correct answers (e.g., "5/8 questions correctly"). Visitor answers/results are not persisted.                                                   |

### Example question types

- Single-answer: "Moon is a star" → Yes / No
- Multiple-answer: "Temperature can be measured in" → Kelvin / Fahrenheit / Grams / Celsius / Liters (all correct options must be selected)

## Technical requirements

- The system has a client and a server component.
- The server exposes a GraphQL or RESTful API, independent of any front end — a different client (e.g., a mobile app) must be buildable against it without server changes.
- The client is a single-page application. Server-rendered fragment frameworks (e.g., Turbolinks/Hotwire) are not acceptable.
- The system must handle edge cases and unexpected input gracefully.
- The system must apply sound security practices and data validation throughout.
