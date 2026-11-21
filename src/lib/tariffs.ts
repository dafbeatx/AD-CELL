import { Tariff } from '../types';

export const BANK_TARIFFS: Tariff[] = [
  { minimal: 1, maksimal: 203, admin: 3 },
  { minimal: 204, maksimal: 505, admin: 4 },
  { minimal: 506, maksimal: 1005, admin: 5 },
  { minimal: 1006, maksimal: 2008, admin: 8 },
  { minimal: 2009, maksimal: 3010, admin: 10 },
  { minimal: 3011, maksimal: 4015, admin: 15 },
  { minimal: 4016, maksimal: 5020, admin: 20 }
];

export const DANA_OVO_TARIFFS: Tariff[] = [
  { minimal: 1, maksimal: 102, admin: 2 },
  { minimal: 103, maksimal: 303, admin: 3 },
  { minimal: 304, maksimal: 604, admin: 4 },
  { minimal: 605, maksimal: 1005, admin: 5 },
  { minimal: 1006, maksimal: 2008, admin: 8 },
  { minimal: 2009, maksimal: 3010, admin: 10 },
  { minimal: 3011, maksimal: 4015, admin: 15 }
];

export function calculateAdminFee(channel: 'Bank' | 'Dana' | 'Ovo' | 'BCA', nominalRibuan: number): number {
  if (nominalRibuan <= 0) return 0;
  const list = (channel === 'Bank' || channel === 'BCA') ? BANK_TARIFFS : DANA_OVO_TARIFFS;
  const match = list.find(t => nominalRibuan >= t.minimal && nominalRibuan <= t.maksimal);
  return match ? match.admin : 0;
}
