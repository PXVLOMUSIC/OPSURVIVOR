// === KITS DE LA TRIPULACIÓN: NAMI, USOPP, CHOPPER Y ROBIN ===
// Como Luffy, Zoro y Sanji: 5 técnicas exclusivas (la insignia de js/arsenal.js + 4 de aquí) y una
// transformación de 3 escalones con medidor (Espacio o botón), que se desbloquean con hitos.
// Motor genérico: cada técnica es un tipo de ataque (kind) con parámetros propios.
// Se carga después de gears.js: amplía CHAR_SKILLS, skills, EVOLUTIONS, FORMS, GEAR_ATTACKS y los ganchos de arsenal.js.

// ---------- Iconos ----------
Object.assign(ICONS, {
    gustsword:   SVG(`<g ${S}><path d="M3 15c5-1 9-4 13-9M5 19c6-1 11-5 15-11" /><path d="M2 11c3 0 5-1 7-3" opacity=".6"/></g>`),
    tornado:     SVG(`<g ${S}><path d="M4 5h16M6 9h12M8 13h8M10 17h4M11.5 21h1"/></g>`),
    thunderbreed:SVG(`<g ${F}><path d="M7 11a4 4 0 0 1 .6-8 5 5 0 0 1 9.3 1.4A3.4 3.4 0 0 1 17 11z"/><path d="M12 12l-3 5h2.6L10 22l5-6.4h-2.7l1.8-3.6z"/></g>`),
    raintempo:   SVG(`<g ${F}><path d="M6.5 10a4 4 0 0 1 .6-8 5 5 0 0 1 9.3 1.4A3.4 3.4 0 0 1 16.5 10z"/></g><g ${S}><path d="M7 13l-1.5 3M12 13l-1.5 3M17 13l-1.5 3M9.5 18l-1.5 3M14.5 18l-1.5 3"/></g>`),
    namiform:    SVG(`<g ${S}><path d="M5 21 16 10" stroke-width="2.4"/><circle cx="18" cy="7.5" r="3"/></g><g ${F}><circle cx="18" cy="7.5" r="1.3"/><path d="M4 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM10 2l.7 1.4 1.4.6-1.4.6L10 6l-.7-1.4L7.9 4l1.4-.6z"/></g>`),
    namari:      SVG(`<g ${F}><circle cx="15" cy="12" r="4"/><circle cx="7" cy="12" r="2" opacity=".55"/><circle cx="2.5" cy="12" r="1.2" opacity=".3"/></g>`),
    kaen:        SVG(`<g ${F}><path d="M12 2c1 4 6 5.5 6 11a6 6 0 0 1-12 0c0-3 1.6-4.6 3-6 .2 2 1 3 2 3.3C10.4 7 11 4.4 12 2z"/></g>`),
    tabasco:     SVG(`<g ${F}><path d="M10 2h4v3l1.5 2v13a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V7L10 5z"/></g><g ${S}><path d="M18 9c2 0 3 1.5 3 3M18.5 13.5c1.5.3 2 1.3 2 2.5" opacity=".6"/></g>`),
    hinotori:    SVG(`<g ${F}><path d="M2 12c4-1 6-5 8-8 0 3 1 5 3 6 1-2 3-3 5-3-1 2-1 3 0 4l4 1-4 1c-1 1-1 2 0 4-2 0-4-1-5-3-2 1-3 3-3 6-2-3-4-7-8-8z"/></g>`),
    usoppform:   SVG(`<g ${S}><circle cx="12" cy="10" r="7"/><path d="M5 10h14M12 3v14M8 21h8"/></g><g ${F}><circle cx="9" cy="10" r="1.6"/><circle cx="15" cy="10" r="1.6"/></g>`),
    heavygong:   SVG(`<g ${F}><path d="M5 8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4a6 6 0 0 1-6 6h-2a4 4 0 0 1-4-4z"/></g><g ${S}><path d="M19 6c2 2 2 6 0 8M21.5 4c3 3 3 9 0 12" opacity=".6"/></g>`),
    kokuteicross:SVG(`<g ${S}><path d="M5 5l14 14M19 5 5 19" stroke-width="3"/></g><g ${F}><circle cx="12" cy="12" r="2.2"/></g>`),
    guardpoint:  SVG(`<g ${F}><circle cx="12" cy="13" r="8"/></g><g stroke="#000" stroke-opacity=".3" fill="none" stroke-width="1.4"><path d="M7 9c1 1 1 3 0 4M12 7c1 1.5 1 3.5 0 5M17 9c-1 1-1 3 0 4M9 16c1 1 5 1 6 0"/></g><g ${S}><path d="M8 4 6 1.5M16 4l2-2.5"/></g>`),
    hornpoint:   SVG(`<g ${S}><path d="M12 21v-7M12 14C9 12 7 9 7 4M7 7 4 5M12 14c3-2 5-5 5-10M17 7l3-2M9 10 6.5 10M15 10l2.5 0"/></g>`),
    chopperform: SVG(`<g ${F}><path d="M4 12c0-5 3.6-8 8-8s8 3 8 8l-2 8H6z"/></g><g fill="#000" fill-opacity=".35"><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><path d="M8 16h8l-1 2H9z"/></g><g ${S}><path d="M7 5 4 1.5M17 5l3-3.5"/></g>`),
    delphinium:  SVG(`<g ${F}><path d="M3 21v-6l1.5-1.5L6 15v6zM9 21v-9l1.5-1.5L12 12v9zM15 21V9l1.5-1.5L18 9v12z"/></g><g ${S}><path d="M2 21.5h20" opacity=".6"/></g>`),
    calendula:   SVG(`<g ${S}><circle cx="12" cy="12" r="3"/><path d="M12 9V3M15 12h6M12 15v6M9 12H3M14.1 9.9l4.2-4.2M14.1 14.1l4.2 4.2M9.9 14.1l-4.2 4.2M9.9 9.9 5.7 5.7"/></g>`),
    slap:        SVG(`<g ${F}><path d="M6 21c-1-3-2-6-2-9.5 0-1 1.5-1.2 1.8-.2L7 15V6c0-1.2 1.8-1.2 1.8 0v6V3.8c0-1.2 1.8-1.2 1.8 0V12V5c0-1.2 1.8-1.2 1.8 0v8l1.8-2.6c.7-1 2.2-.3 1.8.8L14 21z"/></g><g ${S}><path d="M18 5l3-2M19 9h3" opacity=".6"/></g>`),
    doble:       SVG(`<g ${F}><circle cx="8" cy="6" r="3"/><path d="M3 21c0-6 2-9 5-9s5 3 5 9z"/></g><g fill="currentColor" fill-opacity=".45"><circle cx="16" cy="6" r="3"/><path d="M11 21c0-6 2-9 5-9s5 3 5 9z"/></g>`),
    robinform:   SVG(`<g ${F}><path d="M12 7c-2-4-7-5-10-3 2 1 3 3 3 5 2 0 4 0 7-2zM12 7c2-4 7-5 10-3-2 1-3 3-3 5-2 0-4 0-7-2z"/><path d="M10 9h4l1 12h-6z"/></g>`)
});

