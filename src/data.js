import { CATEGORIES } from './categories.js';

const STAGE_1_VOTES = [
    { name: "NbTuN", goty: "Clair Obscur: Expedition 33, Monster Hunter Wilds, Doom: The Dark Ages", gameplay: "clair obscure expdetion 33, monster hunter wilds", story: "Kingdom Come: Deliverance II, clair obscure expdetion 33, The Alters", art: "clair obscure expdetion 33, No, I'm Not a Human, hades 2", music: "clair obscure expdetion 33, dynasty warriors origins, south of midnight", indie: "pistrello and the cursed yoyo, clair obscure expdetion 33, Advent NEON, Haste", remaster: "The Elder Scrolls IV: Oblivion Remastered, Ninja Gaiden 2 Black", multi: "dying light the beast, Mario Kart World, Split Fiction", flop: "vampire: the masquerade - bloodlines 2, Little Nightmares 3, lost soul aside", anticipated: "The Witcher 4, resdient evil 9, judas", char: "verso, gustave, jan", boss: "curator, Zoh Shia, the dragon everhood 2, Enhanced dark dragon", song: "Horizon Dreamer https://youtu.be/DJq0jJhPSjg, Une vie à t'aimer, lisrim golden, CAPRICIOUS WIND, rougarou", honorable: "Trepang2" },
    { name: "sal", goty: "Kingdom Come: Deliverance II", gameplay: "clair obscure expdetion 33, kingdom come deliverance2", story: "Kingdom Come: Deliverance II, clair obscure expdetion 33, death stranding 2", art: "clair obscure expdetion 33, ghost of yotei", music: "clair obscure expdetion 33, dynasty warriors origins", indie: "clair obscure expdetion 33", remaster: "The Elder Scrolls IV: Oblivion Remastered, METAL GEAR SOLID Δ: SNAKE EATER", multi: "dying light the beast, battlefield 6", flop: "vampire: the masquerade - bloodlines 2", anticipated: "The Witcher 4, crimson Desert, lego batman", char: "verso, Maelle, henry", boss: "Visages, Arlecchino", song: "Une vie à t'aimer, Lumière, Alicia, The Clear Blue Sky", honorable: "" },
    { name: "القوت", goty: "Clair Obscur: Expedition 33", gameplay: "clair obscure expdetion 33", story: "clair obscure expdetion 33", art: "clair obscure expdetion 33, death stranding 2, ghost of yotei", music: "clair obscure expdetion 33, death stranding 2", indie: "clair obscure expdetion 33", remaster: "", multi: "Mario Kart World, battlefield 6, rv there yet", flop: "dispatch", anticipated: "The Witcher 4, judas, gta 6", char: "verso", boss: "King K. Rool, Fulghor Champion of Nightglow, Arlecchino", song: "to the wilder, Une vie à t'aimer, Lumière", honorable: "Ai Baby gif" },
    { name: "Omar", goty: "Hollow Knight: Silksong", gameplay: "hollow knight silksong", story: "hollow knight silksong", art: "hollow knight silksong", music: "hollow knight silksong", indie: "hollow knight silksong", remaster: "", multi: "", flop: "Hunter x Hunter: Nen x Impact, Bleach Rebirth of Souls", anticipated: "", char: "hornet", boss: "tormented trobbio", song: "", honorable: "" },
    { name: "Potato Lover", goty: "Clair Obscur: Expedition 33, Hollow Knight: Silksong", gameplay: "hollow knight silksong", story: "clair obscure expdetion 33", art: "clair obscure expdetion 33, hollow knight silksong, death stranding 2", music: "clair obscure expdetion 33, death stranding 2", indie: "clair obscure expdetion 33, hollow knight silksong", remaster: "", multi: "elden ring nightreign", flop: "Hunter x Hunter: Nen x Impact, lost soul aside", anticipated: "MARVEL Tokon: Fighting Souls, stranger of heaven, dusk blood", char: "verso", boss: "curator", song: "to the wilder, story of rainy, Une vie à t'aimer, Lumière, Skarrsinger Karmelita", honorable: "" },
    { name: "ماجد", goty: "Clair Obscur: Expedition 33", gameplay: "ninja gaiden 4", story: "clair obscure expdetion 33", art: "clair obscure expdetion 33, hollow knight silksong, death stranding 2", music: "clair obscure expdetion 33, death stranding 2", indie: "clair obscure expdetion 33, hollow knight silksong", remaster: "The Elder Scrolls IV: Oblivion Remastered, Xenoblade chronicles x definitive edition", multi: "battlefield 6", flop: "vampire: the masquerade - bloodlines 2", anticipated: "The Witcher 4, judas", char: "verso", boss: "simon, Zoh Shia, Enhanced dark dragon", song: "to the wilder, Lumière, phantom", honorable: "Psychonauts" },
    { name: "اللواء جيري", goty: "Clair Obscur: Expedition 33", gameplay: "Doom: The Dark Ages, ninja gaiden 4, Khazan", story: "clair obscure expdetion 33", art: "clair obscure expdetion 33, ghost of yotei, Split Fiction", music: "clair obscure expdetion 33", indie: "clair obscure expdetion 33", remaster: "اي حاجة غير نينجا قايدن وميتل خرا", multi: "Split Fiction", flop: "lost soul aside", anticipated: "onimusha way of the sword, stranger of heaven, resdient evil 9", char: "renoir, verso, Maelle", boss: "simon, curator, maluka, Ryu Hayabusa", song: "Une vie à t'aimer, aline ost and renoir final boss phase 2", honorable: "" },
    { name: "PXL", goty: "Clair Obscur: Expedition 33, Monster Hunter Wilds", gameplay: "clair obscure expdetion 33", story: "clair obscure expdetion 33", art: "hollow knight silksong, ghost of yotei, Split Fiction", music: "clair obscure expdetion 33, hollow knight silksong", indie: "clair obscure expdetion 33, Haste", remaster: "METAL GEAR SOLID Δ: SNAKE EATER", multi: "Split Fiction, mage arena, Elden Ring Nightrain", flop: "Hunter x Hunter: Nen x Impact, Bleach Rebirth of Souls", anticipated: "phantom blade zero, The Witcher 4", char: "gustave, Jeff The Shark (MR), Revenant (ER), Duchess (ER)", boss: "Fulghor Champion of Nightglow, The wylder remembrance ending cutscene", song: "story of rainy, Une vie à t'aimer, Caligo, Miasma Of Night", honorable: "Balatro, Hearthstone" },
    { name: "silver", goty: "Clair Obscur: Expedition 33, ninja gaiden 4", gameplay: "clair obscure expdetion 33, ninja gaiden 4", story: "clair obscure expdetion 33, south of midnight", art: "clair obscure expdetion 33, Shinobi: Art of Vengeance, Bye Sweet Carole", music: "clair obscure expdetion 33, south of midnight, hades 2", indie: "clair obscure expdetion 33, Haste", remaster: "", multi: "dying light the beast, battlefield 6, rv there yet", flop: "vampire: the masquerade - bloodlines 2, lost soul aside, Split Fiction", anticipated: "stranger of heaven, The Witcher 4, crimson Desert", char: "renoir, verso, Maelle", boss: "Visages, Sirene, curator, Enhanced dark dragon", song: "story of rainy, Une vie à t'aimer, Lumière, lisrim golden, cherie tree", honorable: "prince of persia the lost crown" },
    { name: "معوذي", goty: "Clair Obscur: Expedition 33", gameplay: "hollow knight silksong, ninja gaiden 4, The First Berserker: Khazan", story: "Kingdom Come: Deliverance II, clair obscure expdetion 33, The Alters", art: "hollow knight silksong, death stranding 2, sword of the sea", music: "clair obscure expdetion 33, dynasty warriors origins, death stranding 2", indie: "clair obscure expdetion 33, hollow knight silksong, hades 2", remaster: "The Elder Scrolls IV: Oblivion Remastered, METAL GEAR SOLID Δ: SNAKE EATER", multi: "rv there yet, peak, R.E.P.O.", flop: "vampire: the masquerade - bloodlines 2, Little Nightmares 3, lost soul aside", anticipated: "stranger of heaven, Marvel's Wolverine, dusk blood", char: "verso, henry, jan", boss: "curator, Fulghor Champion of Nightglow, Enhanced dark dragon, Arlecchino", song: "Gestral Village Golgra, The Clear Blue Sky, CAPRICIOUS WIND, Open Your Heart, Last Dive", honorable: "Bioshock Infinite" },
    { name: "K-Tap", goty: "Hollow Knight: Silksong", gameplay: "hollow knight silksong", story: "clair obscure expdetion 33", art: "clair obscure expdetion 33, ghost of yotei, Dispatch", music: "", indie: "Dispatch", remaster: "METAL GEAR SOLID Δ: SNAKE EATER", multi: "ARC Raiders, peak", flop: "", anticipated: "Marvel's Wolverine, resdient evil 9, gta 6", char: "hornet, Robert robertson the third", boss: "", song: "", honorable: "Hollow kbight" },
    { name: "عزوز", goty: "Doom: The Dark Ages", gameplay: "dying light the beast", story: "clair obscure expdetion 33", art: "clair obscure expdetion 33", music: "", indie: "clair obscure expdetion 33", remaster: "METAL GEAR SOLID Δ: SNAKE EATER", multi: "Sonic Racing: CrossWorlds", flop: "elden ring nightreign, Fortnite", anticipated: "The Witcher 4", char: "", boss: "", song: "", honorable: "" },
    { name: "yuki", goty: "Clair Obscur: Expedition 33, Hollow Knight: Silksong", gameplay: "clair obscure expdetion 33, hollow knight silksong", story: "clair obscure expdetion 33, hollow knight silksong", art: "clair obscure expdetion 33, hollow knight silksong, Split Fiction", music: "clair obscure expdetion 33", indie: "hollow knight silksong", remaster: "trails in the sky 1st chapter", multi: "dying light the beast, Split Fiction", flop: "lost soul aside", anticipated: "The Witcher 4, resdient evil 9, tides of annihilation", char: "renoir, verso, gustave", boss: "renoir secoend fight, simon, scar singer", song: "Une vie à t'aimer, Lumière, Skarrsinger Karmelita", honorable: "" },
    { name: "فراس", goty: "Kingdom Come: Deliverance II, Clair Obscur: Expedition 33, Hollow Knight: Silksong", gameplay: "ninja gaiden 4", story: "clair obscure expdetion 33", art: "sword of the sea", music: "clair obscure expdetion 33", indie: "clair obscure expdetion 33", remaster: "Ninja Gaiden 2 Black", multi: "Split Fiction", flop: "Little Nightmares 3", anticipated: "Marvel's Wolverine, dusk blood", char: "verso, renoir", boss: "curator, Fulghor Champion of Nightglow, simon, Arlecchino", song: "Gestral Village Golgra, The Clear Blue Sky, CAPRICIOUS WIND, Open Your Heart, Last Dive, Une vie à t'aimer, Lumière", honorable: "Bioshock Infinite" }
];

