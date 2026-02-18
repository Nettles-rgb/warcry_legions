// autofiller.js

(function() {
    'use strict';

    // =================================================================
    // 1. CONFIGURATION & DATA SOURCES
    // =================================================================
    const JSON_SOURCES = [
        { 
            url: "https://krisling049.github.io/warcry_data/fighters.json", 
            type: "Main",     
            order: 0,
            prefix: "" 
        },
        { 
            url: "./assets/custom_fighters.json", 
            type: "Custom",   
            order: 1,
            prefix: "[Custom] " 
        },
        { 
            url: "./assets/retired_fighters.json", 
            type: "Retired",  
            order: 2,
            prefix: "[Retired] " 
        }
    ];

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
    // 2. DICTIONARIES (THE TRANSLATORS)
    // =================================================================
    
    // Character Runemarks (JSON Name -> HTML ID Name)
    const RUNEMARK_MAP = {
        "hero": "Leader"
    };

    // Weapon Runemarks (JSON Name -> HTML ID Suffix "wr:Suffx")
    const WEAPON_RUNEMARK_MAP = {
        "ranged": "Ranged weapon",
        "Ranged": "Ranged weapon",
        "reach": "Reach weapon",
        "Reach": "Reach weapon"
    };

    // Faction Runemarks (JSON Warband Name -> HTML ID Suffix "fr:Suffix")
    const FACTION_RUNEMARK_MAP = {
        "order": "Grand Alliance: Order"
    };


    // =================================================================
    // 3. FETCH AND PROCESS
    // =================================================================
    console.log("Auto-Filler: Fetching all fighter data...");

    Promise.all(JSON_SOURCES.map(source => 
        fetch(source.url)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${source.url}`);
                return response.json();
            })
            .then(data => {
                data.forEach(f => {
                    f._sortOrder = source.order; 
                    if (f.warband && source.prefix) {
                        f.warband = source.prefix + f.warband;
                    }
                });
                return data;
            })
            .catch(err => {
                console.warn("Skipping file:", source.url, err);
                return []; 
            })
    ))
    .then(results => {
        const combinedFighters = results.flat();
        console.log(`Auto-Filler: Loaded ${combinedFighters.length} total fighters.`);
        initTool(combinedFighters);
    });

    // =================================================================
    // 4. MAIN TOOL LOGIC
    // =================================================================
    function initTool(FIGHTER_DATA) {
        // --- UI Setup ---
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

        // Sort Logic
        FIGHTER_DATA.sort((a, b) => {
            const orderA = a._sortOrder || 0;
            const orderB = b._sortOrder || 0;
            if (orderA !== orderB) return orderA - orderB;

            const warbandA = (a.warband || "").toLowerCase();
            const warbandB = (b.warband || "").toLowerCase();
            if (warbandA < warbandB) return -1;
            if (warbandA > warbandB) return 1;

            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });

        // Populate Dropdown
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

        // --- Selection Event ---
        select.addEventListener('change', function() {
            const selectedName = this.value;
            const data = FIGHTER_DATA.find(f => f.name === selectedName);

            if (data) {
                // A. Basic Stats
                setNativeValue(document.getElementById(FIELD_MAP.name), data.name);
                setNativeValue(document.getElementById(FIELD_MAP.movement), data.movement);
                setNativeValue(document.getElementById(FIELD_MAP.toughness), data.toughness);
                setNativeValue(document.getElementById(FIELD_MAP.wounds), data.wounds);
                setNativeValue(document.getElementById(FIELD_MAP.points), data.points);
                setNativeValue(document.getElementById(FIELD_MAP.grand_alliance), data.grand_alliance);

                // B. Weapon Stats
                fillWeaponStats(data.weapons, 0);
                fillWeaponStats(data.weapons, 1);

                // C. Weapon Toggle
                const w2Btn = document.getElementById(FIELD_MAP.weapon2_toggle);
                const shouldBeActive = (data.weapons && data.weapons.length > 1);
                if (w2Btn) {
                    const isCurrentlyActive = w2Btn.classList.contains("active");
                    if (shouldBeActive && !isCurrentlyActive) w2Btn.click();
                    else if (!shouldBeActive && isCurrentlyActive) w2Btn.click();
                }

                // D. Weapon Runemarks (WITH DICTIONARY SUPPORT)
                if (data.weapons && Array.isArray(data.weapons)) {
                    data.weapons.forEach((weapon, index) => {
                        if (index > 1) return;
                        if (weapon.runemark) {
                            // 1. Check Dictionary First
                            let runemarkName = WEAPON_RUNEMARK_MAP[weapon.runemark.toLowerCase()];
                            
                            // 2. If not in dictionary, Capitalize First Letter
                            if (!runemarkName) {
                                runemarkName = capitalizeFirstLetter(weapon.runemark);
                            }

                            const iconID = "wr:" + runemarkName;
                            const icons = document.querySelectorAll(`[id="${iconID}"]`);
                            
                            if (icons.length > index) {
                                const targetIcon = icons[index];
                                if (!targetIcon.classList.contains("active")) targetIcon.click();
                            } else if (icons.length === 1 && index === 0) {
                                if (!icons[0].classList.contains("active")) icons[0].click();
                            }
                        }
                    });
                }

                // E. Faction Runemark (WITH DICTIONARY SUPPORT)
                const rawWarband = data.warband || "";
                let cleanWarband = rawWarband.replace(/\[Custom\] |\[Retired\] /g, "");

                // 1. Check Dictionary First
                if (FACTION_RUNEMARK_MAP[cleanWarband]) {
                    cleanWarband = FACTION_RUNEMARK_MAP[cleanWarband];
                }

                if (cleanWarband) {
                    const allRunemarks = document.querySelectorAll('img[id^="fr:"]');
                    let matchFound = false;
                    allRunemarks.forEach(img => {
                        const idName = img.id.replace("fr:", "").toLowerCase();
                        const targetName = cleanWarband.toLowerCase();
                        // Fuzzy matching logic
                        if (targetName.includes(idName) || idName.includes(targetName)) {
                            if (!img.classList.contains("active")) img.click();
                            matchFound = true;
                        } else {
                            if (img.classList.contains("active")) img.click();
                        }
                    });
                }

                // F. Character Runemarks (WITH DICTIONARY SUPPORT)
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
            }
        });
    }

    // Helper: Fill Weapon Stats to reduce code duplication
    function fillWeaponStats(weapons, index) {
        if (weapons && weapons.length > index) {
            const w = weapons[index];
            const idx = index === 0 ? "w1" : "w2"; // Match FIELD_MAP keys
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_max_range`]), w.max_range);
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_min_range`]), w.min_range);
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_attacks`]), w.attacks);
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_strength`]), w.strength);
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_dmg_hit`]), w.dmg_hit);
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_dmg_crit`]), w.dmg_crit);
        } else {
             // Clear fields if weapon doesn't exist
            const idx = index === 0 ? "w1" : "w2";
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_max_range`]), "");
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_min_range`]), "");
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_attacks`]), "");
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_strength`]), "");
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_dmg_hit`]), "");
            setNativeValue(document.getElementById(FIELD_MAP[`${idx}_dmg_crit`]), "");
        }
    }

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

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

})();
