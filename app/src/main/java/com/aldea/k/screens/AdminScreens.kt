package com.aldea.k.screens

import android.app.*
import android.graphics.Color
import android.graphics.Typeface
import android.view.*
import android.widget.*
import java.text.SimpleDateFormat
import java.util.*
import com.aldea.k.MainActivity
import com.aldea.k.data.AldeaRepository
import com.aldea.k.ui.*

class AdminLoginScreen(private val a:MainActivity,private val r:AldeaRepository){
    fun view():View{
        val root=Ui.root();root.addView(Ui.header("Aldea",{a.showMain()},"Admin"))
        val scroll=Ui.scroll();val box=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL;setPadding(Ui.dp(18),Ui.dp(22),Ui.dp(18),Ui.dp(18))}
        box.addView(Ui.text("Admin",23f,Ui.BLUE,true).apply{gravity=Gravity.CENTER;setPadding(0,Ui.dp(4),0,Ui.dp(12))})
        val p=Ui.input("Password");p.inputType=129;box.addView(p,LinearLayout.LayoutParams(-1,Ui.dp(48)).apply{bottomMargin=Ui.dp(10)})
        val msg=Ui.text("",13f,Color.RED).apply{gravity=Gravity.CENTER}
        box.addView(Ui.blueBtn("Masuk"){if(p.text.toString()==r.settings().optString("password","password awal Aldea")){a.adminHome()}else msg.text="Password salah"},LinearLayout.LayoutParams(-1,Ui.dp(48)).apply{bottomMargin=Ui.dp(7)})
        box.addView(msg);scroll.addView(box);root.addView(scroll);return root
    }
}

class AdminHomeScreen(private val a:MainActivity,private val r:AldeaRepository){
    fun view():View{
        val root=Ui.root();root.addView(Ui.header("Aldea",{a.showMain()},"Admin"))
        val scroll=Ui.scroll();val box=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL;setPadding(Ui.dp(14),Ui.dp(14),Ui.dp(14),Ui.dp(18))}
        box.addView(Ui.text("Menu Admin",23f,Ui.BLUE,true).apply{gravity=Gravity.CENTER;setPadding(0,Ui.dp(5),0,Ui.dp(14))})
        listOf("Setting" to {a.settings()},"Hapus ACC" to {delete("Acc")},"Hapus ATK" to {delete("Atk")},"Hapus Voucher & SP" to {delete("Voucher")},"Riwayat" to {a.history()}).forEach{(t,f)->
            val action=if(t.startsWith("Hapus")) Ui.dangerBtn(t,f) else Ui.btn(t,f)
            box.addView(action.apply{textSize=17f},LinearLayout.LayoutParams(-1,Ui.dp(54)).apply{bottomMargin=Ui.dp(10)})
        }
        box.addView(Ui.btn("Total Modal Stok",{a.totalModalStok()}).apply{textSize=17f},LinearLayout.LayoutParams(-1,Ui.dp(56)).apply{bottomMargin=Ui.dp(10)})
        box.addView(Ui.btn("Keluar Admin",{a.showMain()}).apply{textSize=17f},LinearLayout.LayoutParams(-1,Ui.dp(54)).apply{bottomMargin=Ui.dp(4)})
        scroll.addView(box);root.addView(scroll);return root
    }
    private fun delete(t:String){
        val ps=r.products(t);if(ps.isEmpty()){Toast.makeText(a,"Belum ada produk.",Toast.LENGTH_SHORT).show();return}
        val names=ps.map{"${it.kategori} → ${it.model}"}.toTypedArray();val checked=BooleanArray(ps.size)
        AlertDialog.Builder(a).setTitle("Hapus $t").setMultiChoiceItems(names,checked){_,i,v->checked[i]=v}.setPositiveButton("Hapus"){_,_->r.deleteProducts(t,checked.indices.filter{checked[it]}.toSet());Toast.makeText(a,"Produk dihapus",Toast.LENGTH_SHORT).show()}.setNegativeButton("Kembali",null).show()
    }
}

