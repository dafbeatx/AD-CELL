package com.aldea.k.data

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.InputStream
import java.io.OutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

class JsonStore(private val context: Context) {
    private val root get() = File(context.filesDir,"aldea_data")
    private val safetyDir get() = File(context.filesDir,"aldea_safety")
    private val safetyFile get() = File(safetyDir,"before_import.aldea")

    init { recoverOrSeed() }

    private fun recoverOrSeed(){
        if(!root.exists() && safetyFile.exists()){
            try {
                extractBackup(safetyFile.inputStream(), root)
                if(root.exists()) { safetyFile.delete(); return }
            } catch(_:Exception) { root.deleteRecursively() }
        }
        if(!root.exists()) seed()
        migrateDefaultTariffs()
    }

    private fun seed(){ if(root.exists()) return; copyAssetTree("aldea_seed",root) }
    private fun copyAssetTree(asset:String,dest:File){ dest.mkdirs(); context.assets.list(asset)?.forEach { n -> val a="$asset/$n"; val d=File(dest,n); val kids=context.assets.list(a); if(kids!=null && kids.isNotEmpty()) copyAssetTree(a,d) else context.assets.open(a).use{ins->d.outputStream().use{ins.copyTo(it)}} } }
    fun file(path:String)=File(root,path)
    fun readObject(path:String):JSONObject=try{JSONObject(file(path).readText())}catch(_:Exception){JSONObject()}
    fun writeObject(path:String,o:JSONObject){file(path).parentFile?.mkdirs();file(path).writeText(o.toString(4))}
    fun readArray(path:String):JSONArray=try{JSONArray(file(path).readText())}catch(_:Exception){JSONArray()}
    fun writeArray(path:String,a:JSONArray){file(path).parentFile?.mkdirs();file(path).writeText(a.toString(4))}

    private fun migrateDefaultTariffs(){
        replaceOldTariffs("laba/dana_ovo.json",
            listOf(intArrayOf(1,203,3),intArrayOf(204,504,4),intArrayOf(505,1005,5),intArrayOf(1006,2010,10),intArrayOf(2011,3015,15),intArrayOf(3016,4020,20),intArrayOf(4021,5022,22)),
            listOf(intArrayOf(1,102,2),intArrayOf(103,303,3),intArrayOf(304,604,4),intArrayOf(605,1005,5),intArrayOf(1006,2008,8),intArrayOf(2009,3010,10),intArrayOf(3011,4015,15)))
        replaceOldTariffs("laba/bank.json",
            listOf(intArrayOf(1,203,3),intArrayOf(203,1005,5),intArrayOf(1005,2010,10),intArrayOf(2010,3015,15),intArrayOf(3015,4020,20),intArrayOf(4020,5022,22),intArrayOf(5022,6024,24)),
            listOf(intArrayOf(1,203,3),intArrayOf(204,505,4),intArrayOf(506,1005,5),intArrayOf(1006,2008,8),intArrayOf(2009,3010,10),intArrayOf(3011,4015,15),intArrayOf(4016,5020,20)))
    }

    private fun replaceOldTariffs(path:String,old:List<IntArray>,new:List<IntArray>){
        val a=readArray(path)
        if(a.length()!=old.size)return
        val same=(0 until a.length()).all{
            val o=a.optJSONObject(it) ?: return@all false
            val x=old[it]
            o.optInt("minimal")==x[0] && o.optInt("maksimal")==x[1] && o.optInt("admin")==x[2]
        }
        if(!same)return
        val out=JSONArray()
        new.forEach{x->out.put(JSONObject().apply{put("minimal",x[0]);put("maksimal",x[1]);put("admin",x[2])})}
        writeArray(path,out)
    }

