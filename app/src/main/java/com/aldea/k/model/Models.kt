package com.aldea.k.model

data class Product(val kategori:String,val model:String,var awal:Int,var tambah:Int,var sisa:Int,var terjual:Int,var akhir:Int,var modal:Int,var jual:Int,var omset:Int,var laba:Int)
data class ProductSale(val id:String,val kategori:String,val model:String,val modal:Int,val jual:Int,val waktu:Long)
data class TxRow(val baris:Int,var saldoAwal:Long,var transaksi:String,var nominal:Int,var laba:Int,var saldoAkhir:Long)
data class TxTotal(var transfer:Long=0,var tarik:Long=0,var laba:Long=0,var bagi:Long=0,var isi:Long=0,var setor:Long=0,var saldoAkhir:Long=0,var omset:Long=0)
data class Expense(val nomor:Int,var nama:String,var jumlah:Int,var keterangan:String,var jenis:String="ADMIN")
data class TotalResult(val omset:Long,val labaKotor:Long,val labaBersih:Long)
data class Tariff(var minimal:Int,var maksimal:Int,var admin:Int)
