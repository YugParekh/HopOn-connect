const getEventDateTime = (event) => {
  if (!event?.date) return null;

  const rawDate = String(event.date).trim();
  if (!rawDate) return null;

  const rawTime = String(event.time || "").trim();
  const combined = rawTime ? `${rawDate}T${rawTime}` : rawDate;

  const parsed = new Date(combined);
  if (Number.isNaN(parsed.getTime())) {
    const fallback = new Date(rawDate);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  return parsed;
};

const hasEventEnded = (event) => {
  const eventDateTime = getEventDateTime(event);
  if (!eventDateTime) return false;
  return eventDateTime.getTime() < Date.now();
};

module.exports = {
  getEventDateTime,
  hasEventEnded,
};