    fun exportBackup(out: OutputStream){
        val files = root.walkTopDown().filter { it.isFile }.map { it.relativeTo(root).path.replace(File.separatorChar,'/') }.sorted().toList()
        ZipOutputStream(out.buffered()).use { zip ->
            val manifest = JSONObject().apply{
                put("format","Aldea Backup")
                put("format_version",1)
                put("app_version","1.0.K41")
                put("created_at",System.currentTimeMillis())
                put("file_count",files.size)
            }
            zip.putNextEntry(ZipEntry("aldea_backup.json"));zip.write(manifest.toString(2).toByteArray(Charsets.UTF_8));zip.closeEntry()
            files.forEach { rel ->
                zip.putNextEntry(ZipEntry("data/$rel"))
                File(root,rel).inputStream().use { it.copyTo(zip) }
                zip.closeEntry()
            }
            zip.finish()
        }
    }

    fun importBackup(input: InputStream): Result<String>{
        val tmp=File(context.cacheDir,"aldea_import_tmp")
        tmp.deleteRecursively()
        try{
            val manifest=extractBackup(input,tmp)
            if(manifest.optString("format")!="Aldea Backup" || manifest.optInt("format_version",-1)!=1) throw IllegalArgumentException("File backup Aldea tidak dikenali atau versinya tidak didukung.")
            if(!File(tmp,"settings.json").exists()) throw IllegalArgumentException("Backup tidak lengkap: settings.json tidak ditemukan.")
            val count=tmp.walkTopDown().count{it.isFile}
            val expected=manifest.optInt("file_count",-1)
            if(expected<1 || count!=expected) throw IllegalArgumentException("Backup Aldea tidak lengkap atau rusak.")

            safetyDir.mkdirs();safetyFile.delete()
            safetyFile.outputStream().use { out -> exportBackup(out) }

            val old=root
            val movedOld=File(context.filesDir,"aldea_data_before_import")
            movedOld.deleteRecursively()
            if(old.exists() && !old.renameTo(movedOld)) throw IllegalStateException("Data lama tidak bisa diamankan.")
            if(!tmp.renameTo(old)){
                old.deleteRecursively()
                if(movedOld.exists()) movedOld.renameTo(old)
                throw IllegalStateException("Data backup tidak bisa dipasang.")
            }
            movedOld.deleteRecursively()
            safetyFile.delete()
            return Result.success("Data Aldea berhasil diimpor.")
        }catch(e:Exception){
            tmp.deleteRecursively()
            return Result.failure(e)
        }
    }

    private fun extractBackup(input:InputStream,dest:File):JSONObject{
        dest.deleteRecursively();dest.mkdirs()
        var manifest:JSONObject?=null
        ZipInputStream(input.buffered()).use { zip ->
            val buffer=ByteArray(8192)
            while(true){
                val entry=zip.nextEntry ?: break
                if(entry.isDirectory){zip.closeEntry();continue}
                val name=entry.name
                if(name.startsWith("/") || name.contains("../") || name.contains("\\..")) throw IllegalArgumentException("Isi backup tidak valid.")
                if(name=="aldea_backup.json"){
                    val bytes=zip.readBytesCompat()
                    manifest=JSONObject(String(bytes,Charsets.UTF_8))
                }else if(name.startsWith("data/") && name.length>5){
                    val rel=name.removePrefix("data/")
                    val target=File(dest,rel)
                    val canonicalDest=dest.canonicalFile
                    val canonicalTarget=target.canonicalFile
                    if(!canonicalTarget.path.startsWith(canonicalDest.path+File.separator)) throw IllegalArgumentException("Isi backup tidak valid.")
                    target.parentFile?.mkdirs();target.outputStream().use{out->var n:Int;do{n=zip.read(buffer);if(n>0)out.write(buffer,0,n)}while(n!=-1)}
                }
                zip.closeEntry()
            }
        }
        return manifest ?: throw IllegalArgumentException("File backup bukan backup Aldea.")
    }

    private fun ZipInputStream.readBytesCompat():ByteArray{val out=java.io.ByteArrayOutputStream();val b=ByteArray(4096);var n:Int;do{n=read(b);if(n>0)out.write(b,0,n)}while(n!=-1);return out.toByteArray()}
}
