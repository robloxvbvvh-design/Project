package com.superkb;

import java.util.ArrayList;
import java.util.List;

/** Список языков: код;название;раскладка;доп. буквы. */
public class Langs {
    public static class Lang {
        public final String code, name, layout, extras;
        Lang(String c, String n, String l, String e) { code = c; name = n; layout = l; extras = e; }
        @Override public String toString() { return name + "  (" + code + ")"; }
    }

    private static final String[] D = {
        "en;English;LAT;", "ru;Русский;RU;ё", "uk;Українська;UK;", "es;Español;LAT;áéíñóúü¿¡",
        "fr;Français;LAT;éèêëàâçîïôùûœ", "de;Deutsch;LAT;äöüß", "it;Italiano;LAT;àèéìòù",
        "pt;Português;LAT;ãõáâàçéêíóú", "nl;Nederlands;LAT;éëïóü", "pl;Polski;LAT;ąćęłńóśźż",
        "cs;Čeština;LAT;áčďéěíňóřšťúůýž", "sk;Slovenčina;LAT;áäčďéíĺľňóôŕšťúýž", "sl;Slovenščina;LAT;čšž",
        "hr;Hrvatski;LAT;čćđšž", "bs;Bosanski;LAT;čćđšž", "sr;Српски;SR;", "mk;Македонски;RU;ѓќљњџѕ",
        "bg;Български;BG;", "ro;Română;LAT;ăâîșț", "hu;Magyar;LAT;áéíóöőúüű", "sv;Svenska;LAT;åäö",
        "no;Norsk;LAT;æøå", "da;Dansk;LAT;æøå", "fi;Suomi;LAT;äöå", "is;Íslenska;LAT;áðéíóúýþæö",
        "et;Eesti;LAT;äöõüšž", "lv;Latviešu;LAT;āčēģīķļņšūž", "lt;Lietuvių;LAT;ąčęėįšųūž",
        "tr;Türkçe;LAT;çğıöşü", "az;Azərbaycan;LAT;əçğıöşü", "uz;Oʻzbek;LAT;ʻ", "tk;Türkmen;LAT;çäžňöşüýň",
        "kk;Қазақ;RU;әіңғүұқөһ", "ky;Кыргыз;RU;ңөү", "tg;Тоҷикӣ;RU;ғӣқӯҳҷ", "mn;Монгол;RU;өү",
        "be;Беларуская;RU;ўі", "tt;Татар;RU;әөүҗңһ", "ba;Башҡорт;RU;әөүғҙҡңҫһ", "ka;ქართული;KA;",
        "hy;Հայերեն;HY;", "el;Ελληνικά;EL;", "sq;Shqip;LAT;ëç", "mt;Malti;LAT;ċġħż", "ga;Gaeilge;LAT;áéíóú",
        "cy;Cymraeg;LAT;âêîôûŵŷ", "gd;Gàidhlig;LAT;àèìòù", "eu;Euskara;LAT;ñç", "ca;Català;LAT;àèéíòóúçï",
        "gl;Galego;LAT;ñáéíóú", "lb;Lëtzebuergesch;LAT;äëé", "af;Afrikaans;LAT;éèêëíîïóôúûý", "fy;Frysk;LAT;âêôûúé",
        "co;Corsu;LAT;àèìòù", "eo;Esperanto;LAT;ĉĝĥĵŝŭ", "la;Latina;LAT;āēīōū", "br;Brezhoneg;LAT;âêñù",
        "sw;Kiswahili;LAT;", "zu;isiZulu;LAT;", "xh;isiXhosa;LAT;", "st;Sesotho;LAT;", "tn;Setswana;LAT;",
        "ts;Xitsonga;LAT;", "sn;Shona;LAT;", "yo;Yorùbá;LAT;ẹọṣàáèéìíòóùú", "ig;Igbo;LAT;ịọụṅ",
        "ha;Hausa;LAT;ɓɗƙ", "ak;Twi;LAT;ɔɛ", "ee;Eʋe;LAT;ɖɛƒɣɔʋ", "bm;Bamanankan;LAT;ɛɔɲŋ", "ln;Lingála;LAT;ɛɔ",
        "lg;Luganda;LAT;ŋ", "rw;Kinyarwanda;LAT;", "ny;Chichewa;LAT;", "mg;Malagasy;LAT;", "so;Soomaali;LAT;",
        "om;Afaan Oromoo;LAT;", "am;አማርኛ;LAT;", "ti;ትግርኛ;LAT;", "ar;العربية;AR;", "fa;فارسی;AR;پچژگکی",
        "ur;اردو;AR;ٹڈڑںھےگپچ", "ps;پښتو;AR;ټډړڼ", "sd;سنڌي;AR;ڀڏڦ", "ug;ئۇيغۇرچە;AR;ۆۈۇڭ", "ckb;کوردی;AR;ڕۆێڵڤگپچ",
        "ku;Kurdî;LAT;çêîşû", "he;עברית;HE;", "yi;ייִדיש;HE;", "hi;हिन्दी;DEVA;", "mr;मराठी;DEVA;", "ne;नेपाली;DEVA;",
        "sa;संस्कृतम्;DEVA;", "mai;मैथिली;DEVA;", "gom;कोंकणी;DEVA;", "doi;डोगरी;DEVA;", "bn;বাংলা;BN;",
        "as;অসমীয়া;BN;", "gu;ગુજરાતી;GU;", "pa;ਪੰਜਾਬੀ;PA;", "ta;தமிழ்;TA;", "te;తెలుగు;TE;", "kn;ಕನ್ನಡ;KN;",
        "ml;മലയാളം;ML;", "si;සිංහල;SI;", "or;ଓଡ଼ିଆ;LAT;", "dv;ދިވެހި;LAT;", "th;ไทย;TH;", "lo;ລາວ;LAT;",
        "km;ខ្មែរ;LAT;", "my;မြန်မာ;LAT;", "vi;Tiếng Việt;LAT;àáảãạăâđêèéẻẽẹôơưýỳ", "id;Indonesia;LAT;",
        "ms;Melayu;LAT;", "tl;Filipino;LAT;ñ", "ceb;Cebuano;LAT;", "ilo;Ilokano;LAT;", "jw;Basa Jawa;LAT;éè",
        "su;Basa Sunda;LAT;éèö", "haw;ʻŌlelo Hawaiʻi;LAT;ʻāēīōū", "mi;Māori;LAT;āēīōū", "sm;Gagana Samoa;LAT;āēīōū",
        "hmn;Hmoob;LAT;", "ht;Kreyòl ayisyen;LAT;èòé", "gn;Avañe'ẽ;LAT;ãẽĩõũỹ", "qu;Runasimi;LAT;ñ", "ay;Aymar aru;LAT;ñ",
        "lus;Mizo;LAT;âêîôû", "zh-CN;中文 (简体);LAT;", "zh-TW;中文 (繁體);LAT;", "ja;日本語;JA;", "ko;한국어;KO;"
    };

    public static final List<Lang> ALL = new ArrayList<Lang>();
    static {
        for (String s : D) {
            String[] p = s.split(";", -1);
            ALL.add(new Lang(p[0], p[1], p[2], p[3]));
        }
    }

    public static Lang byCode(String code) {
        for (Lang l : ALL) if (l.code.equals(code)) return l;
        return ALL.get(0);
    }

    /** Языковой тег для распознавания речи. */
    public static String speechTag(Lang l) {
        return l.code.equals("zh-CN") ? "zh-CN" : l.code.equals("zh-TW") ? "zh-TW" : l.code;
    }
}
