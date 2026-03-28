export class InMemoryEventStore {
  constructor() {
    this.events = [];
    this.subscribers = new Set();
  }

  append(event) {
    this.events.push(event);
    for (const fn of this.subscribers) fn(event);
    return event;
  }

  appendMany(events) {
    for (const event of events) this.append(event);
    return events;
  }

  all() {
    return [...this.events];
  }

  byWorld(worldId) {
    return this.events.filter((e) => e.worldId === worldId);
  }

  subscribe(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  replay(handler) {
    for (const event of this.events) handler(event);
  }
}

export class Outbox {
  constructor() {
    this.queue = [];
  }

  push(event) {
    this.queue.push({ event, delivered: false });
  }

  nextUndelivered() {
    return this.queue.find((x) => !x.delivered) ?? null;
  }

  markDelivered(eventId) {
    const item = this.queue.find((x) => x.event.id === eventId);
    if (item) item.delivered = true;
  }
}