const STAGE_2_VOTES = [
    { name: "sal", goty: "Kingdom Come: Deliverance II", gameplay: "clair obscure expdetion 33", story: "clair obscure expdetion 33", art: "clair obscure expdetion 33", music: "clair obscure expdetion 33", indie: "clair obscure expdetion 33", remaster: "The Elder Scrolls IV: Oblivion Remastered", multi: "elden ring nightreign", flop: "vampire: the masquerade - bloodlines 2", anticipated: "The Witcher 4", char: "renoir", boss: "Arlecchino", song: "Lumière https://youtu.be/zmvsw2ILX5k", honorable: "Bioshock Infinite" },
    { name: "Potato lover", goty: "Hollow Knight: Silksong", gameplay: "hollow knight silksong", story: "clair obscure expdetion 33", art: "clair obscure expdetion 33", music: "death stranding 2", indie: "hollow knight silksong", remaster: "", multi: "elden ring nightreign", flop: "Hunter x Hunter: Nen x Impact", anticipated: "stranger of heaven", char: "verso", boss: "curator", song: "to the wilder https://www.youtube.com/watch?v=BSN1rPPKK9s", honorable: "Bioshock Infinite" },
    { name: "ماجد", goty: "Clair Obscur: Expedition 33", gameplay: "ninja gaiden 4", story: "clair obscure expdetion 33", art: "hollow knight silksong", music: "death stranding 2", indie: "clair obscure expdetion 33", remaster: "Xenoblade Chronicles X", multi: "battlefield 6", flop: "lost soul aside", anticipated: "The Witcher 4", char: "verso", boss: "Enhanced dark dragon", song: "Une vie à peindre https://www.youtube.com/watch?v=-i_nT9d-mK8", honorable: "Psychonauts" },
    { name: "yuki", goty: "Clair Obscur: Expedition 33", gameplay: "hollow knight silksong, clair obscure expdetion 33", story: "clair obscure expdetion 33", art: "split fiction", music: "clair obscure expdetion 33", indie: "clair obscure expdetion 33", remaster: "trails in the sky 1st chapter", multi: "Split Fiction", flop: "lost soul aside", anticipated: "resdient evil 9, The Witcher 4", char: "verso", boss: "curator", song: "Une vie à t'aimer https://www.youtube.com/watch?v=3kMbTzomh94", honorable: "prince of persia the lost crown" },
    { name: "NbTuN", goty: "Clair Obscur: Expedition 33", gameplay: "clair obscure expdetion 33", story: "clair obscure expdetion 33", art: "clair obscure expdetion 33", music: "dynasty warriors origins", indie: "clair obscure expdetion 33", remaster: "The Elder Scrolls IV: Oblivion Remastered", multi: "Split Fiction", flop: "lost soul aside", anticipated: "The Witcher 4", char: "verso", boss: "Enhanced dark dragon", song: "Une vie à peindre https://www.youtube.com/watch?v=-i_nT9d-mK8", honorable: "Trepang2" },
    { name: "silver", goty: "Clair Obscur: Expedition 33", gameplay: "clair obscure expdetion 33", story: "clair obscure expdetion 33", art: "clair obscure expdetion 33", music: "clair obscure expdetion 33", indie: "clair obscure expdetion 33", remaster: "", multi: "dying light the beast", flop: "lost soul aside", anticipated: "stranger of heaven", char: "verso", boss: "curator", song: "Une vie à peindre https://www.youtube.com/watch?v=-i_nT9d-mK8", honorable: "prince of persia the lost crown" },
    { name: "اللواء جيري", goty: "Clair Obscur: Expedition 33", gameplay: "ninja gaiden 4", story: "clair obscure expdetion 33", art: "split fiction", music: "clair obscure expdetion 33", indie: "clair obscure expdetion 33", remaster: "trails in the sky 1st chapter", multi: "Split Fiction", flop: "lost soul aside", anticipated: "stranger of heaven", char: "verso", boss: "curator", song: "Une vie à t'aimer", honorable: "Bioshock Infinite" },
    { name: "فراس", goty: "Clair Obscur: Expedition 33", gameplay: "ninja gaiden 4", story: "clair obscure expdetion 33", art: "split fiction", music: "clair obscure expdetion 33", indie: "clair obscure expdetion 33", remaster: "The Elder Scrolls IV: Oblivion Remastered", multi: "Split Fiction", flop: "lost soul aside", anticipated: "stranger of heaven", char: "verso", boss: "Arlecchino", song: "Une vie à peindre", honorable: "Bioshock Infinite" }
];

