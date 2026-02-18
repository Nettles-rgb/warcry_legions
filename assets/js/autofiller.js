// autofiller.js

(function() {
    'use strict';

    // 1. CONFIGURATION: Your 3 Data Sources
    const JSON_SOURCES = [
        { 
            url: "https://krisling049.github.io/warcry_data/fighters.json", 
            type: "Main",     
            order: 0,
            prefix: "" // No prefix for main fighters
        },
        { 
            url: "./assets/custom_fighters.json", 
            type: "Custom",   
            order: 1,
            prefix: "[Custom] " // Added to Warband Name
        },
        { 
            url: "./assets/retired_fighters.json", 
            type: "Retired",  
            order: 2,
            prefix: "[Retired] " // Added to Warband Name
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

    const RUNEMARK_MAP = {
        "hero": "Leader",
        "minion": "Minion",
        "champion": "Champion"
    };

    console.log("Auto-Filler: Fetching all fighter data...");

    // 2. FETCH ALL FILES SIMULTANEOUSLY
    Promise.all(JSON_SOURCES.map(source => 
        fetch(source.url)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${source.url}`);
                return response.json();
            })
            .then(data => {
                // MODIFY DATA HERE
                data.forEach(f => {
                    f._sortOrder = source.order; // Keep for safety sorting
                    
                    // Prepend the prefix to the Warband Name immediately
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

    function initTool(FIGHTER_DATA) {
        // --- UI SETUP ---
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

        // 3. UPDATED SORTING LOGIC
        FIGHTER_DATA.sort((a, b) => {
            // A. Sort by Source first (Main < Custom < Retired)
            const orderA = a._sortOrder || 0;
            const orderB = b._sortOrder || 0;
            if (orderA !== orderB) {
                return orderA - orderB;
            }

            // B. Then sort by Warband (Alphabetical)
            // Since we added [Custom] to the string, they will group naturally
            const warbandA = (a.warband || "").toLowerCase();
            const warbandB = (b.warband || "").toLowerCase();
            if (warbandA < warbandB) return -1;
            if (warbandA > warbandB) return 1;

            // C. Finally sort by Name
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            
            return 0;
        });

        // 4. Populate Dropdown
        FIGHTER_DATA.forEach((fighter) => {
            const opt = document.createElement('option');
            opt.value = fighter.name;
            
            // Because we modified 'fighter.warband' in the fetch stage,
            // it already contains "[Custom] Warband Name"
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

        // --- EVENT LISTENER (Standard Logic) ---
        select.addEventListener('change', function() {
            const selectedName = this.value;
            // Note: If duplicate names exist across Main/Custom, find() picks the first one.
            // Since we sort Main to the top, it prioritizes Main.
            const data = FIGHTER_DATA.find(f => f.name === selectedName);

            if (data) {
                // A. Basic Stats
                setNativeValue(document.getElementById(FIELD_MAP.name), data.name);
                setNativeValue(document.getElementById(FIELD_MAP.movement), data.movement);
                setNativeValue(document.getElementById(FIELD_MAP.toughness), data.toughness);
                setNativeValue(document.getElementById(FIELD_MAP.wounds), data.wounds);
                setNativeValue(document.getElementById(FIELD_MAP.points), data.points);
                setNativeValue(document.getElementById(FIELD_MAP.grand_alliance), data.grand_alliance);

                // B. Weapon 1
                if (data.weapons && data.weapons.length > 0) {
                    const w1 = data.weapons[0];
                    setNativeValue(document.getElementById(FIELD_MAP.w1_max_range), w1.max_range);
                    setNativeValue(document.getElementById(FIELD_MAP.w1_min_range), w1.min_range);
                    setNativeValue(document.getElementById(FIELD_MAP.w1_attacks), w1.attacks);
                    setNativeValue(document.getElementById(FIELD_MAP.w1_strength), w1.strength);
                    setNativeValue(document.getElementById(FIELD_MAP.w1_dmg_hit), w1.dmg_hit);
                    setNativeValue(document.getElementById(FIELD_MAP.w1_dmg_crit), w1.dmg_crit);
                }

                // C. Weapon 2
                if (data.weapons && data.weapons.length > 1) {
                    const w2 = data.weapons[1];
                    setNativeValue(document.getElementById(FIELD_MAP.w2_max_range), w2.max_range);
                    setNativeValue(document.getElementById(FIELD_MAP.w2_min_range), w2.min_range);
                    setNativeValue(document.getElementById(FIELD_MAP.w2_attacks), w2.attacks);
                    setNativeValue(document.getElementById(FIELD_MAP.w2_strength), w2.strength);
                    setNativeValue(document.getElementById(FIELD_MAP.w2_dmg_hit), w2.dmg_hit);
                    setNativeValue(document.getElementById(FIELD_MAP.w2_dmg_crit), w2.dmg_crit);
                } else {
                    setNativeValue(document.getElementById(FIELD_MAP.w2_max_range), "");
                    setNativeValue(document.getElementById(FIELD_MAP.w2_min_range), "");
                    setNativeValue(document.getElementById(FIELD_MAP.w2_attacks), "");
                    setNativeValue(document.getElementById(FIELD_MAP.w2_strength), "");
                    setNativeValue(document.getElementById(FIELD_MAP.w2_dmg_hit), "");
                    setNativeValue(document.getElementById(FIELD_MAP.w2_dmg_crit), "");
                }

                // D. Weapon Toggle
                const w2Btn = document.getElementById(FIELD_MAP.weapon2_toggle);
                const shouldBeActive = (data.weapons && data.weapons.length > 1);
                if (w2Btn) {
                    const isCurrentlyActive = w2Btn.classList.contains("active");
                    if (shouldBeActive && !isCurrentlyActive) w2Btn.click();
                    else if (!shouldBeActive && isCurrentlyActive) w2Btn.click();
                }

                // E. Weapon Runemarks
                if (data.weapons && Array.isArray(data.weapons)) {
                    data.weapons.forEach((weapon, index) => {
                        if (index > 1) return;
                        if (weapon.runemark) {
                            const runemarkName = capitalizeFirstLetter(weapon.runemark);
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

                // F. Faction Runemark
                // NOTE: We stripped the prefix before matching!
                const rawWarband = data.warband || "";
                // Remove [Custom] or [Retired] to find the real image ID
                const cleanWarband = rawWarband.replace(/\[Custom\] |\[Retired\] /g, "");
                
                if (cleanWarband) {
                    const allRunemarks = document.querySelectorAll('img[id^="fr:"]');
                    let matchFound = false;
                    allRunemarks.forEach(img => {
                        const idName = img.id.replace("fr:", "").toLowerCase();
                        const targetName = cleanWarband.toLowerCase();
                        if (targetName.includes(idName) || idName.includes(targetName)) {
                            if (!img.classList.contains("active")) img.click();
                            matchFound = true;
                        } else {
                            if (img.classList.contains("active")) img.click();
                        }
                    });
                }

                // G. Character Runemarks
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
