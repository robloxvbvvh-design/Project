package com.studio.istorii;

import android.app.Activity;
import android.content.ContentValues;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Locale;

public class MainActivity extends Activity {
    private WebView web;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private OutputStream saveOut;
    private String saveLabel;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "Android");
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int r = tts.setLanguage(new Locale("ru", "RU"));
                ttsReady = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED;
                if (!ttsReady) { tts.setLanguage(Locale.getDefault()); ttsReady = true; }
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) { js("window.__tts&&__tts('start'," + id + ")"); }
                    @Override public void onDone(String id) { js("window.__tts&&__tts('end'," + id + ")"); }
                    @Override public void onError(String id) { js("window.__tts&&__tts('end'," + id + ")"); }
                    @Override public void onRangeStart(String id, int start, int end, int frame) { js("window.__tts&&__tts('range'," + id + "," + start + ")"); }
                });
            }
        });
        web.loadUrl("file:///android_asset/index.html");
    }

    private void js(String code) { runOnUiThread(() -> web.evaluateJavascript(code, null)); }
    private void toast(String m) { runOnUiThread(() -> Toast.makeText(this, m, Toast.LENGTH_LONG).show()); }

    private class Bridge {
        @JavascriptInterface public void speak(int id, String text, float pitch, float rate, String gender) {
            runOnUiThread(() -> {
                if (!ttsReady) { js("window.__tts&&__tts('end'," + id + ")"); return; }
                try {
                    // пробуем выбрать русский голос; пол по возможности через имя голоса
                    Voice pick = null;
                    for (Voice v : tts.getVoices()) {
                        if (!"ru".equals(v.getLocale().getLanguage()) || v.isNetworkConnectionRequired()) continue;
                        String n = v.getName().toLowerCase();
                        boolean fem = n.contains("female") || n.contains("-f-") || n.contains("dfc") || n.contains("ruf");
                        if (pick == null) pick = v;
                        if (("f".equals(gender)) == fem) { pick = v; break; }
                    }
                    if (pick != null) tts.setVoice(pick);
                } catch (Exception ignored) {}
                tts.setPitch(pitch);
                tts.setSpeechRate(rate);
                Bundle p = new Bundle();
                p.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f);
                p.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC);
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, p, String.valueOf(id));
            });
        }
        @JavascriptInterface public void stopSpeak() { runOnUiThread(() -> { if (tts != null) tts.stop(); }); }

        @JavascriptInterface public void startSave(String name, String mime) {
            try {
                closeSave();
                saveLabel = name;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, name);
                    v.put(MediaStore.Downloads.MIME_TYPE, mime);
                    v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    saveOut = getContentResolver().openOutputStream(u);
                } else {
                    File d = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (d != null) d.mkdirs();
                    File f = new File(d, name);
                    saveLabel = f.getPath();
                    saveOut = new FileOutputStream(f);
                }
            } catch (Exception e) { saveOut = null; toast("Ошибка сохранения: " + e.getMessage()); }
        }
        @JavascriptInterface public void writeChunk(String b64) {
            try { if (saveOut != null) saveOut.write(Base64.decode(b64, Base64.DEFAULT)); }
            catch (Exception e) { toast("Ошибка записи: " + e.getMessage()); }
        }
        @JavascriptInterface public void endSave() {
            try { if (saveOut != null) { closeSave(); toast(Build.VERSION.SDK_INT >= 29 ? "Сохранено в «Загрузки»: " + saveLabel : "Сохранено: " + saveLabel); } }
            catch (Exception e) { toast("Ошибка: " + e.getMessage()); }
        }
    }

    private void closeSave() throws java.io.IOException { if (saveOut != null) { saveOut.close(); saveOut = null; } }

    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    @Override protected void onPause() { super.onPause(); web.onPause(); if (tts != null) tts.stop(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); }
    @Override protected void onDestroy() { if (tts != null) { tts.stop(); tts.shutdown(); } super.onDestroy(); }
}