const FINAL_CANDIDATES = {
    gameplay: ["Clair Obscur: Expedition 33", "Hollow Knight: Silksong", "Ninja Gaiden 4", "The First Berserker: Khazan"],
    story: ["Kingdom Come: Deliverance II", "Clair Obscur: Expedition 33", "Hollow Knight: Silksong", "The Alters", "Death Stranding 2"],
    art: ["Clair Obscur: Expedition 33", "Hollow Knight: Silksong", "Ghost of Yotei", "Split Fiction", "Death Stranding 2"],
    music: ["Clair Obscur: Expedition 33", "Death Stranding 2", "Dynasty Warriors Origins", "Hollow Knight: Silksong"],
    indie: ["Clair Obscur: Expedition 33", "Hollow Knight: Silksong", "Haste", "Hades 2"],
    remaster: ["MGS Delta: Snake Eater", "The Elder Scrolls IV: Oblivion Remastered", "Ninja Gaiden 2 Black", "Trails in the Sky 1st Chapter", "Xenoblade Chronicles X"],
    multi: ["Sonic Racing: CrossWorlds", "Dying Light The Beast", "Gentelman Dispute", "Mario Kart World", "ARC Raiders", "Split Fiction", "Mage Arena", "Battlefield 6", "Rv There Yet", "Peak", "Elden Ring: Nightreign", "R.E.P.O.", "Elden Ring Nightrain"],
    flop: ["Lost Soul Aside", "Vampire: The Masquerade - Bloodlines 2", "Little Nightmares 3", "Hunter x Hunter: Nen x Impact"],
    anticipated: ["The Witcher 4", "Resident Evil 9", "Stranger of Heaven"],
    char: ["Renoir", "Verso", "Gustave", "Maelle", "Henry", "Jan"],
    boss: ["Simon", "Curator", "Enhanced Dark Dragon", "Fulghor Champion of Nightglow", "Zoh Shia", "Arlecchino"], // Added Arlecchino back
    song: ["Une vie à t'aimer", "Lumière", "To the Wilder", "Story of Rainy", "Une vie à peindre", "Alicia", "Lisrim Golden", "The Clear Blue Sky", "Skarrsinger Karmelita", "CAPRICIOUS WIND", "Ailne", "Horizon Dreamer"],
    goty: ["Kingdom Come: Deliverance II", "Clair Obscur: Expedition 33", "Hollow Knight: Silksong", "Doom: The Dark Ages", "Monster Hunter Wilds"],
    honorable: []
};

