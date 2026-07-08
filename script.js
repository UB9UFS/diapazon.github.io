// ============================================================
// 1. ЯГИ (YAGI)
// ============================================================
function calcYagi() {
    // ---- Считывание данных ----
    const f = parseFloat(document.getElementById('yagiFreq').value);
    const n = parseInt(document.getElementById('yagiElements').value);
    const d = parseFloat(document.getElementById('yagiDiam').value);
    const boom = parseFloat(document.getElementById('yagiBoom').value);
    const vibType = document.getElementById('yagiVibType').value;
    const mode = document.getElementById('yagiMode').value;

    if (!f || f <= 0 || !n || n < 3 || !d || d <= 0 || !boom || boom <= 0) {
        document.getElementById('yagiResult').innerHTML = '⚠️ Заполните все поля (элементов ≥ 3)';
        return;
    }

    // ---- Константы ----
    const c = 299.792458;
    const lambda = c / f;                 // длина волны в метрах
    const lambdaMm = lambda * 1000;        // в мм

    // ---- Коэффициент укорочения в зависимости от λ/d ----
    const ratio = lambdaMm / d;
    let k;
    if (ratio >= 10000) k = 0.98;
    else if (ratio >= 1000) k = 0.97;
    else if (ratio >= 500) k = 0.965;
    else if (ratio >= 200) k = 0.96;
    else if (ratio >= 100) k = 0.955;
    else if (ratio >= 50) k = 0.95;
    else if (ratio >= 20) k = 0.94;
    else k = 0.92;

    // ---- Расчёт длин элементов (в мм) ----
    // Рефлектор: 0.5λ * (1.02..1.05) с учётом утолщения
    const reflector = lambdaMm * 0.5 * 1.03 * k;

    // Вибратор: 0.5λ * k (корректируем в зависимости от типа)
    let driven = lambdaMm * 0.5 * k;
    if (vibType === 'loop') {
        // Петлевой вибратор имеет чуть большую длину
        driven = driven * 1.02;
    }

    // Директоры: от 0.43λ до 0.39λ с прогрессией
    const dirStart = lambdaMm * 0.44 * k;
    const dirEnd = lambdaMm * 0.39 * k;

    // ---- Расчёт расстояний (в мм) в зависимости от режима ----
    let spacingRF, spacingDir;
    switch (mode) {
        case 'fb':
            spacingRF = lambdaMm * 0.22;      // для F/B
            spacingDir = lambdaMm * 0.16;
            break;
        case 'wide':
            spacingRF = lambdaMm * 0.18;      // широкополосный
            spacingDir = lambdaMm * 0.20;
            break;
        default: // gain
            spacingRF = lambdaMm * 0.20;
            spacingDir = lambdaMm * 0.18;
    }

    // ---- Длина стрелы ----
    const boomLength = (n - 1) * spacingDir;

    // ---- Усиление (приблизительное) ----
    let gain = 5 + 2.5 * Math.log10(n) * 2;
    if (mode === 'fb') gain -= 0.5;
    if (mode === 'wide') gain -= 1.0;

    // ---- Согласование ----
    let match = '';
    if (vibType === 'direct') {
        match = 'Прямой вибратор: сопротивление ~30-40 Ом. Рекомендуется U-колено (петля) или балун 1:1.5 для согласования с 50 Ом.';
    } else {
        match = 'Петлевой вибратор: сопротивление ~200 Ом. Используйте четвертьволновый трансформатор из 75-омного кабеля (параллельно) или балун 4:1.';
    }

    // ---- Подстроечный диапазон ----
    const tuneRange = 'Рекомендуемый подстроечный запас: ±5 мм на каждом элементе для точной настройки по КСВ и F/B.';

    // ---- Формирование вывода ----
    let html = `<p><b>Вид элемента:</b> ${vibType === 'loop' ? 'Петлевой' : 'Прямой'}</p>`;
    html += `<p><b>Частота f:</b> ${f.toFixed(1)} МГц</p>`;
    html += `<p><b>Длина волны λ:</b> ${lambda.toFixed(3)} м (${lambdaMm.toFixed(0)} мм)</p>`;
    html += `<p><b>Диаметр элемента d:</b> ${d.toFixed(1)} мм</p>`;
    html += `<p><b>Сторона бума D:</b> ${boom.toFixed(1)} мм</p>`;
    html += `<p><b>Коэффициент укорочения K:</b> ${k.toFixed(3)} (λ/d = ${ratio.toFixed(0)})</p>`;
    html += `<p><b>Общее число элементов:</b> ${n}</p>`;
    html += `<p><b>Длина стрелы:</b> ${boomLength.toFixed(0)} мм</p>`;
    html += `<p><b>Усиление (прибл.):</b> ${gain.toFixed(1)} dBi</p>`;
    html += `<hr>`;
    html += `<p><b>📌 Рефлектор R:</b> ${reflector.toFixed(0)} мм (позиция 0)</p>`;
    html += `<p><b>📌 Вибратор F:</b> ${driven.toFixed(0)} мм (R-F: ${spacingRF.toFixed(0)} мм)</p>`;

    // Директоры
    const numDir = n - 2;
    for (let i = 1; i <= numDir; i++) {
        const dirLen = dirStart - (dirStart - dirEnd) * ((i - 1) / (numDir > 1 ? numDir - 1 : 1));
        const pos = (i === 1) ? spacingRF : spacingRF + (i - 1) * spacingDir;
        html += `<p><b>📌 Директор D${i}:</b> ${dirLen.toFixed(0)} мм (поз. ${pos.toFixed(0)} мм)</p>`;
    }

    html += `<hr>`;
    html += `<p><b>🔧 Согласование:</b> ${match}</p>`;
    html += `<p><b>📐 Подстройка:</b> ${tuneRange}</p>`;
    html += `<p><b>💡 Совет:</b> Для точной настройки используйте анализатор антенн. Начните с рефлектора, затем вибратор, потом директоры. Подгибайте концы элементов для изменения резонанса.</p>`;

    document.getElementById('yagiResult').innerHTML = html;
}

