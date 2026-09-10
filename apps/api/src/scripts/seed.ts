/**
 * Demo-data seed script.
 *
 * Boots the real Nest application context and reuses `AuthService` and
 * `QuizzesService` so every domain invariant (email normalization, bcrypt
 * hashing, question/answer rules, permalink generation) is enforced exactly
 * as it would be through the HTTP API.
 *
 * The script is additive and idempotent:
 *   - the demo user is skipped if the email is already registered
 *   - a quiz is skipped if the demo user already owns one with the same title
 * It never deletes data, so it is safe to re-run.
 *
 * Run with:  pnpm db:seed   (from apps/api, after `pnpm docker:start` + `pnpm db:deploy`)
 */
import { ConflictException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DatabaseService } from '../database/database.service';
import { QuestionType } from '../database/generated/enums';
import { AuthService } from '../modules/auth/auth.service';
import { CreateQuizDto } from '../modules/quizzes/dto/create-quiz.dto';
import { QuizzesService } from '../modules/quizzes/quizzes.service';

const DEMO_USER = {
  email: 'user@demo.com',
  password: 'password',
};

interface DemoQuiz {
  quiz: CreateQuizDto;
  publish: boolean;
}

const log = (msg: string): void => console.log(msg);

const single = (
  text: string,
  answers: [string, boolean][],
): CreateQuizDto['questions'][number] => ({
  text,
  type: QuestionType.SINGLE,
  answers: answers.map(([t, isCorrect]) => ({ text: t, isCorrect })),
});

const multiple = (
  text: string,
  answers: [string, boolean][],
): CreateQuizDto['questions'][number] => ({
  text,
  type: QuestionType.MULTIPLE,
  answers: answers.map(([t, isCorrect]) => ({ text: t, isCorrect })),
});

// Two quizzes, one draft (Science) and one published (TypeScript). Each has
// exactly 10 simple questions with a varying number of answers (2–5), a mix of
// SINGLE and MULTIPLE types, and full-sentence answer options.
const DEMO_QUIZZES: DemoQuiz[] = [
  {
    publish: false,
    quiz: {
      title: 'Science Quiz',
      questions: [
        single('What happens to most liquids when they are heated enough?', [
          [
            'They boil and turn into a gas as the molecules gain energy and spread apart',
            true,
          ],
          [
            'They freeze into a solid because heat removes energy from the molecules',
            false,
          ],
          [
            'They stay exactly the same because temperature has no effect on liquids',
            false,
          ],
        ]),
        single('Which process do green plants use to make their own food?', [
          [
            'Photosynthesis, in which sunlight, water and carbon dioxide are turned into sugar and oxygen',
            true,
          ],
          [
            'Digestion, in which the plant breaks down food it has swallowed through its roots',
            false,
          ],
          [
            'Condensation, in which water vapour in the air collects on the leaves overnight',
            false,
          ],
          [
            'Combustion, in which the plant slowly burns nutrients stored in the soil',
            false,
          ],
        ]),
        single('Why do objects fall towards the ground when you drop them?', [
          [
            'The Earth’s gravity pulls every nearby object towards its centre',
            true,
          ],
          [
            'The air above the object constantly pushes it downwards with great force',
            false,
          ],
          [
            'Objects naturally move towards whatever surface is closest to them',
            false,
          ],
        ]),
        multiple(
          'Which of these statements about the water cycle are correct?',
          [
            [
              'Water evaporates from oceans and lakes when it is warmed by the Sun',
              true,
            ],
            [
              'Water vapour cools high in the atmosphere and condenses into clouds',
              true,
            ],
            [
              'Rain, snow and hail return water to the surface as precipitation',
              true,
            ],
            [
              'Clouds are made of tiny grains of dust that never contain any water',
              false,
            ],
          ],
        ),
        multiple('Which of the following are planets in our solar system?', [
          [
            'Mars, a rocky planet whose iron-rich dust gives it a reddish colour',
            true,
          ],
          [
            'Jupiter, the largest planet, made mostly of hydrogen and helium gas',
            true,
          ],
          [
            'The Moon, which orbits the Earth rather than orbiting the Sun directly',
            false,
          ],
          ['Neptune, a cold, windy blue planet far from the Sun', true],
          [
            'The Sun, which is actually the star at the centre of the solar system',
            false,
          ],
        ]),
        single(
          'What is the smallest unit that still counts as a chemical element?',
          [
            [
              'An atom, which cannot be broken into a simpler substance by chemical means',
              true,
            ],
            [
              'A molecule, which is always made of two or more atoms joined together',
              false,
            ],
            [
              'A mixture, in which several substances are combined but not chemically bonded',
              false,
            ],
            [
              'A compound, which is formed when different elements react and bond together',
              false,
            ],
          ],
        ),
        multiple(
          'Which of these are things a healthy ecosystem usually needs?',
          [
            [
              'Producers such as plants that capture energy from sunlight',
              true,
            ],
            [
              'Consumers such as animals that feed on plants or on other animals',
              true,
            ],
            [
              'Decomposers such as fungi and bacteria that recycle dead material',
              true,
            ],
            [
              'A complete absence of water so that nothing can grow or spread',
              false,
            ],
          ],
        ),
      ],
    },
  },
  {
    publish: true,
    quiz: {
      title: 'TypeScript Quiz',
      questions: [
        single('What is TypeScript best described as?', [
          [
            'A typed superset of JavaScript that compiles down to plain JavaScript',
            true,
          ],
          [
            'A separate runtime that replaces Node.js and executes .ts files directly in production',
            false,
          ],
          [
            'A CSS framework that adds static typing to stylesheets and design tokens',
            false,
          ],
        ]),
        single('What does the `unknown` type give you that `any` does not?', [
          [
            'It forces you to narrow or assert the value before you can operate on it',
            true,
          ],
          [
            'It silently disables all type checking for the rest of the file',
            false,
          ],
          ['It automatically converts the value to a string at runtime', false],
          [
            'It is an alias for `object` and only accepts non-primitive values',
            false,
          ],
        ]),
        single(
          'What is the difference between `interface` and `type` for object shapes?',
          [
            [
              'Interfaces support declaration merging, while type aliases can also express unions and mapped types',
              true,
            ],
            [
              'Type aliases are checked at runtime, while interfaces are erased during compilation',
              false,
            ],
            [
              'Interfaces cannot describe function types, but type aliases can',
              false,
            ],
          ],
        ),
        multiple('Which statements about `enum` in TypeScript are correct?', [
          [
            'Numeric enums emit a real object at runtime with reverse mappings from value to name',
            true,
          ],
          [
            '`const enum` members are inlined at their use sites and emit no object',
            true,
          ],
          ['String enums are not given reverse mappings', true],
          [
            'Enums are purely a type-level construct and never appear in the compiled output',
            false,
          ],
        ]),
        single('What does the `strict` compiler flag do?', [
          [
            'It turns on a family of stricter checks, including strictNullChecks and noImplicitAny',
            true,
          ],
          [
            'It makes the compiler treat every warning as a build-breaking error only in CI',
            false,
          ],
          [
            'It forces all modules to use CommonJS instead of ES module syntax',
            false,
          ],
        ]),
        single(
          'Given `type T = A extends B ? X : Y`, what kind of type is this?',
          [
            [
              'A conditional type that resolves to X or Y depending on assignability of A to B',
              true,
            ],
            [
              'A runtime ternary that TypeScript evaluates when the module is imported',
              false,
            ],
            [
              'An intersection type that always combines X and Y into one shape',
              false,
            ],
            [
              'A syntax error, because `extends` is only allowed on interfaces and classes',
              false,
            ],
          ],
        ),
        multiple('Which of these are genuine TypeScript utility types?', [
          ['`Partial<T>`, which makes every property of T optional', true],
          ['`Pick<T, K>`, which builds a type from a subset of T’s keys', true],
          [
            '`Record<K, V>`, which maps a set of keys K to a value type V',
            true,
          ],
          [
            '`Mutable<T>`, a built-in type that strips `readonly` from every property',
            false,
          ],
        ]),
        multiple('Which statements about generics in TypeScript are true?', [
          [
            'A generic parameter can be constrained with `extends` to require certain properties',
            true,
          ],
          [
            'Generic type parameters are erased and do not exist at runtime',
            true,
          ],
          [
            'Every generic function call must be given its type arguments explicitly',
            false,
          ],
        ]),
        single('What does the non-null assertion operator `!` do?', [
          [
            'It tells the compiler a value is not null or undefined, without any runtime check',
            true,
          ],
          [
            'It throws a TypeError at runtime if the value turns out to be null',
            false,
          ],
          [
            'It converts `null` and `undefined` into a default empty value',
            false,
          ],
        ]),
        single(
          'How does structural typing decide if two types are compatible?',
          [
            [
              'By comparing the shape of their members rather than their declared names',
              true,
            ],
            [
              'By checking that both types were declared in the same module',
              false,
            ],
            [
              'By requiring an explicit `implements` clause between them',
              false,
            ],
          ],
        ),
      ],
    },
  },
];