// --- HELPER FUNCTIONS ---
       const normalizeName = (name) => {
    if (!name) return null;
    let n = name.toLowerCase().trim();
    
    // --- BOSSES ---
    if (n.includes("simon")) return "Simon";
    if (n.includes("fulghor")) return "Fulghor Champion of Nightglow";
    // Updated to shorten name
    if (n.includes("arlecchino") || n.includes("blood artist")) return "Arlecchino";
    if (n.includes("curator")) return "Curator";
    if (n.includes("enhanced dark dragon") || n.includes("dark dragon")) return "Enhanced Dark Dragon";
    if (n.includes("zoh shia")) return "Zoh Shia";
    if (n.includes("visages")) return "Visages";

    // --- GAMES ---
    if (n.includes("dispatch")) return "Dispatch";
    if (n.includes("khazan") || n.includes("khzan")) return "The First Berserker: Khazan";
    if (n.includes("haste")) return "Haste";
    if (n.includes("xenoblade")) return "Xenoblade Chronicles X";
    if (n.includes("trails")) return "Trails in the Sky 1st Chapter";
    if (n.includes("sonic racing")) return "Sonic Racing: CrossWorlds";
    if (n.includes("dying light")) return "Dying Light The Beast";
    if (n.includes("mario kart")) return "Mario Kart World";
    if (n.includes("battlefield")) return "Battlefield 6";
    if (n.includes("nightrain") || n.includes("nightreign")) return "Elden Ring: Nightreign";
    if (n.includes("little nightmares")) return "Little Nightmares 3";
    if (n.includes("alters") || n.includes("the alters")) return "The Alters"; // Added
    if (n.includes("dynasty")) return "Dynasty Warriors Origins";
    if (n.includes("clair") || n.includes("expedition")) return "Clair Obscur: Expedition 33";
    if (n.includes("silksong")) return "Hollow Knight: Silksong";
    if (n.includes("kingdom come") || n.includes("deliverance")) return "Kingdom Come: Deliverance II";
    if (n.includes("oblivion")) return "The Elder Scrolls IV: Oblivion Remastered";
    if (n.includes("bloodlines") || n.includes("vampire")) return "Vampire: The Masquerade - Bloodlines 2"; // Fixed
    if (n.includes("witcher 4")) return "The Witcher 4";
    if (n.includes("resident evil 9") || n.includes("resdient")) return "Resident Evil 9";
    if (n.includes("ninja gaiden 4")) return "Ninja Gaiden 4";
    if (n.includes("death stranding")) return "Death Stranding 2";
    if (n.includes("split fiction")) return "Split Fiction";
    if (n.includes("lost soul aside")) return "Lost Soul Aside"; // Fixed
    if (n.includes("stranger of heaven")) return "Stranger of Heaven";
    if (n.includes("hunter x hunter")) return "Hunter x Hunter: Nen x Impact";
    if (n.includes("snake eater") || n.includes("metal gear") || n.includes("mgs")) return "MGS Delta: Snake Eater";
    if (n.includes("monster hunter")) return "Monster Hunter Wilds";
    if (n.includes("ghost of yotei")) return "Ghost of Yotei";
    if (n.includes("hades")) return "Hades 2";

    // --- CHARACTERS ---
    if (n.includes("renoir")) return "Renoir";
    if (n.includes("verso")) return "Verso";
    if (n.includes("gustave")) return "Gustave";
    if (n.includes("maelle")) return "Maelle";
    if (n.includes("henry")) return "Henry";
    if (n.includes("jan")) return "Jan";

    return n.replace(/\b\w/g, l => l.toUpperCase());
};

