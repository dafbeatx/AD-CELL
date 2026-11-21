package com.aldea.k.ui

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.StateListDrawable
import android.view.Gravity
import android.view.View
import android.widget.*

object App { lateinit var ctx: Context }

object Ui {
    // Palet modern Aldea: navy sebagai dasar, biru sebagai aksi, emas sebagai aksen.
    val BLUE=Color.rgb(23,73,181)          // #1749B5
    val CREAM=Color.rgb(246,248,252)       // latar lembut
    val WHITE=Color.WHITE
    val TEXT=Color.rgb(24,35,56)
    val LINE=Color.rgb(224,231,242)
    val BLUE_SOFT=Color.rgb(235,241,253)
    val CREAM_SOFT=Color.rgb(248,250,255)
    val BLUE_PALE=Color.rgb(220,231,251)
    val BLUE_DARK=Color.rgb(9,39,95)       // #09275F
    val YELLOW_SOFT=Color.rgb(245,185,0)   // #F5B900
    val RED=Color.rgb(204,70,83)
    val RED_DARK=Color.rgb(164,48,62)
    val MUTED=Color.rgb(111,124,146)
    const val VERSION="1.0.K41"

    // Skala ringan berdasarkan lebar layar: mempertahankan tampilan standar,
    // tetapi mengurangi kepadatan pada HP sempit dan memberi ruang pada layar lebar.
    private fun screenScale(): Float {
        val dm = App.ctx.resources.displayMetrics
        val widthDp = dm.widthPixels / dm.density
        return (widthDp / 393f).coerceIn(0.94f, 1.04f)
    }

    fun dp(v:Int):Int=(v*App.ctx.resources.displayMetrics.density*screenScale()+0.5f).toInt()
    fun root()=LinearLayout(App.ctx).apply {
        orientation=LinearLayout.VERTICAL
        setBackgroundColor(CREAM)
        layoutParams=LinearLayout.LayoutParams(-1,-1)
    }

    fun header(title:String, back:()->Unit, right:String?=null):LinearLayout=LinearLayout(App.ctx).apply {
        orientation=LinearLayout.HORIZONTAL
        gravity=Gravity.CENTER_VERTICAL
        setBackgroundColor(BLUE_DARK)
        setPadding(dp(10),0,dp(12),0)
        layoutParams=LinearLayout.LayoutParams(-1,dp(58))
        elevation=dp(3).toFloat()
        addView(TextView(App.ctx).apply {
            text="‹"; textSize=34f; setTextColor(WHITE); gravity=Gravity.CENTER
            includeFontPadding=false; setOnClickListener{back()}
        },LinearLayout.LayoutParams(dp(44),dp(58)))
        addView(TextView(App.ctx).apply {
            text=title; textSize=20f; setTextColor(WHITE); gravity=Gravity.CENTER_VERTICAL
            typeface=Typeface.create("sans-serif",Typeface.BOLD); includeFontPadding=false
        },LinearLayout.LayoutParams(0,dp(58),1f))
        addView(TextView(App.ctx).apply {
            text=right?:""; textSize=12f; setTextColor(Color.rgb(245,185,0)); gravity=Gravity.CENTER
            typeface=Typeface.DEFAULT_BOLD
        },LinearLayout.LayoutParams(dp(54),dp(58)))
    }

    fun btn(text:String,on:()->Unit)=Button(App.ctx).apply {
        this.text=text; isAllCaps=false; textSize=15f; setTextColor(TEXT)
        background=stateRounded(WHITE,LINE,BLUE_SOFT,BLUE)
        elevation=dp(1).toFloat()
        letterSpacing=0f
        setPadding(dp(12),0,dp(12),0); minHeight=0; minimumHeight=0
        stateListAnimator=null
        typeface=Typeface.create("sans-serif-medium",Typeface.NORMAL)
        setOnClickListener{on()}
    }

    fun blueBtn(text:String,on:()->Unit)=Button(App.ctx).apply {
        this.text=text; isAllCaps=false; textSize=15f; setTextColor(WHITE)
        background=stateRounded(BLUE,BLUE,BLUE_DARK,BLUE_DARK); minHeight=0; minimumHeight=0
        elevation=dp(2).toFloat(); letterSpacing=0f
        typeface=Typeface.create("sans-serif-medium",Typeface.BOLD)
        stateListAnimator=null; setOnClickListener{on()}
    }

    fun dangerBtn(text:String,on:()->Unit)=Button(App.ctx).apply {
        this.text=text; isAllCaps=false; textSize=15f; setTextColor(WHITE)
        background=stateRounded(RED,RED,RED_DARK,RED_DARK); minHeight=0; minimumHeight=0
        elevation=dp(1).toFloat(); letterSpacing=0f
        stateListAnimator=null; setOnClickListener{on()}
    }

    fun input(hint:String="")=EditText(App.ctx).apply {
        this.hint=hint; setTextColor(TEXT); setHintTextColor(MUTED); setSingleLine(true); textSize=16f
        showSoftInputOnFocus=true
        setPadding(dp(12),0,dp(12),0); background=rounded(WHITE,LINE)
        letterSpacing=0.01f
        includeFontPadding=true; minHeight=0; minimumHeight=0
        setOnFocusChangeListener { v, hasFocus ->
            v.background=if(hasFocus) rounded(BLUE_SOFT,BLUE).apply{setStroke(dp(2),BLUE)} else rounded(WHITE,LINE)
            
        }
    }

    fun rounded(fill:Int,stroke:Int=fill)=GradientDrawable().apply{setColor(fill);setStroke(dp(1),stroke);cornerRadius=dp(14).toFloat()}

    private fun stateRounded(normalFill:Int,normalStroke:Int,pressedFill:Int,pressedStroke:Int)=StateListDrawable().apply{
        addState(intArrayOf(android.R.attr.state_pressed),rounded(pressedFill,pressedStroke))
        addState(intArrayOf(android.R.attr.state_focused),rounded(pressedFill,pressedStroke))
        addState(intArrayOf(),rounded(normalFill,normalStroke))
    }

    fun scroll()=ScrollView(App.ctx).apply{
        setBackgroundColor(CREAM); layoutParams=LinearLayout.LayoutParams(-1,0,1f)
        clipToPadding=false; isFillViewport=true; overScrollMode=View.OVER_SCROLL_NEVER
        isScrollbarFadingEnabled=true; isSmoothScrollingEnabled=true
    }

    fun card()=LinearLayout(App.ctx).apply{
        orientation=LinearLayout.VERTICAL; setPadding(dp(15),dp(12),dp(15),dp(12))
        setBackgroundDrawable(rounded(WHITE,LINE)); elevation=dp(2).toFloat()
    }

    fun text(value:String,size:Float=15f,color:Int=TEXT,bold:Boolean=false)=TextView(App.ctx).apply{
        text=value; textSize=size; setTextColor(color); includeFontPadding=true; if(bold)typeface=Typeface.DEFAULT_BOLD
        letterSpacing=if(bold) 0.005f else 0f
    }

    fun footer(vararg buttons:Pair<String,()->Unit>):LinearLayout=LinearLayout(App.ctx).apply{
        orientation=LinearLayout.HORIZONTAL; gravity=Gravity.CENTER; setBackgroundColor(BLUE)
        setPadding(dp(10),dp(8),dp(10),dp(8)); weightSum=buttons.size.toFloat()
        buttons.forEach{(label,action)->addView(btn(label,action),LinearLayout.LayoutParams(0,dp(44),1f).apply{setMargins(dp(3),0,dp(3),0)})}
    }
}
