import storage from "../core/storage";

export interface Weekly {
  id: string;
  name: string;
  wodId: string;
  date: string;
  description: string;
  score: string;

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

export const WEEKLIES_STORAGE_KEY =
  "strnz_weeklies";

export const weeklies: Weekly[] = [];

let nextWeeklyNumber = 1;

export function getNextWeeklyNumber(): number {
  return nextWeeklyNumber;
}

export function incrementNextWeeklyNumber(): void {
  nextWeeklyNumber++;
}

export function saveWeeklies(): void {
  storage.set(
    WEEKLIES_STORAGE_KEY,
    weeklies
  );
}

export function loadWeeklies(): void {
  weeklies.length = 0;

  const parsedWeeklies =
    storage.get<Weekly[]>(
      WEEKLIES_STORAGE_KEY,
      []
    );

  const migratedWeeklies =
    parsedWeeklies.map(
      (weekly) => ({
        ...weekly,

        production:
          weekly.production ?? {
            visual: "À faire",
            text: "À faire",
            publication: "À faire"
          },

        texts:
          weekly.texts ?? {
            caption: "",
            hashtags: "",
            cta: ""
          }
      })
    );

  weeklies.push(
    ...migratedWeeklies
  );

  const highestNumber =
    weeklies.reduce(
      (highest, weekly) => {
        const match =
          weekly.id.match(
            /^WEEKLY-(\d+)$/
          );

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

  nextWeeklyNumber =
    highestNumber + 1;
}