const extractSongName = (text) => {
    if (!text) return null;
    const n = text.toLowerCase().trim();

    // Check for keywords anywhere in the string (ignoring URL junk)
    if (n.includes("une vie à t'aimer")) return "Une vie à t'aimer";
    if (n.includes("lumière") || n.includes("lumiere")) return "Lumière";
    if (n.includes("to the wilder")) return "To the Wilder";
    if (n.includes("story of rainy")) return "Story of Rainy";
    if (n.includes("une vie à peindre")) return "Une vie à peindre";
    if (n.includes("alicia")) return "Alicia";
    if (n.includes("lisrim") || n.includes("golden")) return "Lisrim Golden";
    if (n.includes("clear blue sky")) return "The Clear Blue Sky";
    if (n.includes("skarrsinger")) return "Skarrsinger Karmelita";
    if (n.includes("capricious wind")) return "CAPRICIOUS WIND";
    if (n.includes("ailne") || n.includes("aline")) return "Ailne";
    if (n.includes("horizon dreamer")) return "Horizon Dreamer";
    if (n.includes("caligo")) return "Caligo";
    if (n.includes("miasma")) return "Miasma Of Night";
    if (n.includes("gestral")) return "Gestral Village Golgra";
    if (n.includes("open your heart")) return "Open Your Heart";
    if (n.includes("last dive")) return "Last Dive";
    if (n.includes("phantom")) return "Phantom";
    if (n.includes("cherie tree")) return "Cherie Tree";
    if (n.includes("rougarou")) return "Rougarou";

    // Fallback: try to clean URL if no match found
    let rawName = text;
    if (text.includes("http")) {
        rawName = text.split("http")[0];
    }
    return normalizeName(rawName);
};

