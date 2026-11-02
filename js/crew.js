// === KITS DE LA TRIPULACIÓN: NAMI, USOPP, CHOPPER, ROBIN, FRANKY, BROOK Y JINBE ===
// Como Luffy, Zoro y Sanji: 5 técnicas exclusivas (la insignia + 4 más) y una
// (Nami, Usopp, Chopper y Robin llevan la insignia en js/arsenal.js; Franky, Brook y Jinbe la tienen aquí, con `sig: true`)
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
    robinform:   SVG(`<g ${F}><path d="M12 7c-2-4-7-5-10-3 2 1 3 3 3 5 2 0 4 0 7-2zM12 7c2-4 7-5 10-3-2 1-3 3-3 5-2 0-4 0-7-2z"/><path d="M10 9h4l1 12h-6z"/></g>`),
    // Franky
    weaponsleft: SVG(`<g ${F}><path d="M3 9h9l3-3h3v12h-3l-3-3H3z"/><circle cx="20.5" cy="12" r="2"/></g>`),
    strongright: SVG(`<g ${F}><rect x="11" y="6" width="10" height="12" rx="3"/></g><g ${S}><path d="M2 12h9M4 9l-2 3 2 3" opacity=".7"/></g>`),
    freshfire:   SVG(`<g ${F}><path d="M3 12c4-6 9-7 12-5-3 1-3 3 0 5-3 2-3 4 0 5-3 2-8 1-12-5z"/><path d="M17 8c3 0 5 2 5 4s-2 4-5 4c1-1 1.5-2.5 1.5-4S18 9 17 8z" opacity=".6"/></g>`),
    coupdevent:  SVG(`<g ${S}><circle cx="6" cy="12" r="3.5"/><path d="M10 9h11M10 12h12M10 15h11" /></g>`),
    rocket:      SVG(`<g ${F}><path d="M4 20l3-7 8-8c2-2 5-2 5-2s0 3-2 5l-8 8z"/></g><g ${S}><path d="M3 21l2-4M7 21l1-3" opacity=".7"/></g>`),
    frankyform:  SVG(`<g ${F}><path d="M8 3h8v3l2 3v12H6V9l2-3z"/></g><g fill="#000" fill-opacity=".35"><rect x="8" y="11" width="8" height="5" rx="1"/></g><g ${S}><path d="M3 7l2 1M21 7l-2 1"/></g>`),
    // Brook
    yahazu:      SVG(`<g ${S}><path d="M3 20 19 4" stroke-width="2"/><path d="M15 4h5v5"/><path d="M4 9l3 1M8 4l1 3" opacity=".6"/></g>`),
    gavotte:     SVG(`<g ${S}><path d="M2 12h17" stroke-width="2.2"/><path d="M5 9v6"/></g><g ${F}><path d="M19 10l4 2-4 2z"/></g>`),
    fubuki:      SVG(`<g ${S}><path d="M12 2v20M3.5 7l17 10M3.5 17l17-10M9 4l3 2 3-2M9 20l3-2 3 2"/></g>`),
    nemuriuta:   SVG(`<g ${F}><circle cx="7" cy="17" r="3"/><circle cx="17" cy="15" r="3"/></g><g ${S}><path d="M10 17V5l10-2v12"/></g>`),
    soul:        SVG(`<g ${F}><path d="M12 2c4 0 7 3 7 7v8l-2-2-2 3-3-3-3 3-2-3-2 2V9c0-4 3-7 7-7z"/></g><g fill="#000" fill-opacity=".4"><circle cx="9.5" cy="9" r="1.5"/><circle cx="14.5" cy="9" r="1.5"/></g>`),
    brookform:   SVG(`<g ${F}><circle cx="12" cy="10" r="6"/><rect x="8" y="2" width="8" height="4"/><rect x="5" y="5.5" width="14" height="1.6"/></g><g fill="#000" fill-opacity=".45"><circle cx="9.7" cy="10" r="1.6"/><circle cx="14.3" cy="10" r="1.6"/><path d="M9 14h6v2H9z"/></g>`),
    // Jinbe
    samegawara:  SVG(`<g ${F}><rect x="3" y="8" width="8" height="8" rx="2"/></g><g ${S}><path d="M13 7c2 3 2 7 0 10M16.5 5c3 4 3 10 0 14M20 3.5c4 5 4 12 0 17"/></g>`),
    buraikan:    SVG(`<g ${F}><circle cx="12" cy="12" r="8"/></g><g stroke="#fff" stroke-opacity=".5" fill="none" stroke-width="1.5"><path d="M7 10c2-3 6-4 9-2M8 15c3 2 6 2 8 0"/></g>`),
    yarinami:    SVG(`<g ${F}><path d="M2 12l14-3 6 3-6 3z"/></g><g ${S}><path d="M3 17c3-2 5 2 8 0s5 2 8 0" opacity=".6"/></g>`),
    uchimizu:    SVG(`<g ${F}><path d="M6 4c2 3 3 4 3 6a3 3 0 0 1-6 0c0-2 1-3 3-6zM17 3c2 3 3 4 3 6a3 3 0 0 1-6 0c0-2 1-3 3-6zM11.5 12c2 3 3 4 3 6a3 3 0 0 1-6 0c0-2 1-3 3-6z"/></g>`),
    mizugokoro:  SVG(`<g ${S}><circle cx="12" cy="12" r="8"/><path d="M5 14c2-2 4 2 7 0s5 2 7 0"/></g><g ${F}><circle cx="12" cy="9" r="2.4"/></g>`),
    jinbeform:   SVG(`<g ${F}><path d="M12 3c5 0 8 4 8 9 0 5-4 9-8 9s-8-4-8-9c0-5 3-9 8-9z"/></g><g fill="#000" fill-opacity=".35"><path d="M8 14h8l-1 3H9zM9 9h2v2H9zM13 9h2v2h-2z"/></g>`)
});

