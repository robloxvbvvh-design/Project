#!/usr/bin/env python3
"""Собирает www/index.html из src/ (один файл: CSS + данные + код)."""
import pathlib
r = pathlib.Path(__file__).parent
t = (r / "src/index.tpl.html").read_text(encoding="utf-8")
for key, f in (("/*CSS*/", "style.css"), ("/*DATA*/", "data.js"), ("/*APP*/", "app.js")):
    body = (r / "src" / f).read_text(encoding="utf-8").replace("</script", "<\\/script")
    t = t.replace(key, body)
(r / "www").mkdir(exist_ok=True)
(r / "www/index.html").write_text(t, encoding="utf-8")
print("www/index.html:", len(t) // 1024, "KB")
