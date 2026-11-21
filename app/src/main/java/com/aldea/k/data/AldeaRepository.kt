package com.aldea.k.data

import com.aldea.k.model.*
import com.aldea.k.util.LedgerMath
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*
import java.io.InputStream
import java.io.OutputStream

class AldeaRepository(private val store:JsonStore) {
    private fun productPath(t:String)="produk_${t.lowercase()}/aktif.json"
    private fun txPath(t:String)="${t.lowercase()}/aktif.json"
    private fun totalPath(t:String)="${t.lowercase()}/total.json"
    fun products(t:String):MutableList<Product>{ val a=store.readObject(productPath(t)).optJSONArray("produk")?:JSONArray(); return (0 until a.length()).map{p(a.getJSONObject(it))}.toMutableList() }
    private fun p(o:JSONObject)=Product(o.optString("kategori"),o.optString("model"),o.optJSONObject("stok")?.optInt("awal")?:0,o.optJSONObject("stok")?.optInt("tambah")?:0,o.optJSONObject("stok")?.optInt("sisa")?:0,o.optJSONObject("stok")?.optInt("terjual")?:0,o.optJSONObject("stok")?.optInt("akhir")?:0,o.optJSONObject("harga")?.optInt("modal")?:0,o.optJSONObject("harga")?.optInt("jual")?:0,o.optInt("omset"),o.optInt("laba"))
    private fun po(x:Product)=JSONObject().apply{put("kategori",x.kategori);put("model",x.model);put("stok",JSONObject().apply{put("awal",x.awal);put("tambah",x.tambah);put("sisa",x.sisa);put("terjual",x.terjual);put("akhir",x.akhir)});put("harga",JSONObject().apply{put("modal",x.modal);put("jual",x.jual)});put("omset",x.omset);put("laba",x.laba)}
    private fun saveProducts(t:String,list:List<Product>){val a=JSONArray();list.forEach{a.put(po(it))};store.writeObject(productPath(t),JSONObject().put("produk",a))}
    fun recalc(p:Product){
        val tersedia=p.awal.toLong()+p.tambah.toLong()
        val terjual=tersedia-p.sisa.toLong()
        require(tersedia in 0..Int.MAX_VALUE.toLong() && terjual in 0..Int.MAX_VALUE.toLong()) { "Jumlah stok di luar batas." }
        val omset=LedgerMath.omsetProduk(terjual,p.jual.toLong())
        val laba=LedgerMath.labaProduk(terjual,p.jual.toLong(),p.modal.toLong())
        require(omset in Int.MIN_VALUE.toLong()..Int.MAX_VALUE.toLong() && laba in Int.MIN_VALUE.toLong()..Int.MAX_VALUE.toLong()) { "Nilai penjualan terlalu besar untuk format data lama." }
        p.terjual=terjual.toInt();p.akhir=p.sisa;p.omset=omset.toInt();p.laba=laba.toInt()
    }
    fun setSisa(t:String,k:String,m:String,s:Int):Boolean{
        val l=products(t);val x=l.firstOrNull{it.kategori.equals(k,true)&&it.model.equals(m,true)}?:return false
        if(s<0 || s.toLong()>x.awal.toLong()+x.tambah.toLong())return false
        val before=x.copy();x.sisa=s
        return try { recalc(x);saveProducts(t,l);true } catch(_:IllegalArgumentException) { l[l.indexOf(x)]=before;false }
    }
    fun addStock(t:String,k:String,m:String,n:Int):Boolean{
        if(n<=0)return false;val l=products(t);val x=l.firstOrNull{it.kategori==k&&it.model==m}?:return false
        if(x.tambah.toLong()+n>Int.MAX_VALUE || x.sisa.toLong()+n>Int.MAX_VALUE || x.awal.toLong()+x.tambah.toLong()+n>Int.MAX_VALUE)return false
        x.tambah+=n;x.sisa+=n;x.akhir=x.sisa;saveProducts(t,l);return true
    }
    fun addProduct(t:String,k:String,m:String,awal:Int,modal:Int,jual:Int):Boolean{val l=products(t);if(k.isBlank()||m.isBlank()||awal<0||modal<0||jual<0||l.any{it.kategori.equals(k,true)||it.model.equals(m,true)})return false;val x=Product(k,m,awal,0,awal,0,awal,modal,jual,0,0);l.add(x);saveProducts(t,l);return true}
    fun addModel(t:String,k:String,m:String,awal:Int,modal:Int,jual:Int):Boolean{val l=products(t);if(awal<0||modal<0||jual<0||l.none{it.kategori.equals(k,true)}||l.any{it.model.equals(m,true)})return false;return addRaw(l,Product(k,m,awal,0,awal,0,awal,modal,jual,0,0),t)}
    private fun addRaw(l:MutableList<Product>,x:Product,t:String):Boolean{l.add(x);saveProducts(t,l);return true}
    fun deleteProducts(t:String,indexes:Set<Int>){saveProducts(t,products(t).filterIndexed{i,_->i !in indexes})}
    fun setPrice(t:String,index:Int,modal:Int,jual:Int):Boolean{val l=products(t);if(index !in l.indices||modal<0||jual<0)return false;l[index].modal=modal;l[index].jual=jual;saveProducts(t,l);return true}