// ---------- Técnicas ----------
// kind: bolt (proyectil que perfora), boomerang (va y vuelve), zone (área persistente que daña por golpes),
//       burst (impacto en área sobre el objetivo), cone (golpe en abanico frontal), aura (onda alrededor + escudo),
//       orbit (anillo que rodea al jugador, repele y bloquea balas), multi (varios golpes rápidos a objetivos al azar),
//       clone (copia que ataca sola). up: mejora por nivel (2-5). evo: arma + pasiva → evolución en cofre.
const CREW_TECH = {
    // ---- NAMI (Clima-Tact) ----
    gustsword: { char: 'nami', title: 'Gust Sword', kind: 'bolt', look: 'gust', sound: 'laser',
        desc: 'Ráfaga de viento a presión del Clima-Tact: atraviesa a todos en línea y los empuja.',
        sk: { baseDamage: 26, cooldown: 2.2, range: 340, speed: 640, w: 26, pierce: 99, push: 26, shots: 1 },
        up: s => { s.baseDamage += 9; s.range += 20; if (s.level === 4) s.shots++; },
        evo: { passive: 'speed', name: 'Milky Arrow', fx: s => { s.baseDamage *= 1.8; s.w += 10; s.shots++; } } },
    tornado: { char: 'nami', title: 'Tornado Tempo', kind: 'boomerang', look: 'tornado', sound: 'slash',
        desc: 'Lanza las piezas del Clima-Tact girando: van y vuelven cortando a todos a su paso.',
        sk: { baseDamage: 20, cooldown: 2.6, range: 230, speed: 420, w: 30, shots: 1 },
        up: s => { s.baseDamage += 7; s.w += 3; if (s.level === 3 || s.level === 5) s.shots++; },
        evo: { passive: 'area', name: 'Cyclone Tempo', fx: s => { s.baseDamage *= 1.7; s.w += 16; s.range += 60; } } },
    thunderbreed: { char: 'nami', title: 'Thunder Breed Tempo', kind: 'zone', look: 'cloud', sound: 'laser', target: 'dense',
        desc: 'Una nube de tormenta se posa sobre el grupo más denso y descarga rayos sin parar.',
        sk: { baseDamage: 14, cooldown: 5.0, r: 70, dur: 3.0, tick: 0.45, reach: 360, stun: 0 },
        up: s => { s.baseDamage += 5; s.r += 6; s.dur += 0.3; },
        evo: { passive: 'growth', name: 'Weather Egg', fx: s => { s.baseDamage *= 1.7; s.r += 25; s.stun = 0.25; } } },
    raintempo: { char: 'nami', title: 'Rain Tempo', kind: 'zone', look: 'rain', sound: 'laser', target: 'player',
        desc: 'Lluvia del Clima-Tact a su alrededor: frena a los enemigos cercanos y los cala.',
        sk: { baseDamage: 6, cooldown: 6.0, r: 105, dur: 4.0, tick: 0.5, slow: 0.55, reach: 0 },
        up: s => { s.baseDamage += 3; s.r += 10; s.dur += 0.4; },
        evo: { passive: 'luck', name: 'Fog Tempo: Mirage', fx: s => { s.baseDamage *= 1.8; s.r += 30; s.slow = 0.4; } } },
    // ---- USOPP (Kabuto) ----
    namari: { char: 'usopp', title: 'Hissatsu: Namari Boshi', kind: 'bolt', look: 'namari', sound: 'pistol',
        desc: 'Ráfaga de perdigones de plomo con el tirachinas al enemigo más cercano.',
        sk: { baseDamage: 24, cooldown: 0.8, range: 330, speed: 820, w: 14, pierce: 1, push: 0, shots: 1, spread: 0.12 },
        up: s => { s.baseDamage += 5; if (s.level === 3 || s.level === 5) s.shots++; },
        evo: { passive: 'cd', name: 'Midori Boshi: Platanus Shuriken', fx: s => { s.baseDamage *= 1.6; s.pierce = 3; s.shots += 2; s.spread = 0.22; } } },
    kaen: { char: 'usopp', title: 'Hissatsu: Kaen Boshi', kind: 'burst', look: 'kaen', sound: 'boom', target: 'random',
        desc: 'Estrella de fuego: estalla sobre un enemigo y deja el suelo en llamas.',
        sk: { baseDamage: 58, cooldown: 3.0, r: 66, delay: 0.25, reach: 340, fire: 1, fireDmg: 7, fireDur: 2.2 },
        up: s => { s.baseDamage += 14; s.r += 6; s.fireDmg += 2; },
        evo: { passive: 'area', name: 'Midori Boshi: Skull Bomb Grass', fx: s => { s.baseDamage *= 1.8; s.r += 25; s.fireDur += 1; } } },
    tabasco: { char: 'usopp', title: 'Hissatsu: Tabasco Boshi', kind: 'zone', look: 'tabasco', sound: 'pistol', target: 'nearest',
        desc: 'Bola de tabasco que revienta en una nube picante: los enemigos se paran a llorar.',
        sk: { baseDamage: 12, cooldown: 4.0, r: 66, dur: 2.2, tick: 0.5, slow: 0.35, reach: 320, stun: 0 },
        up: s => { s.baseDamage += 4; s.r += 6; s.dur += 0.25; },
        evo: { passive: 'magnet', name: 'Midori Boshi: Rafflesia', fx: s => { s.baseDamage *= 1.8; s.r += 22; s.stun = 0.35; } } },
    hinotori: { char: 'usopp', title: 'Hissatsu: Hi no Tori Boshi', kind: 'bolt', look: 'firebird', sound: 'boom',
        desc: 'El ave de fuego de Sogeking: cruza la arena atravesando a todos (la que quemó la bandera del Gobierno).',
        sk: { baseDamage: 75, cooldown: 4.5, range: 560, speed: 560, w: 34, pierce: 99, push: 0, shots: 1 },
        up: s => { s.baseDamage += 20; s.w += 3; },
        evo: { passive: 'power', name: 'Midori Boshi: Take Jabbu', fx: s => { s.baseDamage *= 1.8; s.w += 14; s.shots = 2; } } },
    // ---- CHOPPER (Roseo Mirror) ----
    heavygong: { char: 'chopper', title: 'Heavy Gong', kind: 'cone', look: 'gong', sound: 'kick',
        desc: 'Puñetazo en Heavy Point: golpea en abanico frente a Chopper y aparta a todos.',
        sk: { baseDamage: 40, cooldown: 1.8, r: 100, arc: 0.9, push: 45 },
        up: s => { s.baseDamage += 11; s.r += 8; },
        evo: { passive: 'maxhp', name: 'Arm Point: Kokutei Palm', fx: s => { s.baseDamage *= 1.8; s.r += 25; s.arc = 1.25; } } },
    kokuteicross: { char: 'chopper', title: 'Kokutei Cross', kind: 'burst', look: 'cross', sound: 'slash', target: 'random',
        desc: 'Arm Point: tajo doble en cruz con las pezuñas sobre un enemigo y sus vecinos.',
        sk: { baseDamage: 52, cooldown: 3.2, r: 62, delay: 0.15, reach: 300 },
        up: s => { s.baseDamage += 18; s.r += 6; },
        evo: { passive: 'crit', name: 'Brain Point: Scope', fx: s => { s.baseDamage *= 1.9; s.r += 20; s.cooldown *= 0.8; } } },
    guardpoint: { char: 'chopper', title: 'Guard Point', kind: 'aura', look: 'guard', sound: 'kick',
        desc: 'Se hincha como una bola de pelo: aparta a los cercanos y recibe menos daño unos segundos.',
        sk: { baseDamage: 14, cooldown: 7.0, r: 85, push: 60, shield: 1.6, shieldMult: 0.5 },
        up: s => { s.baseDamage += 6; s.r += 8; s.shield += 0.3; },
        evo: { passive: 'armor', name: 'Guard Point: Fluffy Fortress', fx: s => { s.baseDamage *= 1.8; s.r += 25; s.shieldMult = 0.45; } } },
    hornpoint: { char: 'chopper', title: 'Horn Point', kind: 'bolt', look: 'horn', sound: 'kick',
        desc: 'Embestida con las astas: atraviesa en línea recta a todos los que pilla.',
        sk: { baseDamage: 40, cooldown: 3.6, range: 260, speed: 620, w: 32, pierce: 99, push: 30, shots: 1 },
        up: s => { s.baseDamage += 14; s.range += 20; },
        evo: { passive: 'power', name: 'Horn Point: Kokutei Rosa', fx: s => { s.baseDamage *= 1.8; s.w += 14; s.shots = 2; } } },
    // ---- ROBIN (Clutch) ----
    delphinium: { char: 'robin', title: 'Cien Fleur: Delphinium', kind: 'bolt', look: 'delph', sound: 'slash',
        desc: 'Una hilera de brazos brota del suelo hacia el enemigo y golpea a todos los de la línea.',
        sk: { baseDamage: 26, cooldown: 2.4, range: 300, speed: 560, w: 26, pierce: 99, push: 0, stun: 0.3, shots: 1 },
        up: s => { s.baseDamage += 9; s.range += 20; },
        evo: { passive: 'growth', name: 'Mil Fleur: Campanula', fx: s => { s.baseDamage *= 1.8; s.w += 12; s.shots = 3; s.spread = 0.5; } } },
    calendula: { char: 'robin', title: 'Veinte Fleur: Calendula', kind: 'orbit', look: 'calendula', sound: 'slash',
        desc: 'Escudo de brazos que gira a su alrededor: bloquea balas y aparta a quien se acerca.',
        sk: { baseDamage: 10, cooldown: 6.0, r: 62, dur: 3.0, push: 26 },
        up: s => { s.baseDamage += 4; s.r += 5; s.dur += 0.4; },
        evo: { passive: 'armor', name: 'Cien Fleur: Calendula', fx: s => { s.baseDamage *= 1.8; s.r += 16; s.dur += 1.5; } } },
    slap: { char: 'robin', title: 'Seis Fleur: Slap', kind: 'multi', look: 'slap', sound: 'hit',
        desc: 'Manos que brotan junto a varios enemigos y los abofetean a la vez.',
        sk: { baseDamage: 15, cooldown: 1.3, targets: 3, reach: 280, r: 0 },
        up: s => { s.baseDamage += 5; if (s.level % 2) s.targets++; },
        evo: { passive: 'cd', name: 'Treinta Fleur: Slap', fx: s => { s.baseDamage *= 1.7; s.targets += 3; s.r = 34; } } },
    doble: { char: 'robin', title: 'Cuerpo Fleur: Doble', kind: 'clone', look: 'doble', sound: 'slash',
        desc: 'Robin crea un clon de pétalos que se queda luchando: agarra a los enemigos cercanos.',
        sk: { baseDamage: 20, cooldown: 7.0, dur: 4.5, rate: 0.6, reach: 170, hits: 1 },
        up: s => { s.baseDamage += 7; s.dur += 0.5; },
        evo: { passive: 'luck', name: 'Cuerpo Fleur: Demonio', fx: s => { s.baseDamage *= 1.7; s.hits = 3; s.dur += 2; } } }
};
const CREW_TECH_IDS = Object.keys(CREW_TECH);

