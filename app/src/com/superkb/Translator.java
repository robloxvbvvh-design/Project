package com.superkb;

import android.os.Handler;
import android.os.Looper;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import org.json.JSONArray;

/** Онлайн-перевод текста на любой из ~140 языков. */
public class Translator {
    public interface Callback { void done(String result, String error); }

    private static final Handler UI = new Handler(Looper.getMainLooper());

    public static void translate(final String text, final String target, final Callback cb) {
        new Thread(new Runnable() {
            @Override public void run() {
                String res = null, err = null;
                try {
                    URL u = new URL("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl="
                            + URLEncoder.encode(target, "UTF-8") + "&dt=t&q=" + URLEncoder.encode(text, "UTF-8"));
                    HttpURLConnection c = (HttpURLConnection) u.openConnection();
                    c.setConnectTimeout(8000);
                    c.setReadTimeout(12000);
                    c.setRequestProperty("User-Agent", "Mozilla/5.0");
                    JSONArray segs = new JSONArray(readAll(c.getInputStream())).getJSONArray(0);
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < segs.length(); i++) sb.append(segs.getJSONArray(i).getString(0));
                    res = sb.toString();
                } catch (Exception e) {
                    err = String.valueOf(e.getMessage());
                }
                final String r = res, er = err;
                UI.post(new Runnable() { @Override public void run() { cb.done(r, er); } });
            }
        }).start();
    }

    public static String readAll(InputStream in) throws Exception {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] b = new byte[8192];
        int n;
        while ((n = in.read(b)) > 0) bo.write(b, 0, n);
        in.close();
        return bo.toString("UTF-8");
    }
}
