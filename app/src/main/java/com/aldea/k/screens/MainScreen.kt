package com.aldea.k.screens

import android.graphics.Color
import android.graphics.Typeface
import android.view.*
import android.widget.*
import com.aldea.k.MainActivity
import com.aldea.k.R
import com.aldea.k.data.AldeaRepository
import com.aldea.k.ui.*

class MainScreen(private val a:MainActivity,private val r:AldeaRepository){
    fun view():View{
        val frame=FrameLayout(App.ctx).apply{setBackgroundColor(Ui.CREAM)}
        lateinit var drawer:LinearLayout
        val scrim=View(App.ctx).apply{setBackgroundColor(Color.argb(80,0,0,0));alpha=0f;visibility=View.GONE}
        val content=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL}
        val header=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER_VERTICAL;setBackgroundColor(Ui.BLUE_DARK);setPadding(Ui.dp(10),Ui.dp(5),Ui.dp(10),Ui.dp(5))}
        header.addView(Button(App.ctx).apply{text="☰";textSize=23f;setTextColor(Ui.WHITE);setBackgroundColor(Color.TRANSPARENT);minHeight=0;minimumHeight=0;stateListAnimator=null;setOnClickListener{openDrawer(drawer,scrim)}},LinearLayout.LayoutParams(Ui.dp(52),Ui.dp(48)))
        header.addView(TextView(App.ctx).apply{text="Aldea";textSize=25f;setTextColor(Ui.WHITE);gravity=Gravity.CENTER;typeface=Typeface.create("sans-serif",Typeface.BOLD)},LinearLayout.LayoutParams(0,Ui.dp(48),1f))
        header.addView(Space(App.ctx),LinearLayout.LayoutParams(Ui.dp(52),Ui.dp(48)))
        content.addView(header,LinearLayout.LayoutParams(-1,Ui.dp(60)))

        val body=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL;setPadding(Ui.dp(14),Ui.dp(14),Ui.dp(14),Ui.dp(14))}
        body.addView(ImageView(App.ctx).apply{setImageResource(R.drawable.adcell_logo);scaleType=ImageView.ScaleType.CENTER_INSIDE},LinearLayout.LayoutParams(-1,Ui.dp(72)))
        section(body,"PRODUK",listOf("Acc" to {a.product("Acc")},"Atk" to {a.product("Atk")},"Voucher & SP" to {a.product("Voucher")}))
        section(body,"TRANSAKSI",listOf("Bank" to {a.transaction("Bank")},"Dana" to {a.transaction("Dana")},"Ovo" to {a.transaction("Ovo")},"BCA" to {a.transaction("BCA")},"Pulsa" to {a.pulsa()},"QRIS" to {a.qris()}))
        section(body,"PENGELUARAN",listOf("Pengeluaran" to {a.expense()}))
        section(body,"CATATAN TERPISAH",listOf("Buku Kasbon" to {a.kasbon()}))
        content.addView(Ui.scroll().apply{addView(body)},LinearLayout.LayoutParams(-1,0,1f))
        val footer=LinearLayout(App.ctx).apply{setPadding(Ui.dp(12),Ui.dp(8),Ui.dp(12),Ui.dp(8));setBackgroundColor(Ui.BLUE_DARK);gravity=Gravity.CENTER}
        footer.addView(Ui.btn("Totalkan"){a.total()}.apply{textSize=20f;typeface=Typeface.DEFAULT_BOLD;background=Ui.rounded(Ui.CREAM,Ui.CREAM)},LinearLayout.LayoutParams(-1,Ui.dp(50)))
        content.addView(footer,LinearLayout.LayoutParams(-1,Ui.dp(64)))
        frame.addView(content,FrameLayout.LayoutParams(-1,-1))

        drawer=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.VERTICAL;setBackgroundColor(Ui.WHITE);elevation=Ui.dp(12).toFloat();translationX=0f
            addView(Ui.text("Menu",22f,Ui.WHITE,true).apply{gravity=Gravity.CENTER_VERTICAL;setPadding(Ui.dp(20),0,Ui.dp(12),0);setBackgroundColor(Ui.BLUE_DARK)},LinearLayout.LayoutParams(-1,Ui.dp(58)))
            addView(Ui.btn("Admin"){closeDrawer(drawer,scrim);a.admin()},LinearLayout.LayoutParams(-1,Ui.dp(52)).apply{setMargins(Ui.dp(12),Ui.dp(14),Ui.dp(12),Ui.dp(6))})
            addView(Ui.btn("Ekspor Data"){closeDrawer(drawer,scrim);a.exportData()},LinearLayout.LayoutParams(-1,Ui.dp(52)).apply{setMargins(Ui.dp(12),Ui.dp(6),Ui.dp(12),Ui.dp(6))})
            addView(Ui.btn("Impor Data"){closeDrawer(drawer,scrim);a.importData()},LinearLayout.LayoutParams(-1,Ui.dp(52)).apply{setMargins(Ui.dp(12),Ui.dp(6),Ui.dp(12),0)})
            addView(Space(App.ctx),LinearLayout.LayoutParams(-1,0,1f))
            addView(Ui.text("Versi: ${Ui.VERSION}",13f,Ui.MUTED,true).apply{
                gravity=Gravity.CENTER
                setPadding(0,0,0,Ui.dp(16))
            },LinearLayout.LayoutParams(-1,Ui.dp(42)))
        }
        frame.addView(scrim,FrameLayout.LayoutParams(-1,-1))
        frame.addView(drawer,FrameLayout.LayoutParams(Ui.dp(280),-1,Gravity.START).apply{leftMargin=-Ui.dp(280)})
        scrim.setOnClickListener{closeDrawer(drawer,scrim)}
        drawer.tag="closed"
        return frame
    }

    private fun section(p:LinearLayout,label:String,items:List<Pair<String,()->Unit>>){
        p.addView(Ui.text(label,13.5f,Ui.BLUE,true).apply{
            gravity=Gravity.CENTER; letterSpacing=.14f; setBackgroundDrawable(Ui.rounded(Ui.WHITE,Ui.LINE));
            setPadding(0,Ui.dp(5),0,Ui.dp(5))
        },LinearLayout.LayoutParams(-1,Ui.dp(34)).apply{setMargins(Ui.dp(2),Ui.dp(2),Ui.dp(2),Ui.dp(7))})
        val g=GridLayout(App.ctx).apply{columnCount=2;useDefaultMargins=false}
        items.forEachIndexed{i,x->
            val lp=GridLayout.LayoutParams().apply{
                width=0;height=Ui.dp(62);
                columnSpec=if(items.size==3 && i==2) GridLayout.spec(0,2,1f) else GridLayout.spec(i%2,1f)
                rowSpec=GridLayout.spec(if(items.size==3 && i==2) 1 else i/2)
                setMargins(0,0,Ui.dp(8),Ui.dp(9))
            }
            g.addView(Ui.btn(x.first,x.second).apply{textSize=17f;typeface=Typeface.create("sans-serif-medium",Typeface.NORMAL)},lp)
        }
        if(items.size==1){g.columnCount=1;g.getChildAt(0).layoutParams=GridLayout.LayoutParams().apply{width=-1;height=Ui.dp(58)}}
        p.addView(g,LinearLayout.LayoutParams(-1,LinearLayout.LayoutParams.WRAP_CONTENT))
    }

    private fun openDrawer(drawer:View,scrim:View){if(drawer.tag=="open")return;drawer.tag="open";scrim.visibility=View.VISIBLE;scrim.animate().alpha(1f).setDuration(180).start();drawer.animate().translationX(Ui.dp(280).toFloat()).setDuration(220).start()}
    private fun closeDrawer(drawer:View,scrim:View){if(drawer.tag!="open")return;drawer.tag="closed";scrim.animate().alpha(0f).setDuration(150).withEndAction{scrim.visibility=View.GONE}.start();drawer.animate().translationX(0f).setDuration(180).start()}
}
