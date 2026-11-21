package com.aldea.k.screens

import android.app.AlertDialog
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.widget.*
import com.aldea.k.MainActivity
import com.aldea.k.data.AldeaRepository
import com.aldea.k.ui.*
import com.aldea.k.util.Money
import org.json.JSONObject

/** Buku Kasbon mandiri: tidak terhubung ke transaksi, omset, saldo, atau Totalan. */
class KasbonScreen(private val a: MainActivity, private val r: AldeaRepository) {
    private var showLunas = false

    fun view(): View {
        val root = Ui.root()
        root.addView(Ui.header("Buku Kasbon", { a.showMain() }))

        val summary = LinearLayout(App.ctx).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(Ui.dp(14), Ui.dp(10), Ui.dp(14), Ui.dp(10))
            setBackgroundColor(Ui.BLUE)
        }
        summary.addView(Ui.text("TOTAL PIUTANG AKTIF", 12f, Ui.WHITE, true))
        val total = Ui.text("Rp0", 25f, Ui.WHITE, true)
        summary.addView(total)
        val count = Ui.text("0 catatan belum lunas", 12f, Ui.WHITE)
        summary.addView(count)
        root.addView(summary, android.widget.LinearLayout.LayoutParams(-1, Ui.dp(92)))

        val tabs = LinearLayout(App.ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(Ui.dp(8), Ui.dp(7), Ui.dp(8), Ui.dp(7))
            setBackgroundColor(Ui.CREAM)
        }
        val scroll = Ui.scroll()
        val list = LinearLayout(App.ctx).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(Ui.dp(9), Ui.dp(5), Ui.dp(9), Ui.dp(12))
        }
        lateinit var activeBtn: Button
        lateinit var closedBtn: Button
        activeBtn = Ui.btn("Belum Lunas") { showLunas = false; render(list, total, count, activeBtn, closedBtn) }
        closedBtn = Ui.btn("Sudah Lunas") { showLunas = true; render(list, total, count, activeBtn, closedBtn) }
        tabs.addView(activeBtn, LinearLayout.LayoutParams(0, Ui.dp(42), 1f).apply { setMargins(Ui.dp(3), 0, Ui.dp(3), 0) })
        tabs.addView(closedBtn, LinearLayout.LayoutParams(0, Ui.dp(42), 1f).apply { setMargins(Ui.dp(3), 0, Ui.dp(3), 0) })
        root.addView(tabs)

        scroll.addView(list)
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        root.addView(Ui.footer("+ Kasbon" to { addDialog { render(list, total, count, activeBtn, closedBtn) } }, "Kembali" to { a.showMain() }), LinearLayout.LayoutParams(-1, Ui.dp(60)))
        render(list, total, count, activeBtn, closedBtn)
        return root
    }

    private fun render(list: LinearLayout, total: TextView, count: TextView, activeBtn: Button, closedBtn: Button) {
        val all = r.kasbonEntries()
        val active = all.filter { r.kasbonRemaining(it) > 0 }
        total.text = Money.rupiah(active.sumOf { r.kasbonRemaining(it).toLong() })
        count.text = "${active.size} catatan belum lunas"
        activeBtn.isEnabled = showLunas
        closedBtn.isEnabled = !showLunas
        list.removeAllViews()
        val entries = if (showLunas) all.filter { r.kasbonRemaining(it) == 0 } else active
        if (entries.isEmpty()) {
            list.addView(Ui.text(if (showLunas) "Belum ada kasbon yang lunas." else "Belum ada kasbon aktif.\nTekan + Kasbon untuk mencatat piutang.", 15f, Ui.MUTED).apply {
                gravity = Gravity.CENTER
                setPadding(Ui.dp(18), Ui.dp(35), Ui.dp(18), Ui.dp(35))
            })
            return
        }
        entries.forEach { entry ->
            val remaining = r.kasbonRemaining(entry)
            val card = Ui.card().apply { setPadding(Ui.dp(13), Ui.dp(11), Ui.dp(13), Ui.dp(11)) }
            val top = LinearLayout(App.ctx).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
            top.addView(Ui.text(entry.optString("nama"), 17f, Ui.BLUE, true), LinearLayout.LayoutParams(0, -2, 1f))
            top.addView(Ui.text(if (remaining == 0) "LUNAS" else "BELUM LUNAS", 10f, if (remaining == 0) 0xFF27834A.toInt() else Ui.RED, true))
            card.addView(top)
            card.addView(Ui.text("Tanggal: ${entry.optString("tanggal")}", 11f, Ui.MUTED))
            card.addView(Ui.text("Kasbon: ${Money.rupiah(entry.optLong("nominal"))}", 13f, Ui.TEXT))
            card.addView(Ui.text("Sisa: ${Money.rupiah(remaining.toLong())}", 15f, if (remaining == 0) 0xFF27834A.toInt() else Ui.BLUE, true))
            if (entry.optString("catatan").isNotBlank()) card.addView(Ui.text(entry.optString("catatan"), 12f, Ui.MUTED))
            card.setOnClickListener { detailDialog(entry) { render(list, total, count, activeBtn, closedBtn) } }
            list.addView(card, LinearLayout.LayoutParams(-1, -2).apply { setMargins(0, Ui.dp(5), 0, Ui.dp(7)) })
        }
    }

    private fun addDialog(done: () -> Unit) {
        val panel = formPanel()
        val nama = Ui.input("Nama pelanggan")
        val nominal = Ui.input("Nominal kasbon (ribuan) — 100 = Rp100.000").apply { inputType = InputType.TYPE_CLASS_NUMBER }
        val catatan = Ui.input("Catatan (opsional)")
        panel.addView(Ui.text("Nama pelanggan", 12f, Ui.MUTED, true)); panel.addView(nama, fieldParams())
        panel.addView(Ui.text("Nominal", 12f, Ui.MUTED, true)); panel.addView(nominal, fieldParams())
        panel.addView(Ui.text("Catatan", 12f, Ui.MUTED, true)); panel.addView(catatan, fieldParams())
        val dialog = AlertDialog.Builder(a).setTitle("Tambah Kasbon").setView(panel)
            .setNegativeButton("Batal", null).setPositiveButton("Simpan", null).create()
        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val amount = Money.parseRibuan(nominal.text.toString())
                if (nama.text.isNullOrBlank() || amount == null || amount <= 0L || amount > Int.MAX_VALUE / 1000L) {
                    Toast.makeText(a, "Isi nama dan nominal kasbon yang benar.", Toast.LENGTH_SHORT).show()
                } else {
                    if(r.addKasbon(nama.text.toString(), amount.toInt(), catatan.text.toString())) {
                        dialog.dismiss(); done()
                    } else {
                        Toast.makeText(a, "Nominal kasbon di luar batas.", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
        dialog.show()
    }

    private fun detailDialog(entry: JSONObject, done: () -> Unit) {
        val panel = formPanel()
        val paid = r.kasbonPaid(entry)
        val remaining = r.kasbonRemaining(entry)
        panel.addView(Ui.text(entry.optString("nama"), 19f, Ui.BLUE, true))
        panel.addView(Ui.text("Tanggal kasbon: ${entry.optString("tanggal")}", 12f, Ui.MUTED))
        panel.addView(Ui.text("Nominal: ${Money.rupiah(entry.optLong("nominal"))}", 14f, Ui.TEXT))
        panel.addView(Ui.text("Sudah dibayar: ${Money.rupiah(paid.toLong())}", 14f, Ui.TEXT))
        panel.addView(Ui.text("Sisa tagihan: ${Money.rupiah(remaining.toLong())}", 17f, Ui.BLUE, true))
        if (entry.optString("catatan").isNotBlank()) panel.addView(Ui.text("Catatan: ${entry.optString("catatan")}", 12f, Ui.MUTED))
        panel.addView(Ui.text("Riwayat pembayaran", 13f, Ui.BLUE, true).apply { setPadding(0, Ui.dp(12), 0, Ui.dp(4)) })
        val payments = entry.optJSONArray("pembayaran")
        if (payments == null || payments.length() == 0) {
            panel.addView(Ui.text("Belum ada pembayaran.", 12f, Ui.MUTED))
        } else {
            for (i in 0 until payments.length()) {
                val p = payments.optJSONObject(i) ?: continue
                panel.addView(Ui.text("${p.optString("tanggal")}  •  ${Money.rupiah(p.optLong("jumlah"))}", 12f, Ui.TEXT))
                if (p.optString("catatan").isNotBlank()) panel.addView(Ui.text("   ${p.optString("catatan")}", 11f, Ui.MUTED))
            }
        }
        val dialog = AlertDialog.Builder(a).setTitle("Detail Kasbon").setView(panel)
            .setNegativeButton("Tutup", null)
            .setPositiveButton(if (remaining > 0) "Catat Pembayaran" else "Lunas", null).create()
        dialog.setOnShowListener {
            val button = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            button.isEnabled = remaining > 0
            button.setOnClickListener {
                dialog.dismiss()
                paymentDialog(entry, done)
            }
        }
        dialog.show()
    }

    private fun paymentDialog(entry: JSONObject, done: () -> Unit) {
        val remaining = r.kasbonRemaining(entry)
        val panel = formPanel()
        panel.addView(Ui.text("Pelanggan: ${entry.optString("nama")}", 14f, Ui.BLUE, true))
        panel.addView(Ui.text("Sisa tagihan: ${Money.rupiah(remaining.toLong())}", 14f, Ui.TEXT))
        val amount = Ui.input("Nominal pembayaran (ribuan) — 25 = Rp25.000").apply { inputType = InputType.TYPE_CLASS_NUMBER }
        val note = Ui.input("Catatan pembayaran (opsional)")
        panel.addView(Ui.text("Jumlah dibayar", 12f, Ui.MUTED, true)); panel.addView(amount, fieldParams())
        panel.addView(Ui.text("Catatan", 12f, Ui.MUTED, true)); panel.addView(note, fieldParams())
        val dialog = AlertDialog.Builder(a).setTitle("Catat Pembayaran").setView(panel)
            .setNegativeButton("Batal", null).setPositiveButton("Simpan", null).create()
        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val parsed = Money.parseRibuan(amount.text.toString())
                val value = if (parsed != null && parsed <= Int.MAX_VALUE / 1000L) (parsed * 1000L).toInt() else 0
                if (value <= 0 || value > remaining) {
                    Toast.makeText(a, "Nominal harus lebih dari 0 dan tidak melebihi sisa tagihan.", Toast.LENGTH_LONG).show()
                } else if (r.addKasbonPayment(entry.optString("id"), value, note.text.toString())) {
                    dialog.dismiss(); done()
                } else {
                    Toast.makeText(a, "Pembayaran gagal disimpan.", Toast.LENGTH_SHORT).show()
                }
            }
        }
        dialog.show()
    }

    private fun formPanel() = LinearLayout(App.ctx).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(Ui.dp(20), Ui.dp(8), Ui.dp(20), Ui.dp(4))
    }

    private fun fieldParams() = LinearLayout.LayoutParams(-1, Ui.dp(46)).apply {
        setMargins(0, Ui.dp(4), 0, Ui.dp(10))
    }
}