    // Penjualan produk dicatat per unit; stok dan nilai periode diperbarui dalam satu operasi.
    private fun salesPath(t:String)="produk_${t.lowercase()}/penjualan_aktif.json"
    fun productSales(t:String):List<ProductSale>{
        val a=store.readObject(salesPath(t)).optJSONArray("penjualan")?:JSONArray()
        return (0 until a.length()).mapNotNull{i->a.optJSONObject(i)?.let{o->ProductSale(o.optString("id"),o.optString("kategori"),o.optString("model"),o.optInt("modal"),o.optInt("jual"),o.optLong("waktu"))}}
    }
    fun addProductSale(t:String,k:String,m:String):Boolean{
        val list=products(t)
        val product=list.firstOrNull{it.kategori.equals(k,true)&&it.model.equals(m,true)}?:return false
        if(product.sisa<=0 || product.terjual==Int.MAX_VALUE)return false
        val now=System.currentTimeMillis()
        val id="P$now-${UUID.randomUUID()}"
        val nextOmset=product.omset.toLong()+product.jual.toLong()
        val nextLaba=product.laba.toLong()+product.jual.toLong()-product.modal.toLong()
        if(nextOmset !in Int.MIN_VALUE.toLong()..Int.MAX_VALUE.toLong() || nextLaba !in Int.MIN_VALUE.toLong()..Int.MAX_VALUE.toLong()) return false
        product.sisa-=1
        product.terjual+=1
        product.akhir=product.sisa
        product.omset=nextOmset.toInt()
        product.laba=nextLaba.toInt()
        val a=store.readObject(salesPath(t)).optJSONArray("penjualan")?:JSONArray()
        a.put(JSONObject().apply{put("id",id);put("kategori",product.kategori);put("model",product.model);put("modal",product.modal);put("jual",product.jual);put("waktu",now)})
        saveProducts(t,list)
        store.writeObject(salesPath(t),JSONObject().put("penjualan",a))
        return true
    }

    private fun txArray(t:String):JSONArray=store.readObject(txPath(t)).optJSONArray(t.lowercase())?:JSONArray()
    fun txRowsPublic(t:String)=txArray(t).let{a->(0 until a.length()).map{val o=a.getJSONObject(it);TxRow(o.optInt("baris"),o.optLong("saldo_awal"),o.optString("transaksi"),o.optInt("nominal"),o.optInt("laba"),o.optLong("saldo_akhir"))}.sortedWith(compareBy<TxRow>{it.baris}.thenBy{txOrder(it.transaksi)})}
    private fun txOrder(t:String)=when(t){"bagi"->0;"isi","setor"->1;"transfer"->2;"tarik"->3;else->9}
    private fun saveTx(t:String,rows:List<TxRow>){val a=JSONArray();rows.sortedWith(compareBy<TxRow>{it.baris}.thenBy{txOrder(it.transaksi)}).forEach{x->a.put(JSONObject().apply{put("baris",x.baris);put("saldo_awal",x.saldoAwal);put("transaksi",x.transaksi);put("nominal",x.nominal);put("laba",x.laba);put("saldo_akhir",x.saldoAkhir)})};store.writeObject(txPath(t),JSONObject().put(t.lowercase(),a))}
    // Hanya Dana dan Ovo memakai tarif Admin Dana/OVO; semua rekening/layanan lain memakai Admin Bank.
    private fun tariffPath(t:String)=if(t.equals("Dana",true)||t.equals("Ovo",true))"laba/dana_ovo.json" else "laba/bank.json"
    fun tariffs(t:String):MutableList<Tariff>{val a=store.readArray(tariffPath(t));return (0 until a.length()).map{val o=a.getJSONObject(it);Tariff(o.optInt("minimal"),o.optInt("maksimal"),o.optInt("admin"))}.toMutableList()}
    fun saveTariffs(t:String,l:List<Tariff>){val a=JSONArray();l.forEach{x->a.put(JSONObject().apply{put("minimal",x.minimal);put("maksimal",x.maksimal);put("admin",x.admin)})};store.writeArray(tariffPath(t),a)}
    private fun fee(t:String,n:Int)=tariffs(t).firstOrNull{n in it.minimal..it.maksimal}?.admin
    // Catatan pemindahan saldo lama dipertahankan untuk kompatibilitas saldo/riwayat. Input manual Mutasi Internal dihapus dari UI.
    private val rekeningMutasi = listOf("Bank", "BCA", "Dana", "Ovo", "Pulsa", "QRIS")
    private fun mutasiObject(): JSONObject = store.readObject("mutasi/aktif.json").apply {
        if (!has("mutasi")) put("mutasi", JSONArray())
    }
    private fun mutasiArray(): JSONArray = mutasiObject().optJSONArray("mutasi") ?: JSONArray()
    fun mutasiRows(): List<JSONObject> {
        val a=mutasiArray(); val out=mutableListOf<JSONObject>()
        for(i in 0 until a.length()) a.optJSONObject(i)?.let { out.add(JSONObject(it.toString())) }
        return out.sortedBy { it.optLong("waktu") }
    }
    private fun mutasiNet(rekening:String):Long {
        var net=0L
        val a=mutasiArray()
        for(i in 0 until a.length()) {
            val x=a.optJSONObject(i) ?: continue
            val n=x.optLong("nominal")
            if(x.optString("tujuan").equals(rekening,true)) net+=n
            if(x.optString("sumber").equals(rekening,true)) net-=n
        }
        return net
    }
    fun tambahMutasi(sumber:String,tujuan:String,nominal:Int):Boolean {
        val from=rekeningMutasi.firstOrNull { it.equals(sumber,true) } ?: return false
        val to=rekeningMutasi.firstOrNull { it.equals(tujuan,true) } ?: return false
        if(nominal<=0 || from.equals(to,true) || from.equals("Pulsa",true) || to.equals("QRIS",true)) return false
        if(from.equals("QRIS",true) && !to.equals("Bank",true)) return false
        if(from.equals("QRIS",true) && nominal.toLong()>qrisBalance()) return false
        val a=mutasiArray()
        val now=System.currentTimeMillis()
        a.put(JSONObject().apply {
            put("id", "M$now-${a.length()+1}")
            put("sumber",from)
            put("tujuan",to)
            put("nominal",nominal)
            put("waktu",now)
            put("tanggal",SimpleDateFormat("dd-MM-yyyy HH:mm",Locale("id","ID")).format(Date(now)))
        })
        store.writeObject("mutasi/aktif.json",JSONObject().put("mutasi",a))
        return true
    }
    fun hapusMutasi(id:String):Boolean {
        val old=mutasiArray(); val next=JSONArray(); var removed=false
        for(i in 0 until old.length()) {
            val x=old.optJSONObject(i) ?: continue
            if(!removed && x.optString("id")==id) removed=true else next.put(x)
        }
        if(removed) store.writeObject("mutasi/aktif.json",JSONObject().put("mutasi",next))
        return removed
    }

