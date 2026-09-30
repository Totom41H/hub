const storage = {
  get<T>(key: string, fallback: T): T {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(
        `Impossible de lire la donnée "${key}" :`,
        error
      );

      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error(
        `Impossible de sauvegarder la donnée "${key}" :`,
        error
      );
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  }
};

export default storage;
