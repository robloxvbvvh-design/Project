package com.superkb;

import android.Manifest;
import android.content.ClipDescription;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.StateListDrawable;
import android.inputmethodservice.InputMethodService;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.LruCache;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.BaseAdapter;
import android.widget.FrameLayout;
import android.widget.GridView;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

public class KeyboardService extends InputMethodService {
    static final int BG = 0xFF15151C, KEY = 0xFF2B2B38, SPECIAL = 0xFF3C3C50, ACCENT = 0xFF7C6CF0, TXT = 0xFFF2F2F7, RED = 0xFFE5484D;
    static final int MATCH = ViewGroup.LayoutParams.MATCH_PARENT;

    SharedPreferences prefs;
    final Handler ui = new Handler(Looper.getMainLooper());
    final ExecutorService pool = Executors.newFixedThreadPool(4);
    LinearLayout root, keysView;
    FrameLayout content;
    View emojiView, gifView;
    Langs.Lang lang;
    boolean shift, caps, symbols, listening;
    long lastShift;
    final ArrayList<TextView> letterKeys = new ArrayList<TextView>();
    TextView shiftKey, micBtn;
    EditorInfo editorInfo;
    SpeechRecognizer recognizer;
    List<EmojiData.Cat> emojiCats;

    // ───────────────────────── жизненный цикл ─────────────────────────
    @Override public void onCreate() {
        super.onCreate();
        instance = this;
        prefs = getSharedPreferences("kb", MODE_PRIVATE);
        lang = Langs.byCode(prefs.getString("lang", "en"));
    }

    @Override public View onCreateInputView() {
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        root.addView(buildToolbar(), new LinearLayout.LayoutParams(MATCH, dp(42)));
        content = new FrameLayout(this);
        root.addView(content, new LinearLayout.LayoutParams(MATCH, dp(274)));
        keysView = new LinearLayout(this);
        keysView.setOrientation(LinearLayout.VERTICAL);
        buildKeys();
        showKeys();
        return root;
    }