    fun txTotal(t:String):TxTotal{
        val r=txRowsPublic(t);val z=TxTotal();
        r.forEach{x->when(x.transaksi){"transfer"->{z.transfer+=x.nominal.toLong();z.laba+=x.laba.toLong()};"tarik"->{z.tarik+=x.nominal.toLong();z.laba+=x.laba.toLong()};"bagi"->z.bagi+=x.nominal.toLong();"isi"->z.isi+=x.nominal.toLong();"setor"->z.setor+=x.nominal.toLong()}}
        val total=store.readObject(totalPath(t));
        val saldoAwal=if(total.has("saldo_awal"))total.optLong("saldo_awal") else total.optLong("saldo_akhir");
        z.saldoAkhir=LedgerMath.saldoAkhir(saldoAwal,z.isi,z.setor,z.tarik,z.transfer,z.bagi,mutasiNet(t));
        z.omset=LedgerMath.omset(z.transfer,z.laba,z.tarik,if(t.equals("BCA",true))z.setor else 0L);
        return z
    }
    fun saveTx(t:String,row:Int,type:String,nominal:Int):Boolean{
        if(row<=0||nominal<=0)return false;
        val r=txRowsPublic(t).toMutableList();val laba=if(type=="transfer"||type=="tarik") fee(t,nominal)?:return false else 0;
        val x=r.firstOrNull{it.baris==row&&it.transaksi==type};
        if(x==null)r.add(TxRow(row,0,type,nominal,laba,0)) else{x.nominal=nominal;x.laba=laba};
        val total=store.readObject(totalPath(t));val saldoAwal=if(total.has("saldo_awal"))total.optLong("saldo_awal") else total.optLong("saldo_akhir");
        var saldo=saldoAwal
        val ordered=r.sortedWith(compareBy<TxRow>{it.baris}.thenBy{txOrder(it.transaksi)})
        for(item in ordered){
            val next=when(item.transaksi){"transfer","bagi"->saldo-item.nominal.toLong();"tarik","isi","setor"->saldo+item.nominal.toLong();else->saldo}
            item.saldoAwal=saldo;item.saldoAkhir=next;saldo=next
        }
        // Tolak total yang tidak lagi muat pada format data K40 agar tidak overflow diam-diam.
        saveTx(t,r);return true
    }
    fun deleteTx(t:String,row:Int,type:String){val r=txRowsPublic(t).filterNot{it.baris==row&&it.transaksi==type};saveTx(t,r)}

    fun txAldea(t:String):Int?{val o=store.readObject(totalPath(t));return if(o.has("aldea"))o.optInt("aldea") else null}
    fun saveTxAldea(t:String,v:Int){val o=store.readObject(totalPath(t));o.put("aldea",v);store.writeObject(totalPath(t),o)}
    fun clearTxAldea(t:String){val o=store.readObject(totalPath(t));o.remove("aldea");store.writeObject(totalPath(t),o)}