// ---------- Técnicas ----------
// kind: bolt (proyectil que perfora), boomerang (va y vuelve), zone (área persistente que daña por golpes),
//       burst (impacto en área sobre el objetivo), cone (golpe en abanico frontal), aura (onda alrededor + escudo),
//       orbit (anillo que rodea al jugador, repele y bloquea balas), multi (varios golpes rápidos a objetivos al azar),
//       clone (copia que ataca sola). up: mejora por nivel (2-5). evo: arma + pasiva → evolución en cofre.
const CREW_TECH = {
    // ---- NAMI (Clima-Tact) ----
    gustsword: { char: 'nami', title: 'Gust Sword', kind: 'bolt', look: 'gust', sound: 'wind',
        desc: 'Ráfaga de viento a presión del Clima-Tact: atraviesa a todos en línea y los empuja.',
        sk: { baseDamage: 26, cooldown: 2.2, range: 340, speed: 640, w: 26, pierce: 99, push: 26, shots: 1 },
        up: s => { s.baseDamage += 9; s.range += 20; if (s.level === 4) s.shots++; },
        evo: { passive: 'speed', name: 'Milky Arrow', fx: s => { s.baseDamage *= 1.8; s.w += 10; s.shots++; } } },
    tornado: { char: 'nami', title: 'Tornado Tempo', kind: 'boomerang', look: 'tornado', sound: 'slash',
        desc: 'Lanza las piezas del Clima-Tact girando: van y vuelven cortando a todos a su paso.',
        sk: { baseDamage: 20, cooldown: 2.6, range: 230, speed: 420, w: 30, shots: 1 },
        up: s => { s.baseDamage += 7; s.w += 3; if (s.level === 3 || s.level === 5) s.shots++; },
        evo: { passive: 'area', name: 'Cyclone Tempo', fx: s => { s.baseDamage *= 1.7; s.w += 16; s.range += 60; } } },
    thunderbreed: { char: 'nami', title: 'Thunder Breed Tempo', kind: 'zone', look: 'cloud', sound: 'thunder', target: 'dense',
        desc: 'Una nube de tormenta se posa sobre el grupo más denso y descarga rayos sin parar.',
        sk: { baseDamage: 14, cooldown: 5.0, r: 70, dur: 3.0, tick: 0.45, reach: 360, stun: 0 },
        up: s => { s.baseDamage += 5; s.r += 6; s.dur += 0.3; },
        evo: { passive: 'growth', name: 'Weather Egg', fx: s => { s.baseDamage *= 1.7; s.r += 25; s.stun = 0.25; } } },
    raintempo: { char: 'nami', title: 'Rain Tempo', kind: 'zone', look: 'rain', sound: 'rain', target: 'player',
        desc: 'Lluvia del Clima-Tact a su alrededor: frena a los enemigos cercanos y los cala.',
        sk: { baseDamage: 6, cooldown: 6.0, r: 105, dur: 4.0, tick: 0.5, slow: 0.55, reach: 0 },
        up: s => { s.baseDamage += 3; s.r += 10; s.dur += 0.4; },
        evo: { passive: 'luck', name: 'Fog Tempo: Mirage', fx: s => { s.baseDamage *= 1.8; s.r += 30; s.slow = 0.4; } } },
    // ---- USOPP (Kabuto) ----
    namari: { char: 'usopp', title: 'Hissatsu: Namari Boshi', kind: 'bolt', look: 'namari', sound: 'twang',
        desc: 'Ráfaga de perdigones de plomo con el tirachinas al enemigo más cercano.',
        sk: { baseDamage: 24, cooldown: 0.8, range: 330, speed: 820, w: 14, pierce: 1, push: 0, shots: 1, spread: 0.12 },
        up: s => { s.baseDamage += 5; if (s.level === 3 || s.level === 5) s.shots++; },
        evo: { passive: 'cd', name: 'Midori Boshi: Platanus Shuriken', fx: s => { s.baseDamage *= 1.6; s.pierce = 3; s.shots += 2; s.spread = 0.22; } } },
    kaen: { char: 'usopp', title: 'Hissatsu: Kaen Boshi', kind: 'burst', look: 'kaen', sound: 'boom', target: 'random',
        desc: 'Estrella de fuego: estalla sobre un enemigo y deja el suelo en llamas.',
        sk: { baseDamage: 58, cooldown: 3.0, r: 66, delay: 0.25, reach: 340, fire: 1, fireDmg: 7, fireDur: 2.2 },
        up: s => { s.baseDamage += 14; s.r += 6; s.fireDmg += 2; },
        evo: { passive: 'area', name: 'Midori Boshi: Skull Bomb Grass', fx: s => { s.baseDamage *= 1.8; s.r += 25; s.fireDur += 1; } } },
    tabasco: { char: 'usopp', title: 'Hissatsu: Tabasco Boshi', kind: 'zone', look: 'tabasco', sound: 'twang', target: 'nearest',
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
        evo: { passive: 'luck', name: 'Cuerpo Fleur: Demonio', fx: s => { s.baseDamage *= 1.7; s.hits = 3; s.dur += 2; } } },
    // ---- FRANKY (insignia: Weapons Left) ----
    weaponsleft: { char: 'franky', sig: true, title: 'Weapons Left', kind: 'bolt', look: 'cannon', sound: 'pistol',
        desc: 'Franky: el cañón de su brazo izquierdo dispara balas al enemigo más cercano y las aparta.',
        sk: { baseDamage: 30, cooldown: 1.1, range: 340, speed: 720, w: 16, pierce: 1, push: 16, shots: 1, spread: 0.16 },
        up: s => { s.baseDamage += 8; if (s.level === 3 || s.level === 5) s.shots++; },
        evo: { passive: 'power', name: 'Franky Radical Beam', fx: s => { s.baseDamage *= 1.8; s.pierce = 99; s.w += 8; s.speed += 300; } } },
    strongright: { char: 'franky', title: 'Strong Right', kind: 'boomerang', look: 'fist', sound: 'kick',
        desc: 'Lanza el puño derecho unido a una cadena: sale disparado y vuelve golpeando a todos.',
        sk: { baseDamage: 34, cooldown: 2.8, range: 230, speed: 520, w: 26, shots: 1 },
        up: s => { s.baseDamage += 11; s.range += 15; if (s.level === 5) s.shots++; },
        evo: { passive: 'maxhp', name: 'Strong Hammer', fx: s => { s.baseDamage *= 1.8; s.w += 14; s.shots++; } } },
    freshfire: { char: 'franky', title: 'Fresh Fire', kind: 'cone', look: 'freshfire', sound: 'gear2',
        desc: 'Escupe una llamarada de cola caliente en abanico delante de él.',
        sk: { baseDamage: 30, cooldown: 2.4, r: 120, arc: 0.55, push: 10 },
        up: s => { s.baseDamage += 9; s.r += 10; },
        evo: { passive: 'area', name: 'Franky Fireball', fx: s => { s.baseDamage *= 1.8; s.r += 30; s.arc = 0.8; } } },
    coupdevent: { char: 'franky', title: 'Coup de Vent', kind: 'bolt', look: 'coup', sound: 'wind',
        desc: 'Cañón de aire comprimido de las palmas: una ráfaga enorme que atraviesa y barre a todos.',
        sk: { baseDamage: 50, cooldown: 5.0, range: 420, speed: 600, w: 40, pierce: 99, push: 55, shots: 1 },
        up: s => { s.baseDamage += 16; s.w += 4; },
        evo: { passive: 'cd', name: 'Gaon Cannon', fx: s => { s.baseDamage *= 1.9; s.w += 20; s.range += 160; } } },
    rocket: { char: 'franky', title: 'Franky Rocket Launcher', kind: 'burst', look: 'rocket', sound: 'boom', target: 'dense',
        desc: 'Cohete del hombro sobre el grupo más denso: estalla y deja el suelo ardiendo.',
        sk: { baseDamage: 60, cooldown: 3.6, r: 74, delay: 0.35, reach: 380, fire: 1, fireDmg: 7, fireDur: 2.0 },
        up: s => { s.baseDamage += 16; s.r += 6; s.fireDmg += 2; },
        evo: { passive: 'growth', name: 'General Cannon', fx: s => { s.baseDamage *= 1.8; s.r += 26; s.fireDur += 1; } } },
    // ---- BROOK (insignia: Yahazu Giri) ----
    yahazu: { char: 'brook', sig: true, title: 'Hanauta Sancho: Yahazu Giri', kind: 'multi', look: 'yahazu', sound: 'slash',
        desc: 'Brook: pasa tarareando junto a varios enemigos y el corte llega cuando ya ha envainado.',
        sk: { baseDamage: 20, cooldown: 1.3, targets: 3, reach: 270, r: 0 },
        up: s => { s.baseDamage += 6; if (s.level % 2) s.targets++; },
        evo: { passive: 'speed', name: 'Arabesque Brick Fist', fx: s => { s.baseDamage *= 1.7; s.targets += 3; s.r = 36; } } },
    gavotte: { char: 'brook', title: 'Gavotte Bond en Avant', kind: 'bolt', look: 'gavotte', sound: 'slash',
        desc: 'Estocada a la velocidad del rayo: atraviesa en línea a todos los que pilla.',
        sk: { baseDamage: 30, cooldown: 2.2, range: 300, speed: 980, w: 14, pierce: 99, push: 0, stun: 0.2, shots: 1 },
        up: s => { s.baseDamage += 10; s.range += 25; },
        evo: { passive: 'crit', name: 'Aubade Coup Droit', fx: s => { s.baseDamage *= 1.8; s.w += 10; s.shots = 3; s.spread = 0.35; } } },
    fubuki: { char: 'brook', title: 'Kasuriuta: Fubuki Giri', kind: 'cone', look: 'frost', sound: 'slash',
        desc: 'Tajo con el frío del inframundo: congela un momento a los que tiene delante.',
        sk: { baseDamage: 32, cooldown: 2.6, r: 105, arc: 0.85, push: 0, stun: 0.6 },
        up: s => { s.baseDamage += 10; s.r += 8; },
        evo: { passive: 'area', name: 'Fubuki Giri: Hielo del Inframundo', fx: s => { s.baseDamage *= 1.8; s.r += 28; s.arc = 1.2; s.stun = 1.0; } } },
    nemuriuta: { char: 'brook', title: 'Nemuri Uta: Flanchet', kind: 'zone', look: 'lullaby', sound: 'bell', target: 'player',
        desc: 'Toca la nana con el violín: los enemigos cercanos se duermen y se frenan.',
        sk: { baseDamage: 6, cooldown: 7.0, r: 110, dur: 3.5, tick: 0.6, slow: 0.5, reach: 0, stun: 0.3 },
        up: s => { s.baseDamage += 3; s.r += 10; s.dur += 0.4; },
        evo: { passive: 'magnet', name: 'Nemuri Uta: Requiem', fx: s => { s.baseDamage *= 1.8; s.r += 30; s.stun = 0.55; } } },
    soul: { char: 'brook', title: 'Yomi Yomi: Alma', kind: 'clone', look: 'soul', sound: 'whip',
        desc: 'Su alma sale del cuerpo y ataca sola: hiela a los enemigos que toca.',
        sk: { baseDamage: 22, cooldown: 7.0, dur: 4.5, rate: 0.6, reach: 180, hits: 1 },
        up: s => { s.baseDamage += 7; s.dur += 0.5; },
        evo: { passive: 'cd', name: 'Soul Parade', fx: s => { s.baseDamage *= 1.7; s.hits = 3; s.dur += 2; } } },
    // ---- JINBE (insignia: Samegawara Seiken) ----
    samegawara: { char: 'jinbe', sig: true, title: 'Gyojin Karate: Samegawara Seiken', kind: 'bolt', look: 'seiken', sound: 'kick',
        desc: 'Jinbe: puñetazo que hace vibrar el agua del aire y el golpe atraviesa a todos en línea.',
        sk: { baseDamage: 32, cooldown: 1.5, range: 260, speed: 640, w: 24, pierce: 99, push: 24, shots: 1 },
        up: s => { s.baseDamage += 9; s.range += 15; if (s.level === 4) s.shots++; },
        evo: { passive: 'power', name: 'Gosenmaigawara Seiken', fx: s => { s.baseDamage *= 1.8; s.w += 14; s.push += 20; } } },
    buraikan: { char: 'jinbe', title: 'Buraikan', kind: 'burst', look: 'buraikan', sound: 'boom', target: 'dense',
        desc: 'Lanza una bola de agua del tamaño de un barril que revienta sobre el grupo más denso.',
        sk: { baseDamage: 58, cooldown: 3.4, r: 78, delay: 0.3, reach: 360 },
        up: s => { s.baseDamage += 16; s.r += 7; },
        evo: { passive: 'area', name: 'Ōgi: Buraikan', fx: s => { s.baseDamage *= 1.8; s.r += 30; } } },
    yarinami: { char: 'jinbe', title: 'Yarinami', kind: 'bolt', look: 'yarinami', sound: 'wind',
        desc: 'Lanza de agua a presión que cruza la arena atravesando a todos.',
        sk: { baseDamage: 44, cooldown: 3.6, range: 520, speed: 820, w: 18, pierce: 99, push: 0, shots: 1 },
        up: s => { s.baseDamage += 14; s.w += 2; },
        evo: { passive: 'crit', name: 'Senmaigawara Seiken', fx: s => { s.baseDamage *= 1.8; s.w += 12; s.shots = 2; } } },
    uchimizu: { char: 'jinbe', title: 'Uchimizu', kind: 'multi', look: 'uchimizu', sound: 'pistol',
        desc: 'Lanza gotas de agua con la fuerza de una bala a varios enemigos a la vez.',
        sk: { baseDamage: 15, cooldown: 1.2, targets: 3, reach: 300, r: 0 },
        up: s => { s.baseDamage += 5; if (s.level % 2) s.targets++; },
        evo: { passive: 'cd', name: 'Uchimizu: Lluvia de Balas', fx: s => { s.baseDamage *= 1.7; s.targets += 3; s.r = 30; } } },
    mizugokoro: { char: 'jinbe', title: 'Gyojin Jujutsu: Mizugokoro', kind: 'aura', look: 'mizu', sound: 'rain',
        desc: 'Domina el agua que le rodea: aparta a los cercanos y recibe menos daño unos segundos.',
        sk: { baseDamage: 16, cooldown: 7.0, r: 90, push: 70, shield: 1.6, shieldMult: 0.5 },
        up: s => { s.baseDamage += 6; s.r += 8; s.shield += 0.3; },
        evo: { passive: 'armor', name: 'Kairyu Ippon Zeoi', fx: s => { s.baseDamage *= 1.9; s.r += 25; s.shieldMult = 0.45; } } }
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
            2: { name: 'SOGEKING', short: 'SK', color: '#eab308', dur: 8, sound: 'twang', dmg: 1.25, cd: 0.7, spd: 1.1, taken: 0.85 },
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
        } },
    franky: { card: 'frankyform', meter: 'COLA', title: 'Cyborg de Cola (Franky)',
        desc: 'Llena el medidor y pulsa ESPACIO o el botón. Nv1: Súper Cola · Nv3: General Franky · Evolución: Franky Shogun (si están desbloqueados).',
        evoName: 'Franky Shogun', evoPassive: 'armor',
        forms: {
            // Tres botellas de cola en la nevera del estómago: ¡SUPER! (Water 7)
            2: { name: 'SÚPER COLA', short: 'SC', color: '#38bdf8', dur: 8, sound: 'gear2', dmg: 1.2, cd: 0.7, spd: 1.15, taken: 0.8 },
            // General Franky (Dressrosa): la armadura robot del Iron Pirate
            3: { name: 'GENERAL FRANKY', short: 'GF', color: '#2563eb', dur: 9, sound: 'boom', dmg: 1.55, cd: 0.8, spd: 1, taken: 0.6, area: 1.2, atk: 'general', atkCd: 1.1 },
            // Franky Shogun (Punk Hazard / Wano): el robot gigante; acaba sin cola
            4: { name: 'FRANKY SHOGUN', short: 'FS', color: '#1d4ed8', dur: 12, sound: 'haoshoku', dmg: 1.8, cd: 0.7, spd: 1.05, taken: 0.5, area: 1.25, atk: 'shogun', atkCd: 1.3, pen: ['exhausted', 6], penText: 'SE ACABA LA COLA... AGOTADO' }
        } },
    brook: { card: 'brookform', meter: 'ALMA', title: 'Yomi Yomi no Mi (Brook)',
        desc: 'Llena el medidor y pulsa ESPACIO o el botón. Nv1: Soul King · Nv3: Alma fuera del cuerpo · Evolución: Soul Solid (si están desbloqueados).',
        evoName: 'Soul Solid', evoPassive: 'crit',
        forms: {
            // Soul King (tras los dos años): el concierto le acelera
            2: { name: 'SOUL KING', short: 'SK', color: '#a855f7', dur: 8, sound: 'bell', dmg: 1.15, cd: 0.7, spd: 1.3, taken: 0.85 },
            // El alma sale del cuerpo (Isla Gyojin / Whole Cake): casi no le tocan y hiela a quien atraviesa
            3: { name: 'ALMA FUERA DEL CUERPO', short: 'AL', color: '#93c5fd', dur: 9, sound: 'whip', dmg: 1.45, cd: 0.8, spd: 1.2, taken: 0.45, atk: 'soulfreeze', atkCd: 1.1 },
            // Soul Solid: la espada cargada con el frío del inframundo (Whole Cake / Wano)
            4: { name: 'SOUL SOLID: FRÍO DEL INFRAMUNDO', short: 'SS', color: '#38bdf8', dur: 12, sound: 'haoshoku', dmg: 1.85, cd: 0.7, spd: 1.2, taken: 0.6, atk: 'soulsolid', atkCd: 1.2, pen: ['exhausted', 6], penText: 'EL ALMA SE AGOTA... YOHOHOHO' }
        } },
    jinbe: { card: 'jinbeform', meter: 'MAREA', title: 'Karate de Hombre-Pez (Jinbe)',
        desc: 'Llena el medidor y pulsa ESPACIO o el botón. Nv1: Shichibukai · Nv3: Timonel de los Sombrero de Paja · Evolución: Caballero del Mar (si están desbloqueados).',
        evoName: 'Caballero del Mar', evoPassive: 'maxhp',
        forms: {
            // Shichibukai (Impel Down / Marineford)
            2: { name: 'SHICHIBUKAI', short: 'SH', color: '#0ea5e9', dur: 8, sound: 'kick', dmg: 1.2, cd: 0.75, spd: 1.1, taken: 0.75 },
            // Timonel de los Sombrero de Paja (Whole Cake): domina la corriente del mar
            3: { name: 'TIMONEL DE LOS SOMBRERO DE PAJA', short: 'TI', color: '#0284c7', dur: 9, sound: 'rain', dmg: 1.5, cd: 0.8, spd: 1.15, taken: 0.6, atk: 'marea', atkCd: 1.2 },
            // Caballero del Mar (Wano): Karate de Hombre-Pez a plena potencia
            4: { name: 'CABALLERO DEL MAR', short: 'CM', color: '#1e3a8a', dur: 12, sound: 'haoshoku', dmg: 1.8, cd: 0.7, spd: 1.1, taken: 0.5, atk: 'ogi', atkCd: 1.2, pen: ['exhausted', 6], penText: 'JINBE SE QUEDA SIN AIRE... AGOTADO' }
        } }
};
const CREW_FORM_IDS = Object.values(CREW_FORMS).map(f => f.card);
const CREW_WEAPON_IDS = CREW_TECH_IDS.concat(CREW_FORM_IDS);