// ============================================================
// СПИРАЛЬНАЯ АНТЕННА — КРАТКИЙ ВЫВОД
// ============================================================
function calcHelix() {
    const f = parseFloat(document.getElementById('helixFreq').value);
    const N = parseFloat(document.getElementById('helixTurns').value);
    const D = parseFloat(document.getElementById('helixDiam').value);
    const S = parseFloat(document.getElementById('helixStep').value);

    if (!f || f <= 0 || !N || N <= 0 || !D || D <= 0 || !S || S <= 0) {
        document.getElementById('helixResult').innerHTML = '⚠️ Заполните все поля (значения > 0)';
        return;
    }

    const c = 299.792458;
    const lambda = c / f;
    const lambdaMm = lambda * 1000;

    // Длина провода
    const C = Math.PI * D;
    const wireLength = N * Math.sqrt(S * S + C * C);
    const wireLengthM = wireLength / 1000;

    // Усиление по Краусу
    const C_lambda = C / lambdaMm;
    const S_lambda = S / lambdaMm;
    let gain_linear = 15 * N * C_lambda * C_lambda * S_lambda;
    if (gain_linear < 1) gain_linear = 1;
    let gain_dBi = 10 * Math.log10(gain_linear);
    gain_dBi -= 0.5;
    if (gain_dBi > 12) gain_dBi = 12;

    // Ширина луча
    let theta = 52 / (C_lambda * Math.sqrt(N * S_lambda));
    if (theta > 120) theta = 120;
    if (theta < 20) theta = 20;

    // Краткая информация (всего одна строка)
    const info = 'Круговая поляризация, направляйте ось на корреспондента.';

    // Вывод
    let html = `<p><b>Длина волны λ:</b> ${lambda.toFixed(3)} м (${lambdaMm.toFixed(1)} мм)</p>`;
    html += `<hr style="border-color:#333;">`;
    html += `<p><b>📏 Длина провода:</b> ${wireLengthM.toFixed(2)} м (${wireLength.toFixed(0)} мм)</p>`;
    html += `<p><b>📈 Усиление:</b> ${gain_dBi.toFixed(1)} dBi</p>`;
    html += `<p><b>📐 Ширина луча:</b> ${theta.toFixed(0)} °</p>`;
    html += `<hr style="border-color:#333;">`;
    html += `<p style="color:#888; font-size:0.6rem;">${info}</p>`;

    document.getElementById('helixResult').innerHTML = html;
}

