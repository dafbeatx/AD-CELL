package com.aldea.k.util

import java.math.BigInteger
import java.text.NumberFormat
import java.util.Locale

/** Satu pintu format uang Aldea. Nilai operasional disimpan dalam ribuan rupiah. */
object Money {
    private val locale = Locale.forLanguageTag("id-ID")
    private val thousand = BigInteger.valueOf(1_000L)

    /** Format nilai internal ribuan menjadi Rupiah penuh, tanpa spasi setelah Rp. */
    fun ribuan(value: Long): String = rupiah(BigInteger.valueOf(value).multiply(thousand))

    /** Format nilai yang memang sudah berupa Rupiah penuh (contoh data Kasbon lama). */
    fun rupiah(value: Long): String = rupiah(BigInteger.valueOf(value))

    private fun rupiah(value: BigInteger): String {
        val sign = if (value.signum() < 0) "-" else ""
        val digits = NumberFormat.getIntegerInstance(locale).format(value.abs())
        return "${sign}Rp$digits"
    }

    /** Input angka ribuan; menolak kosong, negatif, pecahan, dan nilai di luar Long. */
    fun parseRibuan(input: String): Long? {
        val raw = input.trim()
        if (raw.isEmpty() || !raw.all { it in '0'..'9' }) return null
        return raw.toLongOrNull()
    }

    /** Konversi input ribuan ke Rupiah penuh dengan pemeriksaan overflow. */
    fun toRupiah(inputRibuan: Long): Long? = try {
        Math.multiplyExact(inputRibuan, 1_000L)
    } catch (_: ArithmeticException) {
        null
    }
}
