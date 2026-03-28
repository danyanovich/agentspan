export function generateWorldLayout({
  seed = 1,
  width = 24,
  height = 16,
  zoneTypes = ['Knowledge', 'Build', 'Review', 'Archive', 'Utility'],
  zoneCount = 5,
  stationCount = 20
} = {}) {
  const zones = [];
  const stations = [];
  const links = [];

  const columns = Math.ceil(Math.sqrt(zoneCount));
  const rows = Math.ceil(zoneCount / columns);
  const zoneW = Math.floor(width / columns);
  const zoneH = Math.floor(height / rows);

  for (let i = 0; i < zoneCount; i += 1) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    zones.push({
      id: `zone_${i + 1}`,
      name: zoneTypes[i % zoneTypes.length],
      x: col * zoneW,
      y: row * zoneH,
      w: Math.max(4, zoneW - 1),
      h: Math.max(4, zoneH - 1)
    });
  }

  for (let i = 0; i < stationCount; i += 1) {
    const zone = zones[i % zones.length];
    const x = zone.x + 1 + ((seed + i * 3) % Math.max(1, zone.w - 2));
    const y = zone.y + 1 + ((seed + i * 5) % Math.max(1, zone.h - 2));
    stations.push({ id: `station_${i + 1}`, zoneId: zone.id, x, y, type: 'terminal', queueDepth: 0 });
  }

  for (let i = 0; i < stations.length - 1; i += 1) {
    links.push({ id: `link_${i + 1}`, fromId: stations[i].id, toId: stations[i + 1].id, status: 'active' });
  }

  return { seed, width, height, zones, stations, links };
}