    // QRIS berdiri sebagai pencatatan saldo terpisah dari Bank/Dana/OVO.
    private fun qrisObject():JSONObject = store.readObject("qris/aktif.json").apply {
        if(!has("saldo_awal")) put("saldo_awal",0)
        if(!has("tarik_tunai")) put("tarik_tunai",JSONArray())
        if(!has("bayar_qris")) put("bayar_qris",JSONArray())
        if(!has("pindah_saldo")) put("pindah_saldo",JSONArray())
    }
    private fun qrisRowsArray(type:String):JSONArray {
        val o=qrisObject()
        return o.optJSONArray(if(type=="tarik") "tarik_tunai" else "bayar_qris") ?: JSONArray()
    }
    fun qrisRows(type:String):Map<Int,Int> {
        val a=qrisRowsArray(type)
        val out=linkedMapOf<Int,Int>()
        for(i in 0 until a.length()) {
            val x=a.optJSONObject(i) ?: continue
            val row=x.optInt("baris")
            val nominal=x.optInt("nominal")
            if(row>0 && nominal>0) out[row]=nominal
        }
        return out
    }
    fun saveQrisRow(type:String,row:Int,nominal:Int):Boolean {
        if(row<=0 || nominal<=0 || (type!="tarik" && type!="bayar")) return false
        val admin=if(type=="tarik") fee("Bank",nominal) ?: return false else 0
        val o=qrisObject()
        val key=if(type=="tarik") "tarik_tunai" else "bayar_qris"
        val a=o.optJSONArray(key) ?: JSONArray()
        var replaced=false
        for(i in 0 until a.length()) {
            val x=a.optJSONObject(i) ?: continue
            if(x.optInt("baris")==row) {
                x.put("nominal",nominal); x.put("admin",admin); replaced=true; break
            }
        }
        if(!replaced) a.put(JSONObject().apply { put("baris",row); put("nominal",nominal); put("admin",admin) })
        o.put(key,a); store.writeObject("qris/aktif.json",o)
        return true
    }
    fun deleteQrisRow(type:String,row:Int) {
        if(type!="tarik" && type!="bayar") return
        val o=qrisObject()
        val key=if(type=="tarik") "tarik_tunai" else "bayar_qris"
        val old=o.optJSONArray(key) ?: JSONArray()
        val next=JSONArray()
        for(i in 0 until old.length()) {
            val x=old.optJSONObject(i) ?: continue
            if(x.optInt("baris")!=row) next.put(x)
        }
        o.put(key,next); store.writeObject("qris/aktif.json",o)
    }
    private fun qrisSum(key:String):Long {
        val a=qrisObject().optJSONArray(key) ?: JSONArray()
        var total=0L
        for(i in 0 until a.length()) total += a.optJSONObject(i)?.optLong("nominal",0L) ?: 0L
        return total
    }
    fun qrisAdminTotal():Long {
        val a=qrisRowsArray("tarik")
        var total=0L
        for(i in 0 until a.length()) total += a.optJSONObject(i)?.optLong("admin",0L) ?: 0L
        return total
    }
    fun qrisOmset():Long = LedgerMath.omsetQris(
        qrisSum("tarik_tunai"), qrisAdminTotal(), qrisSum("bayar_qris")
    )
    fun qrisBalance():Long = LedgerMath.saldoQris(qrisObject().optLong("saldo_awal"),qrisSum("tarik_tunai"),qrisSum("bayar_qris"),qrisSum("pindah_saldo"),mutasiNet("QRIS"))
    // Setiap pemindahan QRIS langsung mengurangi saldo QRIS dan membuat notifikasi Bank tersendiri.
    // Notifikasi disimpan terpisah dari data harian agar tetap menunggu setelah Closing.
    private fun ensureQrisBankNotifications() {
        val q=qrisObject()
        val moved=q.optJSONArray("pindah_saldo") ?: JSONArray()
        val path="qris/pending_bank.json"
        val pending=store.readObject(path).optJSONArray("notifikasi") ?: JSONArray()
        val known=(0 until pending.length()).mapNotNull { pending.optJSONObject(it)?.optString("id") }.toMutableSet()
        var changed=false
        for(i in 0 until moved.length()) {
            val x=moved.optJSONObject(i) ?: continue
            val id=x.optString("id")
            if(id.isBlank() || !known.add(id)) continue
            pending.put(JSONObject().apply {
                put("id",id)
                put("nominal",x.optInt("nominal"))
                put("waktu",x.optLong("waktu"))
                put("tanggal",x.optString("tanggal"))
                put("status","menunggu")
            })
            changed=true
        }
        if(changed) store.writeObject(path,JSONObject().put("notifikasi",pending))
    }
    fun createQrisBankPending(amount:Int):Boolean {
        if(amount<=0 || amount.toLong()>qrisBalance()) return false
        val now=System.currentTimeMillis()
        val id="Q2B-${UUID.randomUUID()}"
        val o=qrisObject()
        val a=o.optJSONArray("pindah_saldo") ?: JSONArray()
        a.put(JSONObject().apply {
            put("id",id)
            put("nominal",amount)
            put("waktu",now)
            put("tanggal",SimpleDateFormat("dd-MM-yyyy HH:mm",Locale("id","ID")).format(Date(now)))
        })
        o.put("pindah_saldo",a)
        store.writeObject("qris/aktif.json",o)
        ensureQrisBankNotifications()
        return true
    }
    fun pendingQrisBankTransfers():List<JSONObject> {
        ensureQrisBankNotifications()
        val a=store.readObject("qris/pending_bank.json").optJSONArray("notifikasi") ?: JSONArray()
        return (0 until a.length()).mapNotNull { a.optJSONObject(it) }
            .filter { it.optString("status")=="menunggu" }
            .sortedBy { it.optLong("waktu") }
            .map { JSONObject(it.toString()) }
    }
    fun completeQrisBankTransfer(id:String):Boolean {
        if(id.isBlank()) return false
        ensureQrisBankNotifications()
        val path="qris/pending_bank.json"
        val pending=store.readObject(path).optJSONArray("notifikasi") ?: JSONArray()
        val item=(0 until pending.length()).mapNotNull { pending.optJSONObject(it) }
            .firstOrNull { it.optString("id")==id } ?: return false
        if(item.optString("status")=="selesai") return true
        val amount=item.optInt("nominal")
        if(amount<=0) return false

        // Penanda unik di baris Bank mencegah input ganda jika proses terhenti di tengah.
        val bankPath=txPath("Bank")
        val bankObject=store.readObject(bankPath)
        val bankRows=bankObject.optJSONArray("bank") ?: JSONArray()
        var alreadyRecorded=false
        for(i in 0 until bankRows.length()) {
            if(bankRows.optJSONObject(i)?.optString("qris_pending_id")==id) {
                alreadyRecorded=true
                break
            }
        }
        if(!alreadyRecorded) {
            val current=txTotal("Bank").saldoAkhir
            var maxRow=0
            for(i in 0 until bankRows.length()) maxRow=maxOf(maxRow,bankRows.optJSONObject(i)?.optInt("baris") ?: 0)
            bankRows.put(JSONObject().apply {
                put("baris",maxRow+1)
                put("saldo_awal",current)
                put("transaksi","isi")
                put("nominal",amount)
                put("laba",0)
                put("saldo_akhir",current+amount)
                put("qris_pending_id",id)
            })
            bankObject.put("bank",bankRows)
            store.writeObject(bankPath,bankObject)
            txTotal("Bank")
        }
        item.put("status","selesai")
        item.put("selesai_waktu",System.currentTimeMillis())
        store.writeObject(path,JSONObject().put("notifikasi",pending))
        return true
    }
    private fun closeQrisDay() {
        val balance=qrisBalance()
        store.writeObject("qris/aktif.json",JSONObject().apply {
            put("saldo_awal",balance)
            put("tarik_tunai",JSONArray())
            put("bayar_qris",JSONArray())
            put("pindah_saldo",JSONArray())
        })
    }