// ============================================================
// J-АНТЕННА (с учётом диаметра проводника)
// ============================================================
function calcJ() {
    // ---- Чтение данных из полей ----
    const f = parseFloat(document.getElementById('jFreq').value);
    const cableZ = parseFloat(document.getElementById('jCableZ').value);
    const wireDiam = parseFloat(document.getElementById('jWireDiam').value) || 2;

    // ---- Проверка ----
    if (!f || f <= 0 || !cableZ || cableZ <= 0 || !wireDiam || wireDiam <= 0) {
        document.getElementById('jResult').innerHTML = '⚠️ Заполните все поля (значения > 0)';
        return;
    }

    const c = 299.792458;
    const lambda = c / f;
    const lambdaMm = lambda * 1000;

    // ---- Коэффициент укорочения в зависимости от λ/d ----
    const ratio = lambdaMm / wireDiam;
    let k;
    if (ratio >= 10000) k = 0.98;
    else if (ratio >= 1000) k = 0.97;
    else if (ratio >= 500) k = 0.965;
    else if (ratio >= 200) k = 0.96;
    else if (ratio >= 100) k = 0.955;
    else if (ratio >= 50) k = 0.95;
    else if (ratio >= 20) k = 0.94;
    else k = 0.92;

    // ---- Расчёт размеров ----
    const radiator = lambdaMm * 0.5 * k;           // излучатель ½λ с укорочением
    const stub = lambdaMm * 0.25 * k;               // согласующая линия ¼λ с укорочением

    // Точка подключения кабеля (в мм от замыкания) — зависит от сопротивления кабеля
    let feedPoint;
    if (cableZ <= 50) feedPoint = stub * 0.15;
    else if (cableZ <= 75) feedPoint = stub * 0.20;
    else feedPoint = stub * 0.30;

    // Расстояние между проводниками шлейфа (рекомендуемое)
    const gap = (wireDiam * 3) > 10 ? (wireDiam * 3) : 10; // минимум 10 мм

    // ---- Краткая информация ----
    const info = `Изготовьте излучатель длиной ${radiator.toFixed(0)} мм из провода диаметром ${wireDiam} мм. Сделайте согласующий шлейф из двух параллельных проводников длиной ${stub.toFixed(0)} мм с расстоянием между ними ${gap.toFixed(0)} мм. Замкните нижние концы. Подключите кабель (${cableZ} Ом) в точке ${feedPoint.toFixed(0)} мм от замыкания и настройте по минимуму КСВ. Устанавливайте вертикально на мачте.`;

    // ---- Вывод ----
    let html = `<p><b>Длина волны λ:</b> ${lambda.toFixed(3)} м (${lambdaMm.toFixed(0)} мм)</p>`;
    html += `<p><b>Коэффициент укорочения K:</b> ${k.toFixed(3)} (λ/d = ${ratio.toFixed(0)})</p>`;
    html += `<hr style="border-color:#333;">`;
    html += `<p><b>📏 Излучатель (½λ):</b> ${radiator.toFixed(0)} мм</p>`;
    html += `<p><b>📏 Согласующая линия (¼λ):</b> ${stub.toFixed(0)} мм</p>`;
    html += `<p><b>📏 Расстояние между проводниками шлейфа:</b> ${gap.toFixed(0)} мм</p>`;
    html += `<p><b>🔌 Точка подключения кабеля (${cableZ} Ом):</b> ${feedPoint.toFixed(0)} мм от замыкания</p>`;
    html += `<hr style="border-color:#333;">`;
    html += `<p style="color:#888; font-size:0.65rem;">${info}</p>`;

    document.getElementById('jResult').innerHTML = html;
}

