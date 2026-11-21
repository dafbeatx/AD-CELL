package com.aldea.k.screens

import android.app.AlertDialog
import android.text.InputType
import android.view.*
import android.widget.*
import com.aldea.k.MainActivity
import com.aldea.k.data.AldeaRepository
import com.aldea.k.ui.*
import com.aldea.k.util.Money

class QrisScreen(private val a:MainActivity, private val r:AldeaRepository) {
    fun view():View {
        val root=Ui.root()
        root.addView(Ui.header("QRIS",{a.showMain()}))
        val body=Ui.scroll()
        val box=LinearLayout(App.ctx).apply {
            orientation=LinearLayout.VERTICAL
            setPadding(Ui.dp(14),Ui.dp(14),Ui.dp(14),Ui.dp(18))
        }
        val balance=Ui.card().apply { setPadding(Ui.dp(16),Ui.dp(14),Ui.dp(16),Ui.dp(14)) }
        balance.addView(Ui.text("Total Saldo QRIS",14f,Ui.BLUE,true).apply { gravity=Gravity.CENTER })
        val balanceValue=Ui.text("Rp${money(r.qrisBalance())}",25f,Ui.BLUE,true).apply {
            gravity=Gravity.CENTER; setPadding(0,Ui.dp(5),0,Ui.dp(2))
        }
        balance.addView(balanceValue)
        balance.addView(Ui.text("Admin Tarik Tunai hari ini: Rp${money(r.qrisAdminTotal())}",12f,Ui.MUTED).apply { gravity=Gravity.CENTER })
        box.addView(balance,LinearLayout.LayoutParams(-1,LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin=Ui.dp(14) })

        box.addView(Ui.btn("Tarik Tunai") { a.qrisInput("tarik") },LinearLayout.LayoutParams(-1,Ui.dp(58)).apply { bottomMargin=Ui.dp(9) })
        box.addView(Ui.btn("Bayar QRIS") { a.qrisInput("bayar") },LinearLayout.LayoutParams(-1,Ui.dp(58)).apply { bottomMargin=Ui.dp(9) })
        box.addView(Ui.btn("Pindahkan Saldo ke Bank") { pindahkanSaldo(balanceValue) },LinearLayout.LayoutParams(-1,Ui.dp(58)).apply { bottomMargin=Ui.dp(14) })
        body.addView(box)
        root.addView(body,LinearLayout.LayoutParams(-1,0,1f))
        root.addView(Ui.footer("Kembali" to {a.showMain()}),LinearLayout.LayoutParams(-1,Ui.dp(60)))
        return root
    }

    private fun pindahkanSaldo(balanceValue:TextView) {
        val input=Ui.input("Nominal (ribuan)").apply {
            inputType=InputType.TYPE_CLASS_NUMBER
        }
        val dialogContent=LinearLayout(App.ctx).apply {
            orientation=LinearLayout.VERTICAL
            setPadding(Ui.dp(20),Ui.dp(8),Ui.dp(20),Ui.dp(4))
            addView(Ui.text("Saldo akan dipindahkan dari QRIS ke Bank. Masukkan nominal dalam ribuan. Contoh: 100 = Rp100.000.\nSaldo QRIS: Rp${money(r.qrisBalance())}",14f,Ui.MUTED),LinearLayout.LayoutParams(-1,-2).apply { bottomMargin=Ui.dp(10) })
            addView(input,LinearLayout.LayoutParams(-1,Ui.dp(48)))
        }
        val dialog=AlertDialog.Builder(a)
            .setTitle("Pindahkan Saldo QRIS")
            .setView(dialogContent)
            .setNegativeButton("Batal",null)
            .setPositiveButton("Pindahkan"){_,_->
                val amount=input.text.toString().trim().toIntOrNull()
                when {
                    amount==null || amount<=0 ->
                        Toast.makeText(a,"Masukkan nominal yang valid.",Toast.LENGTH_SHORT).show()
                    !r.createQrisBankPending(amount) ->
                        Toast.makeText(a,"Pemindahan gagal. Periksa nominal dan saldo QRIS.",Toast.LENGTH_LONG).show()
                    else -> {
                        balanceValue.text="Rp${money(r.qrisBalance())}"
                        Toast.makeText(a,"Saldo QRIS berkurang. Pemberitahuan Isi Saldo sudah dikirim ke Bank.",Toast.LENGTH_LONG).show()
                    }
                }
            }
            .create()
        dialog.show()
    }

    private fun money(value:Long)=Money.ribuan(value).removePrefix("Rp")
}

class QrisInputScreen(private val a:MainActivity, private val r:AldeaRepository, private val type:String) {
    private var rows=20
    private val tarik get()=type=="tarik"
    private fun title()=if(tarik) "QRIS - Tarik Tunai" else "QRIS - Bayar QRIS"