    @Override public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        editorInfo = info;
        if (keysView != null) showKeys();
    }

    @Override public void onFinishInputView(boolean finishingInput) {
        super.onFinishInputView(finishingInput);
        stopVoice();
    }

    @Override public void onDestroy() {
        stopVoice();
        if (instance == this) instance = null;
        pool.shutdownNow();
        super.onDestroy();
    }

    // ───────────────────────── общие помощники ─────────────────────────
    int dp(float v) { return (int) (v * getResources().getDisplayMetrics().density + 0.5f); }

    GradientDrawable rect(int c) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(c);
        g.setCornerRadius(dp(8));
        return g;
    }

    StateListDrawable bg(int c) {
        StateListDrawable s = new StateListDrawable();
        s.addState(new int[]{android.R.attr.state_pressed}, rect(ACCENT));
        s.addState(new int[]{}, rect(c));
        return s;
    }

    TextView label(String t, int color, float sp) {
        TextView v = new TextView(this);
        v.setText(t);
        v.setTextColor(TXT);
        v.setTextSize(sp);
        v.setGravity(Gravity.CENTER);
        v.setBackground(bg(color));
        v.setSingleLine(true);
        return v;
    }

    void add(LinearLayout row, View v, float w) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, MATCH, w);
        p.setMargins(dp(2), dp(3), dp(2), dp(3));
        row.addView(v, p);
    }

    void haptic(View v) { v.performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP); }

    void commit(String s) {
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) ic.commitText(s, 1);
    }

    void showPanel(View v) {
        if (v != voiceView && (listening || voiceMode)) stopVoice();
        content.removeAllViews();
        content.addView(v, new FrameLayout.LayoutParams(MATCH, MATCH));
    }

    void showKeys() { showPanel(keysView); }

    // ───────────────────────── панель инструментов ─────────────────────────
    View buildToolbar() {
        LinearLayout t = new LinearLayout(this);
        t.setOrientation(LinearLayout.HORIZONTAL);
        t.setBackgroundColor(0xFF1D1D27);
        String[] icons = {"⌨", "😀", "GIF", "🌐", "🈯", "🎤", "⚙"};
        for (int i = 0; i < icons.length; i++) {
            final int id = i;
            TextView b = label(icons[i], 0xFF1D1D27, i == 2 ? 14 : 18);
            if (i == 5) micBtn = b;
            b.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) { haptic(v); toolbarClick(id); }
            });
            add(t, b, 1);
        }
        return t;
    }

    void toolbarClick(int id) {
        switch (id) {
            case 0: symbols = false; buildKeys(); showKeys(); break;
            case 1: showPanel(emojiPanel()); break;
            case 2: showPanel(gifPanel()); break;
            case 3: showPanel(listPanel(false)); break;
            case 4: showPanel(listPanel(true)); break;
            case 5: toggleVoice(); break;
            case 6:
                Intent i = new Intent(this, MainActivity.class);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
                break;
        }
    }

    // ───────────────────────── клавиатура ─────────────────────────
    LinearLayout newRow() {
        LinearLayout r = new LinearLayout(this);
        r.setOrientation(LinearLayout.HORIZONTAL);
        keysView.addView(r, new LinearLayout.LayoutParams(MATCH, 0, 1));
        return r;
    }

    TextView charKey(final String c, boolean letter) {
        final TextView k = label(letter && shift ? c.toUpperCase() : c, KEY, 20);
        if (letter) {
            k.setTag(c);
            letterKeys.add(k);
        }
        k.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                haptic(v);
                String s = v.getTag() != null && shift ? c.toUpperCase() : c;
                commit(s);
                if (shift && !caps) { shift = false; refreshLetters(); }
            }
        });
        return k;
    }

    void refreshLetters() {
        for (TextView k : letterKeys) {
            String c = (String) k.getTag();
            k.setText(shift ? c.toUpperCase() : c);
        }
        if (shiftKey != null) shiftKey.setBackground(bg(caps ? ACCENT : shift ? 0xFF5A5A78 : SPECIAL));
    }

    void addChunked(String row, boolean letter, List<String> out) {
        int n = row.length();
        int parts = (n + 10) / 11;
        int size = (n + parts - 1) / parts;
        for (int i = 0; i < n; i += size) out.add(row.substring(i, Math.min(n, i + size)));
    }

    void buildKeys() {
        keysView.removeAllViews();
        letterKeys.clear();
        shiftKey = null;
        List<String> rows = new ArrayList<String>();
        if (symbols) {
            rows.add("1234567890");
            rows.add("@#$%&*-+=/");
            rows.add("()_\"':;!?~");
            rows.add("[]{}<>\\|^`");
            rows.add("€£¥₽₴₹₩°•©®™");
        } else {
            rows.add("1234567890");
            for (String r : Layouts.get(lang.layout)) addChunked(r, true, rows);
            if (lang.extras.length() > 0) addChunked(lang.extras, true, rows);
        }
        int lastLetter = symbols ? 2 : rows.size() - 1 - (lang.extras.length() > 0 ? (lang.extras.length() + 10) / 11 : 0);
        for (int i = 0; i < rows.size(); i++) {
            LinearLayout r = newRow();
            boolean isLetterRow = !symbols && i > 0;
            boolean last = i == lastLetter;
            if (last) {
                shiftKey = label(symbols ? "↔" : "⇧", SPECIAL, 20);
                if (!symbols) shiftKey.setOnClickListener(new View.OnClickListener() {
                    @Override public void onClick(View v) {
                        haptic(v);
                        long now = System.currentTimeMillis();
                        if (now - lastShift < 350) { caps = !caps; shift = caps; }
                        else { shift = !shift; if (!shift) caps = false; }
                        lastShift = now;
                        refreshLetters();
                    }
                });
                add(r, shiftKey, 1.4f);
            }
            String row = rows.get(i);
            for (int j = 0; j < row.length(); j++) add(r, charKey(row.substring(j, j + 1), isLetterRow), 1);
            if (last) add(r, backspaceKey(), 1.4f);
        }
        LinearLayout b = newRow();
        TextView sym = label(symbols ? "ABC" : "?123", SPECIAL, 15);
        sym.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { haptic(v); symbols = !symbols; buildKeys(); }
        });
        add(b, sym, 1.4f);
        TextView em = label("😀", SPECIAL, 20);
        em.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { haptic(v); showPanel(emojiPanel()); }
        });
        add(b, em, 1);
        add(b, charKey(",", false), 1);
        TextView space = label(lang.name, KEY, 14);
        space.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { haptic(v); commit(" "); }
        });
        space.setOnLongClickListener(new View.OnLongClickListener() {
            @Override public boolean onLongClick(View v) { showPanel(listPanel(false)); return true; }
        });
        add(b, space, 4);
        add(b, charKey(".", false), 1);
        TextView enter = label("↵", ACCENT, 20);
        enter.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { haptic(v); enter(); }
        });
        add(b, enter, 1.5f);
    }

    final Runnable repeatDel = new Runnable() {
        @Override public void run() { del(); ui.postDelayed(this, 45); }
    };

    TextView backspaceKey() {
        TextView k = label("⌫", SPECIAL, 20);
        k.setOnTouchListener(new View.OnTouchListener() {
            @Override public boolean onTouch(View v, MotionEvent e) {
                switch (e.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        v.setPressed(true); haptic(v); del();
                        ui.postDelayed(repeatDel, 400);
                        break;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        v.setPressed(false);
                        ui.removeCallbacks(repeatDel);
                        break;
                }
                return true;
            }
        });
        return k;
    }

    void del() { sendDownUpKeyEvents(KeyEvent.KEYCODE_DEL); }

    void enter() {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        int action = editorInfo == null ? EditorInfo.IME_ACTION_NONE : editorInfo.imeOptions & EditorInfo.IME_MASK_ACTION;
        boolean noEnterAction = editorInfo != null && (editorInfo.imeOptions & EditorInfo.IME_FLAG_NO_ENTER_ACTION) != 0;
        if (action != EditorInfo.IME_ACTION_NONE && action != EditorInfo.IME_ACTION_UNSPECIFIED && !noEnterAction)
            ic.performEditorAction(action);
        else sendDownUpKeyEvents(KeyEvent.KEYCODE_ENTER);
    }

    void setLang(Langs.Lang l) {
        lang = l;
        prefs.edit().putString("lang", l.code).apply();
        if (voiceLang != null) voiceLang.setText("🎙 " + l.name + " (" + l.code + ")");
        symbols = false;
        shift = caps = false;
        buildKeys();
        showKeys();
    }

    // ───────────────────────── список языков / перевод ─────────────────────────
    View listPanel(final boolean translate) {
        LinearLayout p = new LinearLayout(this);
        p.setOrientation(LinearLayout.VERTICAL);
        TextView title = new TextView(this);
        title.setText(translate ? "🈯 Перевести текст в поле на… (" + Langs.ALL.size() + " языков)"
                : "🌐 Язык клавиатуры (" + Langs.ALL.size() + " языков)");
        title.setTextColor(0xFFB8B8C8);
        title.setTextSize(14);
        title.setPadding(dp(12), dp(6), dp(12), dp(6));
        p.addView(title);
        ListView lv = new ListView(this);
        lv.setFastScrollEnabled(true);
        lv.setDivider(null);
        ArrayAdapter<Langs.Lang> ad = new ArrayAdapter<Langs.Lang>(this, android.R.layout.simple_list_item_1, Langs.ALL) {
            @Override public View getView(int pos, View cv, ViewGroup parent) {
                TextView t = (TextView) super.getView(pos, cv, parent);
                Langs.Lang l = getItem(pos);
                t.setTextColor(TXT);
                t.setTextSize(16);
                t.setMinHeight(dp(40));
                boolean cur = translate ? l.code.equals(prefs.getString("target", "en")) : l == lang;
                t.setText((cur ? "✓ " : "") + l.name + "  ·  " + l.code);
                return t;
            }
        };
        lv.setAdapter(ad);
        lv.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override public void onItemClick(AdapterView<?> a, View v, int pos, long id) {
                Langs.Lang l = Langs.ALL.get(pos);
                if (translate) { prefs.edit().putString("target", l.code).apply(); showKeys(); translateField(l); }
                else setLang(l);
            }
        });
        p.addView(lv, new LinearLayout.LayoutParams(MATCH, 0, 1));
        return p;
    }

    void translateField(final Langs.Lang target) {
        final InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        final String before = String.valueOf(ic.getTextBeforeCursor(2000, 0));
        final String after = String.valueOf(ic.getTextAfterCursor(2000, 0));
        final String all = (before.equals("null") ? "" : before) + (after.equals("null") ? "" : after);
        if (all.trim().length() == 0) { toast("Сначала напишите текст, потом нажмите 🈯"); return; }
        toast("Перевожу → " + target.name + "…");
        Translator.translate(all, target.code, new Translator.Callback() {
            @Override public void done(String result, String error) {
                InputConnection c = getCurrentInputConnection();
                if (result == null || c == null) { toast("Ошибка перевода: " + error); return; }
                c.deleteSurroundingText(before.equals("null") ? 0 : before.length(), after.equals("null") ? 0 : after.length());
                c.commitText(result, 1);
            }
        });
    }

    void toast(String s) { Toast.makeText(this, s, Toast.LENGTH_SHORT).show(); }

    // ───────────────────────── голосовой ввод ─────────────────────────
    static KeyboardService instance;
    View voiceView;
    TextView voiceStatus, voiceBig, voiceLang;
    boolean voiceMode;

    View voicePanel() {
        if (voiceView == null) {
            LinearLayout p = new LinearLayout(this);
            p.setOrientation(LinearLayout.VERTICAL);
            p.setGravity(Gravity.CENTER);
            voiceLang = new TextView(this);
            voiceLang.setTextColor(0xFFB8B8C8);
            voiceLang.setTextSize(14);
            voiceLang.setGravity(Gravity.CENTER);
            p.addView(voiceLang);
            voiceStatus = new TextView(this);
            voiceStatus.setTextColor(TXT);
            voiceStatus.setTextSize(16);
            voiceStatus.setGravity(Gravity.CENTER);
            voiceStatus.setPadding(dp(16), dp(10), dp(16), dp(10));
            voiceStatus.setMaxLines(4);
            p.addView(voiceStatus);
            voiceBig = new TextView(this);
            voiceBig.setText("🎤");
            voiceBig.setTextSize(40);
            voiceBig.setGravity(Gravity.CENTER);
            voiceBig.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) { haptic(v); if (listening) stopVoice(); else startVoice(); }
            });
            p.addView(voiceBig, new LinearLayout.LayoutParams(dp(110), dp(110)));
            TextView hint = new TextView(this);
            hint.setText("Нажмите на микрофон, чтобы начать или закончить диктовку.\nЯзык — как у клавиатуры (🌐).");
            hint.setTextColor(0xFF77778A);
            hint.setTextSize(12);
            hint.setGravity(Gravity.CENTER);
            hint.setPadding(dp(16), dp(10), dp(16), 0);
            p.addView(hint);
            voiceView = p;
        }
        voiceLang.setText("🎙 " + lang.name + " (" + lang.code + ")");
        setListening(listening);
        return voiceView;
    }

    void say(String s) { if (voiceStatus != null) voiceStatus.setText(s); }

    void toggleVoice() {
        showPanel(voicePanel());
        if (listening) stopVoice(); else startVoice();
    }

    boolean hasMic() { return checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED; }

    void launchVoiceActivity(String mode) {
        Intent i = new Intent(this, VoiceActivity.class);
        i.putExtra("mode", mode);
        i.putExtra("lang", Langs.speechTag(lang));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_ANIMATION);
        startActivity(i);
    }

    /** Текст, пришедший из системного диалога распознавания (запасной путь). */
    void onVoiceText(String text) {
        InputConnection ic = getCurrentInputConnection();
        if (ic != null && text != null && text.length() > 0) ic.commitText(text + " ", 1);
    }

    void startVoice() {
        if (!hasMic()) {
            say("Нужно разрешение на микрофон — разрешите в открывшемся окне");
            launchVoiceActivity("permission");
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            say("Встроенного распознавания нет — открываю системный диалог");
            launchVoiceActivity("dialog");
            return;
        }
        voiceMode = true;
        if (recognizer != null) { try { recognizer.destroy(); } catch (Exception ignored) {} }
        recognizer = SpeechRecognizer.createSpeechRecognizer(this);
        recognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle b) { setListening(true); say("Говорите…"); }
            @Override public void onBeginningOfSpeech() { say("Слушаю…"); }
            @Override public void onRmsChanged(float rms) {
                if (voiceBig != null) { float s = 1f + Math.max(0, Math.min(rms, 10)) / 25f; voiceBig.setScaleX(s); voiceBig.setScaleY(s); }
            }
            @Override public void onBufferReceived(byte[] b) {}
            @Override public void onEndOfSpeech() { say("Обрабатываю…"); }
            @Override public void onError(int e) {
                setListening(false);
                if (e == SpeechRecognizer.ERROR_NO_MATCH || e == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                    say("Не расслышал. Нажмите на микрофон и повторите.");
                } else if (e == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                    say("Нет разрешения на микрофон");
                    launchVoiceActivity("permission");
                } else if (e == SpeechRecognizer.ERROR_NETWORK || e == SpeechRecognizer.ERROR_NETWORK_TIMEOUT) {
                    say("Нет сети для распознавания. Проверьте интернет.");
                } else if (e == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || e == SpeechRecognizer.ERROR_CLIENT) {
                    say("Служба занята. Нажмите на микрофон ещё раз.");
                    stopVoice();
                } else {
                    say("Ошибка распознавания (" + e + ")");
                }
            }
            @Override public void onResults(Bundle b) {
                ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                InputConnection ic = getCurrentInputConnection();
                if (ic != null && r != null && !r.isEmpty()) {
                    ic.commitText(r.get(0) + " ", 1);
                    say("✓ " + r.get(0));
                }
                setListening(false);
                if (voiceMode) ui.postDelayed(new Runnable() { @Override public void run() { if (voiceMode && !listening) startVoice(); } }, 200);
            }
            @Override public void onPartialResults(Bundle b) {
                ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                InputConnection ic = getCurrentInputConnection();
                if (ic != null && r != null && !r.isEmpty()) { ic.setComposingText(r.get(0), 1); say(r.get(0)); }
            }
            @Override public void onEvent(int t, Bundle b) {}
        });
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Langs.speechTag(lang));
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, Langs.speechTag(lang));
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        try {
            recognizer.startListening(i);
            setListening(true);
            say("Запускаю микрофон…");
        } catch (Exception ex) {
            say("Не удалось запустить: " + ex.getMessage());
            setListening(false);
        }
    }

    void stopVoice() {
        voiceMode = false;
        if (recognizer != null) {
            try { recognizer.stopListening(); recognizer.destroy(); } catch (Exception ignored) {}
            recognizer = null;
        }
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) ic.finishComposingText();
        setListening(false);
    }

    void setListening(boolean on) {
        listening = on;
        if (micBtn != null) micBtn.setBackground(bg(on ? RED : 0xFF1D1D27));
        if (voiceBig != null) {
            voiceBig.setBackground(rect(on ? RED : ACCENT));
            if (!on) { voiceBig.setScaleX(1f); voiceBig.setScaleY(1f); }
        }
    }

    // ───────────────────────── эмодзи ─────────────────────────
    View emojiPanel() {
        if (emojiView != null) return emojiView;
        if (emojiCats == null) emojiCats = EmojiData.build();
        final LinearLayout p = new LinearLayout(this);
        p.setOrientation(LinearLayout.VERTICAL);
        HorizontalScrollView hs = new HorizontalScrollView(this);
        hs.setHorizontalScrollBarEnabled(false);
        LinearLayout tabs = new LinearLayout(this);
        hs.addView(tabs);
        p.addView(hs, new LinearLayout.LayoutParams(MATCH, dp(40)));
        final GridView grid = new GridView(this);
        grid.setVerticalSpacing(dp(2));
        p.addView(grid, new LinearLayout.LayoutParams(MATCH, 0, 1));

        final List<EmojiData.Cat> cats = new ArrayList<EmojiData.Cat>();
        cats.add(new EmojiData.Cat("🕘", recents(), 8, 26));
        cats.addAll(emojiCats);
        for (int i = 0; i < cats.size(); i++) {
            final int idx = i;
            TextView t = new TextView(this);
            t.setText(cats.get(i).icon);
            t.setTextSize(20);
            t.setTextColor(TXT);
            t.setGravity(Gravity.CENTER);
            t.setPadding(dp(14), 0, dp(14), 0);
            t.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) {
                    EmojiData.Cat c = idx == 0 ? new EmojiData.Cat("🕘", recents(), 8, 26) : cats.get(idx);
                    showEmojiGrid(grid, c);
                }
            });
            tabs.addView(t, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, MATCH));
        }
        showEmojiGrid(grid, recents().isEmpty() ? cats.get(1) : new EmojiData.Cat("🕘", recents(), 8, 26));
        emojiView = p;
        return p;
    }

    List<String> recents() {
        List<String> l = new ArrayList<String>();
        String s = prefs.getString("recent", "");
        if (s.length() > 0) for (String x : s.split("\u0001")) l.add(x);
        return l;
    }

    void addRecent(String e) {
        List<String> l = recents();
        l.remove(e);
        l.add(0, e);
        while (l.size() > 40) l.remove(l.size() - 1);
        StringBuilder sb = new StringBuilder();
        for (String x : l) sb.append(sb.length() > 0 ? "\u0001" : "").append(x);
        prefs.edit().putString("recent", sb.toString()).apply();
    }

    void showEmojiGrid(GridView g, final EmojiData.Cat c) {
        g.setNumColumns(c.cols);
        g.setAdapter(new BaseAdapter() {
            @Override public int getCount() { return c.items.size(); }
            @Override public Object getItem(int i) { return c.items.get(i); }
            @Override public long getItemId(int i) { return i; }
            @Override public View getView(int i, View cv, ViewGroup par) {
                TextView t = cv instanceof TextView ? (TextView) cv : new TextView(KeyboardService.this);
                t.setText(c.items.get(i));
                t.setTextSize(c.sp);
                t.setTextColor(TXT);
                t.setGravity(Gravity.CENTER);
                t.setMinHeight(dp(c.cols == 3 ? 40 : 42));
                return t;
            }
        });
        g.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override public void onItemClick(AdapterView<?> a, View v, int i, long id) {
                haptic(v);
                String e = c.items.get(i);
                commit(e);
                addRecent(e);
            }
        });
    }

    // ───────────────────────── GIF ─────────────────────────
    final LruCache<String, Bitmap> thumbs = new LruCache<String, Bitmap>(60);
    final List<String[]> gifs = new ArrayList<String[]>(); // {превью, полный gif}
    BaseAdapter gifAdapter;
    TextView gifStatus;

    View gifPanel() {
        if (gifView != null) return gifView;
        LinearLayout p = new LinearLayout(this);
        p.setOrientation(LinearLayout.VERTICAL);
        HorizontalScrollView hs = new HorizontalScrollView(this);
        hs.setHorizontalScrollBarEnabled(false);
        LinearLayout chips = new LinearLayout(this);
        hs.addView(chips);
        p.addView(hs, new LinearLayout.LayoutParams(MATCH, dp(40)));
        String[] qs = {"🔥 Популярное", "😂 lol", "❤ love", "😍 wow", "😢 sad", "😡 angry", "👋 hello", "🙏 thanks", "🎉 party", "🐱 cat", "🐶 dog", "👍 ok", "🤔 hmm", "😴 sleep", "👏 bravo", "🤦 facepalm"};
        for (final String q : qs) {
            TextView t = label(q.substring(0, q.indexOf(' ') < 0 ? q.length() : q.length()), 0xFF2B2B38, 14);
            t.setPadding(dp(12), 0, dp(12), 0);
            t.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) { loadGifs(q.startsWith("🔥") ? "" : q.substring(q.indexOf(' ') + 1)); }
            });
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, MATCH);
            lp.setMargins(dp(3), dp(4), dp(3), dp(4));
            chips.addView(t, lp);
        }
        gifStatus = new TextView(this);
        gifStatus.setTextColor(0xFFB8B8C8);
        gifStatus.setGravity(Gravity.CENTER);
        gifStatus.setTextSize(14);
        p.addView(gifStatus);
        GridView grid = new GridView(this);
        grid.setNumColumns(3);
        grid.setHorizontalSpacing(dp(3));
        grid.setVerticalSpacing(dp(3));
        gifAdapter = new BaseAdapter() {
            @Override public int getCount() { return gifs.size(); }
            @Override public Object getItem(int i) { return gifs.get(i); }
            @Override public long getItemId(int i) { return i; }
            @Override public View getView(int i, View cv, ViewGroup par) {
                ImageView iv = cv instanceof ImageView ? (ImageView) cv : new ImageView(KeyboardService.this);
                iv.setScaleType(ImageView.ScaleType.CENTER_CROP);
                iv.setLayoutParams(new GridView.LayoutParams(MATCH, dp(96)));
                iv.setBackgroundColor(KEY);
                final String url = gifs.get(i)[0];
                iv.setTag(url);
                Bitmap b = thumbs.get(url);
                if (b != null) { iv.setImageBitmap(b); return iv; }
                iv.setImageBitmap(null);
                final ImageView target = iv;
                pool.execute(new Runnable() {
                    @Override public void run() {
                        try {
                            InputStream in = new URL(url).openStream();
                            final Bitmap bm = BitmapFactory.decodeStream(in);
                            in.close();
                            if (bm == null) return;
                            thumbs.put(url, bm);
                            ui.post(new Runnable() { @Override public void run() { if (url.equals(target.getTag())) target.setImageBitmap(bm); } });
                        } catch (Exception ignored) {}
                    }
                });
                return iv;
            }
        };
        grid.setAdapter(gifAdapter);
        grid.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override public void onItemClick(AdapterView<?> a, View v, int i, long id) { haptic(v); sendGif(gifs.get(i)[1]); }
        });
        p.addView(grid, new LinearLayout.LayoutParams(MATCH, 0, 1));
        gifView = p;
        loadGifs("");
        return p;
    }

    void loadGifs(final String query) {
        final String key = prefs.getString("tenor", "");
        if (key.length() == 0) {
            gifStatus.setText("Добавьте ключ Tenor API в настройках (⚙), чтобы увидеть GIF");
            return;
        }
        gifStatus.setText("Загружаю…");
        pool.execute(new Runnable() {
            @Override public void run() {
                try {
                    String base = query.length() == 0 ? "featured?" : "search?q=" + URLEncoder.encode(query, "UTF-8") + "&";
                    String u = "https://tenor.googleapis.com/v2/" + base + "key=" + URLEncoder.encode(key, "UTF-8")
                            + "&client_key=superkeyboard&limit=36&media_filter=tinygif,gif&locale=" + lang.code.replace('-', '_');
                    java.net.HttpURLConnection c = (java.net.HttpURLConnection) new URL(u).openConnection();
                    c.setConnectTimeout(8000);
                    c.setReadTimeout(12000);
                    JSONArray res = new JSONObject(Translator.readAll(c.getInputStream())).getJSONArray("results");
                    final List<String[]> out = new ArrayList<String[]>();
                    for (int i = 0; i < res.length(); i++) {
                        JSONObject mf = res.getJSONObject(i).getJSONObject("media_formats");
                        out.add(new String[]{mf.getJSONObject("tinygif").getString("url"), mf.getJSONObject("gif").getString("url")});
                    }
                    ui.post(new Runnable() { @Override public void run() {
                        gifs.clear(); gifs.addAll(out); gifAdapter.notifyDataSetChanged();
                        gifStatus.setText(out.isEmpty() ? "Ничего не найдено" : "");
                    } });
                } catch (final Exception e) {
                    ui.post(new Runnable() { @Override public void run() { gifStatus.setText("Ошибка загрузки GIF: " + e.getMessage()); } });
                }
            }
        });
    }

    void sendGif(final String url) {
        toast("Отправляю GIF…");
        pool.execute(new Runnable() {
            @Override public void run() {
                try {
                    File dir = new File(getCacheDir(), "gifs");
                    dir.mkdirs();
                    final File f = new File(dir, "g" + System.currentTimeMillis() + ".gif");
                    InputStream in = new URL(url).openStream();
                    FileOutputStream out = new FileOutputStream(f);
                    byte[] b = new byte[16384];
                    int n;
                    while ((n = in.read(b)) > 0) out.write(b, 0, n);
                    out.close();
                    in.close();
                    ui.post(new Runnable() { @Override public void run() { if (!commitGif(f)) { commit(url + " "); toast("Приложение не принимает GIF — вставил ссылку"); } } });
                } catch (Exception e) {
                    ui.post(new Runnable() { @Override public void run() { commit(url + " "); } });
                }
            }
        });
    }

    /** InputConnection.commitContent (API 25+) через рефлексию, чтобы собираться с API 23. */
    boolean commitGif(File f) {
        try {
            InputConnection ic = getCurrentInputConnection();
            if (ic == null || editorInfo == null || android.os.Build.VERSION.SDK_INT < 25) return false;
            if (!acceptsGif(editorInfo)) return false;
            Uri uri = Uri.parse("content://com.superkb.gifs/" + f.getName());
            Class<?> cls = Class.forName("android.view.inputmethod.InputContentInfo");
            Constructor<?> ctor = cls.getConstructor(Uri.class, ClipDescription.class, Uri.class);
            Object info = ctor.newInstance(uri, new ClipDescription("GIF", new String[]{"image/gif"}), null);
            Method m = InputConnection.class.getMethod("commitContent", cls, int.class, Bundle.class);
            return (Boolean) m.invoke(ic, info, 1 /* GRANT_READ_URI_PERMISSION */, null);
        } catch (Throwable t) {
            return false;
        }
    }

    boolean acceptsGif(EditorInfo ei) {
        try {
            String[] types = (String[]) EditorInfo.class.getField("contentMimeTypes").get(ei);
            if (types == null && ei.extras != null) types = ei.extras.getStringArray("androidx.core.view.inputmethod.EditorInfoCompat.CONTENT_MIME_TYPES");
            if (types == null) return false;
            for (String t : types) if (t.equals("image/gif") || t.equals("image/*") || t.equals("*/*")) return true;
        } catch (Throwable t) {
            if (ei.extras != null) {
                String[] types = ei.extras.getStringArray("androidx.core.view.inputmethod.EditorInfoCompat.CONTENT_MIME_TYPES");
                if (types != null) for (String x : types) if (x.equals("image/gif") || x.equals("image/*")) return true;
            }
        }
        return false;
    }
}
