// autofiller.js

(function() {
    'use strict';

    // 1. URL to your JSON data
    const JSON_URL = "https://krisling049.github.io/warcry_data/fighters.json";

    const FIELD_MAP = {
        name:       "fighterName",
        movement:   "movement",
        toughness:  "toughness",
        wounds:     "wounds",
        points:     "pointCost",
        
        // Stats for Weapon 1 (Index 0)
        w0_min_range: "rangeMin0",
        w0_max_range: "rangeMax0",
        w0_attacks:   "attacks0",
        w0_strength:  "strength0",
        w0_dmg_hit:   "damageBase0",
        w0_dmg_crit:  "damageCrit0",

        // Stats for Weapon 2 (Index 1)
        w1_min_range: "rangeMin1",
        w1_max_range: "rangeMax1",
        w1_attacks:   "attacks1",
        w1_strength:  "strength1",
        w1_dmg_hit:   "damageBase1",
        w1_dmg_crit:  "damageCrit1",
        
        weapon2_toggle: "weaponEnabled1"
    };

    const RUNEMARK_MAP = {
        "hero": "Leader",
        "minion": "Minion",
        "champion": "Champion"
    };

    console.log("Auto-Filler: Fetching fighter data...");

    fetch(JSON_URL)
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
        })
        .then(data => {
            console.log("Auto-Filler: Data loaded!", data.length, "fighters.");
            initTool(data);
        })
        .catch(error => {
            console.error("Auto-Filler Error:", error);
        });

    function initTool(FIGHTER_DATA) {
        // --- UI CREATION ---
        const panel = document.createElement('div');
        panel.className = "card border-primary mb-3";
        panel.style.margin = "10px";
        
        const header = document.createElement('div');
        header.className = "card-header";
        header.innerText = "Load Fighter (Auto-Fill)";
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = "card-body";
        
        const select = document.createElement('select');
        select.className = "form-control";
        select.style.marginBottom = "10px";

        const defaultOption = document.createElement('option');
        defaultOption.text = "Select a Fighter...";
        select.add(defaultOption);

        // Sort: Warband -> Name
        FIGHTER_DATA.sort((a, b) => {
            const warbandA = (a.warband || "").toLowerCase();
            const warbandB = (b.warband || "").toLowerCase();
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (warbandA < warbandB) return -1;
            if (warbandA > warbandB) return 1;
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });

        FIGHTER_DATA.forEach((fighter) => {
            const opt = document.createElement('option');
            opt.value = fighter.name;
            if (fighter.warband) {
                opt.text = `${fighter.warband}: ${fighter.name}`;
            } else {
                opt.text = fighter.name;
            }
            select.add(opt);
        });

        body.appendChild(select);
        panel.appendChild(body);
        
        const mainContainer = document.querySelector('.container') || document.body;
        mainContainer.prepend(panel);

        // --- SELECTION LOGIC ---
        select.addEventListener('change', function() {
            const selectedName = this.value;
            const data = FIGHTER_DATA.find(f => f.name === selectedName);

            if (!data) return;

            // 1. Basic Stats
            setNativeValue(document.getElementById(FIELD_MAP.name), data.name);
            setNativeValue(document.getElementById(FIELD_MAP.movement), data.movement);
            setNativeValue(document.getElementById(FIELD_MAP.toughness), data.toughness);
            setNativeValue(document.getElementById(FIELD_MAP.wounds), data.wounds);
            setNativeValue(document.getElementById(FIELD_MAP.points), data.points);

            // 2. Weapons Loop (Handles Stats AND Runemarks)
            if (data.weapons && Array.isArray(data.weapons)) {
                data.weapons.forEach((weapon, index) => {
                    // Safety check: The tool only supports 2 weapons (index 0 and 1)
                    if (index > 1) return;

                    // A. Fill Stats
                    setNativeValue(document.getElementById(FIELD_MAP[`w${index}_max_range`]), weapon.max_range);
                    setNativeValue(document.getElementById(FIELD_MAP[`w${index}_min_range`]), weapon.min_range);
                    setNativeValue(document.getElementById(FIELD_MAP[`w${index}_attacks`]), weapon.attacks);
                    setNativeValue(document.getElementById(FIELD_MAP[`w${index}_strength`]), weapon.strength);
                    setNativeValue(document.getElementById(FIELD_MAP[`w${index}_dmg_hit`]), weapon.dmg_hit);
                    setNativeValue(document.getElementById(FIELD_MAP[`w${index}_dmg_crit`]), weapon.dmg_crit);

                    // B. Weapon Runemarks Logic
                    // We assume the JSON key is "runemark" (e.g. "runemark": "Claws")
                    if (weapon.runemark) {
                        // Construct the ID: "wr:Claws"
                        // We capitalize the first letter to match standard ID casing if necessary
                        const runemarkName = capitalizeFirstLetter(weapon.runemark);
                        const iconID = "wr:" + runemarkName;

                        // Find all icons with this ID
                        const icons = document.querySelectorAll(`[id="${iconID}"]`);

                        // Logic:
                        // If index is 0 (Weapon 1), click the FIRST icon found.
                        // If index is 1 (Weapon 2), click the SECOND icon found.
                        if (icons.length > index) {
                            const targetIcon = icons[index];
                            // Only click if not already active/selected
                            if (!targetIcon.classList.contains("active")) {
                                targetIcon.click();
                            }
                        } else if (icons.length === 1 && index === 0) {
                            // Fallback: If only 1 exists and we are Weapon 1, click it.
                            icons[0].click();
                        } else {
                            console.warn(`Could not find weapon runemark #${index+1}: ${iconID}`);
                        }
                    }
                });

                // Clear Weapon 2 if it doesn't exist in JSON
                if (data.weapons.length < 2) {
                     setNativeValue(document.getElementById(FIELD_MAP.w1_max_range), "");
                     setNativeValue(document.getElementById(FIELD_MAP.w1_min_range), "");
                     setNativeValue(document.getElementById(FIELD_MAP.w1_attacks), "");
                     setNativeValue(document.getElementById(FIELD_MAP.w1_strength), "");
                     setNativeValue(document.getElementById(FIELD_MAP.w1_dmg_hit), "");
                     setNativeValue(document.getElementById(FIELD_MAP.w1_dmg_crit), "");
                }
            }

            // 3. Weapon 2 Toggle Button
            const w2Btn = document.getElementById(FIELD_MAP.weapon2_toggle);
            const shouldBeActive = (data.weapons && data.weapons.length > 1);
            if (w2Btn) {
                const isCurrentlyActive = w2Btn.classList.contains("active");
                if (shouldBeActive && !isCurrentlyActive) w2Btn.click();
                else if (!shouldBeActive && isCurrentlyActive) w2Btn.click();
            }

            // 4. Faction Runemark Logic
            const targetWarband = data.warband;
            if (targetWarband) {
                const allRunemarks = document.querySelectorAll('img[id^="fr:"]');
                let matchFound = false;
                allRunemarks.forEach(img => {
                    const idName = img.id.replace("fr:", "").toLowerCase();
                    const targetName = targetWarband.toLowerCase();
                    if (targetName.includes(idName) || idName.includes(targetName)) {
                        if (!img.classList.contains("active")) img.click();
                        matchFound = true;
                    } else {
                        if (img.classList.contains("active")) img.click();
                    }
                });
            }

            // 5. Character Runemarks Logic
            let rawRunemarks = data.runemarks || [];
            if (typeof rawRunemarks === 'string') {
                rawRunemarks = rawRunemarks.split(',').map(s => s.trim());
            }
            const targetSet = new Set();
            rawRunemarks.forEach(r => {
                let mappedName = RUNEMARK_MAP[r.toLowerCase()] || r;
                targetSet.add(mappedName.toLowerCase());
            });
            const allRunemarkImages = document.querySelectorAll('img[id^="rn:"]');
            allRunemarkImages.forEach(img => {
                const runemarkID = img.id.replace("rn:", "").toLowerCase();
                const isActive = img.classList.contains("active");
                if (targetSet.has(runemarkID)) {
                    if (!isActive) img.click();
                } else {
                    if (isActive) img.click();
                }
            });
        });
    }

    // Helper: Sets value and triggers React/Angular events
    function setNativeValue(element, value) {
        if(!element) return;
        const lastValue = element.value;
        element.value = value;
        const event = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        const tracker = element._valueTracker;
        if (tracker) tracker.setValue(lastValue);
        element.dispatchEvent(event);
        element.dispatchEvent(changeEvent);
    }

    // Helper: "claws" -> "Claws" to match HTML IDs
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

})();
