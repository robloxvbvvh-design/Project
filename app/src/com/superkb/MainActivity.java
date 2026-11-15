package com.superkb;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Bundle;
import android.provider.Settings;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

/** Экран настройки: включить клавиатуру, выдать разрешения, ввести ключ Tenor для GIF. */
public class MainActivity extends Activity {
    private TextView status;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        final SharedPreferences prefs = getSharedPreferences("kb", MODE_PRIVATE);
        ScrollView sv = new ScrollView(this);
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        int pad = (int) (20 * getResources().getDisplayMetrics().density);
        l.setPadding(pad, pad, pad, pad);
        sv.addView(l);
        sv.setBackgroundColor(0xFF15151C);

        l.addView(text("⌨️ Super Keyboard", 26, 0xFFFFFFFF));
        l.addView(text("130+ языков · эмодзи · GIF · перевод · голосовой ввод", 14, 0xFFB8B8C8));
        status = text("", 15, 0xFFFFD166);
        l.addView(status);

        l.addView(btn("1. Включить клавиатуру", new View.OnClickListener() {
            @Override public void onClick(View v) { startActivity(new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)); }
        }));
        l.addView(btn("2. Выбрать Super Keyboard", new View.OnClickListener() {
            @Override public void onClick(View v) {
                ((InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE)).showInputMethodPicker();
            }
        }));
        l.addView(btn("3. Выдать разрешения (микрофон)", new View.OnClickListener() {
            @Override public void onClick(View v) { askPermissions(); }
        }));

        l.addView(text("\nКлюч Tenor API для GIF (бесплатно: developers.google.com/tenor):", 14, 0xFFB8B8C8));
        final EditText key = new EditText(this);
        key.setText(prefs.getString("tenor", ""));
        key.setHint("Tenor API key");
        key.setTextColor(Color.WHITE);
        key.setHintTextColor(0xFF777788);
        key.setInputType(InputType.TYPE_CLASS_TEXT);
        l.addView(key);
        l.addView(btn("Сохранить ключ", new View.OnClickListener() {
            @Override public void onClick(View v) {
                prefs.edit().putString("tenor", key.getText().toString().trim()).apply();
                Toast.makeText(MainActivity.this, "Сохранено", Toast.LENGTH_SHORT).show();
            }
        }));

        l.addView(text("\nПоле для проверки:", 14, 0xFFB8B8C8));
        EditText test = new EditText(this);
        test.setHint("Нажмите сюда и пишите 🙂");
        test.setTextColor(Color.WHITE);
        test.setHintTextColor(0xFF777788);
        l.addView(test);
        setContentView(sv);
        if (b == null && !hasMic()) askPermissions();
    }

    @Override protected void onResume() {
        super.onResume();
        status.setText("Микрофон: " + (hasMic() ? "разрешён ✅" : "не разрешён ❌")
                + "\nИнтернет (GIF, перевод): разрешён ✅");
    }

    private boolean hasMic() { return checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED; }

    private void askPermissions() {
        if (!hasMic()) requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 1);
    }

    @Override public void onRequestPermissionsResult(int c, String[] p, int[] r) { onResume(); }

    private TextView text(String s, int sp, int color) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setPadding(0, 8, 0, 8);
        return t;
    }

    private Button btn(String s, View.OnClickListener c) {
        Button b = new Button(this);
        b.setText(s);
        b.setAllCaps(false);
        b.setOnClickListener(c);
        return b;
    }
}
