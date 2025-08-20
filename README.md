Bayerisches Schafkopf - Browser Spiel
Ein authentisches bayerisches Schafkopf-Kartenspiel für den Browser, entwickelt in HTML, CSS und JavaScript.

Projektübersicht
Dieses Projekt implementiert das traditionelle bayerische Schafkopf-Spiel mit den offiziellen Regeln des Bayerischen Schafkopf-Vereins. Das Spiel läuft vollständig im Browser und benötigt keine Installation.

🎯 Projektziele
✅ Authentische Schafkopf-Erfahrung
✅ Intuitive Benutzeroberfläche
✅ Responsive Design für verschiedene Bildschirmgrößen
✅ Erweiterbar für verschiedene Spielvarianten
📁 Projekt-Struktur

schafkopf-spiel/
README.md                 # Diese Datei
index.html               # Hauptspiel-Datei
css/
    style.css           # Haupt-Stylesheet
    cards.css           # Kartendarstellung
    responsive.css      # Mobile Anpassungen
js/
    game.js             # Haupt-Spiellogik
    cards.js            # Kartenverwaltung
    rules.js            # Schafkopf-Regeln
    player.js           # Spieler-Management
    ai.js               # KI-Spieler
    ui.js               # Benutzeroberfläche
assets/
    cards/              # Kartenbilder
    sounds/             # Spielsounds (optional)
    icons/              # App-Icons
docs/
rules.md            # Spielregeln
development.md      # Entwicklungsnotizen

🚀 Entwicklungsphasen
Phase 1: Grundlagen ⏳
 Repository-Struktur erstellen
 Basis HTML-Datei
 Kartendeck implementieren
 Grundlegendes Design
 Karten mischen und verteilen

Phase 2: Basis-Spielmechanik 📝
 Stiche spielen (ohne Trumpf-Logik)
 Punktezählung
 Spielrunden-Management
 Grundlegende UI-Interaktionen

Phase 3: Schafkopf-Regeln 🎲
 Trumpf-System (Ober, Unter, Herz)
 Rufspiel-Logik implementieren
 Partnerfindung durch gerufenes Ass
 Stichregeln und Bedienungspflicht

Phase 4: Spielvarianten 🎯
 Farb-Solo implementieren
 Wenz-Spiel
 Tout-Spiele (optional)
 Erweiterte Spieloptionen

Phase 5: KI und Polish ✨
 Basis-KI für Computergegner
 Spielstatistiken
 Sound-Effekte (optional)
 Animationen und Übergänge
 Mobile Optimierung

🎮 Spielregeln (Kurzfassung)
Grundregeln
Spieler: 4 (1 menschlich, 3 KI)
Karten: 32 bayerische Karten (8 pro Spieler)
Ziel: 61 von 120 Punkten erreichen
Trumpf-Reihenfolge
Ober (höchste Trümpfe): Eichel, Gras, Herz, Schellen
Unter: Eichel, Gras, Herz, Schellen
Herz-Karten: Ass, 10, König, 9, 8, 7

Kartenwerte
Ass (Sau): 11 Punkte
Zehn: 10 Punkte
König: 4 Punkte
Ober: 3 Punkte
Unter: 2 Punkte
9, 8, 7: 0 Punkte
🛠️ Technische Details

Technologien
HTML5: Struktur und Semantik
CSS3: Design und Animationen
Vanilla JavaScript: Spiellogik (ES6+)
Canvas/SVG: Kartendarstellung (geplant)
Browser-Kompatibilität
Chrome 80+
Firefox 75+
Safari 13+
Edge 80+

🚀 Installation und Start
Lokale Entwicklung
Repository klonen oder herunterladen
index.html in einem Browser öffnen
Spielen! 🎉
GitHub Pages (Live-Version)
Das Spiel ist verfügbar unter: https://ihr-username.github.io/schafkopf-spiel

📚 Weiterführende Links
Offizielle Schafkopf-Regeln
Bayerisches Schafkopf auf Wikipedia
GitHub Pages Dokumentation
🤝 Beitragen
Da dies ein Lernprojekt ist, sind Verbesserungsvorschläge und Issues willkommen!

Wie kann ich helfen?
🐛 Bugs melden
💡 Neue Features vorschlagen
📝 Dokumentation verbessern
🎨 Design-Verbesserungen
📄 Lizenz
Dieses Projekt steht unter der MIT-Lizenz - siehe LICENSE Datei für Details.

🎯 Roadmap
v0.1: Basis-Rufspiel funktionsfähig
v0.2: Alle Standard-Spielvarianten
v0.3: Verbesserte KI und UI
v0.4: Mobile Optimierung
v1.0: Vollständige Schafkopf-Erfahrung
Entwickelt mit ❤️ für die bayerische Schafkopf-Tradition

