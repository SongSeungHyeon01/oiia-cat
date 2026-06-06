function calcKps(timestamps, now, windowMs = 2000) {
  const cutoff = now - windowMs;
  const recent = timestamps.filter(t => t >= cutoff);
  return recent.length / (windowMs / 1000);
}

function kpsToRate(kps, sensitivity = 'medium') {
  const divisors = { low: 6, medium: 4, high: 2.5 };
  const d = divisors[sensitivity] ?? 4;
  return Math.min(Math.max(kps / d, 0), 3.0);
}

module.exports = { calcKps, kpsToRate };
