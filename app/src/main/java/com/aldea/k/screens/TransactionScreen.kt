package com.aldea.k.screens

import android.graphics.Color
import android.text.InputType
import android.view.*
import android.widget.*
import com.aldea.k.MainActivity
import com.aldea.k.data.AldeaRepository
import com.aldea.k.model.TxRow
import com.aldea.k.ui.*
import com.aldea.k.util.Money

class TransactionScreen(private val a:MainActivity,private val r:AldeaRepository,private val target:String){
    private var rows=20

    private data class RowState(
        var storageBaris:Int,
        var storedType:String?,
        var selectedType:String? = null
    )

    private fun typeOptions():List<Pair<String,String>> = if(target.equals("BCA",true)) {
        listOf("" to "Pilih transaksi", "bagi" to "Bagi Saldo", "isi" to "Isi Saldo", "transfer" to "Transfer", "tarik" to "Tarik Tunai", "setor" to "Setor")
    } else {
        listOf("" to "Pilih transaksi", "bagi" to "Bagi Saldo", "isi" to "Isi Saldo", "transfer" to "Transfer", "tarik" to "Tarik Tunai")
    }

    fun view():View{
        val root=Ui.root()
        root.addView(Ui.header(target,{a.showMain()}))

        val sum=LinearLayout(App.ctx).apply{setBackgroundColor(Ui.BLUE);setPadding(Ui.dp(8),Ui.dp(7),Ui.dp(8),Ui.dp(7)); elevation=Ui.dp(2).toFloat();gravity=Gravity.CENTER;weightSum=3f}
        val saldo=TextView(App.ctx);val omset=TextView(App.ctx);val sel=TextView(App.ctx)
        listOf("Saldo" to saldo,"Omset" to omset,"Selisih" to sel).forEach{(n,v)->
            val c=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL;gravity=Gravity.CENTER;setBackgroundColor(Ui.CREAM_SOFT)}
            c.addView(TextView(App.ctx).apply{text=n;textSize=11f;setTextColor(Ui.BLUE);gravity=Gravity.CENTER})
            v.textSize=16f;v.setTextColor(Ui.BLUE);v.gravity=Gravity.CENTER;v.typeface=android.graphics.Typeface.DEFAULT_BOLD
            c.addView(v)
            sum.addView(c,LinearLayout.LayoutParams(0,Ui.dp(52),1f).apply{setMargins(Ui.dp(2),0,Ui.dp(2),0)})
        }
        root.addView(sum,LinearLayout.LayoutParams(-1,Ui.dp(62)))

        val alde=Ui.input().apply{hint="Saldo aktual (ribuan)";inputType=InputType.TYPE_CLASS_NUMBER;textSize=15f;gravity=Gravity.CENTER}
        r.txAldea(target)?.let{alde.setText(it.toString())}

