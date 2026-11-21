package com.aldea.k.screens

import android.app.*
import android.graphics.Color
import android.view.*
import android.widget.*
import com.aldea.k.MainActivity
import com.aldea.k.data.AldeaRepository
import com.aldea.k.ui.*
import com.aldea.k.util.Money

class ProductScreen(private val a:MainActivity,private val r:AldeaRepository,private val target:String,private var selectedTab:Int=0,private var extraRows:Int=0){

    fun view():View{
        val root=Ui.root()
        root.addView(Ui.header(target,{a.showMain()}))
        val tabs=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;setPadding(Ui.dp(8),Ui.dp(7),Ui.dp(8),Ui.dp(5))}
        val daftar=if(selectedTab==0)Ui.blueBtn("Daftar $target"){a.product(target,0,extraRows)} else Ui.btn("Daftar $target"){a.product(target,0,extraRows)}
        val terjual=if(selectedTab==1)Ui.blueBtn("Terjual"){a.product(target,1,extraRows)} else Ui.btn("Terjual"){a.product(target,1,extraRows)}
        tabs.addView(daftar,LinearLayout.LayoutParams(0,Ui.dp(44),1f).apply{setMargins(0,0,Ui.dp(4),0)})
        tabs.addView(terjual,LinearLayout.LayoutParams(0,Ui.dp(44),1f).apply{setMargins(Ui.dp(4),0,0,0)})
        root.addView(tabs)
        val scroll=Ui.scroll()
        val box=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL;setPadding(Ui.dp(9),Ui.dp(8),Ui.dp(9),Ui.dp(10))}
        if(selectedTab==0){renderList(box);root.addView(scroll.apply{addView(box)});root.addView(Ui.footer("+ Stok" to {addStock()},"+ Produk" to {addProduct()},"+ Model" to {addModel()}),LinearLayout.LayoutParams(-1,Ui.dp(60)))}
        else {renderSales(box);root.addView(scroll.apply{addView(box)});root.addView(Ui.footer("+ Baris" to {a.product(target,1,extraRows+1)},"Kembali" to {a.product(target,0,extraRows)}),LinearLayout.LayoutParams(-1,Ui.dp(60)))}
        return root
    }

    private fun renderList(box:LinearLayout){
        val groups=r.products(target).groupBy{it.kategori}
        if(groups.isEmpty()){val c=Ui.card();c.addView(Ui.text("Belum ada produk",16f,Ui.BLUE,true).apply{gravity=Gravity.CENTER;setPadding(0,Ui.dp(18),0,Ui.dp(18))});box.addView(c);return}
        groups.forEach{(cat,items)->
            box.addView(Ui.text(cat,16f,Ui.BLUE,true).apply{setPadding(Ui.dp(4),Ui.dp(5),Ui.dp(4),Ui.dp(7))})
            val card=Ui.card().apply{setPadding(Ui.dp(6),Ui.dp(6),Ui.dp(6),Ui.dp(6))}
            val grid=GridLayout(App.ctx).apply{columnCount=5;useDefaultMargins=false}
            val weights=listOf(1.25f,0.8f,1f,0.8f,1.15f)
            arrayOf("Tipe","Stok","Sisa Stok","Terjual","Harga jual").forEachIndexed{ci,h->grid.addView(Ui.text(h,9.5f,Ui.WHITE,true).apply{gravity=Gravity.CENTER;setBackgroundColor(Ui.BLUE);setPadding(Ui.dp(2),Ui.dp(4),Ui.dp(2),Ui.dp(4));maxLines=2},GridLayout.LayoutParams().apply{width=0;height=Ui.dp(44);columnSpec=GridLayout.spec(ci,weights[ci])})}
            items.forEach{p->
                val vals=listOf(
                    Ui.text(p.model,11.5f,Ui.BLUE).apply{gravity=Gravity.CENTER;setPadding(Ui.dp(2),0,Ui.dp(2),0);maxLines=2},
                    Ui.text((p.awal+p.tambah).toString(),11.5f,Ui.BLUE).apply{gravity=Gravity.CENTER},
                    Ui.text(p.sisa.toString(),11.5f,Ui.BLUE,true).apply{gravity=Gravity.CENTER},
                    Ui.text(p.terjual.toString(),11.5f,Ui.BLUE).apply{gravity=Gravity.CENTER},
                    Ui.text(Money.ribuan(p.jual.toLong()),11f,Ui.BLUE).apply{gravity=Gravity.CENTER}
                )
                vals.forEachIndexed{ci,v->grid.addView(v,GridLayout.LayoutParams().apply{width=0;height=Ui.dp(46);columnSpec=GridLayout.spec(ci,weights[ci]);setMargins(Ui.dp(1),Ui.dp(2),Ui.dp(1),Ui.dp(2))})}
            }
            card.addView(grid);box.addView(card,LinearLayout.LayoutParams(-1,-2).apply{bottomMargin=Ui.dp(12)})
        }
    }

    private fun renderSales(box:LinearLayout){
        val products=r.products(target)
        val categories=products.map{it.kategori}.distinct()
        val sales=r.productSales(target)
        box.addView(Ui.text("Satu baris = satu unit terjual",12f,Color.DKGRAY).apply{setPadding(Ui.dp(3),0,0,Ui.dp(8))})
        val header=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;setBackgroundColor(Ui.BLUE)}
        listOf("No" to 0.45f,"Produk" to 1.25f,"Tipe" to 1.3f).forEach{(label,w)->header.addView(Ui.text(label,11f,Ui.WHITE,true).apply{gravity=Gravity.CENTER},LinearLayout.LayoutParams(0,Ui.dp(38),w))}
        box.addView(header)
        val totalRows=maxOf(20,sales.size)+extraRows
        for(i in 0 until totalRows){
            val row=LinearLayout(App.ctx).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER_VERTICAL}
            row.addView(Ui.text((i+1).toString(),12f,Ui.TEXT).apply{gravity=Gravity.CENTER},LinearLayout.LayoutParams(0,Ui.dp(48),0.45f))
            if(i<sales.size){
                val sale=sales[i]
                row.addView(Ui.text(sale.kategori,11.5f,Ui.BLUE).apply{gravity=Gravity.CENTER;maxLines=2},LinearLayout.LayoutParams(0,Ui.dp(48),1.25f))
                row.addView(Ui.text(sale.model,11.5f,Ui.BLUE).apply{gravity=Gravity.CENTER;maxLines=2},LinearLayout.LayoutParams(0,Ui.dp(48),1.3f))
            }else{
                val cat=Spinner(App.ctx).apply{adapter=ArrayAdapter(App.ctx,android.R.layout.simple_spinner_dropdown_item,listOf("Pilih Produk")+categories)}
                val model=Spinner(App.ctx)
                fun refreshModels(){
                    val chosen=cat.selectedItem?.toString().orEmpty()
                    val models=products.filter{it.kategori==chosen}.map{it.model}
                    model.adapter=ArrayAdapter(App.ctx,android.R.layout.simple_spinner_dropdown_item,listOf("Pilih Tipe")+models)
                }
                cat.onItemSelectedListener=object:AdapterView.OnItemSelectedListener{
                    override fun onNothingSelected(parent:AdapterView<*>?){}
                    override fun onItemSelected(parent:AdapterView<*>?,v:View?,position:Int,id:Long){refreshModels()}
                }
                model.onItemSelectedListener=object:AdapterView.OnItemSelectedListener{
                    override fun onNothingSelected(parent:AdapterView<*>?){}
                    override fun onItemSelected(parent:AdapterView<*>?,v:View?,position:Int,id:Long){
                        if(position<=0)return
                        val k=cat.selectedItem?.toString()?:return
                        val m=model.selectedItem?.toString()?:return
                        val ok=r.addProductSale(target,k,m)
                        if(!ok){Toast.makeText(a,"Stok tidak tersedia atau penjualan gagal",Toast.LENGTH_SHORT).show();return}
                        a.product(target,1,extraRows)
                    }
                }
                refreshModels()
                row.addView(cat,LinearLayout.LayoutParams(0,Ui.dp(48),1.25f))
                row.addView(model,LinearLayout.LayoutParams(0,Ui.dp(48),1.3f))
            }
            row.setPadding(0,0,0,Ui.dp(2));box.addView(row,LinearLayout.LayoutParams(-1,Ui.dp(50)))
            if(i<totalRows-1)box.addView(View(App.ctx).apply{setBackgroundColor(Ui.LINE)},LinearLayout.LayoutParams(-1,Ui.dp(1)))
        }
        if(products.isEmpty())box.addView(Ui.text("Tambahkan produk terlebih dahulu melalui Daftar $target.",13f,Ui.RED))
    }

    private fun addProduct(){
        val lay=productForm(null)
        showDialog("Tambah Produk",lay.first){val v=lay.second();val ok=r.addProduct(target,v[0],v[1],v[2].toIntOrNull()?:0,v[3].toIntOrNull()?:0,v[4].toIntOrNull()?:0);if(!ok)Toast.makeText(a,"Produk Ditolak",Toast.LENGTH_SHORT).show()else a.product(target)}
    }
    private fun addModel(){
        val cats=r.products(target).map{it.kategori}.distinct()
        if(cats.isEmpty()){Toast.makeText(a,"Belum ada kategori",Toast.LENGTH_SHORT).show();return}
        val lay=productForm(cats)
        showDialog("Tambah Model",lay.first){val v=lay.second();val ok=r.addModel(target,v[0],v[1],v[2].toIntOrNull()?:0,v[3].toIntOrNull()?:0,v[4].toIntOrNull()?:0);if(!ok)Toast.makeText(a,"Model sudah ada atau tidak valid",Toast.LENGTH_SHORT).show()else a.product(target)}
    }
    private fun addStock(){
        val products=r.products(target);if(products.isEmpty()){Toast.makeText(a,"Belum ada produk",Toast.LENGTH_SHORT).show();return}
        val cats=products.map{it.kategori}.distinct()
        val lay=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL;setPadding(Ui.dp(18),Ui.dp(8),Ui.dp(18),Ui.dp(4))}
        val cat=Spinner(App.ctx);cat.adapter=ArrayAdapter(App.ctx,android.R.layout.simple_spinner_dropdown_item,cats)
        val model=Spinner(App.ctx)
        fun refreshModels(){val c=cat.selectedItem?.toString().orEmpty();val ms=products.filter{it.kategori==c}.map{it.model};model.adapter=ArrayAdapter(App.ctx,android.R.layout.simple_spinner_dropdown_item,ms)}
        cat.onItemSelectedListener=object:AdapterView.OnItemSelectedListener{override fun onNothingSelected(p:AdapterView<*>?){};override fun onItemSelected(p:AdapterView<*>?,v:View?,pos:Int,id:Long){refreshModels()}}
        refreshModels()
        val qty=Ui.input("Jumlah stok").apply{inputType=android.text.InputType.TYPE_CLASS_NUMBER}
        lay.addView(Ui.text("Kategori",13f,Ui.BLUE,true));lay.addView(cat,LinearLayout.LayoutParams(-1,Ui.dp(48)).apply{topMargin=Ui.dp(4)})
        lay.addView(Ui.text("Model",13f,Ui.BLUE,true).apply{setPadding(0,Ui.dp(10),0,0)});lay.addView(model,LinearLayout.LayoutParams(-1,Ui.dp(48)).apply{topMargin=Ui.dp(4)})
        lay.addView(qty,LinearLayout.LayoutParams(-1,Ui.dp(48)).apply{topMargin=Ui.dp(11)})
        AlertDialog.Builder(a).setTitle("Tambah Stok").setView(lay).setNegativeButton("Kembali",null).setPositiveButton("Simpan"){_,_->val k=cat.selectedItem?.toString()?:return@setPositiveButton;val m=model.selectedItem?.toString()?:return@setPositiveButton;val n=qty.text.toString().toIntOrNull()?:0;if(!r.addStock(target,k,m,n))Toast.makeText(a,"Stok gagal ditambahkan",Toast.LENGTH_SHORT).show()else a.product(target)}.show()
    }
    private fun productForm(categories:List<String>?):Pair<View,()->List<String>>{
        val lay=LinearLayout(App.ctx).apply{orientation=LinearLayout.VERTICAL;setPadding(Ui.dp(18),Ui.dp(8),Ui.dp(18),Ui.dp(4))};val fields=mutableListOf<EditText>()
        if(categories==null){fields.add(Ui.input("Kategori"));lay.addView(Ui.text("Kategori",13f,Ui.BLUE,true));lay.addView(fields.last(),fieldLp());listOf("Model","Stok awal","Harga modal (ribuan)","Harga jual (ribuan)").forEach{hint->val e=Ui.input(hint);if(hint!="Model")e.inputType=android.text.InputType.TYPE_CLASS_NUMBER;fields.add(e);lay.addView(e,fieldLp())};return Pair(lay,{fields.map{it.text.toString()}})}
        val sp=Spinner(App.ctx);sp.adapter=ArrayAdapter(App.ctx,android.R.layout.simple_spinner_dropdown_item,categories);lay.addView(Ui.text("Kategori",13f,Ui.BLUE,true));lay.addView(sp,fieldLp())
        val model=Ui.input("Model");val awal=Ui.input("Stok awal").apply{inputType=android.text.InputType.TYPE_CLASS_NUMBER};val modal=Ui.input("Harga modal (ribuan)").apply{inputType=android.text.InputType.TYPE_CLASS_NUMBER};val jual=Ui.input("Harga jual (ribuan)").apply{inputType=android.text.InputType.TYPE_CLASS_NUMBER};listOf(model,awal,modal,jual).forEach{fields.add(it);lay.addView(it,fieldLp())}
        return Pair(lay,{listOf(sp.selectedItem?.toString()?:"",fields[0].text.toString(),fields[1].text.toString(),fields[2].text.toString(),fields[3].text.toString())})
    }
    private fun fieldLp()=LinearLayout.LayoutParams(-1,Ui.dp(46)).apply{setMargins(0,Ui.dp(6),0,0)}
    private fun showDialog(title:String,view:View,save:()->Unit){AlertDialog.Builder(a).setTitle(title).setView(view).setNegativeButton("Kembali",null).setPositiveButton("Simpan"){_,_->save()}.show()}
}
