package com.superkb;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.widget.Toast;
import java.util.ArrayList;

/** Прозрачная активность: запрашивает микрофон и (запасной путь) открывает системный диалог распознавания. */
public class VoiceActivity extends Activity {
    private String mode, lang;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        mode = getIntent().getStringExtra("mode");
        lang = getIntent().getStringExtra("lang");
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 1);
        } else proceed();
    }

    @Override public void onRequestPermissionsResult(int c, String[] p, int[] r) {
        if (r.length > 0 && r[0] == PackageManager.PERMISSION_GRANTED) proceed();
        else {
            Toast.makeText(this, "Без доступа к микрофону голосовой ввод не работает", Toast.LENGTH_LONG).show();
            finish();
        }
    }

    private void proceed() {
        if ("dialog".equals(mode)) {
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            if (lang != null) i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
            try {
                startActivityForResult(i, 7);
                return;
            } catch (Exception e) {
                Toast.makeText(this, "На устройстве нет службы распознавания речи. Установите приложение Google.", Toast.LENGTH_LONG).show();
            }
        } else if (KeyboardService.instance != null) {
            KeyboardService.instance.startVoice();
        }
        finish();
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        if (req == 7 && res == RESULT_OK && data != null && KeyboardService.instance != null) {
            ArrayList<String> r = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (r != null && !r.isEmpty()) KeyboardService.instance.onVoiceText(r.get(0));
        }
        finish();
    }
}
