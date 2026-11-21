package com.aldea.k.screens

import android.app.*
import android.graphics.Color
import android.view.*
import android.widget.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import com.aldea.k.MainActivity
import com.aldea.k.data.AldeaRepository
import com.aldea.k.ui.*
import com.aldea.k.util.Money

class HistoryScreen(private val a:MainActivity,private val r:AldeaRepository){
    private val fileOrder=listOf("acc.json","atk.json","voucher.json","bank.json","dana.json","ovo.json","bca.json","pulsa.json","pengeluaran.json")

    fun view():View{
        val root=Ui.root()
        root.addView(Ui.header("Aldea",{a.adminHome()},"Riwayat"))
        val scroll=Ui.scroll()
        val b=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.VERTICAL
            setPadding(Ui.dp(14),Ui.dp(14),Ui.dp(14),Ui.dp(18))
        }
        b.addView(Ui.text("Riwayat Closing",23f,Ui.BLUE,true).apply{
            gravity=Gravity.CENTER
            setPadding(0,Ui.dp(6),0,Ui.dp(12))
        })
        b.addView(Ui.text("Pilih jenis riwayat yang mau dilihat.",14f,Color.DKGRAY).apply{
            gravity=Gravity.CENTER
            setPadding(0,0,0,Ui.dp(12))
        })
        b.addView(Ui.btn("Riwayat Harian"){daily()},LinearLayout.LayoutParams(-1,Ui.dp(58)).apply{
            bottomMargin=Ui.dp(10)
        })
        b.addView(Ui.btn("Riwayat Bulanan"){monthly()},LinearLayout.LayoutParams(-1,Ui.dp(58)))
        scroll.addView(b)
        root.addView(scroll)
        return root
    }

    private fun daily(){
        val cal=Calendar.getInstance()
        DatePickerDialog(
            a,
            {_,y,m,d->
                val stem=SimpleDateFormat("dd-MM-yy",Locale.US).format(GregorianCalendar(y,m,d).time)
                showDay(stem)
            },
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH),
            cal.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

    private fun monthly(){
        val cal=Calendar.getInstance()
        val box=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.HORIZONTAL
            gravity=Gravity.CENTER
            setPadding(Ui.dp(12),Ui.dp(10),Ui.dp(12),Ui.dp(4))
        }
        val months=arrayOf(
            "Januari","Februari","Maret","April","Mei","Juni",
            "Juli","Agustus","September","Oktober","November","Desember"
        )
        val month=Spinner(App.ctx).apply{
            adapter=ArrayAdapter(App.ctx,android.R.layout.simple_spinner_dropdown_item,months)
            setSelection(cal.get(Calendar.MONTH))
        }
        val years=(cal.get(Calendar.YEAR)-10..cal.get(Calendar.YEAR)+10).map{it.toString()}.toTypedArray()
        val year=Spinner(App.ctx).apply{
            adapter=ArrayAdapter(App.ctx,android.R.layout.simple_spinner_dropdown_item,years)
            setSelection(years.indexOf(cal.get(Calendar.YEAR).toString()))
        }
        box.addView(month,LinearLayout.LayoutParams(0,Ui.dp(50),1f).apply{
            setMargins(0,0,Ui.dp(6),0)
        })
        box.addView(year,LinearLayout.LayoutParams(0,Ui.dp(50),1f).apply{
            setMargins(Ui.dp(6),0,0,0)
        })
        AlertDialog.Builder(a)
            .setTitle("Pilih bulan")
            .setView(box)
            .setNegativeButton("Kembali",null)
            .setPositiveButton("Lihat"){_,_->
                val mm=String.format(Locale.US,"%02d",month.selectedItemPosition+1)
                showMonth("${year.selectedItem}-$mm")
            }
            .show()
    }

    private fun showDay(stem:String){
        val dir=r.historyDir(stem)
        if(dir==null){
            Toast.makeText(a,"Riwayat tidak ditemukan.",Toast.LENGTH_SHORT).show()
            return
        }
        showDailyRecap(dir,stem)
    }

    private fun showMonth(mm:String){
        val parts=mm.split("-")
        val year=parts.getOrNull(0)?.toIntOrNull()?:0
        val month=parts.getOrNull(1)?.toIntOrNull()?:0
        val dirs=r.historyDirs().filter{f->
            parseDate(f.name)?.let{it.first==year&&it.second==month}?:false
        }.sortedBy{dateKey(it.name)}

        if(dirs.isEmpty()){
            showHistoryDialog("Riwayat Bulanan","Belum ada riwayat bulan ini.")
            return
        }

        val monthTotal=dirs.fold(ReportTotal()){acc,d->
            val x=dayTotals(d)
            acc.omset+=x.omset
            acc.labaBersih+=x.labaBersih
            acc
        }

        val box=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.VERTICAL
            setPadding(Ui.dp(16),Ui.dp(6),Ui.dp(16),Ui.dp(10))
        }
        box.addView(recapTotalCard("REKAP ${monthName(month)} $year",monthTotal.omset,monthTotal.labaBersih))
        box.addView(Ui.text("Pilih tanggal untuk melihat rekap harian.",13f,Color.DKGRAY).apply{
            setPadding(Ui.dp(4),Ui.dp(10),Ui.dp(4),Ui.dp(7))
        })
        dirs.forEachIndexed{index,dir->
            val x=dayTotals(dir)
            val row=recapRow("${index+1}. ${formatDateLabel(dir.name)}","Omset: ${rupiah(x.omset)}","Laba Bersih: ${rupiah(x.labaBersih)}") {
                showDailyRecap(dir,dir.name)
            }
            box.addView(row,LinearLayout.LayoutParams(-1,Ui.dp(72)).apply{
                bottomMargin=Ui.dp(8)
            })
        }
        showDialogView("Riwayat Bulanan",box)
    }

    private fun showDailyRecap(dir:File,stem:String){
        val totals=dayTotals(dir)
        val box=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.VERTICAL
            setPadding(Ui.dp(16),Ui.dp(6),Ui.dp(16),Ui.dp(10))
        }
        box.addView(recapTotalCard("REKAP ${formatDateLabel(stem)}",totals.omset,totals.labaBersih))
        box.addView(Ui.text("Pilih bagian untuk melihat input pada tanggal ini.",13f,Color.DKGRAY).apply{
            setPadding(Ui.dp(4),Ui.dp(10),Ui.dp(4),Ui.dp(7))
        })

        val items=listOf(
            Triple("1. Acc",productSummary(dir,"acc.json"),"Acc"),
            Triple("2. Atk",productSummary(dir,"atk.json"),"Atk"),
            Triple("3. Voucher & SP",productSummary(dir,"voucher.json"),"Voucher"),
            Triple("4. Bank",txSummary(dir,"bank.json","Bank"),"Bank"),
            Triple("5. Dana",txSummary(dir,"dana.json","Dana"),"Dana"),
            Triple("6. Ovo",txSummary(dir,"ovo.json","Ovo"),"Ovo"),
            Triple("7. BCA",txSummary(dir,"bca.json","BCA"),"BCA"),
            Triple("8. Pulsa",pulsaSummary(dir), "Pulsa"),
            Triple("9. Pengeluaran",expenseSummary(dir),"Pengeluaran"),
            Triple("10. QRIS",qrisSummary(dir),"QRIS"),
            Triple("11. Buku Kasbon",kasbonSummary(dir),"Kasbon"),
            Triple("12. Totalan Cash",cashSummary(dir),"Cash"),
            Triple("13. Mutasi Internal",mutasiSummary(dir),"Mutasi")
        )
        items.forEach{(title,summary,type)->
            val row=recapRow(title,summary.first,summary.second){
                val f=File(dir,"${type.lowercase(Locale.US)}.json")
                if(f.exists())showDetail(type,dir,stem,f) else Toast.makeText(a,"Data $type tidak ditemukan.",Toast.LENGTH_SHORT).show()
            }
            box.addView(row,LinearLayout.LayoutParams(-1,Ui.dp(72)).apply{
                bottomMargin=Ui.dp(8)
            })
        }
        showDialogView("Riwayat Harian",box)
    }

    private fun recapTotalCard(title:String,omset:Long,labaBersih:Long):View{
        val card=Ui.card().apply{
            orientation=LinearLayout.VERTICAL
            setPadding(Ui.dp(14),Ui.dp(10),Ui.dp(14),Ui.dp(10))
        }
        card.addView(Ui.text(title,16f,Ui.BLUE,true).apply{gravity=Gravity.CENTER})
        card.addView(Ui.text("Omset: ${rupiah(omset)}",16f,Ui.TEXT,true).apply{
            gravity=Gravity.CENTER
            setPadding(0,Ui.dp(7),0,Ui.dp(2))
        })
        card.addView(Ui.text("Laba Bersih: ${rupiah(labaBersih)}",16f,Ui.TEXT,true).apply{gravity=Gravity.CENTER})
        return card
    }

    private fun recapRow(title:String,line1:String,line2:String,onClick:()->Unit):View{
        return Ui.card().apply{
            orientation=LinearLayout.HORIZONTAL
            gravity=Gravity.CENTER_VERTICAL
            isClickable=true
            isFocusable=true
            setPadding(Ui.dp(14),Ui.dp(7),Ui.dp(12),Ui.dp(7))
            setOnClickListener{onClick()}
            val box=LinearLayout(App.ctx).apply{
                orientation=LinearLayout.VERTICAL
                gravity=Gravity.CENTER_VERTICAL
                isClickable=false
            }
            box.addView(Ui.text(title,15f,Ui.TEXT,true))
            box.addView(Ui.text(line1,13f,Ui.TEXT).apply{setPadding(0,Ui.dp(2),0,0)})
            if(line2.isNotBlank())box.addView(Ui.text(line2,13f,Ui.TEXT))
            addView(box,LinearLayout.LayoutParams(0,-1,1f))
            addView(Ui.text("›",28f,Ui.BLUE,true).apply{gravity=Gravity.CENTER},LinearLayout.LayoutParams(Ui.dp(28),-1))
        }
    }

    private fun showDetail(type:String,dir:File,stem:String,f:File){
        val text=when(type.lowercase(Locale.US)){
            "acc","atk","voucher"->{
                val base=formatProducts(JSONObject(f.readText()))
                val saleFile=File(dir,"${type.lowercase(Locale.US)}_penjualan.json")
                if(!saleFile.exists())base else base+"\n\n"+formatProductSales(JSONObject(saleFile.readText()))
            }
            "bank","dana","ovo","bca"->formatTx(JSONObject(f.readText()),type)
            "pulsa"->formatPulsa(JSONObject(f.readText()))
            "pengeluaran"->formatExpense(JSONObject(f.readText()))
            "qris"->formatQris(JSONObject(f.readText()),dir)
            "kasbon"->formatKasbon(JSONObject(f.readText()))
            "cash"->formatCash(JSONObject(f.readText()),dir)
            "mutasi"->formatMutasi(JSONObject(f.readText()))
            else->"Data tidak terbaca."
        }
        showHistoryDialog("$type — ${formatDateLabel(stem)}",text)
    }

    private fun showDialogView(title:String,content:View){
        val scroll=ScrollView(App.ctx).apply{
            isFillViewport=true
            overScrollMode=View.OVER_SCROLL_NEVER
        }
        scroll.addView(content,FrameLayout.LayoutParams(-1,-2))
        AlertDialog.Builder(a)
            .setTitle(title)
            .setView(scroll)
            .setPositiveButton("Kembali",null)
            .show()
    }

    private fun showHistoryDialog(title:String,message:String){
        val scroll=ScrollView(App.ctx).apply{
            isFillViewport=true
            overScrollMode=View.OVER_SCROLL_NEVER
            setPadding(Ui.dp(18),Ui.dp(8),Ui.dp(18),Ui.dp(4))
        }
        val text=Ui.text(message,13f,Ui.TEXT).apply{
            setLineSpacing(0f,1.12f)
            includeFontPadding=true
        }
        scroll.addView(text,FrameLayout.LayoutParams(-1,-2))
        AlertDialog.Builder(a)
            .setTitle(title)
            .setView(scroll)
            .setPositiveButton("Kembali",null)
            .show()
    }

    // Nilai modul operasional disimpan dalam satuan ribuan rupiah, sama seperti Totalan.
    private fun rupiah(value:Int):String = Money.ribuan(value.toLong())
    private fun rupiah(value:Long):String = Money.ribuan(value)

    // Buku Kasbon menyimpan nominal rupiah penuh, bukan satuan ribuan.
    private fun rupiahPenuh(value:Int):String = Money.rupiah(value.toLong())
    private fun rupiahPenuh(value:Long):String = Money.rupiah(value)

    private fun dayTotals(dir:File):ReportTotal{
        var omset=0L
        var laba=0L
        var expenseAdmin=0L
        var expenseModal=0L
        listOf("acc.json","atk.json","voucher.json").forEach{name->
            val f=File(dir,name)
            if(f.exists()){
                val o=runCatching{JSONObject(f.readText())}.getOrNull()
                val arr=o?.optJSONArray("produk")?:JSONArray()
                for(i in 0 until arr.length()){
                    val p=arr.optJSONObject(i)?:continue
                    omset+=p.optLong("omset")
                    laba+=p.optLong("laba")
                }
            }
        }
        listOf("bank.json","dana.json","ovo.json","bca.json").forEach{name->
            val f=File(dir,name)
            if(f.exists()){
                val o=runCatching{JSONObject(f.readText())}.getOrNull()?:return@forEach
                val key=name.removeSuffix(".json")
                val arr=o.optJSONArray(key)?:JSONArray()
                var txLaba=0L
                var transfer=0L
                var tarik=0L
                var setor=0L
                for(i in 0 until arr.length()){
                    val x=arr.optJSONObject(i)?:continue
                    val t=x.optString("transaksi")
                    if(t=="transfer"||t=="tarik")txLaba+=x.optLong("laba")
                    if(t=="transfer")transfer+=x.optLong("nominal")
                    if(t=="tarik")tarik+=x.optLong("nominal")
                    if(t=="setor")setor+=x.optLong("nominal")
                }
                laba+=txLaba
                omset+=transfer+txLaba-tarik-setor
            }
        }
        val pf=File(dir,"pulsa.json")
        if(pf.exists()){
            val o=runCatching{JSONObject(pf.readText())}.getOrNull()
            omset+=o?.optLong("omset")?:0L
            laba+=o?.optLong("laba")?:0L
        }
        val qf=File(dir,"qris.json")
        if(qf.exists()){
            val q=runCatching{JSONObject(qf.readText())}.getOrNull()?:JSONObject()
            val tarik=q.optJSONArray("tarik_tunai")?:JSONArray()
            val bayar=q.optJSONArray("bayar_qris")?:JSONArray()
            var totalTarik=0L;var adminTarik=0L;var totalBayar=0L
            for(i in 0 until tarik.length()) {
                val x=tarik.optJSONObject(i)?:continue
                totalTarik+=x.optLong("nominal")
                adminTarik+=x.optLong("admin")
            }
            for(i in 0 until bayar.length()) totalBayar+=bayar.optJSONObject(i)?.optLong("nominal")?:0L
            laba+=adminTarik
            omset+=adminTarik-totalTarik-totalBayar
        }
        val ef=File(dir,"pengeluaran.json")
        if(ef.exists()){
            val o=runCatching{JSONObject(ef.readText())}.getOrNull()
            val arr=o?.optJSONArray("pengeluaran")?:JSONArray()
            for(i in 0 until arr.length()){
                val item=arr.optJSONObject(i)?:continue
                val amount=item.optLong("jumlah")
                if(item.optString("jenis","ADMIN").equals("MODAL",true))expenseModal+=amount else expenseAdmin+=amount
            }
        }
        return ReportTotal(com.aldea.k.util.LedgerMath.omsetSetelahPengeluaran(omset,expenseAdmin,expenseModal),com.aldea.k.util.LedgerMath.labaBersih(laba,expenseAdmin))
    }

    private fun productSummary(dir:File,name:String):Pair<String,String>{
        val f=File(dir,name)
        if(!f.exists())return "Omset: Rp0" to "Laba: Rp0"
        val o=runCatching{JSONObject(f.readText())}.getOrNull()?:return "Omset: Rp0" to "Laba: Rp0"
        val arr=o.optJSONArray("produk")?:JSONArray()
        var omset=0L
        var laba=0L
        for(i in 0 until arr.length()){
            val p=arr.optJSONObject(i)?:continue
            omset+=p.optLong("omset");laba+=p.optLong("laba")
        }
        return "Omset: ${rupiah(omset)}" to "Laba: ${rupiah(laba)}"
    }

    private fun txSummary(dir:File,name:String,key:String):Pair<String,String>{
        val f=File(dir,name)
        if(!f.exists())return "Omset: Rp0" to "Laba: Rp0"
        val o=runCatching{JSONObject(f.readText())}.getOrNull()?:return "Omset: Rp0" to "Laba: Rp0"
        val arr=o.optJSONArray(key.lowercase(Locale.US))?:JSONArray()
        var transfer=0L
        var tarik=0L
        var setor=0L
        var laba=0L
        for(i in 0 until arr.length()){
            val x=arr.optJSONObject(i)?:continue
            when(x.optString("transaksi")){
                "transfer"->{transfer+=x.optLong("nominal");laba+=x.optLong("laba")}
                "tarik"->{tarik+=x.optLong("nominal");laba+=x.optLong("laba")}
                "setor"->setor+=x.optLong("nominal")
            }
        }
        return "Omset: ${rupiah(transfer+laba-tarik-setor)}" to "Laba: ${rupiah(laba)}"
    }

    private fun pulsaSummary(dir:File):Pair<String,String>{
        val f=File(dir,"pulsa.json")
        if(!f.exists())return "Omset: Rp0" to "Laba: Rp0"
        val o=runCatching{JSONObject(f.readText())}.getOrNull()?:return "Omset: Rp0" to "Laba: Rp0"
        return "Omset: ${rupiah(o.optLong("omset"))}" to "Laba: ${rupiah(o.optLong("laba"))}"
    }

    private fun expenseSummary(dir:File):Pair<String,String>{
        val f=File(dir,"pengeluaran.json")
        if(!f.exists())return "Total: 0" to ""
        val o=runCatching{JSONObject(f.readText())}.getOrNull()?:return "Total: 0" to ""
        val arr=o.optJSONArray("pengeluaran")?:JSONArray()
        var admin=0L
        var modal=0L
        for(i in 0 until arr.length()){
            val item=arr.optJSONObject(i)?:continue
            val amount=item.optLong("jumlah")
            if(item.optString("jenis","ADMIN").equals("MODAL",true))modal+=amount else admin+=amount
        }
        return "Admin: ${rupiah(admin)}" to "Modal: ${rupiah(modal)}"
    }

    private fun qrisSummary(dir:File):Pair<String,String>{
        val f=File(dir,"qris.json")
        if(!f.exists())return "Admin tarik tunai: Rp0" to "Saldo tercatat: Rp0"
        val o=runCatching{JSONObject(f.readText())}.getOrNull()?:JSONObject()
        val tarik=o.optJSONArray("tarik_tunai")?:JSONArray()
        val bayar=o.optJSONArray("bayar_qris")?:JSONArray()
        var admin=0L;var totalTarik=0L;var totalBayar=0L;var pindah=0L
        for(i in 0 until tarik.length()){val x=tarik.optJSONObject(i)?:continue;totalTarik+=x.optLong("nominal");admin+=x.optLong("admin")}
        for(i in 0 until bayar.length())totalBayar+=bayar.optJSONObject(i)?.optLong("nominal")?:0L
        val moved=o.optJSONArray("pindah_saldo")?:JSONArray()
        for(i in 0 until moved.length())pindah+=moved.optJSONObject(i)?.optLong("nominal")?:0L
        val mutasi=runCatching{JSONObject(File(dir,"mutasi.json").readText())}.getOrNull()?.optJSONArray("mutasi")?:JSONArray()
        var mutasiKeluar=0L
        for(i in 0 until mutasi.length()){
            val x=mutasi.optJSONObject(i)?:continue
            if(x.optString("sumber").equals("QRIS",true))mutasiKeluar+=x.optLong("nominal")
        }
        val saldo=(o.optLong("saldo_awal")+totalTarik+totalBayar-pindah-mutasiKeluar).coerceAtLeast(0L)
        return "Admin tarik tunai: ${rupiah(admin)}" to "Saldo akhir: ${rupiah(saldo)}"
    }

    private fun mutasiSummary(dir:File):Pair<String,String>{
        val f=File(dir,"mutasi.json")
        if(!f.exists())return "Tidak ada mutasi" to ""
        val a=runCatching{JSONObject(f.readText())}.getOrNull()?.optJSONArray("mutasi")?:JSONArray()
        var total=0L
        for(i in 0 until a.length())total+=a.optJSONObject(i)?.optLong("nominal")?:0L
        return "Jumlah mutasi: ${a.length()}" to "Total perpindahan: ${rupiah(total)}"
    }

    private fun cashSummary(dir:File):Pair<String,String>{
        val f=File(dir,"cash.json")
        if(!f.exists())return "Tambah Cash: Rp0" to "Uang di kotak: Rp0"
        val o=runCatching{JSONObject(f.readText())}.getOrNull()?:JSONObject()
        val a=o.optJSONArray("tambah")?:JSONArray()
        var total=0L
        for(i in 0 until a.length()) total+=a.optJSONObject(i)?.optLong("nominal")?:0L
        return "Tambah Cash: ${rupiah(total)}" to "Uang di kotak: ${rupiah(o.optLong("uang_di_kotak"))}"
    }
    private fun formatCash(o:JSONObject,dir:File):String{
        val a=o.optJSONArray("tambah")?:JSONArray()
        val total=a.let{arr->(0 until arr.length()).sumOf{arr.optJSONObject(it)?.optLong("nominal")?:0L}}
        val omset=dayTotals(dir).omset
        val totalan=total+omset
        val cash=o.optLong("uang_di_kotak")
        val selisih=totalan-cash
        val out=StringBuilder("PENCATATAN TOTALAN CASH\n")
        if(a.length()==0) out.append("Belum ada penambahan cash.\n")
        for(i in 0 until a.length()){
            val item=a.optJSONObject(i)?:continue
            out.append("Tambah ${i+1}: ${rupiah(item.optLong("nominal"))}\n")
        }
        out.append("\nTotal Tambah Cash: ${rupiah(total)}\n")
        out.append("Omset Aldea: ${rupiah(omset)}\n")
        out.append("Totalan: ${rupiah(totalan)}\n")
        out.append("Uang Di Kotak: ${rupiah(cash)}\n")
        out.append("Minus: ${if(selisih>0)rupiah(selisih) else "—"}\n")
        out.append("Lebih: ${if(selisih<0)rupiah(-selisih) else "—"}")
        return out.toString()
    }

    private fun kasbonSummary(dir:File):Pair<String,String>{
        val f=File(dir,"kasbon.json")
        if(!f.exists())return "Kasbon baru: 0" to "Pembayaran: Rp0"
        val a=runCatching{JSONObject(f.readText())}.getOrNull()?.optJSONArray("aktivitas")?:JSONArray()
        var count=0;var created=0L;var paid=0L
        for(i in 0 until a.length()){
            val x=a.optJSONObject(i)?:continue
            if(x.optString("jenis")=="kasbon"){count++;created+=x.optLong("jumlah")}
            if(x.optString("jenis")=="pembayaran")paid+=x.optLong("jumlah")
        }
        return "Kasbon baru: $count (${rupiahPenuh(created)})" to "Pembayaran diterima: ${rupiahPenuh(paid)}"
    }

    private data class ReportTotal(var omset:Long=0L,var labaBersih:Long=0L)

    private fun formatProducts(o:JSONObject):String{
        val a=o.optJSONArray("produk")?:JSONArray()
        if(a.length()==0)return "Belum ada data."
        val out=StringBuilder()
        for(i in 0 until a.length()){
            val p=a.optJSONObject(i)?:continue
            val stok=p.optJSONObject("stok")?:JSONObject()
            val harga=p.optJSONObject("harga")?:JSONObject()
            out.append("${p.optString("kategori")} → ${p.optString("model")}\n")
            out.append("  Stok akhir : ${stok.optInt("akhir")}\n")
            out.append("  Terjual    : ${stok.optInt("terjual")}\n")
            out.append("  Harga jual : ${rupiah(harga.optInt("jual"))}\n")
            out.append("  Omset      : ${rupiah(p.optInt("omset"))}\n")
            out.append("  Laba       : ${rupiah(p.optInt("laba"))}\n")
            if(i<a.length()-1)out.append("\n")
        }
        return out.toString().trimEnd()
    }

    private fun formatProductSales(o:JSONObject):String{
        val a=o.optJSONArray("penjualan")?:JSONArray()
        if(a.length()==0)return "Rincian penjualan per unit: tidak ada catatan baru."
        val out=StringBuilder("RINCIAN PENJUALAN PER UNIT\n")
        for(i in 0 until a.length()){
            val x=a.optJSONObject(i)?:continue
            out.append("${i+1}. ${x.optString("kategori")} → ${x.optString("model")} | Jual: ${rupiah(x.optInt("jual"))} | Modal: ${rupiah(x.optInt("modal"))}\n")
        }
        return out.toString().trimEnd()
    }

    private fun formatTx(o:JSONObject,type:String):String{
        val a=o.optJSONArray(type.lowercase(Locale.US))?:JSONArray()
        if(a.length()==0)return "Belum ada transaksi."
        val out=StringBuilder()
        var transfer=0L
        var tarik=0L
        var bagi=0L
        var isi=0L
        var setor=0L
        var laba=0L
        var saldoAwal=0L
        var saldoAkhir=0L
        for(i in 0 until a.length()){
            val x=a.optJSONObject(i)?:continue
            val transaksi=x.optString("transaksi")
            val nominal=x.optLong("nominal")
            val profit=x.optLong("laba")
            if(i==0)saldoAwal=x.optLong("saldo_awal")
            saldoAkhir=x.optLong("saldo_akhir")
            when(transaksi){
                "transfer"->{transfer+=nominal;laba+=profit}
                "tarik"->{tarik+=nominal;laba+=profit}
                "bagi"->bagi+=nominal
                "isi"->isi+=nominal
                "setor"->setor+=nominal
            }
            out.append("Baris ${x.optInt("baris")} • ${transaksi.replaceFirstChar{it.uppercase()}}\n")
            out.append("  Nominal    : ${rupiah(nominal)}\n")
            if(profit!=0L)out.append("  Laba/Admin : ${rupiah(profit)}\n")
            out.append("  Saldo      : ${rupiah(x.optLong("saldo_awal"))} → ${rupiah(x.optLong("saldo_akhir"))}\n")
            if(i<a.length()-1)out.append("\n")
        }
        val omset=transfer+laba-tarik-setor
        out.append("\nRingkasan\n")
        out.append("  Saldo awal : ${rupiah(saldoAwal)}\n")
        out.append("  ${if(type.equals("BCA",true))"Setor" else "Isi saldo"} : ${rupiah(if(type.equals("BCA",true))setor else isi)}\n")
        out.append("  Bagi saldo : ${rupiah(bagi)}\n")
        out.append("  Transfer   : ${rupiah(transfer)}\n")
        out.append("  Tarik tunai: ${rupiah(tarik)}\n")
        out.append("  Laba       : ${rupiah(laba)}\n")
        out.append("  Omset      : ${rupiah(omset)}\n")
        out.append("  Saldo akhir: ${rupiah(saldoAkhir)}")
        return out.toString()
    }

    private fun formatPulsa(o:JSONObject):String{
        return buildString{
            append("Saldo awal      : ${rupiah(o.optLong("saldo_awal"))}\n")
            val entries=o.optJSONArray("isi_saldo_entries")?:JSONArray()
            val totalIsi=o.optLong("total_isi_saldo",o.optLong("isi_saldo")+(0 until entries.length()).sumOf{entries.optJSONObject(it)?.optLong("nominal")?:0L})
            append("Isi saldo       : ${rupiah(totalIsi)}\n")
            append("Pemakaian saldo : ${rupiah(o.optLong("pemakaian_saldo"))}\n")
            append("Total penjualan : ${rupiah(o.optLong("total_penjualan"))}\n")
            append("Laba            : ${rupiah(o.optLong("laba"))}\n")
            append("Omset           : ${rupiah(o.optLong("omset"))}\n")
            append("Saldo akhir     : ${rupiah(o.optLong("saldo_akhir"))}")
        }
    }

    private fun formatExpense(o:JSONObject):String{
        val a=o.optJSONArray("pengeluaran")?:JSONArray()
        if(a.length()==0)return "Belum ada pengeluaran."
        val out=StringBuilder()
        var total=0L
        var admin=0L
        var modal=0L
        for(i in 0 until a.length()){
            val x=a.optJSONObject(i)?:continue
            val jumlah=x.optLong("jumlah")
            val jenis=if(x.optString("jenis","ADMIN").equals("MODAL",true))"MODAL" else "ADMIN"
            total+=jumlah
            if(jenis=="MODAL")modal+=jumlah else admin+=jumlah
            out.append("${x.optInt("nomor")}. ${x.optString("nama")} [${if(jenis=="MODAL")"Modal" else "Admin"}]")
            out.append(" — ${rupiah(jumlah)}")
            val ket=x.optString("keterangan")
            if(ket.isNotBlank())out.append(" (${ket})")
            if(i<a.length()-1)out.append("\n")
        }
        out.append("\n\nTotal Admin: ${rupiah(admin)}")
        out.append("\nTotal Modal: ${rupiah(modal)}")
        out.append("\nTotal seluruh pengeluaran: ${rupiah(total)}")
        return out.toString()
    }

    private fun formatQris(o:JSONObject,dir:File):String{
        val tarik=o.optJSONArray("tarik_tunai")?:JSONArray()
        val bayar=o.optJSONArray("bayar_qris")?:JSONArray()
        val pindah=o.optJSONArray("pindah_saldo")?:JSONArray()
        val out=StringBuilder()
        out.append("TARIK TUNAI\n")
        var totalTarik=0L;var admin=0L
        if(tarik.length()==0)out.append("Belum ada data.\n")
        for(i in 0 until tarik.length()){
            val x=tarik.optJSONObject(i)?:continue
            totalTarik+=x.optLong("nominal");admin+=x.optLong("admin")
            out.append("Baris ${x.optInt("baris")} • Nominal: ${rupiah(x.optLong("nominal"))} • Admin: ${rupiah(x.optLong("admin"))}\n")
        }
        out.append("Total tarik tunai: ${rupiah(totalTarik)}\nTotal admin: ${rupiah(admin)}\n\nBAYAR QRIS\n")
        var totalBayar=0L
        if(bayar.length()==0)out.append("Belum ada data.\n")
        for(i in 0 until bayar.length()){
            val x=bayar.optJSONObject(i)?:continue
            totalBayar+=x.optLong("nominal")
            out.append("Baris ${x.optInt("baris")} • Nominal: ${rupiah(x.optLong("nominal"))}\n")
        }
        out.append("Total bayar QRIS: ${rupiah(totalBayar)}\n\nPINDAH SALDO\n")
        var moved=0L
        if(pindah.length()==0)out.append("Belum ada pemindahan saldo.\n")
        for(i in 0 until pindah.length()){
            val x=pindah.optJSONObject(i)?:continue
            moved+=x.optLong("nominal")
            out.append("${x.optString("tanggal")} • ${rupiah(x.optLong("nominal"))}\n")
        }
        val mutasi=runCatching{JSONObject(File(dir,"mutasi.json").readText())}.getOrNull()?.optJSONArray("mutasi")?:JSONArray()
        var mutasiKeluar=0L
        for(i in 0 until mutasi.length()){
            val x=mutasi.optJSONObject(i)?:continue
            if(x.optString("sumber").equals("QRIS",true))mutasiKeluar+=x.optLong("nominal")
        }
        val balance=(o.optLong("saldo_awal")+totalTarik+totalBayar-moved-mutasiKeluar).coerceAtLeast(0L)
        out.append("\nSaldo awal: ${rupiah(o.optLong("saldo_awal"))}\nTotal saldo masuk: ${rupiah(totalTarik+totalBayar)}\nPindah saldo lama: ${rupiah(moved)}\nMutasi ke Bank: ${rupiah(mutasiKeluar)}\nSaldo akhir QRIS: ${rupiah(balance)}")
        return out.toString()
    }

    private fun formatMutasi(o:JSONObject):String{
        val a=o.optJSONArray("mutasi")?:JSONArray()
        if(a.length()==0)return "Tidak ada mutasi pada tanggal ini."
        val out=StringBuilder("RIWAYAT MUTASI INTERNAL\n")
        var total=0L
        for(i in 0 until a.length()){
            val x=a.optJSONObject(i)?:continue
            val nominal=x.optLong("nominal")
            total+=nominal
            out.append("${x.optString("tanggal")}\n")
            out.append("${x.optString("sumber")} → ${x.optString("tujuan")} • ${rupiah(nominal)}\n\n")
        }
        out.append("Total perpindahan: ${rupiah(total)}")
        return out.toString().trim()
    }

    private fun formatKasbon(o:JSONObject):String{
        val a=o.optJSONArray("aktivitas")?:JSONArray()
        if(a.length()==0)return "Tidak ada aktivitas kasbon pada tanggal ini."
        val out=StringBuilder()
        for(i in 0 until a.length()){
            val x=a.optJSONObject(i)?:continue
            val isNew=x.optString("jenis")=="kasbon"
            out.append(if(isNew)"KASBON BARU" else "PEMBAYARAN DITERIMA")
            out.append("\nNama: ${x.optString("nama")}\nNominal: ${rupiahPenuh(x.optLong("jumlah"))}\nWaktu: ${x.optString("tanggal")}")
            if(x.optString("catatan").isNotBlank())out.append("\nCatatan: ${x.optString("catatan")}")
            if(i<a.length()-1)out.append("\n\n--------------------\n\n")
        }
        return out.toString()
    }

    private fun parseDate(name:String):Pair<Int,Int>?{
        return try{
            val d=SimpleDateFormat("dd-MM-yy",Locale.US).apply{isLenient=false}.parse(name)?:return null
            val c=Calendar.getInstance().apply{time=d}
            Pair(c.get(Calendar.YEAR),c.get(Calendar.MONTH)+1)
        }catch(_:Exception){null}
    }

    private fun dateKey(name:String):String{
        val p=parseDate(name)?:return name
        return String.format(Locale.US,"%04d-%02d-%s",p.first,p.second,name.substringBefore("-"))
    }

    private fun formatDateLabel(name:String):String{
        val d=runCatching{SimpleDateFormat("dd-MM-yy",Locale.US).parse(name)}.getOrNull()?:return name
        return SimpleDateFormat("dd-MMM-yy",Locale.US).format(d)
    }

    private fun monthName(month:Int)=when(month){
        1->"JANUARI";2->"FEBRUARI";3->"MARET";4->"APRIL";5->"MEI";6->"JUNI"
        7->"JULI";8->"AGUSTUS";9->"SEPTEMBER";10->"OKTOBER";11->"NOVEMBER";12->"DESEMBER"
        else->""
    }
}