    // Isi saldo Pulsa dicatat sebagai beberapa setoran terpisah. Nilai isi_saldo
    // lama tetap dibaca agar data dari versi sebelumnya tidak hilang/terhitung ganda.
    // Semua nominal operasional Pulsa disimpan dalam satuan ribuan rupiah.
    // Entri dari revisi awal Isi Saldo pernah tersimpan dalam rupiah penuh;
    // migrasikan satu kali agar tidak membuat saldo membengkak.
    private fun normalizePulsaIsiEntries(o:JSONObject):JSONArray {
        val a=o.optJSONArray("isi_saldo_entries")?:JSONArray()
        if(!o.optBoolean("isi_saldo_entries_ribuan",false)){
            for(i in 0 until a.length()){
                val item=a.optJSONObject(i)?:continue
                val old=item.optLong("nominal")
                if(old>0L && old%1000L==0L && old/1000L<=Int.MAX_VALUE){
                    item.put("nominal",(old/1000L).toInt())
                }
            }
            o.put("isi_saldo_entries_ribuan",true)
            o.put("isi_saldo_entries",a)
            store.writeObject("pulsa/aktif.json",o)
        }
        return a
    }
    fun pulsaIsiEntries():List<JSONObject>{
        val o=store.readObject("pulsa/aktif.json")
        val a=normalizePulsaIsiEntries(o)
        return (0 until a.length()).mapNotNull{i->a.optJSONObject(i)?.let{x->JSONObject(x.toString())}}
            .sortedBy { it.optLong("waktu") }
    }
    fun addPulsaIsiSaldo(nominalRibuan:Int):Boolean{
        if(nominalRibuan<=0)return false
        val o=store.readObject("pulsa/aktif.json")
        val a=normalizePulsaIsiEntries(o)
        val awal=pulsaSaldoAwal(o,a)
        val akhir=LedgerMath.saldoPulsa(awal,o.optLong("isi_saldo"),pulsaIsiEntriesTotal(a)+nominalRibuan.toLong(),o.optLong("pemakaian_saldo"))
        if(akhir !in Int.MIN_VALUE.toLong()..Int.MAX_VALUE.toLong())return false
        a.put(JSONObject().apply{put("id", "PS${System.currentTimeMillis()}-${UUID.randomUUID()}");put("nominal",nominalRibuan);put("waktu",System.currentTimeMillis())})
        o.put("isi_saldo_entries",a)
        o.put("isi_saldo_entries_ribuan",true)
        o.put("saldo_akhir",akhir)
        store.writeObject("pulsa/aktif.json",o)
        return true
    }
    private fun pulsaIsiEntriesTotal(a:JSONArray):Long=(0 until a.length()).sumOf{a.optJSONObject(it)?.optLong("nominal")?:0L}
    // Jika saldo_awal belum ada pada data lama, pulihkan dari saldo_akhir dan
    // komponen aktivitas yang tercatat; jangan memakai saldo_akhir sebagai saldo awal.
    private fun pulsaSaldoAwal(o:JSONObject,entries:JSONArray):Long {
        if(o.has("saldo_awal")) return o.optLong("saldo_awal")
        if(!o.has("saldo_akhir")) return 0L
        return o.optLong("saldo_akhir") - o.optLong("isi_saldo") - pulsaIsiEntriesTotal(entries) + o.optLong("pemakaian_saldo")
    }
    fun pulsa():JSONObject {
        val o=store.readObject("pulsa/aktif.json")
        val entries=normalizePulsaIsiEntries(o)
        val awal=pulsaSaldoAwal(o,entries)
        val isiBaru=pulsaIsiEntriesTotal(entries)
        o.put("saldo_awal",awal)
        o.put("saldo_akhir",LedgerMath.saldoPulsa(awal,o.optLong("isi_saldo"),isiBaru,o.optLong("pemakaian_saldo")))
        o.put("total_isi_saldo",o.optLong("isi_saldo")+isiBaru)
        return o
    }
    fun savePulsa(pemakaian:Int,penjualan:Int):Boolean{
        if(pemakaian<0 || penjualan<0) return false
        val old=store.readObject("pulsa/aktif.json")
        val legacyIsi=old.optLong("isi_saldo")
        val entries=normalizePulsaIsiEntries(old)
        val saldoAwal=pulsaSaldoAwal(old,entries)
        val saldoAkhir=LedgerMath.saldoPulsa(saldoAwal,legacyIsi,pulsaIsiEntriesTotal(entries),pemakaian.toLong())
        val laba=penjualan.toLong()-pemakaian.toLong()
        if(saldoAkhir !in Int.MIN_VALUE.toLong()..Int.MAX_VALUE.toLong() || laba !in Int.MIN_VALUE.toLong()..Int.MAX_VALUE.toLong()) return false
        old.put("saldo_awal",saldoAwal);old.put("pemakaian_saldo",pemakaian);old.put("total_penjualan",penjualan)
        old.put("isi_saldo",legacyIsi);old.put("laba",laba);old.put("omset",penjualan);old.put("saldo_akhir",saldoAkhir)
        store.writeObject("pulsa/aktif.json",old)
        return true
    }
    fun expenses():MutableList<Expense>{
        val a=store.readObject("pengeluaran/aktif.json").optJSONArray("pengeluaran")?:JSONArray()
        return (0 until a.length()).map{val o=a.getJSONObject(it);val jenis=o.optString("jenis","ADMIN").uppercase(Locale.ROOT).let{if(it=="MODAL")"MODAL" else "ADMIN"};Expense(o.optInt("nomor"),o.optString("nama"),o.optInt("jumlah"),o.optString("keterangan"),jenis)}.toMutableList()
    }
    fun saveExpense(e:Expense){
        val l=expenses();val old=l.firstOrNull{it.nomor==e.nomor}
        val jenis=if(e.jenis.equals("MODAL",true))"MODAL" else "ADMIN"
        if(old==null)l.add(e.copy(jenis=jenis))else{old.nama=e.nama;old.jumlah=e.jumlah;old.keterangan=e.keterangan;old.jenis=jenis}
        val a=JSONArray();l.sortedBy{it.nomor}.forEach{x->a.put(JSONObject().apply{put("nomor",x.nomor);put("nama",x.nama);put("jumlah",x.jumlah);put("keterangan",x.keterangan);put("jenis",x.jenis)})}
        store.writeObject("pengeluaran/aktif.json",JSONObject().put("pengeluaran",a))
    }
    fun expenseTotal():Long=expenses().sumOf{it.jumlah.toLong()}
    fun expenseAdminTotal():Long=expenses().filter{it.jenis!="MODAL"}.sumOf{it.jumlah.toLong()}
    fun expenseModalTotal():Long=expenses().filter{it.jenis=="MODAL"}.sumOf{it.jumlah.toLong()}
    fun totalModalStok(t:String):Long=products(t).fold(0L){total,p->
        val nilai=Math.multiplyExact(Math.multiplyExact(p.modal.toLong(),p.sisa.toLong()),1000L)
        Math.addExact(total,nilai)
    }
    // Kas fisik harian: semua nominal memakai satuan ribuan rupiah.
    private fun cashObject():JSONObject = store.readObject("cash/aktif.json").apply {
        if(!has("tambah")) put("tambah",JSONArray())
        if(!has("uang_di_kotak")) put("uang_di_kotak",0)
    }
    fun cashEntries():List<JSONObject> {
        val a=cashObject().optJSONArray("tambah") ?: JSONArray()
        return (0 until a.length()).mapNotNull { a.optJSONObject(it)?.let { x->JSONObject(x.toString()) } }
            .sortedBy { it.optLong("waktu") }
    }
    fun cashAddTotal():Long = cashEntries().sumOf { it.optLong("nominal") }
    fun cashInBox():Int = cashObject().optInt("uang_di_kotak")
    fun addCash(amount:Int):Boolean {
        if(amount<=0) return false
        val o=cashObject()
        val a=o.optJSONArray("tambah") ?: JSONArray()
        val now=System.currentTimeMillis()
        a.put(JSONObject().apply {
            put("id","CASH-${UUID.randomUUID()}")
            put("nominal",amount)
            put("waktu",now)
            put("tanggal",SimpleDateFormat("dd-MM-yyyy HH:mm",Locale("id","ID")).format(Date(now)))
        })
        o.put("tambah",a)
        store.writeObject("cash/aktif.json",o)
        return true
    }
    fun saveCashInBox(amount:Int):Boolean {
        if(amount<0) return false
        val o=cashObject()
        o.put("uang_di_kotak",amount)
        store.writeObject("cash/aktif.json",o)
        return true
    }