// ---------- Transformaciones (tabla FORMS de js/gears.js) ----------
const CREW_FORMS = {
    nami: { card: 'namiform', meter: 'CLIMA', title: 'Clima-Tact (Nami)',
        desc: 'Llena el medidor y pulsa ESPACIO o el botón. Nv1: Sorcery Clima-Tact · Nv3: Mirage Tempo · Evolución: Zeus (si están desbloqueados).',
        evoName: 'Zeus', evoPassive: 'luck',
        forms: {
            // Sorcery Clima-Tact (Usopp lo rehace en Water 7): más rayos y más rápidos
            2: { name: 'SORCERY CLIMA-TACT', short: 'SC', color: '#f97316', dur: 8, sound: 'laser', dmg: 1.2, cd: 0.7, spd: 1.1, taken: 0.85 },
            // Mirage Tempo: Fata Morgana (Enies Lobby): espejismos, casi no la alcanzan
            3: { name: 'MIRAGE TEMPO: FATA MORGANA', short: 'MT', color: '#c084fc', dur: 9, sound: 'haoshoku', dmg: 1.55, cd: 0.8, spd: 1.15, taken: 0.45, atk: 'mirage', atkCd: 1.1 },
            // Zeus (Whole Cake / Wano): la nube de Big Mom ahora obedece a Nami
            4: { name: 'ZEUS BREEZE TEMPO', short: 'ZE', color: '#facc15', dur: 12, sound: 'boom', dmg: 1.7, cd: 0.7, spd: 1.2, taken: 0.6, atk: 'zeus', atkCd: 1.2, pen: ['exhausted', 6], penText: 'ZEUS SE CANSA... AGOTADA' }
        } },
    usopp: { card: 'usoppform', meter: 'SNIPER', title: 'Rey de los Francotiradores (Usopp)',
        desc: 'Llena el medidor y pulsa ESPACIO o el botón. Nv1: Sogeking · Nv3: Kenbunshoku · Evolución: God Usopp (si están desbloqueados).',
        evoName: 'God Usopp', evoPassive: 'crit',
        forms: {
            // Sogeking (Enies Lobby): el héroe de la Isla del Francotirador
            2: { name: 'SOGEKING', short: 'SK', color: '#eab308', dur: 8, sound: 'pistol', dmg: 1.25, cd: 0.7, spd: 1.1, taken: 0.85 },
            // Kenbunshoku (Dressrosa): ve a Sugar a kilómetros y no falla
            3: { name: 'KENBUNSHOKU: OJO DE HALCÓN', short: 'KB', color: '#22c55e', dur: 9, sound: 'haoshoku', dmg: 1.55, cd: 0.8, spd: 1.1, taken: 0.6, atk: 'snipe', atkCd: 0.9 },
            // God Usopp (Dressrosa): el disparo de 3 km; acaba echando espuma por la boca
            4: { name: 'GOD USOPP', short: 'GU', color: '#16a34a', dur: 12, sound: 'boom', dmg: 1.85, cd: 0.7, spd: 1.2, taken: 0.6, atk: 'godsnipe', atkCd: 1.1, pen: ['exhausted', 6], penText: 'USOPP SE DESMAYA... AGOTADO' }
        } },
    chopper: { card: 'chopperform', meter: 'RUMBLE', title: 'Rumble Ball (Chopper)',
        desc: 'Llena el medidor y pulsa ESPACIO o el botón. Nv1: Kung Fu Point · Nv3: Monster Point · Evolución: Monster Point dominado (si están desbloqueados).',
        evoName: 'Monster Point dominado', evoPassive: 'maxhp',
        forms: {
            // Kung Fu Point (Thriller Bark): ágil y veloz
            2: { name: 'KUNG FU POINT', short: 'KF', color: '#ec4899', dur: 8, sound: 'kick', dmg: 1.15, cd: 0.7, spd: 1.3, taken: 0.85 },
            // Monster Point (Enies Lobby): gigante y fuera de control; luego cae rendido
            3: { name: 'MONSTER POINT', short: 'MP', color: '#9a3412', dur: 9, sound: 'boom', dmg: 1.5, cd: 0.85, spd: 1, taken: 0.75, area: 1.3, atk: 'stomp', atkCd: 1.2, pen: ['exhausted', 4], penText: 'MONSTER POINT SE DESCONTROLA... AGOTADO' },
            // Tras los dos años controla el Monster Point durante 3 minutos (Punk Hazard / Onigashima)
            4: { name: 'MONSTER POINT: 3 MINUTOS', short: 'M3', color: '#be123c', dur: 12, sound: 'haoshoku', dmg: 1.7, cd: 0.7, spd: 1.15, taken: 0.65, area: 1.2, atk: 'monster', atkCd: 1.2, pen: ['exhausted', 6], penText: 'SE ACABAN LOS 3 MINUTOS... AGOTADO' }
        } },
    robin: { card: 'robinform', meter: 'HANA', title: 'Hana Hana no Mi (Robin)',
        desc: 'Llena el medidor y pulsa ESPACIO o el botón. Nv1: Cien Fleur Wing · Nv3: Gigante Fleur · Evolución: Demonio Fleur (si están desbloqueados).',
        evoName: 'Demonio Fleur', evoPassive: 'power',
        forms: {
            // Cien Fleur: Wing (Thriller Bark / Water 7): alas de brazos, vuela
            2: { name: 'CIEN FLEUR: WING', short: 'WI', color: '#a78bfa', dur: 8, sound: 'slash', dmg: 1.15, cd: 0.7, spd: 1.35, taken: 0.8 },
            // Gigante Fleur: brazos colosales que aplastan
            3: { name: 'GIGANTE FLEUR', short: 'GF', color: '#7c3aed', dur: 9, sound: 'boom', dmg: 1.6, cd: 0.8, spd: 1, taken: 0.7, area: 1.3, atk: 'gigante', atkCd: 1.2 },
            // Demonio Fleur (Onigashima): la forma de demonio contra Black Maria
            4: { name: 'DEMONIO FLEUR', short: 'DF', color: '#4c1d95', dur: 12, sound: 'haoshoku', dmg: 1.85, cd: 0.7, spd: 1.2, taken: 0.55, atk: 'demonio', atkCd: 1.2, pen: ['exhausted', 6], penText: 'DEMONIO FLEUR SE DESHACE... AGOTADA' }
        } }
};
const CREW_FORM_IDS = Object.values(CREW_FORMS).map(f => f.card);
const CREW_WEAPON_IDS = CREW_TECH_IDS.concat(CREW_FORM_IDS);

