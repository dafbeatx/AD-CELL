package com.aldea.k.util

/** Rumus dasar mesin Aldea. Semua nilai uang operasional berada dalam satuan ribuan. */
object LedgerMath {
    fun saldoAkhir(
        saldoAwal: Long,
        isi: Long,
        setor: Long,
        tarik: Long,
        transfer: Long,
        bagi: Long,
        mutasiBersih: Long
    ): Long = saldoAwal + isi + setor + tarik - transfer - bagi + mutasiBersih

    fun omset(transfer: Long, laba: Long, tarik: Long, setorBca: Long = 0L): Long =
        transfer + laba - tarik - setorBca

    /** Omset QRIS: Tarik Tunai mengikuti rumus rekening (admin - nominal),
     * sedangkan Bayar QRIS mengurangi omset sebesar nominal pembayaran. */
    fun omsetQris(tarikTunai: Long, adminTarik: Long, bayarQris: Long): Long =
        adminTarik - tarikTunai - bayarQris

    /** Admin dan Modal sama-sama mengurangi Omset. */
    fun omsetSetelahPengeluaran(omset: Long, pengeluaranAdmin: Long, pengeluaranModal: Long): Long =
        omset - pengeluaranAdmin - pengeluaranModal

    /** Hanya Pengeluaran Admin yang mengurangi Laba Bersih. */
    fun labaBersih(labaKotor: Long, pengeluaranAdmin: Long): Long = labaKotor - pengeluaranAdmin

    fun omsetProduk(terjual: Long, hargaJualRibuan: Long): Long =
        Math.multiplyExact(terjual, hargaJualRibuan)

    fun labaProduk(terjual: Long, hargaJualRibuan: Long, hargaModalRibuan: Long): Long =
        Math.multiplyExact(terjual, hargaJualRibuan - hargaModalRibuan)

    fun saldoPulsa(
        saldoAwal: Long,
        isiLama: Long,
        isiBaru: Long,
        pemakaian: Long
    ): Long = saldoAwal + isiLama + isiBaru - pemakaian

    fun saldoQris(
        saldoAwal: Long,
        tarikTunai: Long,
        bayarQris: Long,
        pindahSaldo: Long,
        mutasiBersih: Long
    ): Long = (saldoAwal + tarikTunai + bayarQris - pindahSaldo + mutasiBersih).coerceAtLeast(0L)
}