async function resolveOwnerId(
  auth: AuthService,
  db: DatabaseService,
): Promise<string> {
  try {
    const res = await auth.register(DEMO_USER);
    log(`Created demo user ${DEMO_USER.email}`);
    return res.user.id;
  } catch (err) {
    if (!(err instanceof ConflictException)) throw err;
    log(`Demo user ${DEMO_USER.email} already exists — reusing it`);
    const user = await db.user.findUniqueOrThrow({
      where: { email: DEMO_USER.email.trim().toLowerCase() },
    });
    return user.id;
  }
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const auth = app.get(AuthService);
    const quizzes = app.get(QuizzesService);
    const db = app.get(DatabaseService);

    const ownerId = await resolveOwnerId(auth, db);

    const existingTitles = new Set(
      (await quizzes.findAllForOwner(ownerId)).map((q) => q.title),
    );

    let created = 0;
    let skipped = 0;
    const links: string[] = [];

    for (const { quiz, publish } of DEMO_QUIZZES) {
      if (existingTitles.has(quiz.title)) {
        skipped += 1;
        log(`Skipped "${quiz.title}" — already exists`);
        continue;
      }

      const detail = await quizzes.create(ownerId, quiz);
      created += 1;

      if (publish) {
        const { permalink } = await quizzes.publish(detail.id, ownerId);
        links.push(`  "${quiz.title}" → /q/${permalink}`);
        log(`Created + published "${quiz.title}" (${permalink})`);
      } else {
        log(`Created draft "${quiz.title}"`);
      }
    }

    log('--------------------------------------------------');
    log(`Demo login:  ${DEMO_USER.email}  /  ${DEMO_USER.password}`);
    log(`Quizzes created: ${created}, skipped: ${skipped}`);
    if (links.length) {
      log('Published take-quiz links (web on http://localhost:3000):');
      links.forEach((l) => log(l));
    }
    log('--------------------------------------------------');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
