package com.superkb;

import android.graphics.Paint;
import java.util.ArrayList;
import java.util.List;

/** Категории эмодзи строятся из диапазонов Unicode; показываются только те, что есть в шрифте устройства. */
public class EmojiData {
    public static class Cat {
        public final String icon;
        public final List<String> items;
        public final int cols;
        public final float sp;
        public Cat(String i, List<String> it, int c, float s) { icon = i; items = it; cols = c; sp = s; }
    }

    private static final String ISO = "AC AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET EU FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TA TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM UN US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW";

    private static final String[] KAOMOJI = {
        "(｡◕‿◕｡)", "(╯°□°）╯︵ ┻━┻", "¯\\_(ツ)_/¯", "( ͡° ͜ʖ ͡°)", "(づ｡◕‿‿◕｡)づ", "ʕ•ᴥ•ʔ", "(ಥ﹏ಥ)", "(≧▽≦)",
        "(^_^)", "(T_T)", "(-_-)", "(>_<)", "(o_O)", "(¬_¬)", "\\(^o^)/", "(ノ°益°)ノ", "(☞ﾟヮﾟ)☞", "☜(ﾟヮﾟ☜)",
        "(•_•)", "( •_•)>⌐■-■", "(⌐■_■)", "ヽ(´▽`)/", "(*^‿^*)", "(◕‿◕✿)", "(｡♥‿♥｡)", "(ㆆ _ ㆆ)", "ლ(ಠ益ಠლ)",
        "(╥﹏╥)", "(҂◡_◡)", "ᕕ( ᐛ )ᕗ", "(งツ)ว", "♪┏(・o･)┛♪", "(＾▽＾)", "(;´Д`)", "(´･ω･`)", "(^^)v",
        "٩(◕‿◕)۶", "(੭ˊᵕˋ)੭", "≧◉◡◉≦", "(=^･ω･^=)", "(ᵔᴥᵔ)", "ʕ·ᴥ·ʔ", "(｡•́︿•̀｡)", "(*´▽`*)", "(๑˃ᴗ˂)ﻭ"
    };

    private static void range(List<String> o, Paint p, int a, int b, boolean vs) {
        for (int cp = a; cp <= b; cp++) {
            String s = new String(Character.toChars(cp));
            if (vs && cp < 0x1F000) s += "\uFE0F";
            if (p.hasGlyph(s)) o.add(s);
        }
    }

    private static List<String> r(Paint p, boolean vs, int... ab) {
        List<String> o = new ArrayList<String>();
        for (int i = 0; i + 1 < ab.length; i += 2) range(o, p, ab[i], ab[i + 1], vs);
        return o;
    }

    public static List<Cat> build() {
        Paint p = new Paint();
        List<Cat> c = new ArrayList<Cat>();
        c.add(new Cat("😀", r(p, true, 0x1F600, 0x1F64F, 0x1F910, 0x1F92F, 0x1F970, 0x1F97A, 0x1F9D0, 0x1F9D0, 0x1F974, 0x1F976, 0x1F4A9, 0x1F4A9, 0x1F47B, 0x1F47F, 0x1F479, 0x1F47A, 0x2639, 0x263A), 8, 26));
        c.add(new Cat("🤟", r(p, true, 0x1F440, 0x1F487, 0x1F90C, 0x1F90F, 0x1F918, 0x1F91F, 0x1F9B0, 0x1F9BF, 0x1F9D1, 0x1F9DF, 0x270A, 0x270D, 0x261D, 0x261D, 0x1F645, 0x1F64F, 0x1F46A, 0x1F46F), 8, 26));
        c.add(new Cat("🐶", r(p, true, 0x1F400, 0x1F43F, 0x1F980, 0x1F9AE, 0x1F330, 0x1F344, 0x1F490, 0x1F490, 0x1F577, 0x1F578, 0x1F54A, 0x1F54A), 8, 26));
        c.add(new Cat("🍔", r(p, true, 0x1F345, 0x1F37F, 0x1F950, 0x1F96F, 0x1F9C0, 0x1F9CB, 0x1F32D, 0x1F32F, 0x2615, 0x2615), 8, 26));
        c.add(new Cat("⚽", r(p, true, 0x1F380, 0x1F393, 0x1F3A0, 0x1F3CA, 0x1F3CF, 0x1F3D3, 0x1F93A, 0x1F94F, 0x26BD, 0x26BE, 0x1F9E7, 0x1F9FF, 0x265F, 0x265F), 8, 26));
        c.add(new Cat("🚗", r(p, true, 0x1F680, 0x1F6C5, 0x1F30D, 0x1F32C, 0x1F300, 0x1F30C, 0x1F3D4, 0x1F3DF, 0x1F3E0, 0x1F3F0, 0x1F6E0, 0x1F6EC, 0x1F6F0, 0x1F6FC, 0x2708, 0x2708, 0x26F5, 0x26F5), 8, 26));
        c.add(new Cat("💡", r(p, true, 0x1F4A1, 0x1F4FC, 0x1F4FF, 0x1F4FF, 0x1F50A, 0x1F52E, 0x1F9EA, 0x1F9EE, 0x1F5A5, 0x1F5A5, 0x1F6AA, 0x1F6BF), 8, 26));
        c.add(new Cat("❤", r(p, true, 0x2763, 0x2764, 0x1F493, 0x1F49F, 0x1F90D, 0x1F90E, 0x1F9E1, 0x1F9E1, 0x1F5A4, 0x1F5A4, 0x1F4A2, 0x1F4AD, 0x1F4AF, 0x1F4AF, 0x1F500, 0x1F53D, 0x2600, 0x27BF, 0x2B05, 0x2B07, 0x2B1B, 0x2B1C, 0x2B50, 0x2B55), 8, 26));
        List<String> fl = new ArrayList<String>();
        fl.addAll(r(p, true, 0x1F3C1, 0x1F3C1, 0x1F6A9, 0x1F6A9, 0x1F38C, 0x1F38C, 0x1F3F3, 0x1F3F4));
        for (String code : ISO.split(" ")) {
            String s = new String(Character.toChars(0x1F1E6 + code.charAt(0) - 'A')) + new String(Character.toChars(0x1F1E6 + code.charAt(1) - 'A'));
            if (p.hasGlyph(s)) fl.add(s);
        }
        c.add(new Cat("🏁", fl, 8, 26));
        List<String> ka = new ArrayList<String>();
        for (String k : KAOMOJI) ka.add(k);
        c.add(new Cat("ツ", ka, 3, 15));
        c.add(new Cat("∞", r(p, false, 0x20A0, 0x20BF, 0x2190, 0x21FF, 0x2200, 0x2211, 0x221A, 0x2230, 0x2248, 0x2265, 0x25A0, 0x25FF, 0x2605, 0x2606, 0x266A, 0x266F, 0x00B0, 0x00B0, 0x00A9, 0x00AE, 0x2122, 0x2122, 0x2030, 0x2030, 0x2022, 0x2022), 8, 22));
        return c;
    }
}
