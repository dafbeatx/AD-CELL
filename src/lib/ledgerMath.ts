/**
 * Ledger mathematics engine for Aldea.
 * Exact logic ported from LedgerMath.kt to guarantee 100% calculation consistency.
 */
export const LedgerMath = {
  saldoAkhir(
    saldoAwal: number,
    isi: number,
    setor: number,
    tarik: number,
    transfer: number,
    bagi: number,
    mutasiBersih: number = 0
  ): number {
    return saldoAwal + isi + setor + tarik - transfer - bagi + mutasiBersih;
  },

  omset(transfer: number, laba: number, tarik: number, setorBca: number = 0): number {
    return transfer + laba - tarik - setorBca;
  },

  omsetQris(tarikTunai: number, adminTarik: number, bayarQris: number): number {
    return adminTarik - tarikTunai - bayarQris;
  },

  omsetSetelahPengeluaran(omset: number, pengeluaranAdmin: number, pengeluaranModal: number): number {
    return omset - pengeluaranAdmin - pengeluaranModal;
  },

  labaBersih(labaKotor: number, pengeluaranAdmin: number): number {
    return labaKotor - pengeluaranAdmin;
  },

  omsetProduk(terjual: number, hargaJualRibuan: number): number {
    return terjual * hargaJualRibuan;
  },

  labaProduk(terjual: number, hargaJualRibuan: number, hargaModalRibuan: number): number {
    return terjual * (hargaJualRibuan - hargaModalRibuan);
  },

  saldoPulsa(saldoAwal: number, isiLama: number, isiBaru: number, pemakaian: number): number {
    return saldoAwal + isiLama + isiBaru - pemakaian;
  },

  saldoQris(
    saldoAwal: number,
    tarikTunai: number,
    bayarQris: number,
    pindahSaldo: number,
    mutasiBersih: number = 0
  ): number {
    return Math.max(0, saldoAwal + tarikTunai + bayarQris - pindahSaldo + mutasiBersih);
  }
};
