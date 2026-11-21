package com.aldea.k.screens

import android.graphics.Color
import android.graphics.Typeface
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import com.aldea.k.MainActivity
import com.aldea.k.data.AldeaRepository
import com.aldea.k.ui.*
import com.aldea.k.util.Money

class TotalModalStokScreen(private val a:MainActivity,private val r:AldeaRepository){
    fun view():View{
        val root=Ui.root()
        root.addView(Ui.header("Aldea",{a.adminHome()},"Modal Stok"))
        val scroll=Ui.scroll()
        val box=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.VERTICAL
            setPadding(Ui.dp(14),Ui.dp(14),Ui.dp(14),Ui.dp(22))
        }

        box.addView(Ui.text("Total Modal Stok",23f,Ui.BLUE,true).apply{
            gravity=Gravity.CENTER
            setPadding(0,Ui.dp(5),0,Ui.dp(12))
        })

        val acc=r.totalModalStok("Acc")
        val atk=r.totalModalStok("Atk")
        val voucher=r.totalModalStok("Voucher")
        val total=acc+atk+voucher

        val totalCard=Ui.card().apply{
            setPadding(Ui.dp(18),Ui.dp(16),Ui.dp(18),Ui.dp(17))
            background=Ui.rounded(Ui.BLUE_SOFT,Ui.BLUE_SOFT)
        }
        totalCard.addView(Ui.text("TOTAL MODAL STOK",13f,Color.GRAY,true).apply{
            gravity=Gravity.CENTER
            letterSpacing=.08f
        })
        totalCard.addView(Ui.text(rupiah(total),29f,Ui.BLUE,true).apply{
            gravity=Gravity.CENTER
            setPadding(0,Ui.dp(5),0,Ui.dp(2))
        })
        totalCard.addView(Ui.text("Nilai modal barang yang masih tersisa",12.5f,Color.GRAY).apply{
            gravity=Gravity.CENTER
            setPadding(0,Ui.dp(2),0,0)
        })
        box.addView(totalCard,LinearLayout.LayoutParams(-1,LinearLayout.LayoutParams.WRAP_CONTENT).apply{bottomMargin=Ui.dp(13)})

        box.addView(Ui.text("Rincian Modal",16f,Ui.BLUE,true).apply{
            setPadding(Ui.dp(4),Ui.dp(3),0,Ui.dp(7))
        })

        val detailCard=Ui.card().apply{
            setPadding(Ui.dp(16),Ui.dp(13),Ui.dp(16),Ui.dp(13))
        }
        addDetail(detailCard,"Acc",acc)
        addDivider(detailCard)
        addDetail(detailCard,"Atk",atk)
        addDivider(detailCard)
        addDetail(detailCard,"Voucher & SP",voucher)
        addDivider(detailCard)
        detailCard.addView(Ui.text("TOTAL",14f,Ui.BLUE,true).apply{setPadding(0,Ui.dp(4),0,Ui.dp(2))})
        detailCard.addView(Ui.text(rupiah(total),21f,Ui.TEXT,true))
        box.addView(detailCard,LinearLayout.LayoutParams(-1,LinearLayout.LayoutParams.WRAP_CONTENT).apply{bottomMargin=Ui.dp(13)})

        val calcCard=Ui.card().apply{
            setPadding(Ui.dp(16),Ui.dp(13),Ui.dp(16),Ui.dp(13))
            background=Ui.rounded(Ui.YELLOW_SOFT,Ui.YELLOW_SOFT)
        }
        calcCard.addView(Ui.text("Cara Hitung",15f,Ui.BLUE,true).apply{setPadding(0,0,0,Ui.dp(6))})
        calcCard.addView(Ui.text("Harga modal × stok tersisa × 1.000",14f,Ui.TEXT))
        calcCard.addView(Ui.text("Harga modal dimasukkan dalam ribuan rupiah; contoh 100 = Rp100.000.",12.5f,Color.GRAY).apply{setPadding(0,Ui.dp(5),0,0)})
        box.addView(calcCard,LinearLayout.LayoutParams(-1,LinearLayout.LayoutParams.WRAP_CONTENT).apply{bottomMargin=Ui.dp(14)})

        box.addView(Ui.btn("Kembali"){a.adminHome()},LinearLayout.LayoutParams(-1,Ui.dp(50)))
        scroll.addView(box)
        root.addView(scroll)
        return root
    }

    private fun addDetail(card:LinearLayout,label:String,value:Long){
        val row=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.HORIZONTAL
            gravity=Gravity.CENTER_VERTICAL
            minimumHeight=Ui.dp(48)
        }
        row.addView(Ui.text(label,15f,Ui.TEXT,true).apply{
            gravity=Gravity.CENTER_VERTICAL
        },LinearLayout.LayoutParams(0,Ui.dp(48),1f))
        row.addView(Ui.text(rupiah(value),17f,Ui.TEXT).apply{
            gravity=Gravity.CENTER_VERTICAL or Gravity.END
            typeface=Typeface.DEFAULT_BOLD
        },LinearLayout.LayoutParams(Ui.dp(145),Ui.dp(48)))
        card.addView(row)
    }

    private fun addDivider(card:LinearLayout){
        card.addView(Ui.text("",1f,Color.TRANSPARENT),LinearLayout.LayoutParams(-1,Ui.dp(1)).apply{
            topMargin=Ui.dp(1);bottomMargin=Ui.dp(1)
        })
    }

    private fun rupiah(v:Long):String=Money.rupiah(v)
}
