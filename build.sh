#!/usr/bin/env bash
# Сборка APK без Gradle: aapt + javac + dx + apksigner. Нужны пакеты (Ubuntu/Debian):
#   apt-get install android-sdk-platform-23 android-sdk-build-tools aapt apksigner dalvik-exchange zipalign openjdk-17-jdk
set -euo pipefail
cd "$(dirname "$0")"
SDK=/usr/lib/android-sdk
BT=$SDK/build-tools/29.0.3
AJ=$SDK/platforms/android-23/android.jar
OUT=build; DIST=dist
rm -rf $OUT; mkdir -p $OUT/gen $OUT/classes $DIST

aapt package -f --min-sdk-version 23 --target-sdk-version 29 --version-code 1 --version-name 1.0 -M app/AndroidManifest.xml -S app/res -I "$AJ" -J $OUT/gen -F $OUT/res.apk
javac --release 8 -nowarn -cp "$AJ" -d $OUT/classes $(find app/src $OUT/gen -name '*.java')
$BT/dx --dex --min-sdk-version=23 --output=$OUT/classes.dex $OUT/classes
cp $OUT/res.apk $OUT/unsigned.apk
(cd $OUT && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f 4 $OUT/unsigned.apk $OUT/aligned.apk

[ -f debug.keystore ] || keytool -genkeypair -keystore debug.keystore -storepass android -keypass android \
  -alias superkb -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Super Keyboard" >/dev/null 2>&1
apksigner sign --ks debug.keystore --ks-pass pass:android --key-pass pass:android --out $DIST/SuperKeyboard.apk $OUT/aligned.apk
rm -f $DIST/*.idsig; apksigner verify $DIST/SuperKeyboard.apk && echo "OK: $DIST/SuperKeyboard.apk"