// ---------- Registro en las tablas del juego ----------
for (const c in CREW_FORMS) {
    const f = CREW_FORMS[c];
    CHAR_SKILLS[c].push(...CREW_TECH_IDS.filter(id => CREW_TECH[id].char === c), f.card);
    FORM_CARD[c] = f.card; FORM_METER[c] = f.meter; FORMS[c] = f.forms;
    EVOLUTIONS[f.card] = { passive: f.evoPassive, name: f.evoName };
    SHARED_EVO_FX[f.card] = () => {}; // desbloquea el tercer escalón
    const sk = { level: 0, evolved: false };
    skills[f.card] = sk; SKILL_DEFAULTS[f.card] = JSON.parse(JSON.stringify(sk));
    ARSENAL_UPGRADE[f.card] = () => { skills[f.card].level = Math.min(5, skills[f.card].level + 1); };
}
for (const id of CREW_TECH_IDS) {
    const t = CREW_TECH[id];
    const sk = Object.assign({ level: 0, timer: 0, evolved: false }, t.sk);
    skills[id] = sk; SKILL_DEFAULTS[id] = JSON.parse(JSON.stringify(sk));
    EVOLUTIONS[id] = { passive: t.evo.passive, name: t.evo.name };
    SHARED_EVO_FX[id] = t.evo.fx;
    ARSENAL_UPGRADE[id] = () => { const s = skills[id]; s.level = Math.min(5, s.level + 1); if (s.level > 1) t.up(s); };
}
// Evolución de la insignia de Chopper: «Monster Point» pasa a ser su transformación
EVOLUTIONS.roseo.name = 'Kokutei Roseo Mirror: Cerezos de Drum';
// Cartas (van al final de possibleUpgrades: el sorteo favorece a los primeros) y huecos del HUD
const CREW_UPGRADES = [];
const CREW_HUD = [];
const CREW_NAMES = {};
for (const c in CREW_FORMS) {
    const f = CREW_FORMS[c];
    CREW_UPGRADES.push({ id: f.card, type: 'weapon', chars: [c], title: f.title, icon: ICONS[f.card], desc: f.desc });
    CREW_HUD.push({ id: f.card, icon: ICONS[f.card], name: f.title.replace(/ \(.*\)$/, '') });
    CREW_NAMES[f.card] = f.title.replace(/ \(.*\)$/, '');
}
for (const id of CREW_TECH_IDS) {
    const t = CREW_TECH[id];
    CREW_UPGRADES.push({ id, type: 'weapon', chars: [t.char], title: t.title, icon: ICONS[id], desc: t.desc });
    CREW_HUD.push({ id, icon: ICONS[id], name: t.title.replace(/^Hissatsu: /, '') });
    CREW_NAMES[id] = t.title;
}
// Logros que desbloquean el 2.º y 3.er escalón (como Asura / Rey del Infierno de Zoro)
for (const c in CREW_FORMS) {
    const f = CREW_FORMS[c], n3 = f.forms[3].name, n4 = f.forms[4].name, nm = CHAR_ANIMS[c].name;
    ACHIEVEMENTS.push(
        { id: c + '_form3', name: n3.charAt(0) + n3.slice(1).toLowerCase(), desc: 'Conquista una isla con ' + nm + '. Desbloquea ' + n3 + '.', check: s => (s.winsByChar[c] || 0) >= 1, reward: 200, gear: 3, formChar: c, gearText: n3 },
        { id: c + '_form4', name: n4.charAt(0) + n4.slice(1).toLowerCase(), desc: 'Conquista una isla con ' + nm + ' en Clima Peligroso 2 o más. Desbloquea ' + n4 + '.', check: s => ((s.bestCurseBy || {})[c] ?? -1) >= 2, reward: 600, gear: 4, formChar: c, gearText: n4 }
    );
}
gearMetaInit();
ARSENAL_TYPES.add('crew');

// ---------- Utilidades ----------
const crewDur = d => d * (player.durationBonus || 1);
function crewDist(e) { return Math.hypot(e.x - player.x, e.y - player.y); }
function crewTarget(mode, reach) {
    let list = enemies.filter(e => !e.isProp && crewDist(e) < reach);
    if (!list.length) return null;
    if (mode === 'nearest') return list.reduce((a, b) => crewDist(a) < crewDist(b) ? a : b);
    if (mode === 'dense') {
        // el grupo más apretado (muestra de hasta 16 candidatos)
        if (list.length > 16) list = list.sort(() => Math.random() - 0.5).slice(0, 16);
        let best = list[0], bn = -1;
        for (const e of list) { let n = 0; forEnemiesNear(e.x, e.y, 80, () => n++); if (n > bn) { bn = n; best = e; } }
        return best;
    }
    return list[Math.floor(Math.random() * list.length)];
}
function crewAim() {
    const t = getNearestEnemy();
    return t ? Math.atan2(t.y - player.y, t.x - player.x) : (player.facing === 1 ? 0 : Math.PI);
}
function crewHit(atk, e, mult, push, stun) {
    arsenalHit(atk, e, mult);
    if (e.hp <= 0) return;
    if (push && !e.isBoss) {
        const ox = atk.ox ?? player.x, oy = atk.oy ?? player.y;
        const d = Math.hypot(e.x - ox, e.y - oy) || 1;
        const k = e.isMiniboss ? 0.3 : 1;
        e.x += (e.x - ox) / d * push * k; e.y += (e.y - oy) / d * push * k;
    }
    if (stun && !e.isBoss && !e.isMiniboss) e._stun = Math.max(e._stun || 0, stun);
}
// Escudo (Guard Point) multiplica el daño recibido
const _crewTakenBase = gearDamageTakenMult;
gearDamageTakenMult = function () { return _crewTakenBase() * (gameTime < (player._crewShieldUntil || 0) ? (player._crewShieldMult || 1) : 1); };

// ---------- Lanzamiento ----------
function crewFire(id, sk) {
    const t = CREW_TECH[id], ab = player.areaBonus, base = { type: 'crew', k: t.kind, look: t.look, id, baseDamage: sk.baseDamage, evo: sk.evolved };
    if (t.kind === 'bolt' || t.kind === 'boomerang') {
        const a0 = crewAim(), n = sk.shots || 1, sp = sk.spread || (t.kind === 'boomerang' ? 0.6 : 0.18);
        for (let k = 0; k < n; k++) {
            const a = a0 + (k - (n - 1) / 2) * sp;
            const life = t.kind === 'boomerang' ? 9 : (sk.range * ab) / sk.speed + 0.05;
            activeAttacks.push(Object.assign({}, base, { x: player.x, y: player.y, sx: player.x, sy: player.y, ang: a, vx: Math.cos(a) * sk.speed, vy: Math.sin(a) * sk.speed,
                dist: 0, max: sk.range * ab, w: sk.w * (t.kind === 'boomerang' ? ab : Math.sqrt(ab)), pierce: sk.pierce || 99, push: sk.push || 0, stun: sk.stun || 0,
                hit: new Set(), hitCd: new Map(), back: false, life, maxLife: life, spin: 0 }));
        }
        return true;
    }
    if (t.kind === 'zone' || t.kind === 'burst') {
        let x = player.x, y = player.y;
        if (t.target !== 'player') { const e = crewTarget(t.target, sk.reach); if (!e) return false; x = e.x; y = e.y; }
        if (t.kind === 'zone') {
            const life = crewDur(sk.dur);
            activeAttacks.push(Object.assign({}, base, { x, y, ox: x, oy: y, r: sk.r * ab, life, maxLife: life, tick: sk.tick, tt: 0.05, slow: sk.slow || 0, stun: sk.stun || 0, follow: t.target === 'player' }));
        } else {
            activeAttacks.push(Object.assign({}, base, { x, y, ox: x, oy: y, r: sk.r * ab, life: sk.delay + 0.3, maxLife: sk.delay + 0.3, delay: sk.delay, done: false, push: 25,
                fire: sk.fire ? { dmg: sk.fireDmg, dur: crewDur(sk.fireDur) } : null }));
        }
        return true;
    }
    if (t.kind === 'cone') {
        const e = crewTarget('nearest', sk.r * ab + 30);
        if (!e) return false;
        const a = Math.atan2(e.y - player.y, e.x - player.x);
        activeAttacks.push(Object.assign({}, base, { x: player.x, y: player.y, ang: a, r: sk.r * ab, arc: sk.arc, push: sk.push, life: 0.3, maxLife: 0.3, done: false }));
        return true;
    }
    if (t.kind === 'aura') {
        let near = 0; forEnemiesNear(player.x, player.y, sk.r * ab, e => { if (!e.isProp) near++; });
        if (!near) return false;
        player._crewShieldUntil = gameTime + crewDur(sk.shield); player._crewShieldMult = sk.shieldMult;
        activeAttacks.push(Object.assign({}, base, { x: player.x, y: player.y, r: sk.r * ab, push: sk.push, life: Math.max(0.45, crewDur(sk.shield)), maxLife: Math.max(0.45, crewDur(sk.shield)), done: false }));
        return true;
    }
    if (t.kind === 'orbit') {
        const life = crewDur(sk.dur);
        activeAttacks.push(Object.assign({}, base, { x: player.x, y: player.y, r: sk.r * ab, push: sk.push, life, maxLife: life, hitCd: new Map(), spin: 0 }));
        return true;
    }
    if (t.kind === 'multi') {
        const list = enemies.filter(e => !e.isProp && crewDist(e) < sk.reach * Math.sqrt(ab)).sort(() => Math.random() - 0.5).slice(0, sk.targets);
        if (!list.length) return false;
        for (const e of list) activeAttacks.push(Object.assign({}, base, { k: 'burst', x: e.x, y: e.y, ox: e.x, oy: e.y, target: e, r: sk.r * ab, life: 0.38, maxLife: 0.38, delay: 0.12, done: false, push: 10, single: !sk.r, flip: Math.random() < 0.5 }));
        return true;
    }
    if (t.kind === 'clone') {
        const life = crewDur(sk.dur);
        activeAttacks.push(Object.assign({}, base, { x: player.x - player.facing * 30, y: player.y + 4, life, maxLife: life, rate: sk.rate, tt: 0.2, reach: sk.reach * Math.sqrt(ab), hits: sk.hits, arms: [] }));
        return true;
    }
    return false;
}