// ============================================================
// 5. ПАУК (GP)
// ============================================================
function calcSpider() {
    const f = parseFloat(document.getElementById('spiderFreq').value);
    const wireDiam = parseFloat(document.getElementById('spiderWire').value);

    if (!f || f <= 0 || !wireDiam || wireDiam <= 0) {
        document.getElementById('spiderResult').innerHTML = '⚠️ Заполните все поля';
        return;
    }

    const c = 299.792458;
    const lambda = c / f;
    const lambdaMm = lambda * 1000;
    let k = 0.95;
    if (wireDiam < 1) k = 0.97;
    else if (wireDiam < 2) k = 0.96;
    else if (wireDiam < 4) k = 0.94;
    else k = 0.92;

    const rod = lambdaMm / 4 * k;
    const radials = rod * 1.10;

    document.getElementById('spiderResult').innerHTML =
        '<p><b>Длина штыря A:</b> ' + rod.toFixed(0) + ' мм</p>' +
        '<p><b>Длина противовесов B:</b> ' + radials.toFixed(0) + ' мм (на 10% длиннее)</p>' +
        '<p><b>Угол наклона противовесов:</b> 42–45 °</p>' +
        '<p><b>Входное сопротивление:</b> 50 Ом</p>';
}

// ============================================================
// 6. ОСНОВНЫЕ АНТЕННЫ (диполь, штырь)
// ============================================================
function calcMain() {
    const f = parseFloat(document.getElementById('mainFreq').value);
    if (!f || f <= 0) {
        document.getElementById('mainResult').innerHTML = '⚠️ Введите частоту > 0';
        return;
    }

    const c = 299.792458;
    const lambda = c / f;
    const full = lambda;
    const dipole = lambda / 2;
    const gp = lambda / 4;
    const short = (lambda / 4) * 0.8;

    document.getElementById('mainResult').innerHTML =
        '<p><b>Полноразмерная 1λ:</b> ' + (full * 1000).toFixed(0) + ' мм (' + full.toFixed(3) + ' м)</p>' +
        '<p><b>Полуволновая ½λ (диполь):</b> ' + (dipole * 1000).toFixed(0) + ' мм (' + dipole.toFixed(3) + ' м)</p>' +
        '<p><b>Четвертьволновая ¼λ (штырь):</b> ' + (gp * 1000).toFixed(0) + ' мм (' + gp.toFixed(3) + ' м)</p>' +
        '<p><b>Укороченная (¼λ × 0.8):</b> ' + (short * 1000).toFixed(0) + ' мм (' + short.toFixed(3) + ' м)</p>';
}

// ============================================================
// 7. ДЛИНА ВОЛНЫ
// ============================================================
function calcWave() {
    const f = parseFloat(document.getElementById('waveFreq').value);
    if (!f || f <= 0) {
        document.getElementById('waveResult').innerHTML = '⚠️ Введите частоту > 0';
        return;
    }

    const lambda = (299.792458 / f).toFixed(3);
    document.getElementById('waveResult').innerHTML = '<b>λ =</b> ' + lambda + ' м (' + (lambda * 1000).toFixed(0) + ' мм)';
}

// ============================================================
// 8. КОНВЕРТЕР Вт ↔ дБм
// ============================================================
function toDBm() {
    const w = parseFloat(document.getElementById('powerVal').value);
    if (!w || w <= 0) {
        document.getElementById('powerResult').innerHTML = '⚠️ Введите мощность > 0';
        return;
    }
    const dbm = (10 * Math.log10(w * 1000)).toFixed(2);
    document.getElementById('powerResult').innerHTML = w.toFixed(2) + ' Вт = ' + dbm + ' дБм';
}

function toWatt() {
    const w = parseFloat(document.getElementById('powerVal').value);
    if (!w || w <= 0) {
        document.getElementById('powerResult').innerHTML = '⚠️ Введите мощность > 0';
        return;
    }
    const watt = (Math.pow(10, w / 10) / 1000).toFixed(3);
    document.getElementById('powerResult').innerHTML = w.toFixed(2) + ' дБм = ' + watt + ' Вт';
}

