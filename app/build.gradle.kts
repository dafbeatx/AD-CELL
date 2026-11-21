plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }

android { namespace = "com.aldea.k"; compileSdk = 35
    defaultConfig { applicationId = "com.aldea.k"; minSdk = 23; targetSdk = 35; versionCode = 44; versionName = "1.0.K41-FIX4.1" }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}
