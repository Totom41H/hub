import storage from "../core/storage";

export interface Text {
  id: string;
  type: string;
  content: string;
  status: string;
  date: string;
  wodId: string;
}

export const TEXTS_STORAGE_KEY =
  "strnz_texts";

export const texts: Text[] = [];

let nextTextNumber = 1;

export function getNextTextNumber(): number {
  return nextTextNumber;
}

export function incrementNextTextNumber(): void {
  nextTextNumber++;
}

export function loadTexts(): void {
  texts.length = 0;

  const parsedTexts =
    storage.get<Text[]>(
      TEXTS_STORAGE_KEY,
      []
    );

  texts.push(
    ...parsedTexts
  );

  const highestNumber =
    texts.reduce(
      (highest, text) => {
        const match =
          text.id.match(
            /^TEXT-(\d+)$/
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

  nextTextNumber =
    highestNumber + 1;
}

export function saveTexts(): void {
  storage.set(
    TEXTS_STORAGE_KEY,
    texts
  );
}