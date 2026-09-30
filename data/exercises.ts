import storage from "../core/storage";

export interface Exercise {
  id: string;
  name: string;
  bodyParts: string[];
  equipment: string;
  description: string;
  pictogrammeId: string;
  active: boolean;
}

export const EXERCISES_STORAGE_KEY =
  "strnz_exercises";

export const exercises: Exercise[] = [];

let nextExerciseNumber = 1;

export function getNextExerciseNumber(): number {
  return nextExerciseNumber;
}

export function incrementNextExerciseNumber(): void {
  nextExerciseNumber++;
}

export function loadExercises(): void {
  exercises.length = 0;

  const parsedExercises =
    storage.get<
      Array<
        Exercise & {
          category?: string;
          bodyParts?: string[];
        }
      >
    >(
      EXERCISES_STORAGE_KEY,
      []
    );

  const migratedExercises: Exercise[] =
    parsedExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,

      bodyParts:
        Array.isArray(exercise.bodyParts)
          ? exercise.bodyParts
          : exercise.category
            ? [exercise.category]
            : [],

      equipment: exercise.equipment ?? "",
      description: exercise.description ?? "",
      pictogrammeId: exercise.pictogrammeId ?? "",
      active: exercise.active ?? true,
    }));

  exercises.push(...migratedExercises);

  const highestNumber =
    exercises.reduce(
      (highest, exercise) => {
        const match =
          exercise.id.match(/^EX-(\d+)$/);

        if (!match) {
          return highest;
        }

        return Math.max(
          highest,
          Number(match[1])
        );
      },
      0
    );

  nextExerciseNumber =
    highestNumber + 1;
}

export function saveExercises(): void {
  storage.set(
    EXERCISES_STORAGE_KEY,
    exercises
  );
}