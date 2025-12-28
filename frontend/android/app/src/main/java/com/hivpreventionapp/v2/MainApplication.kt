package com.hivpreventionapp.v2

import com.hivpreventionapp.v2.BuildConfig
import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.PackageList
import com.facebook.soloader.SoLoader
// ADD THESE TWO IMPORTS
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers

class MainApplication : Application(), ReactApplication {

  private val mReactNativeHost: ReactNativeHost = object : ReactNativeHost(this) {
    override fun getUseDeveloperSupport() = BuildConfig.DEBUG

    override fun getPackages(): List<ReactPackage> {
      return PackageList(this).packages
    }

    override fun getJSMainModuleName() = "index"

    // ADD THIS BLOCK TO FORCE JSC INSTEAD OF HERMES
    override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory {
            return com.facebook.react.jscexecutor.JSCExecutorFactory(
                this@MainApplication.packageName,
                AndroidInfoHelpers.getFriendlyDeviceName()
            )
        }
  }

  override fun getReactNativeHost() = mReactNativeHost

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
  }
}