function handleCrew(dt, cdMult) {
    const own = CHAR_SKILLS[selectedCharacter];
    for (const id of CREW_TECH_IDS) {
        const sk = skills[id];
        if (sk.level <= 0 || !own.includes(id)) continue;
        sk.timer += dt;
        if (sk.timer >= sk.cooldown * cdMult) {
            if (crewFire(id, sk)) {
                sk.timer = 0; player.attackTimer = 0.25;
                playSound(CREW_TECH[id].sound);
            } else sk.timer = sk.cooldown * cdMult * 0.85; // sin objetivo: reintenta en un momento
        }
    }
}

// ---------- Actualización ----------
function updateCrewAttack(atk, dt) {
    const k = atk.k;
    if (k === 'bolt' || k === 'boomerang') {
        atk.spin += dt * 14;
        if (k === 'boomerang' && atk.back) {
            const dx = player.x - atk.x, dy = player.y - atk.y, d = Math.hypot(dx, dy) || 1;
            const sp = Math.hypot(atk.vx, atk.vy);
            atk.vx = dx / d * sp; atk.vy = dy / d * sp;
            if (d < 20) return true;
        }
        atk.x += atk.vx * dt; atk.y += atk.vy * dt;
        atk.dist += Math.hypot(atk.vx, atk.vy) * dt;
        if (k === 'boomerang' && !atk.back && atk.dist >= atk.max) { atk.back = true; atk.vx *= 1.15; atk.vy *= 1.15; }
        let stop = false;
        forEnemiesNear(atk.x, atk.y, atk.w, e => {
            if (stop || e.isProp && k === 'boomerang') return;
            if (k === 'boomerang') {
                const last = atk.hitCd.get(e) || -9;
                if (gameTime - last < 0.35) return;
                atk.hitCd.set(e, gameTime);
                crewHit(atk, e, 1, 0, 0);
                return;
            }
            if (atk.hit.has(e)) return;
            atk.hit.add(e);
            atk.ox = atk.x - atk.vx; atk.oy = atk.y - atk.vy;
            crewHit(atk, e, 1, atk.push, atk.stun);
            if (--atk.pierce <= 0) stop = true;
        });
        if (k === 'bolt' && (stop || atk.dist >= atk.max)) return true;
        return atk.life <= 0;
    }
    if (k === 'zone') {
        if (atk.follow) { atk.x = player.x; atk.y = player.y; atk.ox = atk.x; atk.oy = atk.y; }
        atk.tt -= dt;
        if (atk.tt <= 0) {
            atk.tt = atk.tick;
            forEnemiesNear(atk.x, atk.y, atk.r, e => {
                if (e.isProp) return;
                if (atk.slow) { e._slowT = gameTime + 0.6; e._slowM = atk.slow; }
                crewHit(atk, e, 1, 0, atk.stun);
            });
            if (atk.look === 'cloud') atk.flash = 0.15;
        }
        if (atk.flash) atk.flash = Math.max(0, atk.flash - dt);
        return atk.life <= 0;
    }
    if (k === 'burst') {
        if (atk.target && !atk.done && atk.target.hp > 0) { atk.x = atk.target.x; atk.y = atk.target.y; atk.ox = atk.x; atk.oy = atk.y + 1; }
        if (!atk.done && atk.maxLife - atk.life >= atk.delay) {
            atk.done = true;
            if (atk.single) { if (atk.target && atk.target.hp > 0) crewHit(atk, atk.target, 1, atk.push, 0.15); }
            else forEnemiesNear(atk.x, atk.y, atk.r, e => { if (!e.isProp || atk.look === 'kaen') crewHit(atk, e, 1, atk.push, 0); });
            if (atk.look === 'kaen') { fxSpark(atk.x, atk.y, '#fb923c', 10, 180, 0.4, 3, 40); cameraShake = Math.max(cameraShake, 0.8); }
            if (atk.fire) activeAttacks.push({ type: 'crew', k: 'zone', look: 'fire', id: atk.id, x: atk.x, y: atk.y, ox: atk.x, oy: atk.y, r: atk.r * 0.85,
                baseDamage: atk.fire.dmg, life: atk.fire.dur, maxLife: atk.fire.dur, tick: 0.4, tt: 0.4, slow: 0, stun: 0, evo: atk.evo });
        }
        return atk.life <= 0;
    }
    if (k === 'cone') {
        if (!atk.done) {
            atk.done = true;
            forEnemiesNear(player.x, player.y, atk.r, e => {
                let d = Math.abs(Math.atan2(e.y - player.y, e.x - player.x) - atk.ang);
                if (d > Math.PI) d = Math.PI * 2 - d;
                if (d < atk.arc) crewHit(atk, e, 1, atk.push, 0);
            });
        }
        atk.x = player.x; atk.y = player.y;
        return atk.life <= 0;
    }
    if (k === 'aura') {
        atk.x = player.x; atk.y = player.y; atk.ox = atk.x; atk.oy = atk.y;
        if (!atk.done) { atk.done = true; forEnemiesNear(atk.x, atk.y, atk.r, e => crewHit(atk, e, 1, atk.push, 0)); }
        return atk.life <= 0;
    }
    if (k === 'orbit') {
        atk.x = player.x; atk.y = player.y; atk.ox = atk.x; atk.oy = atk.y; atk.spin += dt * 4;
        forEnemiesNear(atk.x, atk.y, atk.r, e => {
            if (e.isProp) return;
            const last = atk.hitCd.get(e) || -9;
            if (gameTime - last < 0.5) return;
            atk.hitCd.set(e, gameTime);
            crewHit(atk, e, 1, atk.push, 0);
        });
        // los brazos atrapan las balas
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            if (Math.hypot(b.x - atk.x, b.y - atk.y) < atk.r) { fxSpark(b.x, b.y, '#f2c39a', 4, 80, 0.25, 2, 0); enemyBullets.splice(i, 1); }
        }
        return atk.life <= 0;
    }
    if (k === 'clone') {
        atk.tt -= dt;
        for (const a of atk.arms) a.life -= dt;
        atk.arms = atk.arms.filter(a => a.life > 0);
        if (atk.tt <= 0) {
            atk.tt = atk.rate;
            const list = enemies.filter(e => !e.isProp && Math.hypot(e.x - atk.x, e.y - atk.y) < atk.reach)
                .sort((a, b) => Math.hypot(a.x - atk.x, a.y - atk.y) - Math.hypot(b.x - atk.x, b.y - atk.y)).slice(0, atk.hits);
            for (const e of list) { atk.arms.push({ x: e.x, y: e.y, life: 0.25 }); atk.ox = atk.x; atk.oy = atk.y; crewHit(atk, e, 1, 0, 0.4); }
        }
        return atk.life <= 0;
    }
    return true;
}

