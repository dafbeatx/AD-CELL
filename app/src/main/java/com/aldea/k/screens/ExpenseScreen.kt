package com.aldea.k.screens

import android.graphics.Color
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.*
import android.widget.*
import com.aldea.k.MainActivity
import com.aldea.k.data.AldeaRepository
import com.aldea.k.model.Expense
import com.aldea.k.ui.*
import com.aldea.k.util.Money

class ExpenseScreen(private val a:MainActivity,private val r:AldeaRepository){
    private var rows=10

    fun view():View{
        val root=Ui.root()
        root.addView(Ui.header("Pengeluaran",{a.showMain()}))

        val title=Ui.text("Total Pengeluaran",15f,Ui.WHITE,true).apply{
            gravity=Gravity.CENTER_VERTICAL
        }
        val total=Ui.text("0",19f,Ui.WHITE,true).apply{
            gravity=Gravity.CENTER
            maxLines=1
        }
        val bar=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.HORIZONTAL
            gravity=Gravity.CENTER_VERTICAL
            setBackgroundColor(Ui.BLUE)
            setPadding(Ui.dp(12),Ui.dp(6),Ui.dp(12),Ui.dp(6))
        }
        bar.addView(title,LinearLayout.LayoutParams(0,Ui.dp(48),1f))
        bar.addView(total,LinearLayout.LayoutParams(Ui.dp(105),Ui.dp(48)))
        root.addView(bar,LinearLayout.LayoutParams(-1,Ui.dp(60)))

        val scroll=Ui.scroll()
        val list=LinearLayout(App.ctx).apply{
            orientation=LinearLayout.VERTICAL
            setPadding(Ui.dp(7),Ui.dp(7),Ui.dp(7),Ui.dp(9))
        }
        render(list,total)
        scroll.addView(list)
        root.addView(scroll,LinearLayout.LayoutParams(-1,0,1f).apply{setMargins(Ui.dp(8),0,Ui.dp(8),0)})

        root.addView(
            Ui.footer(
                "+ Baris" to {rows++;render(list,total)},
                "Kembali" to {a.showMain()}
            ),
            LinearLayout.LayoutParams(-1,Ui.dp(60))
        )
        return root
    }

    private fun render(list:LinearLayout,total:TextView){
        list.removeAllViews()

        val head=rowBase(true)
        arrayOf("No.","Nama","Jenis","Jumlah","Keterangan").forEachIndexed{i,t->
            head.addView(
                Ui.text(t,11f,Ui.BLUE,true).apply{gravity=Gravity.CENTER},
                LinearLayout.LayoutParams(
                    if(i==0)Ui.dp(30) else 0,
                    Ui.dp(48),
                    if(i==0)0f else 1f
                )
            )
        }
        list.addView(head)

        val saved=r.expenses()
        val max=maxOf(rows,saved.maxOfOrNull{it.nomor}?:0)

        for(i in 1..max){
            val row=rowBase(false)
            row.addView(
                Ui.text(i.toString(),13f,Ui.BLUE,true).apply{gravity=Gravity.CENTER},
                LinearLayout.LayoutParams(Ui.dp(30),Ui.dp(52))
            )

            val x=saved.firstOrNull{it.nomor==i}
            val n=Ui.input().apply{
                x?.let{setText(it.nama)}
                textSize=14f
            }
            val jenis=Spinner(App.ctx).apply{
                val pilihan=listOf("Admin","Modal")
                adapter=object: ArrayAdapter<String>(
                    App.ctx,
                    android.R.layout.simple_spinner_item,
                    pilihan
                ){
                    override fun getView(position:Int,convertView:View?,parent:ViewGroup):View{
                        val label=(convertView as? TextView)?:TextView(App.ctx)
                        label.text=pilihan.getOrElse(position){"Admin"}
                        label.setTextColor(Ui.BLUE)
                        label.textSize=13f
                        label.gravity=Gravity.CENTER
                        label.maxLines=1
                        label.setPadding(Ui.dp(2),0,Ui.dp(2),0)
                        return label
                    }
                    override fun getDropDownView(position:Int,convertView:View?,parent:ViewGroup):View{
                        val label=(convertView as? TextView)?:TextView(App.ctx)
                        label.text=pilihan.getOrElse(position){"Admin"}
                        label.setTextColor(Ui.BLUE)
                        label.textSize=14f
                        label.gravity=Gravity.CENTER_VERTICAL
                        label.setPadding(Ui.dp(12),Ui.dp(10),Ui.dp(12),Ui.dp(10))
                        label.setBackgroundColor(Color.WHITE)
                        return label
                    }
                }
                setSelection(if(x?.jenis=="MODAL")1 else 0)
            }
            val j=Ui.input("Jumlah (ribuan)").apply{
                x?.let{setText(it.jumlah.toString())}
                inputType=InputType.TYPE_CLASS_NUMBER
                textSize=13f
                gravity=Gravity.CENTER
            }
            val k=Ui.input("Keterangan").apply{
                x?.let{setText(it.keterangan)}
                textSize=13f
            }

            listOf(n,jenis,j,k).forEachIndexed{index,v->
                row.addView(v,LinearLayout.LayoutParams(0,Ui.dp(52),1f).apply{
                    setMargins(Ui.dp(1),Ui.dp(2),Ui.dp(1),Ui.dp(2))
                })
            }

            fun save(){
                r.saveExpense(
                    Expense(
                        i,
                        n.text.toString(),
                        j.text.toString().toIntOrNull()?:0,
                        k.text.toString(),
                        if(jenis.selectedItemPosition==1)"MODAL" else "ADMIN"
                    )
                )
                updateTotal(total)
            }
            var lastJenis=jenis.selectedItemPosition
            jenis.onItemSelectedListener=object:AdapterView.OnItemSelectedListener{
                override fun onNothingSelected(parent:AdapterView<*>?){}
                override fun onItemSelected(parent:AdapterView<*>?,view:View?,position:Int,id:Long){
                    if(position!=lastJenis){lastJenis=position;save()}
                }
            }

            listOf(n,j,k).forEach{e->
                var dirty=false
                e.addTextChangedListener(object:TextWatcher{
                    override fun beforeTextChanged(s:CharSequence?,start:Int,count:Int,after:Int){}
                    override fun onTextChanged(s:CharSequence?,start:Int,before:Int,count:Int){dirty=true}
                    override fun afterTextChanged(s:Editable?){}
                })
                e.setOnFocusChangeListener{_,has->
                    if(!has&&dirty){
                        dirty=false
                        save()
                    }
                }
            }

            list.addView(row)
        }

        updateTotal(total)
    }

    private fun updateTotal(total:TextView){
        total.text=formatNumber(r.expenseTotal())
    }

    private fun rowBase(header:Boolean)=LinearLayout(App.ctx).apply{
        orientation=LinearLayout.HORIZONTAL
        minimumHeight=Ui.dp(if(header)48 else 52)
        setBackgroundColor(if(header)Color.WHITE else Ui.CREAM_SOFT)
        gravity=Gravity.CENTER_VERTICAL
    }

    private fun formatNumber(v:Long):String = Money.ribuan(v)
}
