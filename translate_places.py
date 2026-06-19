#!/usr/bin/env python3
"""
LayersOfPrague — DeepL překladový skript pro places.json
Použití:
  1. pip install requests
  2. export DEEPL_KEY="váš-api-klíč"   (nebo zadejte níže)
  3. python3 translate_places.py

Skript přeloží pouze místa bez _en polí — bezpečné spustit opakovaně.
Výstup: places.json (přepíše původní soubor, záloha v places.json.bak)
"""

import json, os, time, shutil
import requests

# ── Konfigurace ──────────────────────────────────────────
DEEPL_KEY  = os.environ.get("DEEPL_KEY", "")   # nebo sem vložte klíč přímo
INPUT_FILE = "places.json"
SOURCE     = "CS"
TARGET     = "EN-GB"
# Deepl free API endpoint (pro free klíče končící na :fx)
API_URL    = "https://api-free.deepl.com/v2/translate"
# Pro placené klíče použijte: "https://api.deepl.com/v2/translate"
# ─────────────────────────────────────────────────────────

FACT_KEY_MAP = {
    "Postaveno": "Built", "Dokončeno": "Completed", "Sloh": "Style",
    "Architekt": "Architect", "Památka od": "Listed since",
    "Současné využití": "Current use", "První zmínka": "First mention",
    "Otevřeno": "Opened", "Vybudováno": "Constructed", "Výstavba": "Construction",
    "Délka": "Length", "Plocha": "Area", "Rozloha": "Area",
    "Status": "Status", "Socha odstraněna": "Statue removed",
    "Metronom od": "Metronome since", "Orloj od": "Clock since",
}

def translate(texts: list[str]) -> list[str]:
    """Přeloží seznam textů přes DeepL API."""
    if not texts:
        return []
    r = requests.post(API_URL, data={
        "auth_key": DEEPL_KEY,
        "text": texts,
        "source_lang": SOURCE,
        "target_lang": TARGET,
        "tag_handling": "xml",
    })
    r.raise_for_status()
    return [t["text"] for t in r.json()["translations"]]

def translate_place(p: dict) -> dict:
    """Přidá _en pole do jednoho místa."""
    # Sbíráme texty pro batch překlad
    fields = {}

    if "name" in p and "name_en" not in p:
        fields["name"] = p["name"]
    if "lede" in p and "lede_en" not in p:
        fields["lede"] = p["lede"]
    if "sub" in p and "sub_en" not in p:
        fields["sub"] = p["sub"]
    if "tip" in p and "tip_en" not in p:
        fields["tip"] = p["tip"]

    # Batch překlad jednoduchých polí
    if fields:
        keys = list(fields.keys())
        translations = translate(list(fields.values()))
        for k, v in zip(keys, translations):
            p[k + "_en"] = v
        time.sleep(0.3)  # rate limiting

    # Facts — klíče mapujeme staticky, hodnoty překládáme
    if p.get("facts") and any("v_en" not in f for f in p["facts"]):
        vals_to_translate = []
        fact_indices = []
        for i, f in enumerate(p["facts"]):
            # Klíč — statická mapa nebo přeložíme
            if "k_en" not in f:
                f["k_en"] = FACT_KEY_MAP.get(f["k"], f["k"])
            # Hodnota
            if "v_en" not in f:
                vals_to_translate.append(f["v"])
                fact_indices.append(i)

        if vals_to_translate:
            translated_vals = translate(vals_to_translate)
            for i, v in zip(fact_indices, translated_vals):
                p["facts"][i]["v_en"] = v
            time.sleep(0.3)

    # Steps
    if p.get("steps") and any("title_en" not in s for s in p["steps"]):
        titles = [s["title"] for s in p["steps"] if "title_en" not in s]
        texts  = [s["text"]  for s in p["steps"] if "text_en"  not in s]

        if titles:
            translated_titles = translate(titles)
            ti = 0
            for s in p["steps"]:
                if "title_en" not in s:
                    s["title_en"] = translated_titles[ti]; ti += 1
            time.sleep(0.3)

        if texts:
            translated_texts = translate(texts)
            ti = 0
            for s in p["steps"]:
                if "text_en" not in s:
                    s["text_en"] = translated_texts[ti]; ti += 1
            time.sleep(0.3)

    return p

def main():
    if not DEEPL_KEY:
        print("❌ Chybí DEEPL_KEY. Nastavte proměnnou prostředí nebo vložte klíč do skriptu.")
        return

    with open(INPUT_FILE, encoding="utf-8") as f:
        places = json.load(f)

    # Záloha
    shutil.copy(INPUT_FILE, INPUT_FILE + ".bak")
    print(f"✓ Záloha uložena do {INPUT_FILE}.bak")

    to_translate = [p for p in places if "name_en" not in p]
    print(f"Míst k překladu: {len(to_translate)} / {len(places)}")

    for i, p in enumerate(places):
        if "name_en" in p:
            print(f"  [{i+1}/{len(places)}] {p['id']} — přeskočeno (již přeloženo)")
            continue
        print(f"  [{i+1}/{len(places)}] {p['id']} {p.get('name','?')}…", end=" ", flush=True)
        try:
            places[i] = translate_place(p)
            print("✓")
        except Exception as e:
            print(f"❌ {e}")
            # Uložíme co máme a skončíme
            break

    with open(INPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    print(f"\n✓ Uloženo do {INPUT_FILE}")

if __name__ == "__main__":
    main()