    fun total():TotalResult{
        val acc=products("Acc");val atk=products("Atk");val voucher=products("Voucher")
        val b=txTotal("Bank");val d=txTotal("Dana");val o=txTotal("Ovo");val c=txTotal("BCA");val p=pulsa()
        val omsetProduk=acc.sumOf{it.omset.toLong()}+atk.sumOf{it.omset.toLong()}+voucher.sumOf{it.omset.toLong()}
        val omsetTx=b.omset.toLong()+d.omset.toLong()+o.omset.toLong()+c.omset.toLong()+p.optLong("omset")+qrisOmset()
        val laba=acc.sumOf{it.laba.toLong()}+atk.sumOf{it.laba.toLong()}+voucher.sumOf{it.laba.toLong()}+b.laba.toLong()+d.laba.toLong()+o.laba.toLong()+c.laba.toLong()+p.optLong("laba")+qrisAdminTotal().toLong()
        val expAdmin=expenseAdminTotal()
        val expModal=expenseModalTotal()
        val omsetSetelahPengeluaran=LedgerMath.omsetSetelahPengeluaran(omsetProduk+omsetTx,expAdmin,expModal)
        return TotalResult(omsetSetelahPengeluaran,laba,LedgerMath.labaBersih(laba,expAdmin))
    }
    fun historyDir(stem:String):java.io.File?=store.file("riwayat/$stem").takeIf{it.exists()}
    fun historyDirs(): List<java.io.File> =store.file("riwayat").listFiles()?.filter{it.isDirectory}?.toList()?:emptyList()
    fun deleteHistoryDay(stem:String):Boolean{val dir=historyDir(stem)?:return false;return dir.deleteRecursively()}
    fun deleteHistoryMonth(year:Int,month:Int):Int{val dirs=historyDirs().filter{d->runCatching{val c=Calendar.getInstance();c.time=SimpleDateFormat("dd-MM-yy",Locale.US).parse(d.name)?:return@runCatching false;c.get(Calendar.YEAR)==year&&c.get(Calendar.MONTH)==month-1}.getOrDefault(false)};var n=0;dirs.forEach{if(it.deleteRecursively())n++};return n}
    fun exportData(out:OutputStream){store.exportBackup(out)}
    fun importData(input:InputStream):Result<String>{return store.importBackup(input)}