// ---------- Ataques de las transformaciones ----------
function crewThunder(x, y, r, dmg, evo) {
    activeAttacks.push({ type: 'thunder', x, y, radius: r, life: 0.35, maxLife: 0.35, baseDamage: dmg, done: false, evo });
}
Object.assign(GEAR_ATTACKS, {
    // Nami · Mirage Tempo: rayos desde los espejismos sobre los tres más cercanos
    mirage() {
        const list = enemies.filter(e => !e.isProp && crewDist(e) < 320).sort((a, b) => crewDist(a) - crewDist(b)).slice(0, 3);
        if (!list.length) { gearState.atkTimer = 0.3; return; }
        for (const e of list) crewThunder(e.x, e.y, 40 * player.areaBonus, 55 + 12 * gearCardLevel(), false);
        playSound('laser');
    },
    // Nami · Zeus: rayo gigante sobre el grupo más denso
    zeus() {
        const t = crewTarget('dense', 420); if (!t) { gearState.atkTimer = 0.3; return; }
        const r = 140 * player.areaBonus;
        crewThunder(t.x, t.y, r * 0.5, 0, true);
        gearState.fx.push({ kind: 'wave', x: t.x, y: t.y, r, color: '#facc15', life: 0.5, max: 0.5 });
        gearHitArea(t.x, t.y, r, 170, 50);
        playSound('boom'); cameraShake = Math.max(cameraShake, 2.2);
    },
    // Usopp · Kenbunshoku: disparo certero al enemigo más fuerte a la vista
    snipe() {
        const list = enemies.filter(e => !e.isProp && crewDist(e) < 560);
        if (!list.length) { gearState.atkTimer = 0.3; return; }
        const t = list.reduce((a, b) => (b.hp > a.hp ? b : a));
        const r = 55 * player.areaBonus;
        gearState.fx.push({ kind: 'fist', x0: player.x, y0: player.y, x: t.x, y: t.y, r: 7, color: '#22c55e', life: 0.25, max: 0.25 });
        gearState.fx.push({ kind: 'wave', x: t.x, y: t.y, r, color: '#86efac', life: 0.35, max: 0.35 });
        gearHitArea(t.x, t.y, r, 75 + 15 * gearCardLevel(), 20);
        playSound('pistol');
    },
    // Usopp · God Usopp: disparo que cruza la pantalla y aturde
    godsnipe() {
        const t = gearTarget(); if (!t) { gearState.atkTimer = 0.3; return; }
        const a = Math.atan2(t.y - player.y, t.x - player.x), L = 620, w = 40 * player.areaBonus;
        const x1 = player.x + Math.cos(a) * L, y1 = player.y + Math.sin(a) * L;
        gearState.fx.push({ kind: 'fist', x0: player.x, y0: player.y, x: x1, y: y1, r: 10, color: '#16a34a', life: 0.35, max: 0.35 });
        for (let s = 0; s <= L; s += w) forEnemiesNear(player.x + Math.cos(a) * s, player.y + Math.sin(a) * s, w, e => {
            if (e._gs === gameTime) return; e._gs = gameTime;
            const di = calculateDamage(170); e.hp -= di.amount * e.damageTaken; spawnDamageText(e.x, e.y, di);
            if (!e.isBoss && !e.isMiniboss) e._stun = Math.max(e._stun || 0, 1);
            if (e.hp <= 0) killEnemy(e);
        });
        playSound('boom'); cameraShake = Math.max(cameraShake, 2);
    },
    // Chopper · Monster Point: pisotón a su alrededor
    stomp() {
        const r = 115 * player.areaBonus;
        gearState.fx.push({ kind: 'wave', x: player.x, y: player.y, r, color: '#9a3412', life: 0.45, max: 0.45 });
        gearHitArea(player.x, player.y, r, 75 + 15 * gearCardLevel(), 70);
        playSound('boom'); cameraShake = Math.max(cameraShake, 1.6);
    },
    // Chopper · Monster Point dominado: zarpazo colosal sobre el objetivo
    monster() {
        const t = gearTarget(); if (!t) { gearState.atkTimer = 0.3; return; }
        const r = 140 * player.areaBonus;
        gearState.fx.push({ kind: 'slashes', x: t.x, y: t.y, r, n: 3, rot: Math.atan2(t.y - player.y, t.x - player.x) + Math.PI / 2, color: '#be123c', life: 0.45, max: 0.45 });
        gearState.fx.push({ kind: 'wave', x: t.x, y: t.y, r, color: '#7f1d1d', life: 0.5, max: 0.5 });
        gearHitArea(t.x, t.y, r, 170, 90);
        playSound('boom'); cameraShake = Math.max(cameraShake, 2.2);
    },
    // Robin · Gigante Fleur: una mano gigante aplasta al objetivo y a sus vecinos
    gigante() {
        const t = gearTarget(); if (!t) { gearState.atkTimer = 0.3; return; }
        const r = 105 * player.areaBonus;
        gearState.fx.push({ kind: 'hand', x: t.x, y: t.y, r, life: 0.45, max: 0.45 });
        forEnemiesNear(t.x, t.y, r, e => { if (!e.isBoss && !e.isMiniboss) e._stun = Math.max(e._stun || 0, 0.8); });
        gearHitArea(t.x, t.y, r, 75 + 15 * gearCardLevel(), 0);
        playSound('boom'); cameraShake = Math.max(cameraShake, 1.6);
    },
    // Robin · Demonio Fleur: brazos de demonio que estrujan todo a su alrededor
    demonio() {
        const r = 160 * player.areaBonus;
        gearState.fx.push({ kind: 'demonarms', x: player.x, y: player.y, r, life: 0.5, max: 0.5 });
        forEnemiesNear(player.x, player.y, r, e => { if (!e.isBoss && !e.isMiniboss) e._stun = Math.max(e._stun || 0, 1); });
        gearHitArea(player.x, player.y, r, 160, 0);
        playSound('haoshoku'); cameraShake = Math.max(cameraShake, 2);
    }
});

// ---------- Ganchos sobre arsenal.js y gears.js ----------
const _crewHandleArsenal = handleArsenal;
handleArsenal = function (dt, cdMult) { _crewHandleArsenal(dt, cdMult); handleCrew(dt, cdMult); };
const _crewUpdateArsenal = updateArsenalAttack;
updateArsenalAttack = function (atk, dt) { return atk.type === 'crew' ? updateCrewAttack(atk, dt) : _crewUpdateArsenal(atk, dt); };
const _crewDrawArsenal = drawArsenalFX;
drawArsenalFX = function (atk) { if (atk.type === 'crew') { drawCrewFX(atk); return true; } return _crewDrawArsenal(atk); };

