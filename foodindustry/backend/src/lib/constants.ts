export const DELIVERY_FEE = 4.99;

/**
 * Generates the next few days of pickup/delivery time windows.
 * A lightweight stand-in for full delivery-zone/slot administration
 * (DATA-MODEL.md marks that as a "Should" priority, deferred for now).
 */
export function generateUpcomingSlots(days = 5): string[] {
  const windows = ['08:00 - 10:00', '10:00 - 12:00', '14:00 - 16:00', '16:00 - 18:00'];
  const slots: string[] = [];
  const today = new Date();
  for (let d = 1; d <= days; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateLabel = date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
    for (const window of windows) {
      slots.push(`${dateLabel}, ${window}`);
    }
  }
  return slots;
}