    // Buku Kasbon berdiri sendiri dan tidak masuk perhitungan transaksi/totalan.
    private fun kasbonArray():JSONArray = store.readObject("kasbon/aktif.json").optJSONArray("kasbon") ?: JSONArray()
    fun kasbonEntries():List<JSONObject> {
        val a=kasbonArray()
        return (0 until a.length()).mapNotNull { a.optJSONObject(it) }.sortedByDescending { it.optLong("waktu",0L) }
    }
    fun kasbonPaid(entry:JSONObject):Int {
        val a=entry.optJSONArray("pembayaran") ?: JSONArray()
        return (0 until a.length()).sumOf { a.optJSONObject(it)?.optInt("jumlah",0) ?: 0 }
    }
    fun kasbonRemaining(entry:JSONObject)= (entry.optInt("nominal")-kasbonPaid(entry)).coerceAtLeast(0)
    // Parameter nominalRibuan mengikuti standar input K41; data lama Kasbon tetap
    // disimpan sebagai rupiah penuh agar riwayat terdahulu tidak perlu dikonversi.
    fun addKasbon(nama:String,nominalRibuan:Int,catatan:String):Boolean {
        if(nama.isBlank() || nominalRibuan<=0 || nominalRibuan.toLong()>Int.MAX_VALUE/1000L) return false
        val nominal=nominalRibuan*1000
        ensureKasbonActivityMigration()
        val a=kasbonArray()
        val now=System.currentTimeMillis()
        a.put(JSONObject().apply {
            put("id",java.util.UUID.randomUUID().toString())
            put("nama",nama.trim()); put("nominal",nominal); put("catatan",catatan.trim())
            put("waktu",now); put("tanggal",SimpleDateFormat("dd-MM-yyyy HH:mm",Locale("id","ID")).format(Date(now)))
            put("pembayaran",JSONArray())
        })
        store.writeObject("kasbon/aktif.json",JSONObject().put("kasbon",a))
        appendKasbonActivity("kasbon", a.optJSONObject(a.length()-1) ?: JSONObject(), nominal, catatan, now)
        return true
    }
    private fun appendKasbonActivity(jenis:String, entry:JSONObject, jumlah:Int, catatan:String, waktu:Long) {
        val path="kasbon/aktivitas.json"
        val events=store.readObject(path).optJSONArray("aktivitas") ?: JSONArray()
        events.put(JSONObject().apply {
            put("jenis",jenis); put("id",entry.optString("id")); put("nama",entry.optString("nama"))
            put("jumlah",jumlah); put("catatan",catatan.trim()); put("waktu",waktu)
            put("event_id","$jenis:${entry.optString("id")}:$waktu")
            put("tanggal",SimpleDateFormat("dd-MM-yyyy HH:mm",Locale("id","ID")).format(Date(waktu)))
            put("tanggal_key",SimpleDateFormat("dd-MM-yy",Locale.US).format(Date(waktu)))
        })
        store.writeObject(path,JSONObject().put("aktivitas",events))
    }
    private fun ensureKasbonActivityMigration() {
        val marker="kasbon/aktivitas_migrasi.json"
        if(store.readObject(marker).optBoolean("selesai",false)) return
        val events=store.readObject("kasbon/aktivitas.json").optJSONArray("aktivitas") ?: JSONArray()
        val known=(0 until events.length()).mapNotNull{events.optJSONObject(it)?.optString("event_id")}.toMutableSet()
        for(entry in kasbonEntries()) {
            val id=entry.optString("id")
            val created=entry.optLong("waktu",0L)
            if(created>0L) {
                val key="kasbon:$id:$created"
                if(known.add(key)) events.put(kasbonEvent("kasbon",entry,entry.optInt("nominal"),entry.optString("catatan"),created,key))
            }
            val payments=entry.optJSONArray("pembayaran") ?: JSONArray()
            for(i in 0 until payments.length()) {
                val payment=payments.optJSONObject(i) ?: continue
                val time=payment.optLong("waktu",0L)
                if(time<=0L) continue
                val key="pembayaran:$id:$time"
                if(known.add(key)) events.put(kasbonEvent("pembayaran",entry,payment.optInt("jumlah"),payment.optString("catatan"),time,key))
            }
        }
        store.writeObject("kasbon/aktivitas.json",JSONObject().put("aktivitas",events))
        store.writeObject(marker,JSONObject().put("selesai",true))
    }
    private fun kasbonEvent(jenis:String,entry:JSONObject,jumlah:Int,catatan:String,waktu:Long,eventId:String)=JSONObject().apply {
        put("jenis",jenis);put("id",entry.optString("id"));put("nama",entry.optString("nama"));put("jumlah",jumlah)
        put("catatan",catatan);put("waktu",waktu);put("event_id",eventId)
        put("tanggal",SimpleDateFormat("dd-MM-yyyy HH:mm",Locale("id","ID")).format(Date(waktu)))
        put("tanggal_key",SimpleDateFormat("dd-MM-yy",Locale.US).format(Date(waktu)))
    }
    fun addKasbonPayment(id:String,jumlah:Int,catatan:String):Boolean {
        if(jumlah<=0) return false
        ensureKasbonActivityMigration()
        val a=kasbonArray(); var found=false
        for(i in 0 until a.length()) {
            val entry=a.optJSONObject(i) ?: continue
            if(entry.optString("id")!=id) continue
            val remaining=kasbonRemaining(entry)
            if(jumlah>remaining) return false
            val payments=entry.optJSONArray("pembayaran") ?: JSONArray()
            val now=System.currentTimeMillis()
            payments.put(JSONObject().apply {
                put("jumlah",jumlah); put("catatan",catatan.trim()); put("waktu",now)
                put("tanggal",SimpleDateFormat("dd-MM-yyyy HH:mm",Locale("id","ID")).format(Date(now)))
            })
            entry.put("pembayaran",payments)
            appendKasbonActivity("pembayaran", entry, jumlah, catatan, now)
            found=true; break
        }
        if(found) store.writeObject("kasbon/aktif.json",JSONObject().put("kasbon",a))
        return found
    }

