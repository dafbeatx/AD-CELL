package com.aldea.k.screens

import android.app.*
import android.text.InputType
import android.view.*
import android.widget.*
import com.aldea.k.MainActivity
import com.aldea.k.data.AldeaRepository
import com.aldea.k.ui.*
import com.aldea.k.util.Money

class TotalScreen(private val a:MainActivity,private val r:AldeaRepository){
    fun view():View{
        val root=Ui.root()
        root.addView(Ui.header("Totalan",{a.showMain()}))
        val body=Ui.scroll()
        val box=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.VERTICAL
            setPadding(Ui.dp(13),Ui.dp(13),Ui.dp(13),Ui.dp(18))
        }
        val x=r.total()
        metric(box,"Omset",x.omset)
        metric(box,"Laba Kotor",x.labaKotor)
        metric(box,"Laba Bersih",x.labaBersih)
        box.addView(Ui.blueBtn("Closing"){
            AlertDialog.Builder(a).setTitle("Sudah Closing?")
                .setMessage("Data aktif akan disimpan ke Riwayat lalu di-reset. Pemberitahuan QRIS yang belum diinput ke Bank tetap menunggu.")
                .setNegativeButton("Tidak",null)
                .setPositiveButton("Ya, Closing"){_,_->
                    val closed=r.closing()
                    Toast.makeText(a,if(closed)"Closing berhasil" else "Hari ini sudah Closing.",Toast.LENGTH_SHORT).show()
                    a.showMain()
                }.show()
        },LinearLayout.LayoutParams(Ui.dp(150),Ui.dp(48)).apply{
            gravity=Gravity.CENTER_HORIZONTAL
            topMargin=Ui.dp(8)
            bottomMargin=Ui.dp(16)
        })
        cashSection(box)
        body.addView(box)
        root.addView(body)
        root.addView(Ui.footer("Kembali" to {a.showMain()}),LinearLayout.LayoutParams(-1,Ui.dp(60)))
        return root
    }

    private fun cashSection(parent:LinearLayout){
        val card=Ui.card().apply{
            setPadding(Ui.dp(14),Ui.dp(13),Ui.dp(14),Ui.dp(14))
        }
        card.addView(Ui.text("Totalan Cash",19f,Ui.BLUE,true))
        card.addView(Ui.text("Catat setiap penambahan uang ke kotak. Bisa lebih dari satu kali.",12f,Ui.MUTED).apply{
            setPadding(0,Ui.dp(3),0,Ui.dp(10))
        })
        val entries=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL}
        card.addView(entries)
        val addButton=Ui.btn("+ Tambah Cash") {}
        card.addView(addButton,LinearLayout.LayoutParams(-1,Ui.dp(46)).apply{bottomMargin=Ui.dp(12)})

        val tambahValue=Ui.text("",15f,Ui.TEXT,true)
        val totalValue=Ui.text("",15f,Ui.TEXT,true)
        val countInput=Ui.input("Uang di kotak (ribuan)").apply{
            inputType=InputType.TYPE_CLASS_NUMBER
            gravity=Gravity.CENTER
        }
        countInput.setText(if(r.cashInBox()>0)r.cashInBox().toString() else "")
        val minusValue=Ui.text("",15f,Ui.RED,true)
        val lebihValue=Ui.text("",15f,Ui.BLUE,true)

        fun refresh(){
            entries.removeAllViews()
            val rows=r.cashEntries()
            rows.forEachIndexed{index,item->
                val row=LinearLayout(App.ctx).apply{
                    orientation=LinearLayout.HORIZONTAL
                    gravity=Gravity.CENTER_VERTICAL
                    setPadding(0,Ui.dp(4),0,Ui.dp(4))
                }
                row.addView(Ui.text("Tambah ${index+1}",13f,Ui.MUTED),LinearLayout.LayoutParams(0,Ui.dp(30),1f))
                row.addView(Ui.text(formatMoney(item.optLong("nominal")),14f,Ui.TEXT,true))
                entries.addView(row)
            }
            val tambah=r.cashAddTotal()
            val totalan=tambah+r.total().omset
            val cash=countInput.text.toString().toIntOrNull() ?: r.cashInBox()
            val selisih=totalan-cash.toLong()
            tambahValue.text=formatMoney(tambah)
            totalValue.text=formatMoney(totalan)
            minusValue.text=if(selisih>0)formatMoney(selisih) else "—"
            lebihValue.text=if(selisih<0)formatMoney(-selisih) else "—"
        }
        addButton.setOnClickListener{
            val input=Ui.input("Nominal (ribuan)").apply{inputType=InputType.TYPE_CLASS_NUMBER}
            val dialogContent=LinearLayout(App.ctx).apply {
                orientation=LinearLayout.VERTICAL
                setPadding(Ui.dp(20),Ui.dp(8),Ui.dp(20),Ui.dp(4))
                addView(Ui.text("Masukkan nominal dalam ribuan. Contoh: 1000 = Rp1.000.000.",14f,Ui.MUTED),LinearLayout.LayoutParams(-1,-2).apply { bottomMargin=Ui.dp(10) })
                addView(input,LinearLayout.LayoutParams(-1,Ui.dp(48)))
            }
            val dialog=AlertDialog.Builder(a)
                .setTitle("Tambah Cash")
                .setView(dialogContent)
                .setNegativeButton("Batal",null)
                .setPositiveButton("Tambah"){_,_->
                    val amount=input.text.toString().trim().toIntOrNull()
                    if(amount==null || amount<=0){
                        Toast.makeText(a,"Masukkan nominal yang valid.",Toast.LENGTH_SHORT).show()
                    }else if(r.addCash(amount)){
                        refresh()
                        Toast.makeText(a,"Tambah Cash berhasil dicatat.",Toast.LENGTH_SHORT).show()
                    }
                }.create()
            dialog.show()
        }
        countInput.addTextChangedListener(object:android.text.TextWatcher{
            override fun beforeTextChanged(s:CharSequence?,start:Int,count:Int,after:Int){}
            override fun onTextChanged(s:CharSequence?,start:Int,before:Int,count:Int){
                val amount=s?.toString()?.toIntOrNull() ?: 0
                r.saveCashInBox(amount)
                refresh()
            }
            override fun afterTextChanged(s:android.text.Editable?){}
        })

        fun valueRow(label:String,value:TextView){
            val row=LinearLayout(App.ctx).apply{
                orientation=LinearLayout.HORIZONTAL
                gravity=Gravity.CENTER_VERTICAL
                setPadding(0,Ui.dp(5),0,Ui.dp(5))
            }
            row.addView(Ui.text(label,14f,Ui.TEXT),LinearLayout.LayoutParams(0,Ui.dp(38),1f))
            row.addView(value,LinearLayout.LayoutParams(Ui.dp(145),Ui.dp(38)))
            card.addView(row)
        }
        valueRow("Tambah Cash",tambahValue)
        valueRow("Totalan",totalValue)
        val cashRow=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.HORIZONTAL
            gravity=Gravity.CENTER_VERTICAL
            setPadding(0,Ui.dp(5),0,Ui.dp(5))
        }
        cashRow.addView(Ui.text("Uang Di Kotak",14f,Ui.TEXT),LinearLayout.LayoutParams(0,Ui.dp(44),1f))
        cashRow.addView(countInput,LinearLayout.LayoutParams(Ui.dp(145),Ui.dp(44)))
        card.addView(cashRow)
        valueRow("Minus",minusValue)
        valueRow("Lebih",lebihValue)
        parent.addView(card,LinearLayout.LayoutParams(-1,-2).apply{topMargin=Ui.dp(4)})
        refresh()
    }

    private fun metric(b:LinearLayout,l:String,v:Long){
        val c=Ui.card().apply{
            orientation=LinearLayout.HORIZONTAL
            gravity=Gravity.CENTER_VERTICAL
            setPadding(Ui.dp(15),Ui.dp(9),Ui.dp(15),Ui.dp(9))
        }
        c.addView(Ui.text(l,16f,Ui.BLUE,true).apply{gravity=Gravity.CENTER_VERTICAL},LinearLayout.LayoutParams(0,Ui.dp(68),1f))
        c.addView(Ui.text(formatMoney(v),16f,Ui.BLUE,true).apply{gravity=Gravity.RIGHT or Gravity.CENTER_VERTICAL;includeFontPadding=true},LinearLayout.LayoutParams(0,Ui.dp(68),1f))
        b.addView(c,LinearLayout.LayoutParams(-1,Ui.dp(86)).apply{bottomMargin=Ui.dp(10)})
    }

    private fun formatMoney(value:Long):String = Money.ribuan(value)
}
