export function formatTimestamp(srtTime: string): string {
  // srtTime format: HH:MM:SS.mmm
  const [h, m, s] = srtTime.split(":");
  const hours = parseInt(h, 10);
  const minutes = parseInt(m, 10);
  const seconds = Math.floor(parseFloat(s));

  const totalMinutes = hours * 60 + minutes;
  const paddedSeconds = seconds.toString().padStart(2, "0");

  return `${totalMinutes}:${paddedSeconds}`;
}