package com.aldea.k

import android.app.Activity
import android.app.AlertDialog
import android.os.Bundle
import android.view.View
import android.os.Build
import android.view.WindowInsets
import android.content.Intent
import android.widget.Toast
import com.aldea.k.data.*
import com.aldea.k.ui.App
import com.aldea.k.screens.*

class MainActivity:Activity(){
    lateinit var repo:AldeaRepository
    private var page="main"

    override fun onCreate(b:Bundle?){super.onCreate(b);window.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);App.ctx=this;repo=AldeaRepository(JsonStore(this));showMain()}
    fun show(v:View){
        setContentView(v)
        // Keep system bars clear and move the screen footer above the Android keyboard.
        val baseLeft = v.paddingLeft
        val baseTop = v.paddingTop
        val baseRight = v.paddingRight
        val baseBottom = v.paddingBottom
        v.setOnApplyWindowInsetsListener { view, insets ->
            val left: Int
            val top: Int
            val right: Int
            val bottom: Int
            if (Build.VERSION.SDK_INT >= 30) {
                val bars = insets.getInsets(WindowInsets.Type.systemBars())
                val ime = insets.getInsets(WindowInsets.Type.ime())
                left = bars.left
                top = bars.top
                right = bars.right
                // The larger bottom inset keeps fixed footers above the visible keyboard.
                bottom = maxOf(bars.bottom, ime.bottom)
            } else {
                @Suppress("DEPRECATION")
                run {
                    left = insets.systemWindowInsetLeft
                    top = insets.systemWindowInsetTop
                    right = insets.systemWindowInsetRight
                    bottom = insets.systemWindowInsetBottom
                }
            }
            view.setPadding(
                baseLeft + left,
                baseTop + top,
                baseRight + right,
                baseBottom + bottom
            )
            insets
        }
        if (Build.VERSION.SDK_INT >= 30) v.requestApplyInsets()
    }

    fun showMain(){page="main";show(MainScreen(this,repo).view())}
    fun product(t:String,tab:Int=0,extraRows:Int=0){page="product";show(ProductScreen(this,repo,t,tab,extraRows).view())}
    fun transaction(t:String){page="transaction";show(TransactionScreen(this,repo,t).view())}
    fun pulsa(){page="pulsa";show(PulsaScreen(this,repo).view())}
    fun expense(){page="expense";show(ExpenseScreen(this,repo).view())}
    fun kasbon(){page="kasbon";show(KasbonScreen(this,repo).view())}
    fun qris(){page="qris";show(QrisScreen(this,repo).view())}
    fun qrisInput(type:String){page="qrisInput";show(QrisInputScreen(this,repo,type).view())}
    fun total(){page="total";show(TotalScreen(this,repo).view())}
    fun admin(){page="admin";show(AdminLoginScreen(this,repo).view())}
    fun adminHome(){page="adminHome";show(AdminHomeScreen(this,repo).view())}
    fun settings(){page="settings";show(SettingsScreen(this,repo).view())}
    fun history(){page="history";show(HistoryScreen(this,repo).view())}
    fun totalModalStok(){page="modalStok";show(TotalModalStokScreen(this,repo).view())}

    fun exportData(){
        val intent=Intent(Intent.ACTION_CREATE_DOCUMENT).apply{
            addCategory(Intent.CATEGORY_OPENABLE)
            type="application/octet-stream"
            putExtra(Intent.EXTRA_TITLE,"Aldea_Backup_${java.text.SimpleDateFormat("yyyy-MM-dd_HH-mm",java.util.Locale.US).format(java.util.Date())}.aldea")
        }
        startActivityForResult(intent,1001)
    }

    fun importData(){
        val intent=Intent(Intent.ACTION_OPEN_DOCUMENT).apply{
            addCategory(Intent.CATEGORY_OPENABLE)
            type="application/octet-stream"
        }
        startActivityForResult(intent,1002)
    }

    override fun onActivityResult(requestCode:Int,resultCode:Int,data:Intent?){
        super.onActivityResult(requestCode,resultCode,data)
        if(resultCode!=RESULT_OK)return
        val uri=data?.data ?: return
        try{
            when(requestCode){
                1001->{
                    val out=contentResolver.openOutputStream(uri) ?: throw Exception("Lokasi penyimpanan tidak bisa dibuka.")
                    out.use{repo.exportData(it)}
                    Toast.makeText(this,"Backup Aldea berhasil diekspor.",Toast.LENGTH_SHORT).show()
                }
                1002->{
                    AlertDialog.Builder(this)
                        .setTitle("Impor Data")
                        .setMessage("Impor akan mengganti data Aldea saat ini. Data saat ini akan diamankan terlebih dahulu. Lanjutkan?")
                        .setNegativeButton("Batal",null)
                        .setPositiveButton("Impor"){_,_->
                            val ok=contentResolver.openInputStream(uri)?.use{repo.importData(it)}
                                ?: Result.failure(Exception("File tidak bisa dibuka."))
                            ok.onSuccess{Toast.makeText(this,it,Toast.LENGTH_LONG).show();showMain()}
                                .onFailure{Toast.makeText(this,"Impor gagal: ${it.message}",Toast.LENGTH_LONG).show()}
                        }.show()
                }
            }
        }catch(e:Exception){Toast.makeText(this,"Proses gagal: ${e.message}",Toast.LENGTH_LONG).show()}
    }

    override fun onBackPressed(){
        if(page!="main") showMain() else super.onBackPressed()
    }
}