// ============================================================
// 9. КОЭФФИЦИЕНТ УКОРОЧЕНИЯ
// ============================================================
function calcShort() {
    const f = parseFloat(document.getElementById('shortFreq').value);
    const wireDiam = parseFloat(document.getElementById('shortWire').value);

    if (!f || f <= 0 || !wireDiam || wireDiam <= 0) {
        document.getElementById('shortResult').innerHTML = '⚠️ Заполните все поля';
        return;
    }

    const c = 299.792458;
    const lambda = c / f;
    const lambdaMm = lambda * 1000;
    const ratio = lambdaMm / wireDiam;

    let k;
    if (ratio >= 10000) k = 0.98;
    else if (ratio >= 1000) k = 0.97;
    else if (ratio >= 500) k = 0.965;
    else if (ratio >= 200) k = 0.96;
    else if (ratio >= 100) k = 0.955;
    else if (ratio >= 50) k = 0.95;
    else if (ratio >= 20) k = 0.94;
    else k = 0.92;

    const dipoleLen = lambda / 2 * k;

    document.getElementById('shortResult').innerHTML =
        '<p><b>λ/d =</b> ' + ratio.toFixed(0) + '</p>' +
        '<p><b>Коэффициент укорочения K =</b> ' + k.toFixed(3) + '</p>' +
        '<p><b>Длина диполя (½λ):</b> ' + (dipoleLen * 1000).toFixed(0) + ' мм (' + dipoleLen.toFixed(2) + ' м)</p>';
}

// ============================================================
// ТРЕУГОЛЬНАЯ АНТЕННА (ДЕЛЬТА-ПЕТЛЯ)
// ============================================================
function calcDelta() {
    const f = parseFloat(document.getElementById('deltaFreq').value);
    const k = parseFloat(document.getElementById('deltaK').value);

    if (!f || f <= 0) {
        document.getElementById('deltaResult').innerHTML = '⚠️ Введите частоту > 0';
        return;
    }
    if (!k || k <= 0 || k > 1) {
        document.getElementById('deltaResult').innerHTML = '⚠️ Коэффициент укорочения должен быть от 0.95 до 0.98';
        return;
    }

    const c = 299.792458;
    const lambda = c / f;
    const lambdaSm = lambda * 100; // в сантиметрах

    // Полный периметр рамки (длина провода)
    const perimeter = lambda * k;
    const perimeterSm = perimeter * 100;

    // Сторона равностороннего треугольника
    const side = perimeter / 3;
    const sideSm = side * 100;

    // Высота треугольника
    const height = side * Math.sqrt(3) / 2;
    const heightSm = height * 100;

    // Входное сопротивление (приблизительно)
    const impedance = 100 + 20 * (1 - k) * 100;

    let html = '<p><b>Частота f:</b> ' + f.toFixed(1) + ' МГц</p>';
    html += '<p><b>Длина волны λ:</b> ' + lambda.toFixed(2) + ' м (' + lambdaSm.toFixed(0) + ' см)</p>';
    html += '<p><b>Коэффициент укорочения K:</b> ' + k.toFixed(3) + '</p>';
    html += '<hr>';
    html += '<p><b>📐 Периметр рамки (длина провода):</b> ' + perimeter.toFixed(2) + ' м (' + perimeterSm.toFixed(0) + ' см)</p>';
    html += '<p><b>📐 Сторона треугольника:</b> ' + side.toFixed(2) + ' м (' + sideSm.toFixed(0) + ' см)</p>';
    html += '<p><b>📐 Высота треугольника:</b> ' + height.toFixed(2) + ' м (' + heightSm.toFixed(0) + ' см)</p>';
    html += '<hr>';
    html += '<p><b>⚡ Входное сопротивление (прибл.):</b> ' + impedance.toFixed(0) + ' Ом</p>';
    html += '<p><b>💡 Совет:</b> Для питания используйте согласующий трансформатор 4:1. Антенна имеет круговую диаграмму направленности.</p>';

    document.getElementById('deltaResult').innerHTML = html;
}   

