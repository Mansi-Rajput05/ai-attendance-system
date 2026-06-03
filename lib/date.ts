export function getTodayParts() {
  const now = new Date();

  return {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 8),
  };
}
