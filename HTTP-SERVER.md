# 🌐 HTTP-Server Setup für ES6-Module

## 🚨 **Problem:** 
ES6-Module funktionieren nicht mit `file://` URLs - sie benötigen einen HTTP-Server.

## ✅ **Sofortige Lösung:**
Das Spiel läuft bereits vollständig mit Legacy-Modulen! Alle Features funktionieren.

## 🚀 **HTTP-Server für ES6-Module (optional):**

### **Option 1: Python (einfachste Lösung)**
```bash
# Im schafkopf-spiel Ordner:
cd C:\schafkopf-spiel

# Python 3:
python -m http.server 8000

# Python 2:
python -m SimpleHTTPServer 8000

# Dann öffnen: http://localhost:8000
```

### **Option 2: Node.js Live-Server**
```bash
# Installation:
npm install -g live-server

# Im Projektordner:
cd C:\schafkopf-spiel
live-server

# Öffnet automatisch Browser
```

### **Option 3: PHP (falls installiert)**
```bash
cd C:\schafkopf-spiel
php -S localhost:8000

# Dann öffnen: http://localhost:8000
```

### **Option 4: Visual Studio Code**
- Install "Live Server" Extension
- Rechtsklick auf `index.html` 
- "Open with Live Server"

## 🎯 **Warum HTTP-Server?**

1. **CORS-Policy**: Browser blockieren `file://` Module-Imports
2. **Sicherheit**: Module benötigen HTTP-Kontext
3. **Standards**: ES6-Module sind für Web-Server konzipiert

## 📋 **Aktueller Status:**

### **✅ Funktioniert jetzt (ohne HTTP-Server):**
- ✅ Komplettes Spiel spielbar
- ✅ Alle Buttons funktionieren
- ✅ Debug-Modus verfügbar
- ✅ Kartenbilder/Symbole umschaltbar
- ✅ KI spielt intelligent
- ✅ Alle Schafkopf-Regeln implementiert

### **🔄 Verfügbar nach HTTP-Server Setup:**
- 🔄 ES6-Module mit besserer Performance
- 🔄 Modulare Entwicklung neuer Features
- 🔄 Tree-Shaking für kleinere Bundle-Größen
- 🔄 Moderne JavaScript-Features

## 💡 **Empfehlung:**

**Für sofortiges Spielen:** Einfach `index.html` öffnen - alles funktioniert!

**Für Entwicklung neuer Features:** HTTP-Server verwenden für ES6-Module-Vorteile.

## 🔧 **Umstellung auf ES6-Module (wenn HTTP-Server läuft):**

In `index.html` diese Zeile aktivieren:
```html
<!-- Entkommentieren wenn HTTP-Server läuft: -->
<!-- <script type="module" src="js/global-wrapper.js"></script> -->
```

## 🎮 **Bottom Line:**

**Das Spiel ist vollständig funktionsfähig!** HTTP-Server ist nur für Entwickler-Komfort, nicht für die Spielfunktionalität nötig.