    fun settings():JSONObject=store.readObject("settings.json")
    fun saveSettings(o:JSONObject)=store.writeObject("settings.json",o)
    fun closing():Boolean{val date=SimpleDateFormat("dd-MM-yy",Locale.US).format(Date());val hist="riwayat/$date";if(store.file("$hist/closing_complete.json").exists())return false;val cashNow=cashObject();store.writeObject("$hist/cash.json",cashNow);store.writeObject("cash/aktif.json",JSONObject().put("tambah",JSONArray()).put("uang_di_kotak",0));val mutasiAktif=mutasiObject();store.writeObject("$hist/mutasi.json",mutasiAktif);listOf("Acc","Atk","Voucher").forEach{val a=store.readObject(productPath(it));store.writeObject("$hist/${it.lowercase()}.json",a);val sales=store.readObject(salesPath(it));store.writeObject("$hist/${it.lowercase()}_penjualan.json",sales);store.writeObject(salesPath(it),JSONObject().put("penjualan",JSONArray()));val l=products(it);l.forEach{x->x.awal=x.akhir;x.tambah=0;x.sisa=x.akhir;x.terjual=0;x.omset=0;x.laba=0};saveProducts(it,l)};listOf("Bank","Dana","Ovo","BCA").forEach{val a=store.readObject(txPath(it));val z=txTotal(it);store.writeObject("$hist/${it.lowercase()}.json",a);store.writeObject(totalPath(it),JSONObject().apply{put("saldo_awal",z.saldoAkhir);put("transfer",0);put("tarik",0);put("laba",0);put("bagi",0);if(it=="BCA")put("setor",0) else put("isi",0);put("saldo_akhir",z.saldoAkhir);put("omset",0)});store.writeObject(txPath(it),JSONObject())};val pu=pulsa();store.writeObject("$hist/pulsa.json",pu);store.writeObject("pulsa/aktif.json",JSONObject().apply{put("saldo_awal",pu.optLong("saldo_akhir"));put("pemakaian_saldo",0);put("total_penjualan",0);put("omset",0);put("laba",0);put("isi_saldo",0);put("isi_saldo_entries",JSONArray());put("saldo_akhir",pu.optLong("saldo_akhir"))});val qris=store.readObject("qris/aktif.json");store.writeObject("$hist/qris.json",qris);closeQrisDay();ensureKasbonActivityMigration();val activities=store.readObject("kasbon/aktivitas.json").optJSONArray("aktivitas")?:JSONArray();val grouped=linkedMapOf<String,JSONArray>();for(i in 0 until activities.length()){val event=activities.optJSONObject(i)?:continue;val key=event.optString("tanggal_key",date);if(key.isBlank())continue;val target=grouped.getOrPut(key){val old=store.readObject("riwayat/$key/kasbon.json").optJSONArray("aktivitas")?:JSONArray();JSONArray().apply{for(j in 0 until old.length())old.optJSONObject(j)?.let{put(it)}}};val eventId=event.optString("event_id");var exists=false;if(eventId.isNotBlank())for(j in 0 until target.length())if(target.optJSONObject(j)?.optString("event_id")==eventId){exists=true;break};if(!exists)target.put(event)};grouped.forEach{(key,events)->store.writeObject("riwayat/$key/kasbon.json",JSONObject().put("aktivitas",events))};store.writeObject("kasbon/aktivitas.json",JSONObject().put("aktivitas",JSONArray()));store.writeObject("mutasi/aktif.json",JSONObject().put("mutasi",JSONArray()));val ex=store.readObject("pengeluaran/aktif.json");store.writeObject("$hist/pengeluaran.json",ex);store.writeObject("pengeluaran/aktif.json",JSONObject().put("pengeluaran",JSONArray()));store.writeObject("$hist/closing_complete.json",JSONObject().put("selesai",true).put("waktu",System.currentTimeMillis()));return true}
}
