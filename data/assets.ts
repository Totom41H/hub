import storage from "../core/storage";

export interface FileAsset {
  id: string;
  name: string;
  type: string;
  size: number;
  date: string;
}

export const FILES_STORAGE_KEY = "strnz_files";

// Keep one stable array reference so core/state.ts never becomes stale.
export const files: FileAsset[] = [];

let nextFileNumber = 1;

export function getNextFileNumber(): number {
  return nextFileNumber;
}

export function incrementNextFileNumber(): void {
  nextFileNumber++;
}

export function loadFiles(): void {
  files.length = 0;

  const parsedFiles = storage.get<FileAsset[]>(
    FILES_STORAGE_KEY,
    []
  );

  files.push(...parsedFiles);

  const highestNumber = files.reduce((highest, file) => {
    const match = file.id.match(/^FILE-(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  nextFileNumber = highestNumber + 1;
}

export function saveFiles(): void {
  storage.set(FILES_STORAGE_KEY, files);
}
