import storage from "../core/storage";

export type WodUnit =
  | "reps"
  | "time"
  | "distance"
  | "weight"
  | "calories"
  | "custom";

export interface WodLevelExercise {
  exerciseId: string;
  value: string;
  unit: WodUnit;
  notes: string;
}

export interface Wod {
  id: string;
  name: string;
  type: string;
  focal: string;
  duration: string;
  equipment: string;
  exercises: string[];
  levels: string[];

  prescriptions: {
    BEGINNER: WodLevelExercise[];
    INTERMEDIATE: WodLevelExercise[];
    ADVANCED: WodLevelExercise[];
  };

  score: string;
  date: string;

  production: {
    visual: string;
    text: string;
    publication: string;
  };

  texts: {
    caption: string;
    hashtags: string;
    cta: string;
  };

  status: string;
}

export const WODS_STORAGE_KEY = "strnz_wods";

export const wods: Wod[] = [];

let nextWodNumber = 1;

export function getNextWodNumber(): number {
  return nextWodNumber;
}

export function incrementNextWodNumber(): void {
  nextWodNumber++;
}

export function saveWods(): void {
  storage.set(WODS_STORAGE_KEY, wods);
}

export function loadWods(): void {
  wods.length = 0;

  const storedWods =
    storage.get<Wod[]>(
      WODS_STORAGE_KEY,
      []
    );

  wods.push(...storedWods);

  const highestNumber =
    wods.reduce(
      (highest, wod) => {
        const match =
          wod.id.match(/^WOD-(\d+)$/);

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

  nextWodNumber =
    highestNumber + 1;
}