// Get Honorable Mentions as a list of {game, voter}
const getHonorableMentionsList = () => {
    // Specific hardcoded list per user request
    return [
        { game: "Hearthstone / Balatro", voter: "PXL" },
        { game: "Trepang2", voter: "NbTuN" },
        { game: "Bioshock Infinite", voter: "Feras" },
        { game: "Prince of Persia: The Lost Crown", voter: "Silver" },
        { game: "Psychonauts", voter: "Majid" }
    ];
};

const processData = (dataSet, isFinalStage = false) => {
    const results = {};
    CATEGORIES.forEach(cat => {
        results[cat.id] = {};
        if (isFinalStage && FINAL_CANDIDATES[cat.id]) {
            FINAL_CANDIDATES[cat.id].forEach(candidateName => {
                results[cat.id][candidateName] = 0;
            });
        }
    });

    dataSet.forEach(vote => {
        CATEGORIES.forEach(cat => {
            const rawValue = vote[cat.id];
            if (rawValue) {
                const values = rawValue.split(/,|،/); 
                values.forEach(v => {
                    let normalized;
                    if (cat.id === 'song') {
                        normalized = extractSongName(v);
                    } else {
                        normalized = normalizeName(v);
                    }
                    
                    if (normalized && normalized.length > 1) {
                        if (isFinalStage && FINAL_CANDIDATES[cat.id]) {
                            if (!FINAL_CANDIDATES[cat.id].includes(normalized)) return;
                        }
                        if (results[cat.id][normalized] === undefined) {
                            if (!isFinalStage) results[cat.id][normalized] = 0;
                        }
                        if (results[cat.id][normalized] !== undefined) {
                            results[cat.id][normalized]++;
                        }
                    }
                });
            }
        });
    });

    const sortedResults = {};
    CATEGORIES.forEach(cat => {
        let entries = Object.entries(results[cat.id]).map(([name, count]) => ({ name, count }));
        entries.sort((a, b) => b.count - a.count);
        
        let currentRank = 1;
        for (let i = 0; i < entries.length; i++) {
            if (i > 0 && entries[i].count < entries[i - 1].count) {
                currentRank = i + 1;
            }
            entries[i].rank = currentRank;
        }

        if (isFinalStage && cat.id === 'multi') {
            entries = entries.filter(entry => entry.rank !== 5);
        }
        
        sortedResults[cat.id] = entries;
    });
    return sortedResults;
};

const getFilteredStage1Data = (data) => {
    if (!data || data.length <= 5) return data;
    const fifthPlaceCount = data[4].count;
    return data.filter(item => item.count >= fifthPlaceCount);
};

export { STAGE_1_VOTES, STAGE_2_VOTES, FINAL_CANDIDATES, normalizeName, extractSongName, processData, getFilteredStage1Data, getHonorableMentionsList };