// ---------- Registro en las tablas del juego ----------
for (const c in CREW_FORMS) {
    const f = CREW_FORMS[c];
    CHAR_SKILLS[c].push(...CREW_TECH_IDS.filter(id => CREW_TECH[id].char === c && !CHAR_SKILLS[c].includes(id)), f.card);
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
const CREW_SHORT = {}; // nombre corto para las fichas del HUD y de la pausa
for (const c in CREW_FORMS) {
    const f = CREW_FORMS[c];
    CREW_UPGRADES.push({ id: f.card, type: 'weapon', chars: [c], title: f.title, icon: ICONS[f.card], desc: f.desc });
    CREW_SHORT[f.card] = f.title.replace(/ \(.*\)$/, '');
    CREW_HUD.push({ id: f.card, icon: ICONS[f.card], name: CREW_SHORT[f.card] });
    CREW_NAMES[f.card] = f.title.replace(/ \(.*\)$/, '');
}
for (const id of CREW_TECH_IDS) {
    const t = CREW_TECH[id];
    CREW_UPGRADES.push({ id, type: 'weapon', chars: [t.char], title: t.title, icon: ICONS[id], desc: t.desc });
    CREW_SHORT[id] = t.title.replace(/^.*: /, '');
    CREW_HUD.push({ id, icon: ICONS[id], name: CREW_SHORT[id] });
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
        activeAttacks.push(Object.assign({}, base, { x: player.x, y: player.y, ang: a, r: sk.r * ab, arc: sk.arc, push: sk.push, stun: sk.stun || 0, life: 0.3, maxLife: 0.3, done: false }));
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
                baseDamage: atk.fire.dmg, life: atk.fire.dur, maxLife: atk.fire.dur, tick: 0.4, tt: 0.4, slow: 0, stun: 0, evo: atk.evo && atk.look === 'kaen' }); // fuego verde solo en el Midori Boshi de Usopp
        }
        return atk.life <= 0;
    }
    if (k === 'cone') {
        if (!atk.done) {
            atk.done = true;
            forEnemiesNear(player.x, player.y, atk.r, e => {
                let d = Math.abs(Math.atan2(e.y - player.y, e.x - player.x) - atk.ang);
                if (d > Math.PI) d = Math.PI * 2 - d;
                if (d < atk.arc) crewHit(atk, e, 1, atk.push, atk.stun);
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
        playSound('thunder');
    },
    // Nami · Zeus: rayo gigante sobre el grupo más denso
    zeus() {
        const t = crewTarget('dense', 420); if (!t) { gearState.atkTimer = 0.3; return; }
        const r = 140 * player.areaBonus;
        crewThunder(t.x, t.y, r * 0.5, 0, true);
        gearState.fx.push({ kind: 'wave', x: t.x, y: t.y, r, color: '#facc15', life: 0.5, max: 0.5 });
        gearHitArea(t.x, t.y, r, 170, 50);
        playSound('thunder'); cameraShake = Math.max(cameraShake, 2.2);
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
        playSound('twang');
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
    },
    // Franky · General Franky: General Cannon sobre el objetivo
    general() {
        const t = gearTarget(); if (!t) { gearState.atkTimer = 0.3; return; }
        const r = 100 * player.areaBonus;
        gearState.fx.push({ kind: 'fist', x0: player.x, y0: player.y, x: t.x, y: t.y, r: 9, color: '#2563eb', life: 0.3, max: 0.3 });
        gearState.fx.push({ kind: 'wave', x: t.x, y: t.y, r, color: '#f97316', life: 0.45, max: 0.45 });
        gearHitArea(t.x, t.y, r, 75 + 15 * gearCardLevel(), 40);
        playSound('boom'); cameraShake = Math.max(cameraShake, 1.6);
    },
    // Franky · Franky Shogun: rayo que barre la arena hacia el enemigo más cercano
    shogun() {
        const t = gearTarget(); if (!t) { gearState.atkTimer = 0.3; return; }
        const a = Math.atan2(t.y - player.y, t.x - player.x), L = 600, w = 46 * player.areaBonus;
        gearState.fx.push({ kind: 'beam', x0: player.x, y0: player.y - 10, a, L, w, color: '#7dd3fc', life: 0.45, max: 0.45 });
        for (let s = 0; s <= L; s += w) forEnemiesNear(player.x + Math.cos(a) * s, player.y + Math.sin(a) * s, w, e => {
            if (e._fs === gameTime) return; e._fs = gameTime;
            const di = calculateDamage(165); e.hp -= di.amount * e.damageTaken; spawnDamageText(e.x, e.y, di);
            if (e.hp <= 0) killEnemy(e);
        });
        playSound('laser'); cameraShake = Math.max(cameraShake, 2.2);
    },
    // Brook · Alma fuera del cuerpo: el frío del alma hiela a los que la rodean
    soulfreeze() {
        const r = 115 * player.areaBonus;
        gearState.fx.push({ kind: 'wave', x: player.x, y: player.y, r, color: '#bae6fd', life: 0.45, max: 0.45 });
        forEnemiesNear(player.x, player.y, r, e => { if (!e.isBoss && !e.isMiniboss) e._stun = Math.max(e._stun || 0, 0.8); });
        gearHitArea(player.x, player.y, r, 70 + 15 * gearCardLevel(), 0);
        playSound('whip');
    },
    // Brook · Soul Solid: tajo helado gigante sobre el objetivo
    soulsolid() {
        const t = gearTarget(); if (!t) { gearState.atkTimer = 0.3; return; }
        const r = 140 * player.areaBonus;
        gearState.fx.push({ kind: 'slashes', x: t.x, y: t.y, r, n: 2, rot: Math.atan2(t.y - player.y, t.x - player.x) + Math.PI / 2, color: '#7dd3fc', life: 0.45, max: 0.45 });
        gearState.fx.push({ kind: 'wave', x: t.x, y: t.y, r, color: '#e0f2fe', life: 0.5, max: 0.5 });
        forEnemiesNear(t.x, t.y, r, e => { if (!e.isBoss && !e.isMiniboss) e._stun = Math.max(e._stun || 0, 1.2); });
        gearHitArea(t.x, t.y, r, 165, 0);
        playSound('slash'); cameraShake = Math.max(cameraShake, 2);
    },
    // Jinbe · Timonel: ola que sale de él y arrastra a los enemigos
    marea() {
        const r = 125 * player.areaBonus;
        gearState.fx.push({ kind: 'wave', x: player.x, y: player.y, r, color: '#38bdf8', life: 0.5, max: 0.5 });
        gearHitArea(player.x, player.y, r, 75 + 15 * gearCardLevel(), 80);
        playSound('rain'); cameraShake = Math.max(cameraShake, 1.4);
    },
    // Jinbe · Caballero del Mar: Ōgi Buraikan, una bola de agua colosal sobre el grupo más denso
    ogi() {
        const t = crewTarget('dense', 420); if (!t) { gearState.atkTimer = 0.3; return; }
        const r = 150 * player.areaBonus;
        gearState.fx.push({ kind: 'fist', x0: player.x, y0: player.y, x: t.x, y: t.y, r: 14, color: '#0ea5e9', life: 0.3, max: 0.3 });
        gearState.fx.push({ kind: 'wave', x: t.x, y: t.y, r, color: '#0284c7', life: 0.55, max: 0.55 });
        gearHitArea(t.x, t.y, r, 170, 70);
        playSound('boom'); cameraShake = Math.max(cameraShake, 2.4);
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
    else if (c === 'franky' && g === 3) ctx.scale(1.2, 1.2);   // armadura de General Franky
    else if (c === 'franky' && g === 4) { ctx.translate(0, -12); ctx.scale(1.6, 1.6); ctx.filter = 'saturate(1.3) brightness(1.05)'; } // Franky Shogun
    else if (c === 'brook' && g === 4) ctx.filter = 'brightness(1.1) hue-rotate(160deg) saturate(0.7)'; // frío del inframundo
    else if (c === 'jinbe' && g === 4) ctx.filter = 'saturate(1.3) brightness(1.08)';
    if (gearState.penalty === 'exhausted') ctx.filter = 'grayscale(0.6) brightness(0.85)';
};
const _crewSpriteAlpha = gearSpriteAlpha;
gearSpriteAlpha = function () {
    if (gearChar() === 'nami' && gearState.active === 3) return 0.45 + 0.25 * Math.sin(performance.now() / 70);
    if (gearChar() === 'brook' && gearState.active === 3) return 0.5 + 0.15 * Math.sin(performance.now() / 120); // alma fuera del cuerpo
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
        if (f.kind !== 'hand' && f.kind !== 'demonarms' && f.kind !== 'beam') continue;
        const a = Math.max(0, f.life / f.max), p = 1 - a;
        ctx.save();
        if (f.kind === 'beam') {
            // Franky Shogun: rayo con halo y núcleo blanco
            ctx.translate(f.x0, f.y0); ctx.rotate(f.a);
            const L = f.L * Math.min(1, p * 4), w = f.w * (0.6 + 0.4 * a);
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = a * 0.5; ctx.fillStyle = f.color; ctx.fillRect(0, -w / 2, L, w);
            ctx.globalAlpha = a; ctx.fillStyle = '#e0f2fe'; ctx.fillRect(0, -w * 0.22, L, w * 0.44);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -w * 0.08, L, w * 0.16);
            ctx.globalCompositeOperation = 'source-over';
        } else if (f.kind === 'hand') {
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

// ---------- Dibujo: js/crewfx.js (drawCrewFX) ----------
function drawCrewFX(atk) {}