class SettingsScreen(private val a:MainActivity,private val r:AldeaRepository){
    fun view():View{
        val root=Ui.root();root.addView(Ui.header("Aldea",{a.adminHome()},"Setting"))
        val scroll=Ui.scroll();val box=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL;setPadding(Ui.dp(12),Ui.dp(10),Ui.dp(12),Ui.dp(18))}
        box.addView(Ui.text("Pengaturan",23f,Ui.BLUE,true).apply{gravity=Gravity.CENTER;setPadding(0,Ui.dp(4),0,Ui.dp(12))})
        section(box,"Ganti Password"){b->
            val old=Ui.input("Password lama");val n=Ui.input("Password baru");val rep=Ui.input("Ulangi password baru")
            listOf(old,n,rep).forEach{b.addView(it,fieldLp())}
            b.addView(Ui.blueBtn("Simpan Password"){
                val o=r.settings();when{
                    old.text.toString()!=o.optString("password")->Toast.makeText(a,"Password lama salah",Toast.LENGTH_SHORT).show()
                    n.text.toString().isBlank()||n.text.toString()!=rep.text.toString()->Toast.makeText(a,"Password baru tidak sama",Toast.LENGTH_SHORT).show()
                    else->{r.saveSettings(o.put("password",n.text.toString()));old.setText("");n.setText("");rep.setText("");Toast.makeText(a,"Password diubah",Toast.LENGTH_SHORT).show()}
                }
            },buttonLp())
        }
        section(box,"Harga ACC"){b->prices(b,"Acc")}
        section(box,"Harga ATK"){b->prices(b,"Atk")}
        section(box,"Harga VOUCHER & SP"){b->prices(b,"Voucher")}
        section(box,"Tarif Bank"){b->tariffs(b,"Bank")}
        section(box,"Tarif DANA / OVO"){b->tariffs(b,"Dana")}
        section(box,"Kelola Riwayat"){b->historyManage(b)}
        scroll.addView(box);root.addView(scroll);return root
    }

    private fun section(parent:LinearLayout,title:String,fill:(LinearLayout)->Unit){
        val card=Ui.card().apply{setPadding(Ui.dp(10),Ui.dp(6),Ui.dp(10),Ui.dp(10))}
        val head=Ui.btn("$title  ›"){}.apply{textSize=17f;setTextColor(Ui.BLUE);typeface=Typeface.DEFAULT_BOLD;gravity=Gravity.CENTER_VERTICAL}
        val body=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL;setPadding(Ui.dp(2),Ui.dp(5),Ui.dp(2),0);visibility=View.GONE}
        fill(body);card.addView(head,LinearLayout.LayoutParams(-1,Ui.dp(50)));card.addView(body)
        head.setOnClickListener{
            val open=body.visibility!=View.VISIBLE
            body.visibility=if(open)View.VISIBLE else View.GONE
            head.text="$title  ${if(open)"⌄" else "›"}"
        }
        parent.addView(card,LinearLayout.LayoutParams(-1,LinearLayout.LayoutParams.WRAP_CONTENT).apply{bottomMargin=Ui.dp(10)})
    }


    private fun historyManage(b:LinearLayout){
        b.addView(Ui.text("Hapus riwayat Closing berdasarkan tanggal atau bulan.",13f,Color.DKGRAY).apply{setPadding(Ui.dp(4),Ui.dp(3),Ui.dp(4),Ui.dp(9))})
        b.addView(Ui.dangerBtn("Hapus Riwayat Harian"){pickDeleteDay()},buttonLp())
        b.addView(Ui.dangerBtn("Hapus Riwayat Bulanan"){pickDeleteMonth()},buttonLp())
    }

    private fun pickDeleteDay(){
        val c=Calendar.getInstance()
        DatePickerDialog(a,{_,y,m,d->
            val stem=SimpleDateFormat("dd-MM-yy",Locale.US).format(GregorianCalendar(y,m,d).time)
            if(r.deleteHistoryDay(stem))Toast.makeText(a,"Riwayat $stem dihapus.",Toast.LENGTH_SHORT).show() else Toast.makeText(a,"Tidak ada riwayat pada tanggal tersebut.",Toast.LENGTH_SHORT).show()
        },c.get(Calendar.YEAR),c.get(Calendar.MONTH),c.get(Calendar.DAY_OF_MONTH)).show()
    }

    private fun pickDeleteMonth(){
        val c=Calendar.getInstance();val box=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER;setPadding(Ui.dp(12),Ui.dp(10),Ui.dp(12),Ui.dp(4))}
        val months=arrayOf("Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember")
        val month=Spinner(App.ctx).apply{adapter=ArrayAdapter(App.ctx,android.R.layout.simple_spinner_dropdown_item,months);setSelection(c.get(Calendar.MONTH))}
        val years=(c.get(Calendar.YEAR)-10..c.get(Calendar.YEAR)+10).map{it.toString()}.toTypedArray()
        val year=Spinner(App.ctx).apply{adapter=ArrayAdapter(App.ctx,android.R.layout.simple_spinner_dropdown_item,years);setSelection(years.indexOf(c.get(Calendar.YEAR).toString()))}
        box.addView(month,LinearLayout.LayoutParams(0,Ui.dp(50),1f).apply{setMargins(0,0,Ui.dp(6),0)});box.addView(year,LinearLayout.LayoutParams(0,Ui.dp(50),1f).apply{setMargins(Ui.dp(6),0,0,0)})
        AlertDialog.Builder(a).setTitle("Pilih bulan").setView(box).setNegativeButton("Kembali",null).setPositiveButton("Hapus"){_,_->
            val n=r.deleteHistoryMonth(year.selectedItem.toString().toInt(),month.selectedItemPosition+1)
            Toast.makeText(a,if(n>0)"$n hari riwayat bulan tersebut dihapus." else "Tidak ada riwayat pada bulan tersebut.",Toast.LENGTH_SHORT).show()
        }.show()
    }

    private fun prices(b:LinearLayout,t:String){
        b.addView(priceHead())
        r.products(t).forEachIndexed{i,p->
            val row=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER_VERTICAL}
            row.addView(Ui.text("${p.kategori} → ${p.model}",12.5f,Ui.BLUE).apply{gravity=Gravity.CENTER_VERTICAL;maxLines=2;setPadding(0,0,Ui.dp(4),0)},LinearLayout.LayoutParams(0,Ui.dp(48),1f))
            val m=Ui.input("Ribuan").apply{setText(p.modal.toString());gravity=Gravity.CENTER;textSize=13f;inputType=android.text.InputType.TYPE_CLASS_NUMBER};val j=Ui.input("Ribuan").apply{setText(p.jual.toString());gravity=Gravity.CENTER;textSize=13f;inputType=android.text.InputType.TYPE_CLASS_NUMBER}
            row.addView(m,LinearLayout.LayoutParams(Ui.dp(62),Ui.dp(44)).apply{setMargins(Ui.dp(2),0,Ui.dp(2),0)});row.addView(j,LinearLayout.LayoutParams(Ui.dp(62),Ui.dp(44)).apply{setMargins(Ui.dp(2),0,Ui.dp(2),0)})
            row.addView(Ui.blueBtn("Simpan"){
                val ok=r.setPrice(t,i,m.text.toString().toIntOrNull()?:0,j.text.toString().toIntOrNull()?:0)
                Toast.makeText(a,if(ok)"Harga berhasil disimpan." else "Harga gagal disimpan.",Toast.LENGTH_SHORT).show()
            },LinearLayout.LayoutParams(Ui.dp(72),Ui.dp(44)).apply{setMargins(Ui.dp(2),0,0,0)})
            b.addView(row,LinearLayout.LayoutParams(-1,Ui.dp(50)))
        }
    }

    private fun priceHead():View{
        val row=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER_VERTICAL}
        row.addView(Ui.text("Produk",11f,Color.GRAY,true),LinearLayout.LayoutParams(0,Ui.dp(28),1f))
        row.addView(Ui.text("Modal (rb)",10f,Color.GRAY,true).apply{gravity=Gravity.CENTER},LinearLayout.LayoutParams(Ui.dp(66),Ui.dp(28)))
        row.addView(Ui.text("Jual (rb)",10f,Color.GRAY,true).apply{gravity=Gravity.CENTER},LinearLayout.LayoutParams(Ui.dp(66),Ui.dp(28)))
        row.addView(Ui.text("",11f,Color.GRAY),LinearLayout.LayoutParams(Ui.dp(74),Ui.dp(28)))
        return row
    }

    private fun tariffs(b:LinearLayout,t:String){
        b.addView(Ui.text("Min (ribuan)          Maks (ribuan)          Admin (ribuan)",11f,Color.GRAY).apply{setPadding(Ui.dp(2),Ui.dp(2),0,Ui.dp(5));maxLines=1})
        val list=r.tariffs(t)
        val inputs=mutableListOf<Triple<EditText,EditText,EditText>>()
        list.forEach{x->
            val row=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER_VERTICAL}
            val min=Ui.input().apply{setText(x.minimal.toString());gravity=Gravity.CENTER;textSize=13f;inputType=android.text.InputType.TYPE_CLASS_NUMBER}
            val max=Ui.input().apply{setText(x.maksimal.toString());gravity=Gravity.CENTER;textSize=13f;inputType=android.text.InputType.TYPE_CLASS_NUMBER}
            val admin=Ui.input().apply{setText(x.admin.toString());gravity=Gravity.CENTER;textSize=13f;inputType=android.text.InputType.TYPE_CLASS_NUMBER}
            listOf(min,max,admin).forEach{v->row.addView(v,LinearLayout.LayoutParams(0,Ui.dp(44),1f).apply{setMargins(Ui.dp(2),0,Ui.dp(2),0)})}
            inputs.add(Triple(min,max,admin))
            b.addView(row,LinearLayout.LayoutParams(-1,Ui.dp(50)))
        }
        b.addView(Ui.blueBtn("Simpan Tarif"){
            var valid=true
            inputs.forEachIndexed{i,fields->
                val min=fields.first.text.toString().toIntOrNull()
                val max=fields.second.text.toString().toIntOrNull()
                val admin=fields.third.text.toString().toIntOrNull()
                if(min==null||max==null||admin==null){valid=false;return@forEachIndexed}
                list[i].minimal=min;list[i].maksimal=max;list[i].admin=admin
            }
            if(valid){
                r.saveTariffs(t,list)
                Toast.makeText(a,"Tarif $t disimpan.",Toast.LENGTH_SHORT).show()
            }else Toast.makeText(a,"Isi tarif dengan angka yang valid.",Toast.LENGTH_SHORT).show()
        },buttonLp())
    }

    private fun fieldLp()=LinearLayout.LayoutParams(-1,Ui.dp(46)).apply{bottomMargin=Ui.dp(7)}
    private fun buttonLp()=LinearLayout.LayoutParams(-1,Ui.dp(46)).apply{bottomMargin=Ui.dp(7)}
}
