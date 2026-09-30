import storage from "../core/storage";

export interface Publication {
  id: string;
  wodId: string;
  platform: string;
  scheduledDate: string;
  status: string;
  assetId: string;
  textId: string;
}

export const PUBLICATIONS_STORAGE_KEY =
  "strnz_publications";

export const publications: Publication[] = [];

let nextPublicationNumber = 1;

export function getNextPublicationNumber(): number {
  return nextPublicationNumber;
}

export function incrementNextPublicationNumber(): void {
  nextPublicationNumber++;
}

export function loadPublications(): void {
  publications.length = 0;

  const parsedPublications =
    storage.get<Publication[]>(
      PUBLICATIONS_STORAGE_KEY,
      []
    );

  publications.push(
    ...parsedPublications
  );

  const highestNumber =
    publications.reduce(
      (highest, publication) => {
        const match =
          publication.id.match(
            /^PUB-(\d+)$/
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

  nextPublicationNumber =
    highestNumber + 1;
}

export function savePublications(): void {
  storage.set(
    PUBLICATIONS_STORAGE_KEY,
    publications
  );
}