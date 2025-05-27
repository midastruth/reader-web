export const localData = {
  set(key: string, value: any) {
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  get(key: string) {
    const stored = window.localStorage.getItem(key);
    return stored === null ? undefined : JSON.parse(stored);
  },
  remove(key: string) {
    window.localStorage.removeItem(key);
  }
}