    fun view():View {
        val root=Ui.root()
        root.addView(Ui.header(title(),{a.qris()}))
        val summary=LinearLayout(App.ctx).apply {
            orientation=LinearLayout.VERTICAL; setBackgroundColor(Ui.BLUE)
            setPadding(Ui.dp(10),Ui.dp(7),Ui.dp(10),Ui.dp(8))
        }
        val balance=Ui.text("",17f,Ui.WHITE,true).apply { gravity=Gravity.CENTER }
        val admin=Ui.text("",13f,Ui.WHITE).apply { gravity=Gravity.CENTER }
        summary.addView(balance,LinearLayout.LayoutParams(-1,Ui.dp(30)))
        if(tarik) summary.addView(admin,LinearLayout.LayoutParams(-1,Ui.dp(24)))
        root.addView(summary,LinearLayout.LayoutParams(-1,if(tarik) Ui.dp(66) else Ui.dp(42)))

        val body=LinearLayout(App.ctx).apply { orientation=LinearLayout.VERTICAL }
        val head=LinearLayout(App.ctx).apply {
            orientation=LinearLayout.HORIZONTAL; minimumHeight=Ui.dp(48); gravity=Gravity.CENTER_VERTICAL
            setBackgroundColor(Ui.CREAM_SOFT)
        }
        head.addView(Ui.text("No.",12f,Ui.BLUE,true).apply { gravity=Gravity.CENTER },LinearLayout.LayoutParams(Ui.dp(54),Ui.dp(48)))
        head.addView(Ui.text("Nominal (ribuan)",12f,Ui.BLUE,true).apply { gravity=Gravity.CENTER },LinearLayout.LayoutParams(0,Ui.dp(48),1f))
        body.addView(head)
        val list=LinearLayout(App.ctx).apply { orientation=LinearLayout.VERTICAL }
        renderRows(list,balance,admin)
        body.addView(Ui.scroll().apply { addView(list) },LinearLayout.LayoutParams(-1,0,1f))
        root.addView(body,LinearLayout.LayoutParams(-1,0,1f).apply { setMargins(Ui.dp(9),0,Ui.dp(9),0) })
        root.addView(Ui.footer(
            "+ Tambah Kolom" to { rows++; renderRows(list,balance,admin) },
            "Kembali" to { a.qris() }
        ),LinearLayout.LayoutParams(-1,Ui.dp(60)))
        refresh(balance,admin)
        return root
    }

    private fun refresh(balance:TextView,admin:TextView) {
        balance.text="Saldo QRIS: Rp${money(r.qrisBalance())}"
        if(tarik) admin.text="Total Admin Bank: Rp${money(r.qrisAdminTotal())}"
    }

    private fun renderRows(list:LinearLayout,balance:TextView,admin:TextView) {
        list.removeAllViews()
        val values=r.qrisRows(type).toMutableMap()
        val max=maxOf(rows,values.keys.maxOrNull()?:0)
        for(i in 1..max) {
            val row=LinearLayout(App.ctx).apply {
                orientation=LinearLayout.HORIZONTAL; minimumHeight=Ui.dp(52)
                gravity=Gravity.CENTER_VERTICAL
                setBackgroundColor(if(i%2==0) Ui.CREAM_SOFT else Ui.WHITE)
            }
            row.addView(Ui.text(i.toString(),13f,Ui.BLUE,true).apply { gravity=Gravity.CENTER },LinearLayout.LayoutParams(Ui.dp(54),Ui.dp(52)))
            val field=Ui.input().apply {
                inputType=InputType.TYPE_CLASS_NUMBER; textSize=15f; gravity=Gravity.CENTER
                values[i]?.let { setText(it.toString()) }
            }
            field.setOnFocusChangeListener { _,hasFocus ->
                if(!hasFocus) {
                    val value=field.text.toString().trim().toIntOrNull()
                    if(value==null || value<=0) {
                        r.deleteQrisRow(type,i)
                    } else if(!r.saveQrisRow(type,i,value)) {
                        Toast.makeText(a,"Tarif admin Bank belum tersedia untuk nominal ini.",Toast.LENGTH_SHORT).show()
                        field.setText(values[i]?.toString() ?: "")
                    } else {
                        values[i]=value
                    }
                    refresh(balance,admin)
                }
            }
            row.addView(field,LinearLayout.LayoutParams(0,Ui.dp(46),1f).apply { setMargins(Ui.dp(4),Ui.dp(3),Ui.dp(4),Ui.dp(3)) })
            list.addView(row)
        }
        refresh(balance,admin)
    }

    private fun money(value:Long)=Money.ribuan(value).removePrefix("Rp")
}