        val body=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL}
        val head=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;minimumHeight=Ui.dp(48);setBackgroundColor(Color.WHITE);gravity=Gravity.CENTER_VERTICAL}
        listOf("No.","Nominal","Transaksi").forEachIndexed{idx,it->
            head.addView(TextView(App.ctx).apply{text=it;textSize=12f;setTextColor(Ui.BLUE);gravity=Gravity.CENTER;includeFontPadding=true;typeface=android.graphics.Typeface.DEFAULT_BOLD},LinearLayout.LayoutParams(if(idx==0)Ui.dp(42) else 0,Ui.dp(48),if(idx==0)0f else 1f))
        }
        body.addView(head)
        val list=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL}
        renderRows(list,saldo,omset,sel,alde)
        body.addView(Ui.scroll().apply{addView(list)},LinearLayout.LayoutParams(-1,0,1f))
        root.addView(body,LinearLayout.LayoutParams(-1,0,1f).apply{setMargins(Ui.dp(8),0,Ui.dp(8),0)})

        val footer=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL;setBackgroundColor(Ui.BLUE);setPadding(Ui.dp(10),Ui.dp(6),Ui.dp(10),Ui.dp(7))}
        val arow=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER_VERTICAL}
        arow.addView(Ui.text("Aldea:",14f,Ui.WHITE,true),LinearLayout.LayoutParams(Ui.dp(65),Ui.dp(40)))
        arow.addView(alde,LinearLayout.LayoutParams(0,Ui.dp(40),1f))
        footer.addView(arow,LinearLayout.LayoutParams(-1,Ui.dp(40)))
        val brow=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER;weightSum=2f}
        brow.addView(Ui.btn("+ Baris"){rows++;renderRows(list,saldo,omset,sel,alde)},LinearLayout.LayoutParams(0,Ui.dp(42),1f).apply{setMargins(Ui.dp(3),Ui.dp(3),Ui.dp(3),0)})
        brow.addView(Ui.btn("Kembali"){a.showMain()},LinearLayout.LayoutParams(0,Ui.dp(42),1f).apply{setMargins(Ui.dp(3),Ui.dp(3),Ui.dp(3),0)})
        footer.addView(brow,LinearLayout.LayoutParams(-1,Ui.dp(48)))
        alde.setOnFocusChangeListener{_,has->if(!has){val v=alde.text.toString().toIntOrNull();if(v==null)r.clearTxAldea(target)else r.saveTxAldea(target,v);updateSummary(saldo,omset,sel,alde)}}
        alde.addTextChangedListener(object:android.text.TextWatcher{
            override fun beforeTextChanged(s:CharSequence?,st:Int,c:Int,after:Int){}
            override fun onTextChanged(s:CharSequence?,st:Int,b:Int,c:Int){updateSummary(saldo,omset,sel,alde)}
            override fun afterTextChanged(s:android.text.Editable?){}
        })
        root.addView(footer,LinearLayout.LayoutParams(-1,Ui.dp(100)))
        updateSummary(saldo,omset,sel,alde)
        return root
    }

    private fun updateSummary(saldo:TextView,omset:TextView,sel:TextView,alde:EditText){
        val z=r.txTotal(target);saldo.text=money(z.saldoAkhir);omset.text=money(z.omset)
        val av=alde.text.toString().toIntOrNull();sel.text=money(if(av==null)0L else av.toLong()-z.saldoAkhir)
    }

    private fun money(value:Long):String = Money.ribuan(value)

    private fun renderPendingQris(list:LinearLayout,saldo:TextView,omset:TextView,sel:TextView,alde:EditText) {
        if(!target.equals("Bank",true)) return
        val pending=r.pendingQrisBankTransfers()
        if(pending.isEmpty()) return
        val panel=Ui.card().apply {
            setPadding(Ui.dp(12),Ui.dp(10),Ui.dp(12),Ui.dp(10))
            setBackgroundDrawable(Ui.rounded(Ui.CREAM_SOFT,Ui.YELLOW_SOFT))
        }
        panel.addView(Ui.text("Pemberitahuan Isi Saldo dari QRIS (${pending.size})",15f,Ui.BLUE,true))
        pending.forEachIndexed { index,item ->
            val amount=item.optInt("nominal")
            val id=item.optString("id")
            val line=LinearLayout(App.ctx).apply {
                orientation=LinearLayout.HORIZONTAL
                gravity=Gravity.CENTER_VERTICAL
                setPadding(0,Ui.dp(7),0,Ui.dp(7))
            }
            val info=LinearLayout(App.ctx).apply { orientation=LinearLayout.VERTICAL }
            info.addView(Ui.text(Money.ribuan(amount.toLong()),15f,Ui.TEXT,true))
            info.addView(Ui.text("${item.optString("tanggal")} • QRIS",11f,Ui.MUTED))
            line.addView(info,LinearLayout.LayoutParams(0,Ui.dp(54),1f))
            line.addView(Ui.blueBtn("Input ke Bank") {
                if(r.completeQrisBankTransfer(id)) {
                    Toast.makeText(a,"Isi Saldo QRIS berhasil dicatat di Bank.",Toast.LENGTH_SHORT).show()
                    renderRows(list,saldo,omset,sel,alde)
                    updateSummary(saldo,omset,sel,alde)
                } else Toast.makeText(a,"Pencatatan gagal. Coba lagi.",Toast.LENGTH_LONG).show()
            },LinearLayout.LayoutParams(Ui.dp(126),Ui.dp(42)))
            panel.addView(line)
            if(index<pending.lastIndex) panel.addView(View(App.ctx).apply { setBackgroundColor(Ui.LINE) },LinearLayout.LayoutParams(-1,Ui.dp(1)))
        }
        list.addView(panel,LinearLayout.LayoutParams(-1,-2).apply { bottomMargin=Ui.dp(12) })
    }

    private fun renderRows(list:LinearLayout,saldo:TextView,omset:TextView,sel:TextView,alde:EditText){
        list.removeAllViews()
        renderPendingQris(list,saldo,omset,sel,alde)
        val existing=r.txRowsPublic(target).sortedWith(compareBy<TxRow>{it.baris}.thenBy{when(it.transaksi){"bagi"->0;"isi","setor"->1;"transfer"->2;"tarik"->3;else->9}})
        val maxBaris=existing.maxOfOrNull{it.baris}?:0
        val count=maxOf(rows,existing.size)
        val options=typeOptions()
        for(i in 0 until count){
            val old=existing.getOrNull(i)
            val state=RowState(old?.baris ?: (maxBaris + (i-existing.size+1).coerceAtLeast(1)),old?.transaksi)
            state.selectedType=old?.transaksi
            val row=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;minimumHeight=Ui.dp(54);setBackgroundColor(if(i%2==0)Ui.CREAM_SOFT else Color.WHITE);gravity=Gravity.CENTER_VERTICAL}
            row.addView(TextView(App.ctx).apply{text=(i+1).toString();setTextColor(Ui.BLUE);gravity=Gravity.CENTER;typeface=android.graphics.Typeface.DEFAULT_BOLD},LinearLayout.LayoutParams(Ui.dp(42),Ui.dp(54)))

            val e=Ui.input().apply{textSize=14f;gravity=Gravity.CENTER;inputType=InputType.TYPE_CLASS_NUMBER;hint="Nominal (ribuan)"}
            old?.let{e.setText(it.nominal.toString())}
            val spinner=Spinner(App.ctx).apply{
                adapter=ArrayAdapter(App.ctx,android.R.layout.simple_spinner_item,options.map{it.second}).also{it.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)}
                setSelection(options.indexOfFirst{it.first==old?.transaksi}.coerceAtLeast(0),false)
            }
            // Jangan memakai flag initialSelection. Callback awal Spinner Android
            // dapat datang terlambat dan menelan pilihan pertama pengguna.
            // Pilihan awal cukup dikenali dengan membandingkan nilai terhadap state.
            spinner.onItemSelectedListener=object:AdapterView.OnItemSelectedListener{
                override fun onNothingSelected(parent:AdapterView<*>?){}
                override fun onItemSelected(parent:AdapterView<*>?,view:View?,position:Int,id:Long){
                    val next=options[position].first.ifBlank{null}
                    if(next==state.selectedType)return
                    val nominal=e.text.toString().toIntOrNull()
                    val previous=state.selectedType
                    if(next!=null && nominal!=null && nominal>0){
                        val oldBaris=state.storageBaris
                        val collision = r.txRowsPublic(target).any{it.baris==oldBaris && it.transaksi==next && it.transaksi!=previous}
                        val targetBaris=if(collision) (r.txRowsPublic(target).maxOfOrNull{it.baris}?:0)+1 else oldBaris
                        if(r.saveTx(target,targetBaris,next,nominal)){
                            if(previous!=null && previous!=next) r.deleteTx(target,oldBaris,previous)
                            state.storageBaris=targetBaris
                            state.storedType=next
                            state.selectedType=next
                        }else{
                            Toast.makeText(App.ctx,"Tarif admin belum tersedia untuk nominal ini",Toast.LENGTH_SHORT).show()
                            spinner.setSelection(options.indexOfFirst{it.first==previous}.coerceAtLeast(0))
                        }
                    }else{
                        if(previous!=null) r.deleteTx(target,state.storageBaris,previous)
                        state.storedType=null
                        state.selectedType=next
                    }
                    updateSummary(saldo,omset,sel,alde)
                }
            }
            // Simpan setiap kali nominal berubah setelah jenis transaksi dipilih.
            // Jangan bergantung pada hilangnya fokus: Spinner dan tombol navigasi
            // pada beberapa perangkat tidak selalu memindahkan fokus EditText.
            e.addTextChangedListener(object:android.text.TextWatcher{
                override fun beforeTextChanged(s:CharSequence?,start:Int,count:Int,after:Int){}
                override fun onTextChanged(s:CharSequence?,start:Int,before:Int,count:Int){
                    val v=s?.toString()?.toIntOrNull()
                    val type=state.selectedType
                    if(v!=null && v>0 && type!=null){
                        if(r.saveTx(target,state.storageBaris,type,v)) state.storedType=type
                    }
                    updateSummary(saldo,omset,sel,alde)
                }
                override fun afterTextChanged(s:android.text.Editable?){}
            })
            e.setOnFocusChangeListener{_,has->if(!has){
                val v=e.text.toString().toIntOrNull()
                val type=state.selectedType
                if(v==null||v<=0){
                    if(state.storedType!=null)r.deleteTx(target,state.storageBaris,state.storedType!!)
                    state.storedType=null
                }else if(type!=null){
                    if(r.saveTx(target,state.storageBaris,type,v)) state.storedType=type
                    else Toast.makeText(App.ctx,"Tarif admin belum tersedia untuk nominal ini",Toast.LENGTH_SHORT).show()
                }
                updateSummary(saldo,omset,sel,alde)
            }}
            row.addView(e,LinearLayout.LayoutParams(0,Ui.dp(54),1f).apply{setMargins(Ui.dp(2),Ui.dp(3),Ui.dp(2),Ui.dp(3))})
            row.addView(spinner,LinearLayout.LayoutParams(0,Ui.dp(54),1.25f).apply{setMargins(Ui.dp(2),Ui.dp(2),Ui.dp(2),Ui.dp(2))})
            list.addView(row)
        }
        updateSummary(saldo,omset,sel,alde)
    }
}