const _crewSpriteTransform = gearSpriteTransform;
gearSpriteTransform = function (ctx) {
    const c = gearChar();
    if (!CREW_FORMS[c]) return _crewSpriteTransform(ctx);
    const g = gearState.active, t = performance.now() / 1000;
    if (c === 'chopper' && g >= 3) { ctx.translate(0, -10); ctx.scale(1.55, 1.55); if (g === 3) ctx.filter = 'brightness(0.8) sepia(0.4)'; }
    else if (c === 'chopper' && g === 2) ctx.scale(0.95, 1.1);
    else if (c === 'robin' && g === 2) ctx.translate(0, -10 + Math.sin(t * 5) * 3); // vuela con las alas de brazos
    else if (c === 'nami' && g === 4) ctx.filter = 'brightness(1.15) saturate(1.3)';
    else if (c === 'usopp' && g === 4) ctx.filter = 'saturate(1.4) brightness(1.1)';
    if (gearState.penalty === 'exhausted') ctx.filter = 'grayscale(0.6) brightness(0.85)';
};
const _crewSpriteAlpha = gearSpriteAlpha;
gearSpriteAlpha = function () {
    if (gearChar() === 'nami' && gearState.active === 3) return 0.45 + 0.25 * Math.sin(performance.now() / 70);
    return _crewSpriteAlpha();
};
const _crewDrawAura = gearDrawAura;
gearDrawAura = function (ctx) {
    const c = gearChar(), g = gearState.active;
    _crewDrawAura(ctx);
    if (!g || !CREW_FORMS[c]) return;
    const t = performance.now() / 1000;
    ctx.save();
    if (c === 'robin' && g === 2) {
        // alas hechas de brazos
        ctx.strokeStyle = '#f2c39a'; ctx.lineWidth = 3; ctx.globalAlpha = 0.9;
        for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
            const a = -0.4 - k * 0.28 + Math.sin(t * 8) * 0.12;
            ctx.beginPath(); ctx.moveTo(s * 6, -6); ctx.lineTo(s * Math.cos(a) * (26 + k * 3), -6 + Math.sin(a) * (26 + k * 3)); ctx.stroke();
        }
    } else if (c === 'nami' && g === 3) {
        // espejismos a los lados
        const set = CHAR_IMG.nami, img = set && set.idle && set.idle[0];
        if (img && img.complete && img.width) {
            const ph = 48, pw = ph * img.width / img.height;
            ctx.globalAlpha = 0.3;
            for (const s of [-1, 1]) ctx.drawImage(img, s * (34 + Math.sin(t * 3) * 6) - pw / 2, -ph / 2, pw, ph);
        }
    } else if (c === 'nami' && g === 4) {
        // Zeus: nube con cara sobre su cabeza
        ctx.globalAlpha = 0.9; ctx.fillStyle = '#e2e8f0';
        ctx.beginPath(); ctx.arc(-8, -40, 9, 0, Math.PI * 2); ctx.arc(4, -44, 11, 0, Math.PI * 2); ctx.arc(14, -38, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0f172a'; ctx.fillRect(-1, -45, 2, 3); ctx.fillRect(7, -45, 2, 3);
        if (Math.sin(t * 13) > 0.7) { ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -32); ctx.lineTo(0, -24); ctx.lineTo(6, -22); ctx.lineTo(2, -14); ctx.stroke(); }
    } else if (c === 'robin' && g === 4) {
        ctx.globalAlpha = 0.5 + 0.15 * Math.sin(t * 6); ctx.fillStyle = '#1e1b4b';
        ctx.beginPath(); ctx.moveTo(-18, -20); ctx.lineTo(-30, -48); ctx.lineTo(-8, -26); ctx.moveTo(18, -20); ctx.lineTo(30, -48); ctx.lineTo(8, -26); ctx.fill(); // cuernos/alas de demonio
    }
    ctx.restore();
};
const _crewDrawWorld = gearDrawWorld;
gearDrawWorld = function (ctx) {
    _crewDrawWorld(ctx);
    for (const f of gearState.fx) {
        if (f.kind !== 'hand' && f.kind !== 'demonarms') continue;
        const a = Math.max(0, f.life / f.max), p = 1 - a;
        ctx.save();
        if (f.kind === 'hand') {
            // mano gigante que cae desde arriba y aplasta
            const y = f.y - (1 - Math.min(1, p * 3)) * 120;
            ctx.globalAlpha = Math.min(1, a * 2);
            ctx.fillStyle = '#f2c39a'; ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(f.x, y, f.r * 0.55, f.r * 0.38, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(f.x - f.r * 0.36 + k * f.r * 0.24, y - f.r * 0.45, f.r * 0.09, f.r * 0.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
            if (p > 0.33) { ctx.globalAlpha = a * 0.6; ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.6 + p * 0.5), 0, Math.PI * 2); ctx.stroke(); }
        } else {
            ctx.globalAlpha = a; ctx.lineCap = 'round';
            for (let k = 0; k < 10; k++) {
                const ang = k / 10 * Math.PI * 2 + p, R = f.r * (0.4 + 0.6 * Math.min(1, p * 2.5));
                ctx.strokeStyle = '#1e1b4b'; ctx.lineWidth = 9;
                ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(ang) * R, f.y + Math.sin(ang) * R * 0.7); ctx.stroke();
                ctx.strokeStyle = '#6d28d9'; ctx.lineWidth = 5;
                ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(ang) * R, f.y + Math.sin(ang) * R * 0.7); ctx.stroke();
            }
        }
        ctx.restore();
    }
};

