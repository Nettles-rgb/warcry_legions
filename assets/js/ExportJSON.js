// exporter.js

(function() {
    'use strict';

    // =================================================================
    // CONFIGURATION (Must match the IDs in the tool)
    // =================================================================
    const FIELD_MAP = {
        name:       "fighterName",
        movement:   "movement",
        toughness:  "toughness",
        wounds:     "numWounds",
        points:     "pointCost",
        w1_min_range: "rangeMin0",
        w1_max_range: "rangeMax0",
        w1_attacks:   "attacks0",
        w1_strength:  "strength0",
        w1_dmg_hit:   "damageBase0",
        w1_dmg_crit:  "damageCrit0",
        w2_min_range: "rangeMin1",
        w2_max_range: "rangeMax1",
        w2_attacks:   "attacks1",
        w2_strength:  "strength1",
        w2_dmg_hit:   "damageBase1",
        w2_dmg_crit:  "damageCrit1",
        weapon2_toggle: "weaponEnabled1",
        grand_alliance: "alliance"
    };

    // =================================================================
    // INITIALIZATION
    // =================================================================
    console.log("Exporter: Initializing...");
    
    // Wait a brief moment to ensure autofiller.js has finished building the UI
    setTimeout(initExporter, 1000);

    function initExporter() {
        // 1. Create the Button
        const exportBtn = document.createElement('button');
        exportBtn.className = "btn btn-success btn-block";
        exportBtn.innerText = "Export Current to JSON";
        exportBtn.style.marginTop = "10px";
        exportBtn.style.width = "100%";
        
        // 2. Find where to put it
        // We look for the card-body created by autofiller.js
        const existingPanelBody = document.querySelector('.card.border-primary .card-body');

        if (existingPanelBody) {
            // Option A: Append to the existing Autofiller panel
            existingPanelBody.appendChild(exportBtn);
            console.log("Exporter: Attached to Autofiller panel.");
        } else {
            // Option B: Create a standalone panel if Autofiller isn't there
            const panel = document.createElement('div');
            panel.className = "card border-success mb-3";
            panel.style.margin = "10px";
            
            const header = document.createElement('div');
            header.className = "card-header";
            header.innerHTML = "<strong>Data Exporter</strong>";
            
            const body = document.createElement('div');
            body.className = "card-body";
            
            body.appendChild(exportBtn);
            panel.appendChild(header);
            panel.appendChild(body);

            const mainContainer = document.querySelector('.container') || document.body;
            mainContainer.prepend(panel);
            console.log("Exporter: Created standalone panel.");
        }

        // 3. Add Click Listener
        exportBtn.addEventListener('click', exportFighter);
    }

    // =================================================================
    // EXPORT LOGIC
    // =================================================================
    function exportFighter() {
        try {
            const fighter = {};

            // 1. Basic Fields
            fighter.name = getValue(FIELD_MAP.name);
            fighter.movement = parseInt(getValue(FIELD_MAP.movement)) || 0;
            fighter.toughness = parseInt(getValue(FIELD_MAP.toughness)) || 0;
            fighter.numWounds = parseInt(getValue(FIELD_MAP.wounds)) || 0;
            fighter.pointCost = parseInt(getValue(FIELD_MAP.points)) || 0;
            fighter.grand_alliance = getValue(FIELD_MAP.grand_alliance);

            // 2. Faction Runemark
            const activeFactionImg = document.querySelector('img[id^="fr:"].active');
            if (activeFactionImg) {
                fighter.warband = activeFactionImg.id.replace("fr:", "");
            } else {
                fighter.warband = "Unknown";
            }

            // 3. Character Runemarks
            const activeRunemarks = document.querySelectorAll('img[id^="rn:"].active');
            if (activeRunemarks.length > 0) {
                fighter.runemarks = [];
                activeRunemarks.forEach(img => {
                    fighter.runemarks.push(img.id.replace("rn:", ""));
                });
            }

            // 4. Weapons
            fighter.weapons = [];
            
            // Weapon 1
            const w1 = {
                max_range: getValue(FIELD_MAP.w1_max_range),
                min_range: getValue(FIELD_MAP.w1_min_range),
                attacks: getValue(FIELD_MAP.w1_attacks),
                strength: getValue(FIELD_MAP.w1_strength),
                dmg_hit: getValue(FIELD_MAP.w1_dmg_hit),
                dmg_crit: getValue(FIELD_MAP.w1_dmg_crit)
            };
            
            const allWeaponIcons = Array.from(document.querySelectorAll('img[id^="wr:"]'));
            const w1Icon = allWeaponIcons.find(img => img.classList.contains("active")); // First active icon
            if (w1Icon) {
                w1.runemark = w1Icon.id.replace("wr:", "");
            }
            fighter.weapons.push(w1);

            // Weapon 2
            const w2Btn = document.getElementById(FIELD_MAP.weapon2_toggle);
            if (w2Btn && w2Btn.classList.contains("active")) {
                const w2 = {
                    max_range: getValue(FIELD_MAP.w2_max_range),
                    min_range: getValue(FIELD_MAP.w2_min_range),
                    attacks: getValue(FIELD_MAP.w2_attacks),
                    strength: getValue(FIELD_MAP.w2_strength),
                    dmg_hit: getValue(FIELD_MAP.w2_dmg_hit),
                    dmg_crit: getValue(FIELD_MAP.w2_dmg_crit)
                };
                
                // Find second active icon
                const activeIcons = allWeaponIcons.filter(img => img.classList.contains("active"));
                if (activeIcons.length > 1) {
                    w2.runemark = activeIcons[1].id.replace("wr:", "");
                }
                fighter.weapons.push(w2);
            }

            // 5. Download
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify([fighter], null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", (fighter.name || "fighter") + ".json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

        } catch (e) {
            console.error("Export Failed:", e);
            alert("Export failed! Check console for errors.");
        }
    }

    // Helper to safely get value by ID
    function getValue(id) {
        const el = document.getElementById(id);
        return el ? el.value : "";
    }

})();
