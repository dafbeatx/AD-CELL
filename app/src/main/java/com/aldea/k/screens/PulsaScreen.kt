package com.aldea.k.screens

import android.text.InputType
import android.text.Editable
import android.text.TextWatcher
import android.view.*
import android.widget.*
import com.aldea.k.MainActivity
import com.aldea.k.data.AldeaRepository
import com.aldea.k.ui.*
import com.aldea.k.util.Money
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class PulsaScreen(private val a:MainActivity,private val r:AldeaRepository){
    private fun rupiah(n:Long)=Money.ribuan(n).removePrefix("Rp")

    fun view():View{
        val root=Ui.root();root.addView(Ui.header("Pulsa",{a.showMain()}))
        val body=Ui.scroll()
        val box=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.VERTICAL
            setPadding(Ui.dp(13),Ui.dp(12),Ui.dp(13),Ui.dp(16))
        }
        box.addView(Ui.text("Transaksi Pulsa",22f,Ui.BLUE,true).apply{
            gravity=Gravity.CENTER
            setPadding(0,Ui.dp(3),0,Ui.dp(12))
        })

        // Input isi saldo mandiri: setiap penambahan menjadi catatan terpisah.
        val isiCard=Ui.card().apply{setPadding(Ui.dp(12),Ui.dp(10),Ui.dp(12),Ui.dp(12))}
        isiCard.addView(Ui.text("Isi Saldo Pulsa",16f,Ui.BLUE,true).apply{gravity=Gravity.CENTER})
        isiCard.addView(Ui.text("Tambahkan saldo kapan saja. Bisa diinput berkali-kali.",12f,Ui.MUTED).apply{
            gravity=Gravity.CENTER;setPadding(0,Ui.dp(4),0,Ui.dp(9))
        })
        isiCard.addView(Ui.text("Masukkan dalam ribuan. Contoh: 500 = Rp500.000.",12f,Ui.MUTED).apply{
            gravity=Gravity.CENTER;setPadding(0,0,0,Ui.dp(7))
        })
        val isiInput=Ui.input().apply{
            hint="Nominal isi saldo (ribuan)"
            inputType=InputType.TYPE_CLASS_NUMBER
            textSize=16f;gravity=Gravity.CENTER
        }
        isiCard.addView(isiInput,LinearLayout.LayoutParams(-1,Ui.dp(46)))
        val addButton=Ui.blueBtn("Tambah Isi Saldo"){}
        isiCard.addView(addButton,LinearLayout.LayoutParams(-1,Ui.dp(46)).apply{topMargin=Ui.dp(8)})
        val isiList=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL}
        isiCard.addView(isiList,LinearLayout.LayoutParams(-1,-2).apply{topMargin=Ui.dp(8)})
        box.addView(isiCard,LinearLayout.LayoutParams(-1,-2).apply{bottomMargin=Ui.dp(10)})

        val p=r.pulsa()
        val fields=listOf(
            "Pemakaian saldo (ribuan)" to p.optInt("pemakaian_saldo"),
            "Total penjualan (ribuan)" to p.optInt("total_penjualan")
        )
        val es=mutableListOf<EditText>()
        fields.forEach{(h,v)->
            val card=Ui.card().apply{setPadding(Ui.dp(10),Ui.dp(8),Ui.dp(10),Ui.dp(10))}
            card.addView(Ui.text(h,14f,Ui.BLUE,true).apply{gravity=Gravity.CENTER;setPadding(0,Ui.dp(2),0,Ui.dp(7))})
            val e=Ui.input().apply{setText(v.toString());inputType=InputType.TYPE_CLASS_NUMBER;textSize=16f;gravity=Gravity.CENTER}
            es.add(e);card.addView(e,LinearLayout.LayoutParams(-1,Ui.dp(46)))
            box.addView(card,LinearLayout.LayoutParams(-1,-2).apply{bottomMargin=Ui.dp(9)})
        }

        val result=Ui.card().apply{setPadding(Ui.dp(14),Ui.dp(10),Ui.dp(14),Ui.dp(10))}
        val saldoAwal=Ui.text("",15f,Ui.BLUE,true)
        val totalIsi=Ui.text("",15f,Ui.BLUE,true)
        val laba=Ui.text("",15f,Ui.BLUE,true)
        val saldoAkhir=Ui.text("",15f,Ui.BLUE,true)
        val omset=Ui.text("",15f,Ui.BLUE,true)
        listOf(saldoAwal,totalIsi,laba,saldoAkhir,omset).forEach{
            it.gravity=Gravity.CENTER;it.setPadding(0,Ui.dp(4),0,Ui.dp(4));it.maxLines=1
            result.addView(it,LinearLayout.LayoutParams(-1,Ui.dp(30)))
        }
        box.addView(result,LinearLayout.LayoutParams(-1,Ui.dp(170)).apply{topMargin=Ui.dp(2)})

        fun refresh(){
            val x=r.pulsa()
            saldoAwal.text="Saldo awal: Rp${rupiah(x.optLong("saldo_awal"))}"
            totalIsi.text="Total isi saldo: Rp${rupiah(x.optLong("total_isi_saldo"))}"
            laba.text="Laba: Rp${rupiah(x.optLong("laba"))}"
            saldoAkhir.text="Saldo akhir: Rp${rupiah(x.optLong("saldo_akhir"))}"
            omset.text="Omset: Rp${rupiah(x.optLong("omset"))}"
        }
        fun renderIsi(){
            isiList.removeAllViews()
            val entries=r.pulsaIsiEntries()
            if(entries.isEmpty()){
                isiList.addView(Ui.text("Belum ada penambahan saldo hari ini.",12f,Ui.MUTED).apply{gravity=Gravity.CENTER;setPadding(0,Ui.dp(8),0,0)})
            }else{
                isiList.addView(Ui.text("Daftar isi saldo (${entries.size} kali)",13f,Ui.BLUE,true).apply{setPadding(0,Ui.dp(8),0,Ui.dp(4))})
                entries.forEachIndexed{index,item->
                    val row=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER_VERTICAL;setPadding(Ui.dp(4),Ui.dp(5),Ui.dp(4),Ui.dp(5))}
                    val waktu=SimpleDateFormat("HH:mm",Locale("in","ID")).format(Date(item.optLong("waktu")))
                    row.addView(Ui.text("${index+1}. $waktu",12f,Ui.MUTED),LinearLayout.LayoutParams(0,Ui.dp(30),1f))
                    row.addView(Ui.text("Rp${rupiah(item.optLong("nominal"))}",13f,Ui.TEXT,true).apply{gravity=Gravity.RIGHT},LinearLayout.LayoutParams(-2,Ui.dp(30)))
                    isiList.addView(row)
                    if(index<entries.lastIndex)isiList.addView(View(App.ctx).apply{setBackgroundColor(Ui.LINE)},LinearLayout.LayoutParams(-1,Ui.dp(1)))
                }
            }
        }
        addButton.setOnClickListener{
            val nominalRibuan=isiInput.text.toString().trim().toIntOrNull()
            val nominal=nominalRibuan?.takeIf{it>0}
            if(nominal==null||nominal<=0){Toast.makeText(App.ctx,"Masukkan nominal isi saldo yang benar",Toast.LENGTH_SHORT).show()}
            else if(r.addPulsaIsiSaldo(nominal)){
                isiInput.setText("");renderIsi();refresh()
                Toast.makeText(App.ctx,"Isi saldo berhasil ditambahkan",Toast.LENGTH_SHORT).show()
            }else Toast.makeText(App.ctx,"Isi saldo gagal disimpan",Toast.LENGTH_SHORT).show()
        }

        fun save(){
            val ok=r.savePulsa(es[0].text.toString().toIntOrNull()?:0,es[1].text.toString().toIntOrNull()?:0)
            if(!ok) Toast.makeText(a,"Nilai Pulsa di luar batas atau tidak valid.",Toast.LENGTH_LONG).show()
            refresh()
        }
        es.forEach{e->
            var dirty=false
            e.addTextChangedListener(object:TextWatcher{
                override fun beforeTextChanged(s:CharSequence?,start:Int,count:Int,after:Int){}
                override fun onTextChanged(s:CharSequence?,start:Int,before:Int,count:Int){dirty=true}
                override fun afterTextChanged(s:Editable?){}
            })
            e.setOnFocusChangeListener{_,has->if(!has&&dirty){dirty=false;save()}}
        }
        renderIsi();refresh()
        body.addView(box);root.addView(body)
        root.addView(Ui.footer("Kembali" to {a.showMain()}),LinearLayout.LayoutParams(-1,Ui.dp(60)))
        return root
    }
}
