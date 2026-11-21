/**
 * Money formatting & calculation utilities for Aldea.
 * Most operational values inside Aldea are in 'ribuan' (thousands) except Kasbon.
 */
export const Money = {
  /** Format nilai ribuan (contoh: 10 -> Rp10.000) */
  ribuan(val: number): string {
    const full = Math.round(val) * 1000;
    return this.rupiah(full);
  },

  /** Format nilai rupiah penuh (contoh: 10000 -> Rp10.000) */
  rupiah(val: number): string {
    const isNeg = val < 0;
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('id-ID').format(absVal);
    return `${isNeg ? '-' : ''}Rp${formatted}`;
  },

  /** Parse string input angka ribuan (hanya angka positif) */
  parseRibuan(input: string): number {
    const clean = input.replace(/[^0-9]/g, '');
    if (!clean) return 0;
    return parseInt(clean, 10) || 0;
  },

  /** Konversi nilai ribuan ke rupiah penuh */
  toRupiah(valRibuan: number): number {
    return valRibuan * 1000;
  }
};
