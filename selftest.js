'use strict';
// In-page checks for the main flows. Open the site with ?selftest=1 to run them on any device.
// The run works on a copy of the saved data and puts the original back when it finishes.
(async function () {
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const backup = JSON.stringify(DB), results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
    const reset = () => { Object.assign(DB, { bookings: [], parcels: [], profile: null, points: 0, lang: 'en', notes: [], follow: [], counter: [], saved: [], fares: null, advisory: null, waitlist: [], groups: [], promos: {}, staff: null, assign: {}, tripState: {} }); applyFares(); applyLang(); };
    const search = async (dest, pax, days, round) => {
        setDirection(false); setTripType(!!round); navigateTo('view-home');
        $('origin').value = 'PITX, Manila'; $('destination').value = dest; $('passengers').value = String(pax); $('date').value = addDays(todayLocal(), days); if (round) syncReturnMin();
        $('searchForm').requestSubmit(); await wait(1700);
    };
    const pickSeats = async (n) => {
        const date = S.leg === 0 ? S.search.date : S.search.ret;
        const tr = S.trips.find(x => BUS[x.kind].total - occupied(x.id, x.kind, date).size >= n);
        openSeatSelection(tr.id); await wait(250);
        [...document.querySelectorAll('#seatGrid button')].filter(b => !b.disabled).slice(0, n).forEach(b => b.click());
        confirmSeats(); await wait(750);
    };
    const fillAndPay = async (ok) => {
        for (let i = 0; i < S.search.pax; i++) $('paxName' + i).value = 'Test Rider ' + (i + 1);
        $('chkMobile').value = '09171234567'; if (!$('consent-privacy').checked) $('consent-privacy').click();
        $('payBtn').click(); await wait(350); finishPayment(ok); await wait(2800);
    };
    const tests = [
        ['Search shows four departures and a 7-day fare strip', async () => { await search('Daet, Camarines Norte', 1, 3); assert(currentView === 'view-results', 'not on results'); assert(S.trips.length === 4, 'expected 4 trips'); assert(document.querySelectorAll('#fareCal button').length === 7, 'fare strip'); }],
        ['Checkout total adds fares, discount, add-ons and fee', async () => {
            await search('Naga, Camarines Sur', 2, 3); await pickSeats(2);
            const leg = S.legs[0]; $('paxType1').value = 'senior'; $('addIns').checked = true; renderSummary();
            const want = leg.fare * 2 - leg.fare * DISCOUNT + leg.door + TERMINAL_FEE + INS_FEE * 2;
            assert(Math.abs(totals().total - want) < 0.01, `total ${totals().total} vs ${want}`);
        }],
        ['A failed payment books nothing and keeps the seats held', async () => { const before = DB.bookings.length; await fillAndPay(false); assert(currentView === 'view-checkout', 'left checkout'); assert(DB.bookings.length === before, 'booking was created'); assert(S.legs.length === 1, 'seats released'); }],
        ['A paid booking issues a ticket with a QR code', async () => { await fillAndPay(true); assert(currentView === 'view-ticket', 'no ticket'); assert(DB.bookings.length === 1, 'no booking saved'); assert($('tktQR').querySelector('canvas,img'), 'no QR'); const l = DB.bookings[0].legs[0]; assert(l.seats.every(x => occupied(l.tripId, l.kind, l.date).has(x)), 'seats not taken'); }],
        ['Scanner accepts the ticket and rejects an edited copy', async () => {
            DB.staff = { role: 'gate' }; const b = DB.bookings[0]; navigateTo('view-scan'); $('scanDate').value = b.legs[0].date;
            scanPick(b.ref, true); assert($('scanResult').innerText.startsWith('Not a valid ticket'), 'tampered code accepted');
            scanPick(b.ref); assert($('scanResult').innerText.startsWith('Valid ticket'), 'valid code refused');
            $('scanResult').querySelector('button').click(); assert($('scanResult').innerText.startsWith('Already boarded'), 'second scan not caught');
        }],
        ['The QR code on the ticket decodes to the signed payload', async () => { const b = DB.bookings[0]; viewTicket(b.ref); await wait(300); const cv = $('tktQR').querySelector('canvas'); assert(cv && window.jsQR, 'reader not loaded'); assert(decodeQR(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)) === qrPayload(b), 'decoded text differs'); }],
        ['Round trip, rebook, then cancel and approve the refund', async () => {
            await search('Daet, Camarines Norte', 1, 4, true); await pickSeats(1); await pickSeats(1); assert(S.legs.length === 2, 'two legs'); await fillAndPay(true);
            const b = DB.bookings[0], old = b.legs[1].date; navigateTo('view-trips'); rebookTrip(b.ref); await wait(150); $('rbLeg').value = '1'; $('rbDate').value = addDays(old, 3); $('confirmOk').click(); await wait(400);
            assert(b.legs[1].date === addDays(old, 3) && b.rebooked, 'not rebooked');
            cancelTrip(b.ref); await wait(150); $('confirmOk').click(); await wait(400); assert(b.status === 'cancelled' && b.refundStatus === 'pending', 'no refund request');
            opsApproveRefund(b.ref); assert(b.refundStatus === 'paid', 'refund not approved');
        }],
        ['Promo codes: built-in, switched off, and newly created', async () => {
            await search('Pio Duran', 1, 3); await pickSeats(1); const base = totals().total;
            $('promoInput').value = 'BICOL10'; applyPromo(); assert(totals().total < base, 'BICOL10 gave no discount');
            DB.promos.BICOL10 = { active: false }; applyPromo(); assert(totals().total === base, 'switched-off code still works');
            DB.promos.TEST20 = { pct: 0.2, label: '20% off fares', active: true }; $('promoInput').value = 'TEST20'; applyPromo(); assert(totals().total < base, 'new code rejected');
            navigateTo('view-home');
        }],
        ['A counter sale takes the seat off the passenger map, and a void frees it', async () => {
            DB.staff = { role: 'dispatcher' }; navigateTo('view-ops'); $('opsDate').value = addDays(todayLocal(), 2); $('opsDir').value = 'out'; S.manifest = null; renderOps();
            const r = opsTrips()[0]; opsManifest(r.tr.id); await wait(100); const n = occupied(r.tr.id, r.tr.kind, r.date).size; $('ctName').value = 'Walk In';
            $('opsManifest').querySelector('form.sell').requestSubmit(); await wait(100); assert(occupied(r.tr.id, r.tr.kind, r.date).size === n + 1, 'seat not taken');
            opsVoid(DB.counter[0].ref); assert(occupied(r.tr.id, r.tr.kind, r.date).size === n, 'seat not freed');
        }],
        ['A fare change in the console reaches the passenger app', async () => { $('fare_8_std').value = '990'; opsSaveFares(); assert(ROUTES['Daet, Camarines Norte'].std === 990, 'fare not saved'); assert(document.querySelector('[data-feat^="Daet"]').textContent.includes('990'), 'home card not updated'); opsResetFares(); assert(ROUTES['Daet, Camarines Norte'].std === BASE_FARES['Daet, Camarines Norte'].std, 'reset failed'); }],
        ['The waitlist alerts when seats open', async () => { const r = opsTrips()[1]; DB.waitlist.push({ key: 'x', tripId: r.tr.id, kind: r.tr.kind, date: r.date, pax: 1, mobile: '09171234567', route: 'test', ts: 1 }); const n = DB.notes.length; checkWaitlist(); assert(DB.waitlist.length === 0 && DB.notes.length === n + 1, 'no alert'); }],
        ['Sample trip, guided tour and route map load', async () => { const b = loadSample(true); assert(b && DB.bookings.some(x => x.demo), 'no sample'); await tourGo(6); await wait(400); assert(currentView === 'view-track' && document.querySelector('#routeMap svg'), 'map missing'); tourEnd(); await wait(300); }],
        ['Help chat answers a fare question', async () => { const [a] = chatAnswer('magkano pamasahe papuntang naga'); assert(a.includes('Naga') && a.includes('Standard'), a); }],
        ['Filipino switches on and English comes back', async () => { navigateTo('view-home'); toggleLang(); await wait(150); assert($('btnSearchSubmit').innerText.trim().toUpperCase() === 'MAGHANAP NG BUS', 'not translated'); toggleLang(); await wait(150); assert($('btnSearchSubmit').innerText.trim().toUpperCase() === 'SEARCH BUSES', 'not restored'); }],
        ['No screen scrolls sideways', async () => { DB.staff = { role: 'dispatcher' }; for (const v of ['view-home', 'view-trips', 'view-schedules', 'view-track', 'view-cargo', 'view-help', 'view-account', 'view-ops', 'view-legal', 'view-operators']) { navigateTo(v); await wait(60); assert(document.documentElement.scrollWidth <= window.innerWidth, v + ' overflows'); } }]
    ];

    const panel = document.createElement('div');
    panel.setAttribute('data-notr', '');
    panel.style.cssText = 'position:fixed;inset:auto 12px 12px 12px;z-index:400;max-width:560px;margin:0 auto;max-height:60vh;overflow:auto;background:#0f172a;color:#e2e8f0;border-radius:16px;padding:16px;font:13px/1.5 Inter,system-ui,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.4)';
    document.body.appendChild(panel);
    const draw = (done) => { panel.innerHTML = `<div style="font-weight:800;margin-bottom:8px">Self-test ${done ? 'finished' : 'running'}: ${results.filter(r => r.ok).length} passed, ${results.filter(r => !r.ok).length} failed of ${tests.length}</div>` + results.map(r => `<div style="color:${r.ok ? '#6ee7b7' : '#fca5a5'}">${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? '' : ' — ' + String(r.err).replace(/</g, '&lt;')}</div>`).join('') + (done ? '<button onclick="location.href=location.pathname" style="margin-top:10px;background:#d4af37;color:#0f172a;font-weight:800;border-radius:10px;padding:8px 14px">Close and reload</button>' : ''); };
    reset();
    for (const [name, fn] of tests) {
        try { await fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, err: e.message }); }
        document.querySelectorAll('.modal').forEach(m => { if (!m.classList.contains('hidden')) closeModal(m.id); });
        draw(false); await wait(350);
    }
    // put the visitor's own data back
    Object.keys(DB).forEach(k => delete DB[k]); Object.assign(DB, JSON.parse(backup)); save(); applyFares(); stopHold && stopHold();
    S.legs = []; S.leg = 0; S.ticket = null; navigateTo('view-home'); applyLang(); updateBell(); updateAuthUI();
    draw(true);
    window.__selftest = { passed: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok), total: tests.length };
})();
