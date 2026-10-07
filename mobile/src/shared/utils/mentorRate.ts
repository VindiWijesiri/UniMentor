export function getMentorRate(mentor: { _id?: string; name: string; hourlyRate?: number }): number {
  if (typeof mentor.hourlyRate === 'number' && mentor.hourlyRate > 0) {
    return mentor.hourlyRate;
  }
  const idStr = mentor._id || mentor.name || 'mentor';
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) >>> 0;
  }
  const rates = [1200, 1500, 1800, 2000, 2200, 2500, 2800, 3200, 3500, 3800, 4200, 4500];
  return rates[hash % rates.length];
}