// ---------- Dibujo ----------
function crewArm(x0, y0, x1, y1, w) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = w + 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = '#f2c39a'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.fillStyle = '#f2c39a'; ctx.beginPath(); ctx.arc(x1, y1, w * 0.8, 0, Math.PI * 2); ctx.fill();
}
function drawCrewFX(atk) {
    const p = atk.maxLife ? Math.min(1, Math.max(0, 1 - atk.life / atk.maxLife)) : 0, a = 1 - p;
    ctx.save();
    switch (atk.look) {
        case 'gust': {
            ctx.translate(atk.x, atk.y); ctx.rotate(atk.ang);
            ctx.globalAlpha = 0.85; ctx.strokeStyle = atk.evo ? '#bae6fd' : '#e0f2fe'; ctx.lineWidth = 3;
            for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(-atk.w * 0.6, k * 6, atk.w * 0.9, -0.7, 0.7); ctx.stroke(); }
            ctx.globalAlpha = 0.35; ctx.fillStyle = atk.evo ? '#f0abfc' : '#7dd3fc';
            ctx.beginPath(); ctx.ellipse(-8, 0, atk.w * 1.1, atk.w * 0.5, 0, 0, Math.PI * 2); ctx.fill();
            break;
        }
        case 'tornado': {
            ctx.translate(atk.x, atk.y);
            ctx.globalAlpha = 0.35; ctx.fillStyle = atk.evo ? '#a5f3fc' : '#e0f2fe';
            ctx.beginPath(); ctx.arc(0, 0, atk.w, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1; ctx.rotate(atk.spin);
            ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke();
            ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2;
            for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, 0, atk.w * (0.45 + k * 0.2), k, k + 2); ctx.stroke(); }
            break;
        }
        case 'cloud': case 'rain': case 'fire': case 'tabasco': {
            const fade = Math.min(1, atk.life * 3, (atk.maxLife - atk.life) * 6);
            if (atk.look === 'cloud') {
                ctx.globalAlpha = 0.3 * fade; ctx.fillStyle = '#1e293b';
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 4, atk.r, atk.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.85 * fade; ctx.fillStyle = atk.evo ? '#475569' : '#334155';
                for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(atk.x - atk.r * 0.5 + k * atk.r * 0.25, atk.y - 70 + Math.sin(k * 2 + gameTime) * 4, atk.r * 0.28, 0, Math.PI * 2); ctx.fill(); }
                if (atk.flash) {
                    ctx.globalAlpha = 1; ctx.strokeStyle = atk.evo ? '#fde047' : '#e0f2fe'; ctx.lineWidth = 3;
                    for (let b = 0; b < 2; b++) {
                        const bx = atk.x + (Math.random() - 0.5) * atk.r * 1.2, by = atk.y + (Math.random() - 0.5) * atk.r * 0.8;
                        ctx.beginPath(); ctx.moveTo(bx, atk.y - 66);
                        for (let s = 1; s <= 4; s++) ctx.lineTo(bx + (Math.random() - 0.5) * 16, atk.y - 66 + (by - atk.y + 66) * s / 4);
                        ctx.stroke();
                    }
                }
            } else if (atk.look === 'rain') {
                ctx.globalAlpha = 0.18 * fade; ctx.fillStyle = '#38bdf8';
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 6, atk.r, atk.r * 0.65, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.7 * fade; ctx.strokeStyle = atk.evo ? '#e2e8f0' : '#7dd3fc'; ctx.lineWidth = 1.5;
                for (let k = 0; k < 18; k++) {
                    const ang = k * 2.39996, rr = atk.r * Math.sqrt(((k * 37) % 18) / 18);
                    const dx = Math.cos(ang) * rr, dy = Math.sin(ang) * rr * 0.65, ph = ((gameTime * 3 + k * 0.37) % 1);
                    ctx.beginPath(); ctx.moveTo(atk.x + dx, atk.y + dy - 30 + ph * 30); ctx.lineTo(atk.x + dx - 2, atk.y + dy - 22 + ph * 30); ctx.stroke();
                }
            } else if (atk.look === 'fire') {
                ctx.globalAlpha = 0.3 * fade; ctx.fillStyle = atk.evo ? '#16a34a' : '#ea580c';
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y, atk.r, atk.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
                if (typeof fxFlames === 'function' && Math.random() < 0.35) fxFlames(atk.x + (Math.random() - 0.5) * atk.r * 1.4, atk.y + (Math.random() - 0.5) * atk.r * 0.8, 1, 2, 30, 3);
            } else {
                ctx.globalAlpha = 0.45 * fade; ctx.fillStyle = atk.evo ? '#a3e635' : '#dc2626';
                for (let k = 0; k < 6; k++) { const ang = k + gameTime * 0.8; ctx.beginPath(); ctx.arc(atk.x + Math.cos(ang) * atk.r * 0.45, atk.y + Math.sin(ang) * atk.r * 0.3, atk.r * 0.42, 0, Math.PI * 2); ctx.fill(); }
            }
            break;
        }
        case 'kaen': case 'cross': case 'slap': {
            const before = (atk.maxLife - atk.life) < atk.delay;
            if (atk.look === 'kaen') {
                if (before) { ctx.fillStyle = '#ea580c'; ctx.beginPath(); ctx.arc(atk.x, atk.y - 20 * a, 6, 0, Math.PI * 2); ctx.fill(); }
                else { ctx.globalAlpha = a; const g = ctx.createRadialGradient(atk.x, atk.y, 2, atk.x, atk.y, atk.r); g.addColorStop(0, '#fef08a'); g.addColorStop(0.5, atk.evo ? 'rgba(22,163,74,0.7)' : 'rgba(234,88,12,0.7)'); g.addColorStop(1, 'rgba(234,88,12,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(atk.x, atk.y, atk.r, 0, Math.PI * 2); ctx.fill(); }
            } else if (atk.look === 'cross') {
                ctx.globalAlpha = a; ctx.lineCap = 'round';
                const L = atk.r * Math.min(1, p * 3);
                ctx.strokeStyle = atk.evo ? '#f472b6' : '#fbcfe8'; ctx.lineWidth = 7;
                ctx.beginPath(); ctx.moveTo(atk.x - L, atk.y - L * 0.7); ctx.lineTo(atk.x + L, atk.y + L * 0.7); ctx.moveTo(atk.x + L, atk.y - L * 0.7); ctx.lineTo(atk.x - L, atk.y + L * 0.7); ctx.stroke();
                ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 2; ctx.stroke();
            } else {
                // Slap: brazo que brota junto al enemigo y le da un bofetón
                ctx.globalAlpha = Math.min(1, a * 2);
                const s = atk.flip ? 1 : -1, sw = Math.sin(Math.min(1, p * 2.5) * Math.PI);
                crewArm(atk.x + s * 22, atk.y + 12, atk.x + s * (16 - 14 * sw), atk.y - 8, 4);
                if (atk.r) { ctx.globalAlpha = a * 0.5; ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(atk.x, atk.y, atk.r, 0, Math.PI * 2); ctx.stroke(); }
                ctx.fillStyle = '#f9a8d4'; ctx.globalAlpha = a;
                for (let k = 0; k < 3; k++) ctx.fillRect(atk.x + Math.cos(k * 2 + p * 4) * 14, atk.y - 14 + Math.sin(k * 2 + p * 4) * 8, 3, 3);
            }
            break;
        }
        case 'namari': {
            ctx.fillStyle = atk.evo ? '#22c55e' : '#52525b'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
            if (atk.evo) { ctx.translate(atk.x, atk.y); ctx.rotate(atk.spin); ctx.beginPath(); for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2; ctx.lineTo(Math.cos(an) * 8, Math.sin(an) * 8); ctx.lineTo(Math.cos(an + 0.78) * 3, Math.sin(an + 0.78) * 3); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
            else { ctx.beginPath(); ctx.arc(atk.x, atk.y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
            break;
        }
        case 'firebird': {
            ctx.translate(atk.x, atk.y); ctx.rotate(atk.ang);
            const fl = Math.sin(atk.spin) * 0.4, W = atk.w;
            ctx.globalAlpha = 0.4; ctx.fillStyle = '#f97316';
            ctx.beginPath(); ctx.ellipse(-W * 0.6, 0, W * 1.2, W * 0.45, 0, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1; ctx.fillStyle = atk.evo ? '#84cc16' : '#ef4444'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(W * 0.7, 0); ctx.lineTo(0, -W * (0.9 + fl)); ctx.lineTo(-W * 0.3, -4); ctx.lineTo(-W * 1.2, 0); ctx.lineTo(-W * 0.3, 4); ctx.lineTo(0, W * (0.9 - fl)); ctx.closePath(); ctx.fill(); ctx.stroke();
            break;
        }
        case 'horn': {
            ctx.translate(atk.x, atk.y); ctx.rotate(atk.ang);
            ctx.globalAlpha = 0.35; ctx.fillStyle = '#f9a8d4';
            ctx.beginPath(); ctx.ellipse(-atk.w * 0.7, 0, atk.w * 1.2, atk.w * 0.6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1; ctx.strokeStyle = atk.evo ? '#be123c' : '#78350f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
            for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-6, s * 4); ctx.lineTo(10, s * 12); ctx.lineTo(18, s * 6); ctx.moveTo(10, s * 12); ctx.lineTo(16, s * 20); ctx.stroke(); }
            break;
        }
        case 'delph': {
            // brazos que brotan del suelo a lo largo del recorrido
            const step = 22, n = Math.floor(atk.dist / step);
            for (let k = Math.max(0, n - 10); k <= n; k++) {
                const d = k * step, age = (atk.dist - d) / 240;
                if (age > 0.6) continue;
                const x = atk.sx + Math.cos(atk.ang) * d + (k % 2 ? 7 : -7) * Math.sin(atk.ang), y = atk.sy + Math.sin(atk.ang) * d - (k % 2 ? 7 : -7) * Math.cos(atk.ang);
                const h = 18 * Math.sin(Math.min(1, age / 0.6) * Math.PI);
                ctx.globalAlpha = 1 - age / 0.6;
                crewArm(x, y + 6, x + (k % 2 ? 2 : -2), y + 6 - h, 4);
            }
            if (atk.evo) { ctx.globalAlpha = 0.6; ctx.fillStyle = '#c4b5fd'; ctx.beginPath(); ctx.arc(atk.x, atk.y, 5, 0, Math.PI * 2); ctx.fill(); }
            break;
        }
        case 'gong': {
            ctx.translate(atk.x, atk.y);
            ctx.globalAlpha = 0.8 * a; ctx.strokeStyle = atk.evo ? '#f472b6' : '#a16207'; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(0, 0, atk.r * (0.4 + 0.6 * p), atk.ang - atk.arc, atk.ang + atk.arc); ctx.stroke();
            ctx.globalAlpha = 0.25 * a; ctx.fillStyle = atk.evo ? '#fbcfe8' : '#fde68a';
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, atk.r * (0.4 + 0.6 * p), atk.ang - atk.arc, atk.ang + atk.arc); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = a; ctx.fillStyle = '#78350f';
            ctx.beginPath(); ctx.arc(Math.cos(atk.ang) * 22, Math.sin(atk.ang) * 22, 9, 0, Math.PI * 2); ctx.fill();
            break;
        }
        case 'guard': {
            const pop = Math.min(1, p * 6);
            ctx.globalAlpha = 0.55 * Math.min(1, atk.life * 2); ctx.fillStyle = atk.evo ? '#fbcfe8' : '#d6a77a';
            ctx.beginPath();
            for (let k = 0; k <= 20; k++) { const an = k / 20 * Math.PI * 2, rr = 30 + 4 * Math.sin(k * 3 + gameTime * 6); ctx.lineTo(atk.x + Math.cos(an) * rr, atk.y + Math.sin(an) * rr); }
            ctx.fill();
            if (pop < 1) { ctx.globalAlpha = 1 - pop; ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(atk.x, atk.y, atk.r * pop, 0, Math.PI * 2); ctx.stroke(); }
            break;
        }
        case 'calendula': {
            const fade = Math.min(1, atk.life * 3, (atk.maxLife - atk.life) * 6), n = atk.evo ? 14 : 10;
            ctx.globalAlpha = 0.9 * fade;
            for (let k = 0; k < n; k++) {
                const an = atk.spin + k / n * Math.PI * 2;
                crewArm(atk.x + Math.cos(an) * atk.r * 0.55, atk.y + Math.sin(an) * atk.r * 0.55, atk.x + Math.cos(an + 0.2) * atk.r, atk.y + Math.sin(an + 0.2) * atk.r, 4);
            }
            break;
        }
        case 'doble': {
            const fade = Math.min(1, atk.life * 2, (atk.maxLife - atk.life) * 5);
            const set = CHAR_IMG.robin, img = set && set.idle && set.idle[Math.floor(gameTime * 6) % set.idle.length];
            ctx.globalAlpha = 0.65 * fade;
            if (img && img.complete && img.width) {
                const ph = 48 * SPRITE_ZOOM, pw = ph * img.width / img.height;
                ctx.save(); ctx.translate(atk.x, atk.y); if (player.facing === 1) ctx.scale(-1, 1);
                ctx.filter = atk.evo ? 'hue-rotate(220deg) brightness(0.8)' : 'saturate(0.6) brightness(1.2)';
                ctx.drawImage(img, -pw / 2, -ph / 2, pw, ph); ctx.restore();
            }
            ctx.fillStyle = '#f9a8d4';
            for (let k = 0; k < 5; k++) { const an = gameTime * 2 + k * 1.3; ctx.fillRect(atk.x + Math.cos(an) * 22, atk.y + Math.sin(an) * 26, 3, 3); }
            ctx.globalAlpha = fade;
            for (const arm of atk.arms) crewArm(atk.x, atk.y, arm.x, arm.y, 4);
            break;
        }
    }
    ctx.restore();
}
