'use strict';

/* ------------------------------------------------------------------ config */

// TODO: replace these placeholders with the company's real pages.
const SOCIAL = {
    facebook:  'https://www.facebook.com/',
    tiktok:    'https://www.tiktok.com/',
    instagram: 'https://www.instagram.com/',
    messenger: 'https://www.messenger.com/'
};

const TERMINAL_FEE = 30, DOOR_FEE = 50, DISCOUNT = 0.2, REBOOK_FEE = 100;
// add-ons, per trip: extra baggage per 10 kg, one pet in a carrier, insurance per passenger
const BAG_FEE = 150, PET_FEE = 150, INS_FEE = 40;
// Demo only: a real ticket is signed on the server with a private key the phone never sees.
const QR_SECRET = 'demo-signing-key';
const MERCHANT = 'Biyahe Bicol Demo Lines';
const HOLD_SECONDS = 600;      // seats are held this long at checkout
const CLOSE_MIN = 30;          // online booking closes this long before departure
const CHANGE_CUTOFF_H = 4;     // rebook / cancel up to this many hours before departure

// offset: minutes after the Manila departure that the bus reaches this stop; adj: fare difference
const ORIGINS = {
    'PITX, Manila':       { offset: 0,  adj: 0 },
    'Cubao, Quezon City': { offset: 0,  adj: 0 },
    'Turbina, Calamba':   { offset: 75, adj: -150 }
};
const ROUTES = {
    'Daet, Camarines Norte': { no: 8, fc: 1250, std: 850,  mins: 570 },
    'Naga, Camarines Sur':   { no: 9, fc: 1250, std: 950,  mins: 600 },
    'Jose Panganiban':       { no: 7, fc: 1350, std: 950,  mins: 630 },
    'Pio Duran':             { no: 6, fc: 1500, std: 1100, mins: 720 }
};
const BUS = {
    fc:  { className: 'First Class 2+1', total: 23 },
    std: { className: 'Standard 2+2',    total: 44 }
};
const DEPS = {
    out: [{ t: '07:00 AM', kind: 'std' }, { t: '08:00 PM', kind: 'fc' }, { t: '09:30 PM', kind: 'std' }, { t: '10:30 PM', kind: 'fc' }],
    ret: [{ t: '06:00 AM', kind: 'std' }, { t: '06:00 PM', kind: 'fc' }, { t: '08:00 PM', kind: 'std' }, { t: '09:00 PM', kind: 'fc' }]
};
const FARE_TYPES = { regular: 'Regular', senior: 'Senior Citizen (20% off)', pwd: 'PWD (20% off)', student: 'Student (20% off)' };
const FARE_SHORT = { regular: '', senior: 'Senior', pwd: 'PWD', student: 'Student' };
const PROMOS = {
    BICOL10: { pct: 0.10, label: '10% off fares' },
    SUPER50: { off: 50,   label: '₱50 off' }
};
const TERMINALS = [
    { name: 'PITX Manila',      addr: 'Counter 11, 2nd Floor, Parañaque Integrated Terminal Exchange', hours: 'Open 24 hours',                 q: 'Parañaque Integrated Terminal Exchange' },
    { name: 'Cubao EDSA',       addr: 'Aurora Blvd Terminal, Quezon City',                             hours: '4:00 AM to 11:30 PM',           q: 'Aurora Boulevard Cubao bus terminal Quezon City' },
    { name: 'Turbina, Calamba', addr: 'Turbina Bus Stop, Calamba, Laguna',                             hours: 'Boarding stop, 5:00 AM to 12 MN', q: 'Turbina bus terminal Calamba Laguna' },
    { name: 'Daet Hub',         addr: 'Central Terminal, Daet, Camarines Norte',                       hours: '4:00 AM to 10:00 PM',           q: 'Daet Central Terminal Camarines Norte' },
    { name: 'Naga',             addr: 'Bicol Central Station, Naga City',                              hours: '4:00 AM to 10:00 PM',           q: 'Bicol Central Station Naga City' },
    { name: 'Jose Panganiban',  addr: 'Town terminal, Jose Panganiban, Camarines Norte',               hours: '4:00 AM to 9:00 PM',            q: 'Jose Panganiban Camarines Norte' },
    { name: 'Pio Duran',        addr: 'Town terminal, Pio Duran, Albay',                               hours: '4:00 AM to 9:00 PM',            q: 'Pio Duran Albay' }
];
const FAQ = [
    ['How early should I be at the terminal?', 'At least 30 minutes before departure. Boarding closes 10 minutes before the bus leaves, and a no-show ticket is forfeited.'],
    ['Do I need to print my ticket?', 'No. Show the QR code from My Trips at the turnstile and again at the bus door. The ticket is saved on your phone and opens without a signal.'],
    ['How do senior, PWD and student discounts work?', 'Pick the fare type for each passenger at checkout to get 20% off the fare. Each discounted passenger shows the matching valid ID at boarding, or pays the fare difference.'],
    ['Can I change my travel date?', 'Yes, up to 4 hours before departure, for ₱100 per passenger. Open My Trips, tap Rebook and choose the new date. If your seats are taken on the new date you are moved to the nearest free ones.'],
    ['How do refunds work?', 'Cancel in My Trips. You get 80% back when you cancel 24 hours or more before departure, 50% between 24 and 4 hours, and nothing after that. Refunds reach the original payment method in 3 to 5 banking days.'],
    ['What if my trip is cancelled by weather?', 'When the operator cancels a trip, you choose a free rebooking to any date within 30 days or a full refund.'],
    ['Can children ride free?', 'One child under 3 feet tall rides free on the lap of each paying adult. Children who take a seat pay the full fare.'],
    ['How do loyalty points work?', 'Sign in before paying and you earn 1 point for every ₱20 spent. Each point is worth ₱1 off a later booking.']
];
const FIDS = [
    { id: 'SL-802', route: 'Manila ➔ Daet',           sched: '08:00 PM', eta: '08:00 PM', status: 'BOARDING', loc: 'PITX Bay 4' },
    { id: 'DX-802', route: 'Daet ➔ Manila',           sched: '06:00 PM', eta: '06:25 PM', status: 'DELAYED',  loc: 'Atimonan Zigzag' },
    { id: 'SL-902', route: 'Manila ➔ Naga',           sched: '08:00 PM', eta: '08:00 PM', status: 'ON TIME',  loc: 'Cubao Terminal' },
    { id: 'DX-701', route: 'J. Panganiban ➔ Manila',  sched: '06:00 AM', eta: '05:50 AM', status: 'EARLY',    loc: 'SLEX Turbina' },
    { id: 'SL-603', route: 'Manila ➔ Pio Duran',      sched: '09:30 PM', eta: '09:30 PM', status: 'ON TIME',  loc: 'PITX Bay 5' },
    { id: 'SL-804', route: 'Manila ➔ Daet',           sched: '10:30 PM', eta: '10:30 PM', status: 'ON TIME',  loc: 'PITX Bay 6' },
    { id: 'DX-904', route: 'Naga ➔ Manila',           sched: '09:00 PM', eta: '09:00 PM', status: 'ON TIME',  loc: 'Naga Terminal' }
];
const STATUS_CLASS = {
    'BOARDING': 'bg-green-500/20 text-green-400 border-green-500/30',
    'DELAYED':  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'ON TIME':  'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'EARLY':    'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

/* ------------------------------------------------------- storage and state */

const STORE = 'bb_site_v1';
const DB = Object.assign({ bookings: [], parcels: [], profile: null, points: 0, lang: 'en', notes: [], follow: [], counter: [], saved: [], fares: null, advisory: null },
    (() => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } })());
// fares the operator changed in the console override the built-in ones
const BASE_FARES = JSON.parse(JSON.stringify(ROUTES));
function applyFares() { Object.keys(ROUTES).forEach(d => { const f = (DB.fares && DB.fares[d]) || BASE_FARES[d]; ROUTES[d].fc = f.fc; ROUTES[d].std = f.std; }); }
applyFares();
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(DB)); } catch (e) { /* private mode: keep going in memory */ } };

const S = {
    search: { origin: '', dest: '', date: '', ret: '', pax: 1, round: false },
    round: false, rev: false, legs: [], leg: 0, trips: [], filter: 'all', assign: [],
    sel: null, promo: null, usePoints: false, holdEnd: 0, holdTimer: null, ticket: null
};

/* ---------------------------------------------------------------- language */

// The Filipino dictionary lives in fil.js. Text is written in English and translated in the DOM,
// so switching back restores the original wording. t() only marks a string as user-facing.
const t = (s) => s;

const trOrig = new WeakMap();
function trText(str) {
    if (FIL[str]) return FIL[str];
    for (const [re, to] of FIL_RX) if (re.test(str)) return str.replace(re, to);
    // "a · b · c" and "a | b | c" lines are translated piece by piece
    for (const sep of [' · ', ' | ']) {
        if (!str.includes(sep)) continue;
        let hit = false;
        const parts = str.split(sep).map(p => { const f = trText(p); if (f !== null) hit = true; return f === null ? p : f; });
        if (hit) return parts.join(sep);
    }
    return null;
}
function trNode(n) {
    const raw = trOrig.has(n) ? trOrig.get(n) : n.nodeValue, key = raw.replace(/\s+/g, ' ').trim();
    if (!key) return;
    if (DB.lang === 'fil') {
        const f = trText(key);
        if (f === null) return;
        if (!trOrig.has(n)) trOrig.set(n, raw);
        const lead = raw.match(/^\s*/)[0] ? ' ' : '', tail = raw.match(/\s*$/)[0] ? ' ' : '';
        if (n.nodeValue !== lead + f + tail) n.nodeValue = lead + f + tail;
    } else if (trOrig.has(n)) { n.nodeValue = trOrig.get(n); trOrig.delete(n); }
}
function trAttr(el) {
    ['placeholder', 'aria-label', 'title'].forEach(a => {
        if (!el.hasAttribute(a)) return;
        const k = 'en' + a.replace('-', ''), en = el.dataset[k] || el.getAttribute(a);
        const f = DB.lang === 'fil' ? trText(en) : null;
        if (f) { el.dataset[k] = en; el.setAttribute(a, f); } else if (el.dataset[k]) el.setAttribute(a, en);
    });
}
function trTree(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
        acceptNode: (n) => n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.hasAttribute('data-notr')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    if (root.nodeType === 1) trAttr(root);
    for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === 3 ? trNode(n) : trAttr(n);
}
function applyLang() {
    trTree(document.body);
    document.querySelectorAll('[data-lang-toggle]').forEach(b => b.textContent = DB.lang === 'fil' ? 'FIL' : 'EN');
    document.documentElement.lang = DB.lang === 'fil' ? 'fil' : 'en';
}
function toggleLang() {
    DB.lang = DB.lang === 'fil' ? 'en' : 'fil'; save(); applyLang();
    if (currentView === 'view-account') renderAccount();
    toast('Language set to English');
}

/* ----------------------------------------------------------------- helpers */

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const short = (s) => s.split(',')[0];
const formatPHP = (amount) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, currencyDisplay: 'narrowSymbol' }).format(amount);

// Dates are handled in local time (toISOString is UTC and gives yesterday before 8 AM in Manila)
const isoLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayLocal = () => isoLocal(new Date());
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return isoLocal(d); };
const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const parseTime = (str) => { const [time, mod] = str.split(' '); const [h, m] = time.split(':').map(Number); return (h % 12) * 60 + m + (mod === 'PM' ? 720 : 0); };
const fmtTime = (mins) => { const x = ((mins % 1440) + 1440) % 1440; return `${pad(Math.floor(x / 60) % 12 || 12)}:${pad(x % 60)} ${x >= 720 ? 'PM' : 'AM'}`; };
const addMinutes = (timeStr, mins) => fmtTime(parseTime(timeStr) + mins);
const depDate = (iso, depStr) => new Date(new Date(iso + 'T00:00:00').getTime() + parseTime(depStr) * 60000);
const durText = (m) => `${Math.floor(m / 60)}h ${pad(m % 60)}m`;

function toast(msg, kind) {
    const el = document.createElement('div');
    el.className = `pointer-events-auto max-w-sm w-full sm:w-auto text-sm font-bold px-4 py-3 rounded-xl shadow-xl text-white animate-slide-up ${kind === 'error' ? 'bg-brand-red' : 'bg-slate-900'}`;
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3200);
}

/* -------------------------------------------------------------- navigation */

const VIEWS = ['view-home', 'view-results', 'view-checkout', 'view-ticket', 'view-trips', 'view-schedules', 'view-track', 'view-cargo', 'view-help', 'view-account', 'view-ops', 'view-scan'];
const TAB_OF = { 'view-results': 'view-home', 'view-checkout': 'view-home', 'view-ticket': 'view-trips', 'view-cargo': 'view-account', 'view-help': 'view-account', 'view-ops': 'view-account', 'view-scan': 'view-account' };
let currentView = 'view-home';

function guard(view) {
    if (!VIEWS.includes(view)) return 'view-home';
    if (view === 'view-checkout' && S.legs.length === 0) view = 'view-results';
    if (view === 'view-results' && !S.search.dest) return 'view-home';
    if (view === 'view-ticket' && !S.ticket) return 'view-trips';
    return view;
}

function showView(view) {
    view = guard(view);
    // walking away from checkout releases the held seats
    if (currentView === 'view-checkout' && view !== 'view-checkout' && view !== 'view-ticket') releaseSelection();
    if (currentView === 'view-scan' && view !== 'view-scan') stopCamera();
    currentView = view;
    VIEWS.forEach(v => { const el = $(v); el.classList.toggle('hidden', v !== view); el.classList.toggle('block', v === view); });
    const tab = TAB_OF[view] || view;
    document.querySelectorAll('#tabbar .tab').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('active', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); });
    $('mobileMenu').classList.add('hidden');
    refreshView();
    window.scrollTo({ top: 0, behavior: 'instant' });
    return view;
}

function refreshView() {
    if (currentView === 'view-results') renderResults();
    if (currentView === 'view-checkout') renderSummary();
    if (currentView === 'view-trips') renderTrips();
    if (currentView === 'view-schedules') renderSchedules();
    if (currentView === 'view-track') renderFIDS();
    if (currentView === 'view-home') { renderFeatured(); renderAdvisory(); }
    if (currentView === 'view-help') renderAdvisory();
    if (currentView === 'view-cargo') { prefillCargo(); renderCargoQuote(); }
    if (currentView === 'view-account') renderAccount();
    if (currentView === 'view-ops') renderOps();
    if (currentView === 'view-scan') renderScan();
}

function navigateTo(view) {
    const shown = showView(view);
    const hash = '#' + shown.replace('view-', '');
    if (location.hash !== hash) history.pushState({ view: shown }, '', hash);
}
window.addEventListener('popstate', (e) => showView((e.state && e.state.view) || 'view-' + (location.hash.slice(1) || 'home')));

function menuGo(view) { navigateTo(view); }
function toggleMobileMenu() { const open = !$('mobileMenu').classList.toggle('hidden'); $('menuBtn').setAttribute('aria-expanded', open); }

function handleNavClick(e, sectionId) {
    if (e && e.preventDefault) e.preventDefault();
    if (currentView !== 'view-home') navigateTo('view-home');
    setTimeout(() => {
        const el = $(sectionId);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - $('navbar').offsetHeight, behavior: 'smooth' });
    }, 30);
}

/* ------------------------------------------------------------------ modals */

const modalTimers = {};
function openModal(id) {
    const modal = $(id);
    clearTimeout(modalTimers[id]);
    if (id === 'authModal') resetAuthModal();
    if (id === 'manageBookingModal') $('mbError').innerText = '';
    modal.classList.remove('hidden');
    void modal.offsetWidth; // force reflow
    modal.classList.remove('opacity-0');
    const content = modal.querySelector('div[id$="Content"]');
    if (content) { content.classList.remove('scale-95', 'translate-y-8'); content.classList.add('scale-100', 'translate-y-0'); }
    if (!modal._returnTo) modal._returnTo = document.activeElement;
    setTimeout(() => { if (!modal.contains(document.activeElement)) { const f = focusables(modal)[0]; if (f) f.focus(); } }, 60);
}
const focusables = (root) => [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && el.type !== 'hidden' && el.offsetParent !== null);
const openModals = () => [...document.querySelectorAll('.modal')].filter(m => !m.classList.contains('hidden') && !m.classList.contains('opacity-0'));
function closeModal(id) {
    const modal = $(id);
    modal.classList.add('opacity-0');
    const content = modal.querySelector('div[id$="Content"]');
    if (content) { content.classList.remove('scale-100', 'translate-y-0'); content.classList.add('scale-95', 'translate-y-8'); }
    clearTimeout(modalTimers[id]);
    modalTimers[id] = setTimeout(() => modal.classList.add('hidden'), 300);
    if (modal._returnTo) { try { modal._returnTo.focus({ preventScroll: true }); } catch (e) { /* element is gone */ } modal._returnTo = null; }
}
function openConfirm({ title, body, okText, cancelText, onOk }) {
    $('confirmTitle').textContent = title;
    $('confirmBody').innerHTML = body;
    $('confirmOk').textContent = okText || 'Confirm';
    $('confirmCancel').textContent = cancelText || 'Back';
    $('confirmOk').onclick = () => { if (onOk() !== false) closeModal('confirmModal'); };
    openModal('confirmModal');
}

/* -------------------------------------------------------------------- auth */

function resetAuthModal() {
    $('authStep1').classList.remove('hidden');
    $('authStep2').classList.add('hidden');
    $('authError').innerText = ''; $('otpError').innerText = '';
    $('authHint').innerText = 'Enter your mobile number to sign in or create an account instantly via OTP.';
    document.querySelectorAll('.otp-input').forEach(i => i.value = '');
}
function initOTPInputs() {
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/\D/g, '');
            if (input.value.length === 1 && index < inputs.length - 1) inputs[index + 1].focus();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.value === '' && index > 0) inputs[index - 1].focus();
            if (e.key === 'Enter') verifyOTP();
        });
    });
    $('authMobile').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendOTP(); });
}
const authDigits = () => $('authMobile').value.replace(/\D/g, '').replace(/^0/, '');

function sendOTP() {
    if (!/^9\d{9}$/.test(authDigits())) { $('authError').innerText = 'Enter your 10-digit mobile number, e.g. 917 123 4567.'; return; }
    $('authStep1').classList.add('hidden');
    $('authStep2').classList.remove('hidden');
    $('authHint').innerText = 'Enter the 4-digit code sent to +63 ' + authDigits() + '. (Demo: any 4 digits work.)';
    document.querySelector('.otp-input').focus();
}
function verifyOTP() {
    const inputs = [...document.querySelectorAll('.otp-input')];
    const empty = inputs.find(i => i.value === '');
    if (empty) { $('otpError').innerText = 'Enter all 4 digits.'; empty.focus(); return; }
    const mobile = '0' + authDigits();
    if (!DB.profile || DB.profile.mobile !== mobile) DB.profile = { mobile, first: '', last: '' };
    save();
    closeModal('authModal');
    updateAuthUI();
    toast('Signed in as ' + mobile);
    if (currentView === 'view-checkout') { autofillCheckout(); renderSummary(); }
    if (currentView === 'view-account') renderAccount();
}
function signOut() { DB.profile = null; save(); updateAuthUI(); renderAccount(); toast('Signed out'); }
function accountClick() { DB.profile ? navigateTo('view-account') : openModal('authModal'); }

function updateAuthUI() {
    const p = DB.profile, btn = $('btnSignIn');
    $('signInText').textContent = p ? (p.first || t('Account')) : t('Sign In');
    btn.querySelector('i').className = p ? 'fa-solid fa-user-check' : 'fa-regular fa-user';
    btn.classList.toggle('bg-brand-blue', !p); btn.classList.toggle('hover:bg-slate-800', !p);
    btn.classList.toggle('bg-green-600', !!p); btn.classList.toggle('hover:bg-green-700', !!p);
    $('btnSignInMobile').innerHTML = p ? `<i class="fa-solid fa-user-check mr-2"></i> ${esc(p.first || t('Account'))}` : '<i class="fa-regular fa-user mr-2"></i> Sign In / Register';
    $('chkLoginBtn').classList.toggle('hidden', !!p);
}

/* ------------------------------------------------------------------ search */

function setTripType(round) {
    S.round = round;
    $('tripOne').className = 'px-3 py-1.5 rounded-full whitespace-nowrap ' + (round ? 'text-slate-500' : 'bg-white shadow text-brand-blue');
    $('tripRound').className = 'px-3 py-1.5 rounded-full whitespace-nowrap ' + (round ? 'bg-white shadow text-brand-blue' : 'text-slate-500');
    const r = $('retDate');
    r.disabled = !round; r.required = round;
    $('retWrap').classList.toggle('opacity-40', !round);
    if (round) syncReturnMin(); else r.value = '';
}
// rev = travelling from Bicol to Manila: the two fields swap places and labels
function setDirection(rev) {
    if (S.rev === rev) return;
    S.rev = rev;
    const a = $('originCell'), b = $('destCell');
    a.parentNode.insertBefore(rev ? b : a, rev ? a : b);
    $('originLbl').textContent = rev ? 'Destination' : 'Origin';
    $('destLbl').textContent = rev ? 'Origin' : 'Destination';
    $('swapLbl').textContent = rev ? 'Going to Manila. Tap to switch to Bicol-bound' : 'Going to Bicol. Tap to switch to Manila-bound';
}
function swapDirection() { setDirection(!S.rev); }
function syncReturnMin() {
    const d = $('date').value || todayLocal(), r = $('retDate');
    r.min = d;
    if (S.round && (!r.value || r.value < d)) r.value = addDays(d, 2);
}

function prefillSearch(origin, dest, round, rev) {
    $('origin').value = origin;
    $('destination').value = dest;
    if (!$('date').value) $('date').value = todayLocal();
    if (round !== undefined) setTripType(round);
    setDirection(!!rev);
    handleNavClick(null, 'section-home');
    setTimeout(() => {
        const btn = $('btnSearchSubmit');
        btn.classList.add('ring-4', 'ring-brand-red', 'ring-opacity-60');
        setTimeout(() => btn.classList.remove('ring-4', 'ring-brand-red', 'ring-opacity-60'), 1000);
    }, 600);
}

function handleSearch(e) {
    e.preventDefault();
    const date = $('date').value, ret = $('retDate').value;
    if (date < todayLocal()) { toast('Pick a departure date from today onward.', 'error'); return; }
    if (S.round && ret < date) { toast('The return date cannot be before the departure date.', 'error'); return; }
    S.search = { origin: $('origin').value, dest: $('destination').value, date, ret: S.round ? ret : '', pax: parseInt($('passengers').value), round: S.round, rev: S.rev };
    S.legs = []; S.leg = 0; S.filter = 'all';
    openModal('searchModal');
    setTimeout(() => { closeModal('searchModal'); setTimeout(() => navigateTo('view-results'), 300); }, 1100);
}

/* ------------------------------------------------------- trips and seating */

function tripsFor(origin, dest, dir) {
    const r = ROUTES[dest], o = ORIGINS[origin];
    return DEPS[dir].map((d, i) => {
        const durMin = r.mins + (d.kind === 'std' ? 30 : 0) - o.offset;
        const depMin = parseTime(d.t) + (dir === 'out' ? o.offset : 0);
        return {
            id: `${dir === 'out' ? 'SL' : 'DX'}-${r.no}0${i + 1}`, dir, kind: d.kind, className: BUS[d.kind].className,
            dep: fmtTime(depMin), arr: fmtTime(depMin + durMin), plus: Math.floor((depMin + durMin) / 1440), durMin,
            fare: r[d.kind] + o.adj, from: dir === 'out' ? origin : dest, to: dir === 'out' ? dest : origin
        };
    });
}

// One stable seat map per bus and date: seeded, so it is the same on every open and after a reload.
function hashStr(s) { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; }
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }

function occupied(tripId, kind, date, exceptRef) {
    const r = rng(hashStr(tripId + '|' + date)), total = BUS[kind].total;
    const nums = Array.from({ length: total }, (_, i) => pad(i + 1));
    for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
    const set = new Set(nums.slice(0, Math.floor(total * (0.3 + r() * 0.6))));
    DB.bookings.forEach(b => {
        if (b.status === 'cancelled' || b.ref === exceptRef) return;
        b.legs.forEach(l => { if (l.tripId === tripId && l.date === date) l.seats.forEach(x => set.add(x)); });
    });
    DB.counter.forEach(c => { if (c.tripId === tripId && c.date === date) set.add(c.seat); });   // sold at the terminal counter
    return set;
}

function setFilter(f) { S.filter = f; renderResults(); }

function renderResults() {
    const s = S.search;
    if (!s.dest) return;
    const dir = (S.leg === 0) !== !!s.rev ? 'out' : 'ret', date = S.leg === 0 ? s.date : s.ret;
    S.trips = tripsFor(s.origin, s.dest, dir);
    const from = dir === 'out' ? s.origin : s.dest, to = dir === 'out' ? s.dest : s.origin;

    $('resStep').textContent = s.round ? t(S.leg === 0 ? 'Step 1 of 2 · Choose your outbound trip' : 'Step 2 of 2 · Choose your return trip') : '';
    $('resTitle').innerHTML = `<span>${esc(short(from))}</span> <i class="fa-solid fa-arrow-right-long text-slate-300 text-lg"></i> <span>${esc(short(to))}</span>`;
    $('resMeta').innerHTML = `<i class="fa-regular fa-calendar mr-1 text-brand-red"></i> ${fmtDate(date)} &nbsp;|&nbsp; <i class="fa-solid fa-users mr-1 text-brand-red"></i> ${s.pax} ${s.pax === 1 ? 'Passenger' : 'Passengers'}${s.round ? ' &nbsp;|&nbsp; ' + t('Round Trip') : ''}`;
    document.querySelectorAll('#resFilters button').forEach(b => {
        const on = b.dataset.f === S.filter;
        b.className = 'px-4 py-2 rounded-full border ' + (on ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-slate-600 border-slate-200');
    });

    const now = Date.now();
    let anyOpen = false;
    const cards = S.trips.filter(tr => S.filter === 'all' || tr.kind === S.filter).map(tr => {
        const left = BUS[tr.kind].total - occupied(tr.id, tr.kind, date).size;
        const closed = depDate(date, tr.dep).getTime() - now < CLOSE_MIN * 60000;
        const fc = tr.kind === 'fc';
        let btnTxt = t('Select Seats'), dis = false;
        if (closed) { btnTxt = t('Booking Closed'); dis = true; }
        else if (left === 0) { btnTxt = t('Sold Out'); dis = true; }
        else if (left < s.pax) { btnTxt = `Only ${left} seat${left === 1 ? '' : 's'} left`; dis = true; }
        if (!dis) anyOpen = true;
        const leftTxt = closed ? 'Departed or boarding' : left === 0 ? 'Sold out' : left < 10 ? `Almost full (${left} left)` : `${left} seats left`;
        const leftCls = closed ? 'text-slate-400' : left < 10 ? 'text-orange-500' : 'text-green-600';
        return `
        <div class="card shadow-md overflow-hidden transition-all ${dis ? 'opacity-70' : 'hover:border-brand-blue hover:shadow-lg'}">
            <div class="p-5 md:p-8 flex flex-col md:flex-row gap-5 md:gap-6 items-center">
                <div class="flex-1 w-full flex justify-between md:justify-start md:gap-10 items-center">
                    <div class="text-left">
                        <div class="text-xl md:text-2xl font-black text-slate-800">${tr.dep}</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">${t('Departure')}</div>
                        <div class="text-sm font-medium text-slate-600 mt-1">${esc(short(tr.from))}</div>
                    </div>
                    <div class="flex flex-col items-center flex-1 px-3">
                        <div class="text-[11px] text-slate-400 font-medium mb-2">${durText(tr.durMin)}</div>
                        <div class="w-full relative flex items-center justify-center">
                            <div class="h-0.5 w-full bg-slate-200 rounded-full"></div>
                            <i class="fa-solid fa-bus absolute ${fc ? 'text-brand-blue' : 'text-slate-400'} bg-white px-2 text-base"></i>
                        </div>
                        <div class="text-[10px] text-slate-500 font-bold mt-2 font-mono">${tr.id}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xl md:text-2xl font-black text-slate-800">${tr.arr}</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">${t('Arrival')}${tr.plus ? ' (+1d)' : ''}</div>
                        <div class="text-sm font-medium text-slate-600 mt-1">${esc(short(tr.to))}</div>
                    </div>
                </div>
                <div class="w-px h-24 bg-slate-200 hidden md:block"></div>
                <div class="flex-shrink-0 w-full md:w-60 flex md:flex-col items-center md:items-end justify-between gap-3 md:gap-0">
                    <div class="md:text-right">
                        <div class="${fc ? 'bg-brand-blue text-white' : 'bg-slate-200 text-slate-700'} inline-block px-3 py-1 rounded-md text-[10px] font-bold mb-2 tracking-wide uppercase">${tr.className}</div>
                        <div class="text-2xl md:text-3xl font-black ${fc ? 'text-brand-red' : 'text-slate-800'}">${formatPHP(tr.fare)}</div>
                        <div class="text-xs text-slate-500 md:mb-3 font-medium">${fc ? '<i class="fa-solid fa-restroom text-slate-400"></i> CR, USB, Wi-Fi' : '<i class="fa-solid fa-snowflake text-blue-400"></i> Fully airconditioned'}</div>
                    </div>
                    <div class="w-40 md:w-full text-center md:text-right">
                        <button ${dis ? 'disabled' : ''} onclick="openSeatSelection('${tr.id}')" class="${fc ? 'btn-red' : 'btn-blue'} w-full py-3 text-sm">${btnTxt}</button>
                        <div class="text-[10px] font-bold ${leftCls} mt-2 uppercase tracking-wide">${leftTxt}</div>
                    </div>
                </div>
            </div>
        </div>`;
    });
    if (!anyOpen && S.filter === 'all') {
        cards.unshift(`<div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <p class="text-sm text-amber-900 font-medium"><i class="fa-solid fa-circle-info text-amber-500 mr-2"></i>No bookable trips are left on ${fmtDate(date)} for ${s.pax} passenger${s.pax === 1 ? '' : 's'}.</p>
            <button onclick="shiftDate(1)" class="btn-blue px-5 py-3 text-sm whitespace-nowrap">Try the next day</button></div>`);
    }
    $('resultsList').innerHTML = cards.join('');
}

function shiftDate(n) {
    const s = S.search;
    if (S.leg === 0) { s.date = addDays(s.date, n); $('date').value = s.date; if (s.round && s.ret < s.date) { s.ret = s.date; $('retDate').value = s.ret; } }
    else { s.ret = addDays(s.ret, n); $('retDate').value = s.ret; }
    renderResults();
}

function openSeatSelection(tripId) {
    const trip = S.trips.find(x => x.id === tripId);
    if (!trip) return;
    const date = S.leg === 0 ? S.search.date : S.search.ret;
    S.sel = { trip, date, seats: [], door: 0 };
    $('seatModalSubtitle').innerText = `${trip.id} | ${trip.className} | ${formatPHP(trip.fare)} per seat`;
    $('maxSeatIndicator').innerText = S.search.pax;
    $('proceedLabel').textContent = t(S.search.round && S.leg === 0 ? 'Choose return' : 'Proceed');
    updateSeatFooter();
    generateSeatGrid(trip.kind === 'fc', occupied(trip.id, trip.kind, date));
    openModal('seatModal');
}

const seatClass = (isDoorSeat) => `w-10 h-10 rounded-lg bg-white border-2 ${isDoorSeat ? 'border-accent-gold' : 'border-slate-300'} text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors relative flex items-center justify-center shadow-sm`;
const seatLabel = (seatNum, isDoorSeat) => seatNum + (isDoorSeat ? '<i class="fa-solid fa-star text-[8px] text-accent-gold opacity-90 absolute top-1 right-1"></i>' : '');

function generateSeatGrid(isFirstClass, occ) {
    const grid = $('seatGrid'); grid.innerHTML = '';
    grid.className = `grid gap-2 justify-items-center ${isFirstClass ? 'grid-cols-[1fr_20px_1fr_1fr]' : 'grid-cols-[1fr_1fr_20px_1fr_1fr]'} mt-8 mb-4`;
    const totalRows = isFirstClass ? 9 : 11;
    let seatNum = 1;
    for (let r = 0; r < totalRows; r++) {
        const aisleIndex = isFirstClass ? 1 : 2;
        for (let c = 0; c < (isFirstClass ? 4 : 5); c++) {
            if (c === aisleIndex) { grid.appendChild(document.createElement('div')); continue; }
            if (isFirstClass && r >= totalRows - 2 && c > aisleIndex) {
                if (r === totalRows - 2 && c === 2) {
                    const cr = document.createElement('div');
                    cr.className = 'col-span-2 row-span-2 w-full bg-slate-200 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-300';
                    cr.innerHTML = '<i class="fa-solid fa-restroom text-xl mb-1"></i> CR';
                    grid.appendChild(cr);
                }
                continue;
            }
            const currentSeat = pad(seatNum);
            const isDoorSeat = (r === 0 && c > aisleIndex);
            const seatBtn = document.createElement('button');
            seatBtn.type = 'button';
            if (occ.has(currentSeat)) {
                seatBtn.className = 'w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-300 flex items-center justify-center cursor-not-allowed';
                seatBtn.innerHTML = '<i class="fa-solid fa-user text-sm"></i>'; seatBtn.disabled = true;
                seatBtn.setAttribute('aria-label', `Seat ${currentSeat} occupied`);
            } else {
                seatBtn.className = seatClass(isDoorSeat);
                seatBtn.innerHTML = seatLabel(currentSeat, isDoorSeat);
                seatBtn.setAttribute('aria-label', `Seat ${currentSeat}${isDoorSeat ? ', door seat, plus ₱50' : ''}`);
                seatBtn.setAttribute('aria-pressed', 'false');
                seatBtn.onclick = () => toggleSeat(currentSeat, isDoorSeat, seatBtn);
            }
            grid.appendChild(seatBtn); seatNum++;
        }
    }
}

function toggleSeat(seatNum, isDoorSeat, btnEl) {
    const sel = S.sel, index = sel.seats.indexOf(seatNum);
    if (index > -1) {
        sel.seats.splice(index, 1);
        if (isDoorSeat) sel.door -= DOOR_FEE;
        btnEl.className = seatClass(isDoorSeat);
        btnEl.innerHTML = seatLabel(seatNum, isDoorSeat);
        btnEl.setAttribute('aria-pressed', 'false');
    } else {
        if (sel.seats.length >= S.search.pax) { toast(`You only need ${S.search.pax} seat${S.search.pax === 1 ? '' : 's'}. Tap a selected seat to change it.`); return; }
        sel.seats.push(seatNum);
        if (isDoorSeat) sel.door += DOOR_FEE;
        btnEl.className = 'w-10 h-10 rounded-lg bg-brand-blue text-white border border-brand-blue font-bold text-xs transition-colors flex items-center justify-center shadow-inner';
        btnEl.innerHTML = '<i class="fa-solid fa-check"></i>';
        btnEl.setAttribute('aria-pressed', 'true');
    }
    updateSeatFooter();
}

function updateSeatFooter() {
    const sel = S.sel, seats = sel.seats;
    $('selectedSeatsList').innerHTML = seats.length
        ? `<span class="text-slate-800 font-bold text-base normal-case">${seats.sort().join(', ')}</span>`
        : '<span class="text-slate-400 font-normal italic text-sm normal-case">None</span>';
    $('seatTotalFare').innerText = formatPHP(sel.trip.fare * seats.length + sel.door);
    $('btnProceedPayment').disabled = seats.length !== S.search.pax;
}

function confirmSeats() {
    const { trip, date, seats, door } = S.sel;
    if (seats.length !== S.search.pax) return;
    S.legs[S.leg] = { dir: trip.dir, tripId: trip.id, kind: trip.kind, busClass: trip.className, from: trip.from, to: trip.to, date, dep: trip.dep, arr: trip.arr, plus: trip.plus, durMin: trip.durMin, seats: seats.slice().sort(), door, fare: trip.fare };
    closeModal('seatModal');
    if (S.search.round && S.leg === 0) {
        S.leg = 1; S.filter = 'all';
        renderResults();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast('Outbound seats saved. Now choose your return trip.');
    } else {
        renderCheckout();
        startHold();
        setTimeout(() => navigateTo('view-checkout'), 300);
    }
}

/* ---------------------------------------------------------------- checkout */

function renderCheckout() {
    const opts = Object.entries(FARE_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    S.assign = S.legs.map(l => l.seats.slice());
    const seatPick = (i) => S.legs.map((l, n) => `
            <div>
                <label for="paxSeat${n}_${i}" class="lbl">${S.legs.length > 1 ? (n === 0 ? 'Outbound seat' : 'Return seat') : 'Seat'}</label>
                <select id="paxSeat${n}_${i}" class="inp" onchange="swapSeat(${n}, ${i}, this.value)">${l.seats.map(x => `<option${x === l.seats[i] ? ' selected' : ''}>${x}</option>`).join('')}</select>
            </div>`).join('');
    $('paxRows').innerHTML = Array.from({ length: S.search.pax }, (_, i) => `
        <div class="grid grid-cols-2 md:grid-cols-12 gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
            <div class="col-span-2 md:col-span-5">
                <label for="paxName${i}" class="lbl">Passenger ${i + 1} full name${i === 0 ? ' (contact person)' : ''}</label>
                <input type="text" id="paxName${i}" required minlength="2" maxlength="60" autocomplete="${i === 0 ? 'name' : 'off'}" class="inp">
            </div>
            <div class="col-span-2 ${S.legs.length > 1 ? 'md:col-span-3' : 'md:col-span-4'}">
                <label for="paxType${i}" class="lbl">Fare type</label>
                <select id="paxType${i}" class="inp" onchange="renderSummary()">${opts}</select>
            </div>
            <div class="col-span-2 ${S.legs.length > 1 ? 'md:col-span-4' : 'md:col-span-3'} grid ${S.legs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-3">${seatPick(i)}</div>
        </div>`).join('');
    S.promo = null; S.usePoints = false;
    $('promoInput').value = ''; $('promoMsg').textContent = ''; $('usePoints').checked = false;
    $('consent-privacy').checked = false;
    $('addBag').value = '0'; $('addPet').checked = false; $('addIns').checked = false;
    const petOk = S.legs.every(l => l.kind === 'std');
    $('addPet').disabled = !petOk;
    $('addPetNote').textContent = petOk ? 'Small cat or dog up to 10 kg, in a closed carrier at your feet.' : 'Pets ride on Standard coaches only, so this is off for a First Class trip.';
    $('payError').classList.add('hidden');
    autofillCheckout();
    renderSaved();
    renderSummary();
}

// two passengers cannot hold the same seat: picking one that is taken swaps the two
function swapSeat(leg, i, seat) {
    const a = S.assign[leg], j = a.indexOf(seat);
    if (j > -1 && j !== i) { a[j] = a[i]; $(`paxSeat${leg}_${j}`).value = a[j]; }
    a[i] = seat;
}

function autofillCheckout() {
    const p = DB.profile;
    if (!p) return;
    const name = $('paxName0');
    if (name && !name.value && (p.first || p.last)) name.value = `${p.first} ${p.last}`.trim();
    if (!$('chkMobile').value) $('chkMobile').value = p.mobile;
}

const paxTypes = () => Array.from({ length: S.search.pax }, (_, i) => ($('paxType' + i) || {}).value || 'regular');

function totals() {
    const types = paxTypes();
    let base = 0, disc = 0, door = 0;
    S.legs.forEach(l => { types.forEach(ty => { base += l.fare; if (ty !== 'regular') disc += l.fare * DISCOUNT; }); door += l.door; });
    const L = S.legs.length, fee = TERMINAL_FEE * L;
    const bagKg = (parseInt($('addBag').value) || 0) * 10;
    const bag = bagKg / 10 * BAG_FEE * L, pet = $('addPet').checked && !$('addPet').disabled ? PET_FEE * L : 0, ins = $('addIns').checked ? INS_FEE * types.length * L : 0;
    const fares = base - disc;
    const promo = !S.promo ? 0 : S.promo.pct ? Math.round(fares * S.promo.pct) : Math.min(S.promo.off, fares);
    const sub = fares - promo + door + fee + bag + pet + ins;
    const pts = (S.usePoints && DB.profile) ? Math.min(DB.points, Math.floor(sub)) : 0;
    return { base, disc, door, fee, promo, pts, bag, bagKg, pet, ins, total: sub - pts, nDisc: types.filter(x => x !== 'regular').length };
}

function renderSummary() {
    if (!S.legs.length) return;
    $('chkLegs').innerHTML = S.legs.map((l, i) => `
        <div>
            ${S.legs.length > 1 ? `<div class="text-[10px] font-black tracking-widest uppercase text-brand-red mb-1">${t(i === 0 ? 'Outbound' : 'Return')}</div>` : ''}
            <div class="font-black text-slate-800 text-lg leading-tight">${esc(short(l.from))} to ${esc(short(l.to))}</div>
            <div class="text-sm font-bold text-brand-red">${l.busClass} · ${l.tripId}</div>
            <div class="text-sm text-slate-600 mt-1"><i class="fa-regular fa-calendar text-slate-400 mr-1"></i> ${fmtDate(l.date)}, ${l.dep}</div>
            <div class="text-sm text-slate-600"><i class="fa-solid fa-couch text-slate-400 mr-1"></i> Seats <span class="font-black text-brand-blue">${l.seats.join(', ')}</span></div>
        </div>`).join('<div class="h-px bg-slate-100"></div>');

    const x = totals(), n = S.search.pax, L = S.legs.length;
    const row = (label, val, cls) => `<div class="flex justify-between text-sm gap-3"><span class="text-slate-600 font-medium">${label}</span><span class="font-bold ${cls || 'text-slate-800'} whitespace-nowrap">${val}</span></div>`;
    $('chkBreakdown').innerHTML =
        row(`Base fare (${n} pax${L > 1 ? ' × 2 trips' : ''})`, formatPHP(x.base)) +
        (x.disc ? row(`Senior / PWD / Student (${x.nDisc})`, '−' + formatPHP(x.disc), 'text-green-600') : '') +
        (x.promo ? row(`Promo ${S.promo.code}`, '−' + formatPHP(x.promo), 'text-green-600') : '') +
        (x.door ? row(`Door seat premium (${x.door / DOOR_FEE}×)`, '+' + formatPHP(x.door), 'text-accent-gold') : '') +
        row(`Terminal fee${L > 1 ? ' (2 trips)' : ''}`, formatPHP(x.fee)) +
        (x.bag ? row(`Extra baggage (+${x.bagKg} kg)`, '+' + formatPHP(x.bag)) : '') +
        (x.pet ? row('Pet in carrier', '+' + formatPHP(x.pet)) : '') +
        (x.ins ? row(`Travel insurance (${n} pax)`, '+' + formatPHP(x.ins)) : '') +
        (x.pts ? row(`Points redeemed (${x.pts})`, '−' + formatPHP(x.pts), 'text-green-600') : '');
    $('chkGrandTotal').innerText = formatPHP(x.total);
    $('chkEarn').textContent = DB.profile ? `You will earn ${Math.floor(x.total / 20)} points on this booking.` : 'Sign in before paying to earn points on this booking.';

    const showPts = !!DB.profile && DB.points > 0;
    $('pointsWrap').classList.toggle('hidden', !showPts);
    if (showPts) $('pointsLabel').textContent = `Use my ${DB.points} points (₱${DB.points} off)`;
}

function applyPromo() {
    const code = $('promoInput').value.trim().toUpperCase(), msg = $('promoMsg');
    if (!code) { S.promo = null; msg.textContent = ''; }
    else if (PROMOS[code]) { S.promo = Object.assign({ code }, PROMOS[code]); msg.className = 'text-xs font-medium h-4 mt-2 text-green-600'; msg.textContent = `${code} applied: ${PROMOS[code].label}.`; }
    else { S.promo = null; msg.className = 'text-xs font-medium h-4 mt-2 text-red-600'; msg.textContent = 'That code is not valid or has expired.'; }
    renderSummary();
}

function startHold() {
    stopHold();
    S.holdEnd = Date.now() + HOLD_SECONDS * 1000;
    const tick = () => {
        const left = Math.max(0, Math.round((S.holdEnd - Date.now()) / 1000));
        $('holdTimer').textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
        if (left === 0 && !paying) {
            stopHold();
            closeModal('payModal');
            toast('Your seat hold ran out. Please choose your seats again.', 'error');
            releaseSelection();
            navigateTo('view-results');
        }
    };
    tick();
    S.holdTimer = setInterval(tick, 1000);
}
function stopHold() { clearInterval(S.holdTimer); S.holdTimer = null; }
function releaseSelection() { stopHold(); S.legs = []; S.leg = 0; }
function abandonCheckout() { navigateTo('view-results'); }

function highlightPayment() {
    document.querySelectorAll('.pay-opt').forEach(label => {
        const on = label.querySelector('input').checked;
        label.classList.toggle('border-brand-blue', on);
        label.classList.toggle('bg-blue-50', on);
        label.classList.toggle('shadow-sm', on);
        label.classList.toggle('border-slate-200', !on);
    });
}

let paying = false;
// Pay button: show the wallet, QR or card screen for the chosen method first
function processPayment() {
    if (paying || !S.legs.length) return;
    $('payError').classList.add('hidden');
    openPay();
}
function openPay() {
    const method = document.querySelector('input[name="payment"]:checked').value, amt = formatPHP(totals().total);
    const head = { gcash: ['bg-[#0052FE]', 'GCash'], maya: ['bg-slate-900', 'maya'], qrph: ['bg-blue-900', 'QR Ph'], card: ['bg-slate-700', 'Card payment'] }[method];
    const mid = method === 'qrph'
        ? '<div class="qr bg-white p-2 rounded-xl border border-slate-200 mx-auto w-fit"><div id="payQR" class="w-32 h-32"></div></div><p class="text-sm text-slate-600 text-center">Scan with any bank or e-wallet app, then tap the button below.</p>'
        : method === 'card'
            ? '<div class="bg-slate-50 border border-slate-200 rounded-xl p-4"><div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Test card</div><div class="font-mono font-bold text-slate-800 text-lg">4242 •••• •••• 4242</div><div class="text-xs text-slate-500">No real card details are asked for in this demo.</div></div>'
            : `<div class="bg-slate-50 border border-slate-200 rounded-xl p-4"><div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wallet number</div><div class="font-mono font-bold text-slate-800 text-lg">${esc($('chkMobile').value)}</div><div class="text-xs text-slate-500">You would approve this with your MPIN in the wallet app.</div></div>`;
    $('payBody').innerHTML = `
        <div class="${head[0]} text-white p-5"><div class="font-black italic text-2xl">${head[1]}</div><div class="text-xs opacity-80 mt-1">Paying ${MERCHANT}</div></div>
        <div class="p-5 space-y-4">
            <div class="text-center"><div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount due</div><div class="text-3xl font-black text-slate-800">${amt}</div></div>
            ${mid}
            <button onclick="finishPayment(true)" class="btn-blue w-full py-3.5">${method === 'qrph' ? 'I have paid' : 'Pay ' + amt}</button>
            <button onclick="finishPayment(false)" class="btn-ghost w-full py-3 text-sm">Simulate a failed payment</button>
            <button onclick="closeModal('payModal')" class="w-full text-sm font-bold text-slate-500 hover:text-brand-red py-1">Cancel</button>
        </div>`;
    if (method === 'qrph') drawQR($('payQR'), `QRPH|${MERCHANT}|${totals().total}`);
    openModal('payModal');
}
function finishPayment(ok) {
    if (paying || !S.legs.length) return;
    paying = true;
    closeModal('payModal');
    openModal('paymentProcessingModal');
    setTimeout(() => {
        closeModal('paymentProcessingModal');
        if (!ok) {   // declined: nothing is booked, the hold keeps running, the passenger can retry
            paying = false;
            $('payError').classList.remove('hidden');
            toast('Payment did not go through. Nothing was charged.', 'error');
            return;
        }
        const x = totals(), types = paxTypes();
        const methodMap = { gcash: 'GCash', maya: 'Maya', qrph: 'QR Ph', card: 'Card' };
        const earned = DB.profile ? Math.floor(x.total / 20) : 0;
        const b = {
            ref: 'SL-' + Math.floor(Math.random() * 90000 + 10000) + 'X',
            createdAt: Date.now(), status: 'confirmed',
            contact: { mobile: $('chkMobile').value, email: $('chkEmail').value.trim() },
            pax: types.map((ty, i) => ({ name: $('paxName' + i).value.trim().toUpperCase(), type: ty, seats: S.assign.map(a => a[i]) })),
            addons: { bagKg: x.bagKg, pet: x.pet > 0, ins: x.ins > 0 },
            legs: S.legs.map(l => Object.assign({}, l)),
            method: methodMap[document.querySelector('input[name="payment"]:checked').value],
            total: x.total, pointsEarned: earned, pointsUsed: x.pts,
            auth: new Date().toLocaleTimeString('en-US', { hour12: false })
        };
        DB.bookings.unshift(b);
        if (DB.profile) {
            DB.points = DB.points - x.pts + earned;
            b.pax.forEach(p => { if (!DB.saved.some(x => x.name === p.name)) DB.saved.unshift({ name: p.name, type: p.type }); });
            DB.saved.length = Math.min(DB.saved.length, 8);
            if (!DB.profile.first) { const parts = $('paxName0').value.trim().split(/\s+/); DB.profile.last = parts.length > 1 ? parts.pop() : ''; DB.profile.first = parts.join(' '); }
        }
        save();
        updateAuthUI();
        releaseSelection();
        notify('Booking confirmed', `${b.ref}: ${b.legs.map(l => `${short(l.from)} to ${short(l.to)}, ${fmtDate(l.date)} ${l.dep}`).join('; ')}.`, 'conf-' + b.ref, true);
        checkReminders();
        S.promo = null; S.usePoints = false;
        renderTicket(b, 'Payment Successful!', `Your booking is confirmed. A copy was sent by SMS to ${b.contact.mobile}.`);
        setTimeout(() => { paying = false; navigateTo('view-ticket'); }, 300);
    }, 2200);
}

function resetAndGoHome() {
    $('checkoutForm').reset();
    document.querySelector('input[name="payment"][value="gcash"]').checked = true;
    highlightPayment();
    navigateTo('view-home');
}

/* ------------------------------------------------------------------ ticket */

function drawQR(el, text) {
    el.innerHTML = '';
    if (window.QRCode) new QRCode(el, { text, width: 256, height: 256, correctLevel: QRCode.CorrectLevel.M });
    else el.textContent = 'QR code needs a connection the first time.';
}

const statusPill = (b) => b.status === 'cancelled'
    ? '<span class="pill bg-red-500/20 text-red-200 border-red-300/40">Cancelled</span>'
    : b.rebooked ? '<span class="pill bg-amber-400/20 text-amber-200 border-amber-300/40">Rebooked</span>' : '';

function renderTicket(b, heading, sub) {
    S.ticket = b;
    $('tktHeading').innerText = heading; $('tktSub').innerText = sub;
    $('tktRef').innerText = b.ref;
    $('tktStatus').innerHTML = statusPill(b);
    $('tktPax').innerHTML = b.pax.map(p => `<div class="text-lg md:text-xl font-black text-slate-800 break-words">${esc(p.name)}${FARE_SHORT[p.type] ? ` <span class="pill bg-green-50 text-green-700 border-green-200 align-middle">${FARE_SHORT[p.type]}</span>` : ''}${p.seats ? ` <span class="text-sm font-bold text-brand-blue whitespace-nowrap align-middle">Seat ${p.seats.join(' / ')}</span>` : ''}</div>`).join('');
    $('tktLegs').innerHTML = b.legs.map((l, i) => `
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            ${b.legs.length > 1 ? `<div class="text-[10px] font-black tracking-widest uppercase text-brand-red mb-2">${t(i === 0 ? 'Outbound' : 'Return')}</div>` : ''}
            <div class="flex items-center gap-3">
                <div class="flex-1"><div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${l.dep}</div><div class="font-bold text-slate-800 text-lg leading-tight">${esc(short(l.from))}</div></div>
                <i class="fa-solid fa-bus text-slate-300"></i>
                <div class="flex-1 text-right"><div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${l.arr}${l.plus ? ' (+1d)' : ''}</div><div class="font-bold text-slate-800 text-lg leading-tight">${esc(short(l.to))}</div></div>
            </div>
            <div class="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
                <div><span class="text-slate-400">Date</span> <span class="font-bold text-slate-800">${fmtDate(l.date)}</span></div>
                <div><span class="text-slate-400">Bus</span> <span class="font-bold text-slate-800">${l.tripId} · ${l.busClass}</span></div>
                <div><span class="text-slate-400">Seats</span> <span class="font-black text-brand-blue">${l.seats.join(', ')}</span></div>
            </div>
        </div>`).join('');
    const ad = b.addons || {}, adList = [ad.bagKg ? `+${ad.bagKg} kg baggage` : '', ad.pet ? 'Pet in carrier' : '', ad.ins ? 'Travel insurance' : ''].filter(Boolean);
    if (adList.length) $('tktLegs').innerHTML += `<div class="text-sm text-slate-600"><span class="text-slate-400">Add-ons</span> <span class="font-bold text-slate-800">${adList.join(' · ')}</span></div>`;
    drawQR($('tktQR'), qrPayload(b));
    $('authTimestamp').innerText = b.auth;
    $('tktMethod').innerText = b.method;
    $('tktAmount').innerText = formatPHP(b.total);
    $('tktPoints').textContent = b.status === 'cancelled' ? `Cancelled. Refund of ${formatPHP(b.refund || 0)} to ${b.method}.`
        : b.pointsEarned ? `You earned ${b.pointsEarned} points on this booking.` : 'This ticket is saved on this device and opens offline in My Trips.';
}

const QR_PREFIX = 'BIYAHEBICOL';
const qrBase = (b) => `${QR_PREFIX}|${b.ref}|${b.legs.map(l => `${l.tripId}@${l.date}:${l.seats.join('/')}`).join('|')}|${b.pax.length}PAX`;
const qrSig = (base) => hashStr(base + '|' + QR_SECRET).toString(16).toUpperCase().padStart(8, '0');
const qrPayload = (b) => { const base = qrBase(b); return `${base}|${qrSig(base)}`; };

const SAMPLE_REF = 'SL-35948X';
function sampleBooking() {
    const date = addDays(todayLocal(), 3), tr = tripsFor('PITX, Manila', 'Jose Panganiban', 'out')[1];
    return {
        ref: SAMPLE_REF, status: 'confirmed', sample: true, contact: { mobile: '09171234567', email: '' },
        pax: ['JUAN DELA CRUZ', 'ELENA DELA CRUZ', 'MARIA DELA CRUZ', 'ANA DELA CRUZ', 'LUIS DELA CRUZ'].map((name, i) => ({ name, type: 'regular', seats: [['02', '05', '06', '08', '09'][i]] })),
        legs: [{ dir: 'out', tripId: tr.id, kind: 'fc', busClass: tr.className, from: tr.from, to: tr.to, date, dep: tr.dep, arr: tr.arr, plus: tr.plus, durMin: tr.durMin, seats: ['02', '05', '06', '08', '09'], door: 50, fare: tr.fare }],
        method: 'GCash', total: 5 * tr.fare + 50 + TERMINAL_FEE, pointsEarned: 0, auth: '14:22:09'
    };
}

function retrieveTicket() {
    const ref = $('mbRef').value.trim().toUpperCase();
    const mobile = $('mbMobile').value.replace(/\D/g, '');
    if (!ref || mobile.length < 11) { $('mbError').innerText = 'Enter your booking reference and the 11-digit mobile number used.'; return; }
    const b = DB.bookings.find(x => x.ref === ref && x.contact.mobile === mobile) || (ref === SAMPLE_REF ? sampleBooking() : null);
    if (!b) { $('mbError').innerText = `No booking matches that reference and mobile number. (Demo: try ${SAMPLE_REF}.)`; return; }
    closeModal('manageBookingModal');
    renderTicket(b, 'Booking Found', 'Here is your e-ticket. Show the QR code at the terminal.');
    navigateTo('view-ticket');
}

/* ---------------------------------------------------------------- my trips */

const findBooking = (ref) => DB.bookings.find(b => b.ref === ref) || (S.ticket && S.ticket.ref === ref ? S.ticket : null);
const nextDeparture = (b) => { const now = Date.now(); const ts = b.legs.map(l => depDate(l.date, l.dep).getTime()).filter(x => x > now); return ts.length ? Math.min(...ts) : null; };
const isUpcoming = (b) => b.status !== 'cancelled' && nextDeparture(b) !== null;
const hoursLeft = (b) => { const n = nextDeparture(b); return n === null ? -1 : (n - Date.now()) / 3600000; };

function renderTrips() {
    const list = DB.bookings;
    $('tripsList').innerHTML = list.length ? list.map(b => {
        const up = isUpcoming(b), canChange = up && hoursLeft(b) >= CHANGE_CUTOFF_H;
        const st = b.status === 'cancelled' ? ['Cancelled', 'bg-red-50 text-red-700 border-red-200'] : up ? ['Upcoming', 'bg-green-50 text-green-700 border-green-200'] : ['Completed', 'bg-slate-100 text-slate-600 border-slate-200'];
        return `
        <div class="card p-5 ${b.status === 'cancelled' ? 'opacity-75' : ''}">
            <div class="flex justify-between items-start gap-3 mb-3">
                <div><div class="font-mono font-black text-brand-blue">${b.ref}</div><div class="text-xs text-slate-500">${b.pax.length} passenger${b.pax.length === 1 ? '' : 's'} · ${formatPHP(b.total)} · ${b.method}</div></div>
                <div class="text-right space-y-1"><span class="pill ${st[1]}">${t(st[0])}</span>${b.rebooked && b.status !== 'cancelled' ? '<br><span class="pill bg-amber-50 text-amber-700 border-amber-200">Rebooked</span>' : ''}</div>
            </div>
            ${b.legs.map(l => `<div class="flex items-center gap-3 py-2 border-t border-slate-100">
                <div class="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><i class="fa-solid fa-bus"></i></div>
                <div class="min-w-0"><div class="font-bold text-slate-800 leading-tight">${esc(short(l.from))} to ${esc(short(l.to))}</div>
                <div class="text-xs text-slate-500">${fmtDate(l.date)}, ${l.dep} · ${l.busClass} · Seats ${l.seats.join(', ')}</div></div></div>`).join('')}
            ${b.status === 'cancelled' ? `<p class="text-xs text-slate-500 pt-2 border-t border-slate-100">Refund of ${formatPHP(b.refund || 0)} to ${b.method}, 3 to 5 banking days.</p>` : ''}
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 text-xs">
                <button onclick="viewTicket('${b.ref}')" class="btn-blue py-2.5 col-span-2 sm:col-span-1">${t('View Ticket')}</button>
                <button onclick="rebookTrip('${b.ref}')" ${canChange ? '' : 'disabled'} class="btn-ghost py-2.5">${t('Rebook')}</button>
                <button onclick="cancelTrip('${b.ref}')" ${canChange ? '' : 'disabled'} class="btn-ghost py-2.5 !text-brand-red">${t('Cancel')}</button>
                <button onclick="downloadICS('${b.ref}')" ${up ? '' : 'disabled'} class="btn-ghost py-2.5"><i class="fa-regular fa-calendar-plus"></i> Calendar</button>
                <button onclick="shareTrip('${b.ref}')" class="btn-ghost py-2.5"><i class="fa-solid fa-share-nodes"></i> ${t('Share')}</button>
            </div>
            ${up && !canChange ? `<p class="text-[11px] text-slate-500 mt-2">Changes close ${CHANGE_CUTOFF_H} hours before departure.</p>` : ''}
        </div>`;
    }).join('') : `
        <div class="card p-8 text-center">
            <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mx-auto mb-4"><i class="fa-solid fa-ticket"></i></div>
            <h3 class="font-black text-slate-800 text-lg mb-1">No trips yet</h3>
            <p class="text-sm text-slate-500 mb-5">Tickets you book on this device appear here and open without a signal.</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button onclick="navigateTo('view-home')" class="btn-red px-6 py-3">${t('Book Your Trip')}</button>
                <button onclick="loadSample()" class="btn-ghost px-6 py-3">Load a sample trip</button>
            </div>
        </div>`;

    $('parcelsHead').classList.toggle('hidden', !DB.parcels.length);
    $('parcelsList').innerHTML = DB.parcels.map(p => `
        <div class="card p-5 flex items-center gap-4">
            <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0"><i class="fa-solid fa-box"></i></div>
            <div class="min-w-0 flex-1"><div class="font-mono font-black text-brand-blue">${p.ref}</div>
            <div class="text-sm font-bold text-slate-800">${esc(p.from)} to ${esc(p.to)}</div>
            <div class="text-xs text-slate-500">${p.weight} kg · ${esc(p.contents)} · for ${esc(p.receiver)} · ${formatPHP(p.fee)} at drop-off</div></div>
            <span class="pill bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap">Awaiting drop-off</span>
        </div>`).join('');
}

function viewTicket(ref) {
    const b = findBooking(ref); if (!b) return;
    renderTicket(b, b.status === 'cancelled' ? 'Booking Cancelled' : 'Your E-Ticket', 'Show the QR code at the turnstile and at the bus door.');
    navigateTo('view-ticket');
}

function rebookTrip(ref) {
    const b = findBooking(ref); if (!b) return;
    const now = Date.now();
    const legs = b.legs.map((l, i) => ({ l, i })).filter(x => depDate(x.l.date, x.l.dep).getTime() > now);
    const fee = REBOOK_FEE * b.pax.length;
    openConfirm({
        title: 'Rebook ' + b.ref,
        body: `
            ${legs.length > 1 ? `<div><label class="lbl" for="rbLeg">Which trip</label><select id="rbLeg" class="inp">${legs.map(x => `<option value="${x.i}">${x.i === 0 ? 'Outbound' : 'Return'}: ${esc(short(x.l.from))} to ${esc(short(x.l.to))}, ${fmtDate(x.l.date)}</option>`).join('')}</select></div>` : `<input type="hidden" id="rbLeg" value="${legs[0].i}">`}
            <div><label class="lbl" for="rbDate">New travel date</label><input type="date" id="rbDate" class="inp" min="${todayLocal()}"></div>
            <p>Same bus and departure time. Rebooking fee: <strong>${formatPHP(fee)}</strong> (${formatPHP(REBOOK_FEE)} × ${b.pax.length}), charged to ${b.method}. If your seats are taken on the new date, you get the nearest free ones.</p>
            <p class="text-xs text-red-600 font-medium min-h-[1rem]" id="rbMsg"></p>`,
        okText: 'Rebook', cancelText: 'Back',
        onOk: () => {
            const i = parseInt($('rbLeg').value), l = b.legs[i], d = $('rbDate').value, msg = $('rbMsg');
            if (!d) { msg.textContent = 'Choose the new date.'; return false; }
            if (d === l.date) { msg.textContent = 'That is the date you already have.'; return false; }
            if (depDate(d, l.dep).getTime() - Date.now() < CLOSE_MIN * 60000) { msg.textContent = 'That departure has already left or is closing. Pick a later date.'; return false; }
            const other = b.legs[1 - i];
            if (other && ((i === 0 && d > other.date) || (i === 1 && d < other.date))) { msg.textContent = 'The outbound trip has to come before the return trip.'; return false; }
            const occ = occupied(l.tripId, l.kind, d, b.ref), total = BUS[l.kind].total, moved = [];
            const old = l.seats.slice(), mapped = old.map(seat => {
                if (!occ.has(seat)) { occ.add(seat); return seat; }
                for (let n = 1; n <= total; n++) { const c = pad(n); if (!occ.has(c)) { occ.add(c); moved.push(`${seat} → ${c}`); return c; } }
                return null;
            });
            if (mapped.includes(null)) { msg.textContent = 'That bus is full on the new date. Pick another date.'; return false; }
            b.pax.forEach(p => { if (p.seats) { const k = old.indexOf(p.seats[i]); if (k > -1) p.seats[i] = mapped[k]; } });
            l.seats = mapped.slice().sort(); l.date = d; l.boarded = null;
            b.total += fee; b.rebooked = true;
            save(); renderTrips();
            if (S.ticket && S.ticket.ref === b.ref && currentView === 'view-ticket') viewTicket(b.ref);
            toast(moved.length ? `Rebooked. Seats moved: ${moved.join(', ')}.` : `Rebooked to ${fmtDate(d)}. Same seats.`);
        }
    });
}

function cancelTrip(ref) {
    const b = findBooking(ref); if (!b) return;
    const pct = hoursLeft(b) >= 24 ? 0.8 : 0.5, refund = Math.round(b.total * pct);
    openConfirm({
        title: 'Cancel ' + b.ref + '?',
        body: `<p>You are ${hoursLeft(b) >= 24 ? '24 hours or more' : 'less than 24 hours'} from departure, so the refund is <strong>${pct * 100}%</strong>:</p>
               <p class="text-2xl font-black text-slate-800">${formatPHP(refund)}</p>
               <p>It goes back to ${b.method} in 3 to 5 banking days. Your seats are released right away and this cannot be undone.</p>`,
        okText: 'Cancel booking', cancelText: 'Keep my trip',
        onOk: () => {
            b.status = 'cancelled'; b.refund = refund;
            DB.points = Math.max(0, DB.points - (b.pointsEarned || 0)) + (b.pointsUsed || 0);
            save(); renderTrips();
            toast(`Booking cancelled. ${formatPHP(refund)} will be refunded.`);
        }
    });
}

function icsFor(b) {
    const local = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Biyahe Bicol Demo//Booking//EN', 'CALSCALE:GREGORIAN'];
    b.legs.forEach((l, i) => {
        const start = depDate(l.date, l.dep), end = new Date(start.getTime() + l.durMin * 60000);
        out.push('BEGIN:VEVENT', `UID:${b.ref}-${i}@biyahe-bicol-demo`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
            `DTSTART:${local(start)}`, `DTEND:${local(end)}`,
            `SUMMARY:Bus ${short(l.from)} to ${short(l.to)} (${b.ref})`, `LOCATION:${l.from.replace(/,/g, '\\,')}`,
            `DESCRIPTION:${l.busClass}\\, bus ${l.tripId}\\, seats ${l.seats.join(' ')}. Be at the terminal 30 minutes early.`,
            'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Your bus leaves in 2 hours', 'END:VALARM', 'END:VEVENT');
    });
    out.push('END:VCALENDAR');
    return out.join('\r\n');
}
function downloadICS(ref) {
    const b = findBooking(ref); if (!b) return;
    const url = URL.createObjectURL(new Blob([icsFor(b)], { type: 'text/calendar' }));
    const a = document.createElement('a'); a.href = url; a.download = `${b.ref}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Calendar file saved. Open it to add the trip.');
}
const shareText = (b) => `Biyahe Bicol booking ${b.ref}\n` + b.legs.map(l => `${short(l.from)} to ${short(l.to)}, ${fmtDate(l.date)} ${l.dep}, ${l.busClass}, bus ${l.tripId}, seats ${l.seats.join(', ')}`).join('\n');
async function shareTrip(ref) {
    const b = findBooking(ref); if (!b) return;
    const text = shareText(b);
    try {
        if (navigator.share) { await navigator.share({ title: 'My bus trip ' + b.ref, text }); return; }
        await navigator.clipboard.writeText(text);
        toast('Trip details copied. Paste them into any chat.');
    } catch (e) {
        if (e && e.name === 'AbortError') return;
        toast('Could not share from this browser.', 'error');
    }
}
function calendarCurrent() { if (S.ticket) downloadICS(S.ticket.ref); }
function shareCurrent() { if (S.ticket) shareTrip(S.ticket.ref); }

/* --------------------------------------------------------------- schedules */

function renderSchedules() {
    const origin = $('schedOrigin').value, dir = $('schedDir').value;
    $('schedBody').innerHTML = Object.keys(ROUTES).map(dest => {
        const trips = tripsFor(origin, dest, dir);
        const from = dir === 'out' ? origin : dest, to = dir === 'out' ? dest : origin;
        return `
        <div class="card overflow-hidden">
            <div class="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                <h3 class="font-black text-slate-800">${esc(short(from))} <i class="fa-solid fa-arrow-right-long text-slate-300 mx-1"></i> ${esc(short(to))}</h3>
                <button onclick="prefillSearch('${origin}', '${dest}', false, ${dir === 'ret'})" class="btn-red px-4 py-2 text-xs whitespace-nowrap">${t('Book')}</button>
            </div>
            <div class="divide-y divide-slate-100">
                ${trips.map(tr => `<div class="px-5 py-3 flex items-center gap-3 text-sm">
                    <div class="w-14 font-mono text-xs font-bold text-slate-400">${tr.id}</div>
                    <div class="flex-1 min-w-0"><div class="font-black text-slate-800">${tr.dep}</div>
                        <div class="text-xs text-slate-500">→ ${tr.arr}${tr.plus ? ' +1d' : ''}<span class="hidden sm:inline"> · ${durText(tr.durMin)}</span></div></div>
                    <span class="pill ${tr.kind === 'fc' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-slate-100 text-slate-600 border-slate-200'} hidden sm:inline-block">${tr.className}</span>
                    <span class="pill ${tr.kind === 'fc' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-slate-100 text-slate-600 border-slate-200'} sm:hidden">${tr.kind === 'fc' ? '2+1' : '2+2'}</span>
                    <div class="w-16 text-right font-black ${tr.kind === 'fc' ? 'text-brand-red' : 'text-slate-800'}">${formatPHP(tr.fare).replace('.00', '')}</div>
                </div>`).join('')}
            </div>
        </div>`;
    }).join('');
}

/* -------------------------------------------------------------- live board */

function renderFIDS() {
    const q = $('fidsFilter').value.trim().toLowerCase();
    const rows = FIDS.filter(r => !q || r.id.toLowerCase().includes(q) || r.route.toLowerCase().includes(q) || r.loc.toLowerCase().includes(q));
    const badge = (r) => `<span class="${STATUS_CLASS[r.status]} border px-2 py-1 rounded text-[10px] font-bold tracking-widest whitespace-nowrap">${r.status}</span>`;
    const bell = (r) => { const on = DB.follow.includes(r.id); return `<button onclick="toggleFollow('${r.id}')" aria-pressed="${on}" aria-label="${on ? 'Stop alerts for' : 'Alert me about'} bus ${r.id}" class="w-9 h-9 rounded-full border ${on ? 'bg-accent-gold text-slate-900 border-accent-gold' : 'border-slate-600 text-slate-400 hover:text-white'}"><i class="fa-${on ? 'solid' : 'regular'} fa-bell"></i></button>`; };
    $('fidsBody').innerHTML = rows.map(r => `<tr data-fids="${r.id}" class="border-b border-slate-700 hover:bg-slate-700/40 transition-colors">
        <td class="p-5 font-mono font-bold text-accent-gold">${r.id}</td><td class="p-5 font-medium">${r.route}</td><td class="p-5 text-slate-400">${r.sched}</td>
        <td class="p-5 font-bold">${r.eta}</td><td class="p-5">${badge(r)}</td><td class="p-5 text-slate-400">${r.loc}</td><td class="p-5 text-right">${bell(r)}</td></tr>`).join('');
    $('fidsCards').innerHTML = rows.map(r => `<div data-fids="${r.id}" class="bg-slate-800 border border-slate-700 rounded-2xl p-4">
        <div class="flex justify-between items-center mb-2"><span class="font-mono font-bold text-accent-gold">${r.id}</span>${badge(r)}</div>
        <div class="flex justify-between items-center gap-3"><div class="font-bold">${r.route}</div>${bell(r)}</div>
        <div class="flex justify-between text-sm text-slate-400 mt-2"><span>Sched ${r.sched} · ETA <span class="text-white font-bold">${r.eta}</span></span></div>
        <div class="text-sm text-slate-400 mt-1"><i class="fa-solid fa-location-dot mr-1 text-slate-500"></i>${r.loc}</div></div>`).join('');
    $('fidsEmpty').classList.toggle('hidden', rows.length > 0);
    renderMap();
}

function toggleFollow(id) {
    const i = DB.follow.indexOf(id);
    i > -1 ? DB.follow.splice(i, 1) : DB.follow.push(id);
    save(); renderFIDS();
    toast(i > -1 ? `Alerts off for bus ${id}` : `You will be alerted if bus ${id} is delayed`);
}

// A bus running late reaches two groups: people who follow it, and people booked on it in the next 24 hours.
function delayBus(id, mins, route) {
    let row = FIDS.find(r => r.id === id);
    if (!row) { row = { id, route: route.label, sched: route.dep, eta: route.dep, status: 'ON TIME', loc: route.loc }; FIDS.push(row); }
    row.status = 'DELAYED';
    row.eta = addMinutes(row.eta, mins);
    if (currentView === 'view-track') renderFIDS();
    const now = Date.now();
    const booked = DB.bookings.some(b => b.status !== 'cancelled' && b.legs.some(l => { const d = depDate(l.date, l.dep).getTime() - now; return l.tripId === id && d > 0 && d < 86400000; }));
    if (booked || DB.follow.includes(id)) notify(`Bus ${id} is delayed`, `${row.route}: new time ${row.eta} (scheduled ${row.sched}).${booked ? ' Your ticket stays valid.' : ''}`, `delay-${id}-${row.eta}`, true);
    return row;
}

function startLiveFIDSUpdates() {
    renderFIDS();
    setInterval(() => {
        const row = FIDS[Math.floor(Math.random() * FIDS.length)];
        if (row.status === 'ON TIME' && Math.random() > 0.5) delayBus(row.id, 15);
        // flash after any re-render, so the highlight is not wiped with the old row
        document.querySelectorAll(`[data-fids="${row.id}"]`).forEach(el => {
            el.classList.remove('status-update-flash'); void el.offsetWidth; el.classList.add('status-update-flash');
        });
    }, 5000);
}

/* ----------------------------------------------------------- notifications */

function notify(title, body, key, quiet) {
    if (key && DB.notes.some(n => n.key === key)) return;
    DB.notes.unshift({ key, ts: Date.now(), title, body, read: false });
    DB.notes.length = Math.min(DB.notes.length, 30);
    save(); updateBell();
    if (!quiet) toast(title);
}
function updateBell() {
    const n = DB.notes.filter(x => !x.read).length;
    document.querySelectorAll('[data-bell-badge]').forEach(b => { b.textContent = n; b.classList.toggle('hidden', n === 0); });
    document.querySelectorAll('[data-bell]').forEach(b => b.setAttribute('aria-label', n ? `Notifications, ${n} unread` : 'Notifications'));
}
function openNotes() {
    $('notesList').innerHTML = DB.notes.length ? DB.notes.map(n => `
        <div class="p-4 ${n.read ? '' : 'bg-blue-50'}">
            <div class="flex justify-between gap-3"><div class="font-bold text-slate-800">${esc(n.title)}</div><div class="text-[11px] text-slate-400 whitespace-nowrap" data-notr>${new Date(n.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div></div>
            <p class="text-sm text-slate-600 mt-1">${esc(n.body)}</p>
        </div>`).join('') : '<p class="p-8 text-center text-sm text-slate-500">Nothing yet. Trip reminders and delay alerts show up here.</p>';
    DB.notes.forEach(n => n.read = true); save(); updateBell();
    openModal('notesModal');
}
function clearNotes() { DB.notes = []; save(); updateBell(); closeModal('notesModal'); }

// A day before and two hours before each upcoming trip. Runs on open and once a minute while the app is open.
function checkReminders() {
    const now = Date.now();
    DB.bookings.forEach(b => {
        if (b.status === 'cancelled') return;
        b.legs.forEach((l, i) => {
            const h = (depDate(l.date, l.dep).getTime() - now) / 3600000;
            if (h <= 0 || h > 24) return;
            const trip = `${short(l.from)} to ${short(l.to)}`;
            if (h <= 2) notify('Your bus leaves soon', `${trip}, bus ${l.tripId}, leaves at ${l.dep}. Be at ${short(l.from)} 30 minutes early with your QR code and any discount IDs.`, `rem2-${b.ref}-${i}-${l.date}`);
            else notify('Trip reminder', `${trip} on ${fmtDate(l.date)} at ${l.dep}, bus ${l.tripId}, seats ${l.seats.join(', ')}.`, `rem24-${b.ref}-${i}-${l.date}`, true);
        });
    });
}

/* ------------------------------------------------------------------- cargo */

function cargoQuote() {
    const w = parseFloat($('cgWeight').value) || 0, v = parseFloat($('cgValue').value) || 0;
    const base = w <= 0 ? 0 : w <= 3 ? 150 : w <= 10 ? 300 : w <= 20 ? 500 : 500 + Math.ceil(w - 20) * 20;
    const ins = Math.round(v * 0.01);
    return { w, base, ins, total: base + ins, same: $('cgFrom').value === $('cgTo').value, over: w > 50 };
}
function renderCargoQuote() {
    const q = cargoQuote();
    const row = (a, b, big) => `<div class="flex justify-between ${big ? 'border-t border-slate-200 pt-3 mt-1 text-base' : ''}"><span class="text-slate-600">${a}</span><span class="font-black ${big ? 'text-brand-red text-xl' : 'text-slate-800'}">${b}</span></div>`;
    $('cgQuote').innerHTML = q.same ? '<p class="text-red-600 font-medium">Choose two different terminals.</p>'
        : q.over ? '<p class="text-red-600 font-medium">The limit is 50 kg per parcel. Split it into two parcels.</p>'
        : row(`Freight (${q.w || 0} kg)`, formatPHP(q.base)) + (q.ins ? row('Insurance (1%)', formatPHP(q.ins)) : '') + row('Pay at drop-off', formatPHP(q.total), true);
}
function prefillCargo() {
    const p = DB.profile;
    if (p && !$('cgSender').value) { $('cgSender').value = `${p.first} ${p.last}`.trim(); $('cgSenderMobile').value = p.mobile; }
}
function bookCargo() {
    const q = cargoQuote();
    if (q.same || q.over || q.w <= 0) { toast('Check the terminals and the weight first.', 'error'); return; }
    const p = {
        ref: 'CG-' + Math.floor(Math.random() * 90000 + 10000), createdAt: Date.now(),
        from: $('cgFrom').value, to: $('cgTo').value, weight: q.w, fee: q.total, contents: $('cgContents').value.trim(),
        sender: $('cgSender').value.trim(), senderMobile: $('cgSenderMobile').value, receiver: $('cgReceiver').value.trim(), receiverMobile: $('cgReceiverMobile').value
    };
    DB.parcels.unshift(p); save();
    $('cargoForm').reset(); $('cgTo').selectedIndex = 3; prefillCargo(); renderCargoQuote();
    const done = $('cargoDone');
    done.classList.remove('hidden');
    done.innerHTML = `
        <div class="flex flex-col sm:flex-row gap-6 items-center">
            <div class="qr bg-white p-2 rounded-xl border border-slate-200 shrink-0"><div id="cgQR" class="w-32 h-32"></div></div>
            <div class="flex-1 text-center sm:text-left">
                <div class="text-green-600 font-black mb-1"><i class="fa-solid fa-circle-check mr-1"></i> Drop-off booked</div>
                <div class="font-mono font-black text-2xl text-brand-blue">${p.ref}</div>
                <p class="text-sm text-slate-600 mt-2">${esc(p.from)} to ${esc(p.to)} · ${p.weight} kg · for ${esc(p.receiver)}</p>
                <p class="text-sm text-slate-600">Show this code at the ${esc(p.from)} counter and pay <strong>${formatPHP(p.fee)}</strong>. The receiver gets an SMS when the parcel arrives and shows a valid ID to claim it.</p>
                <button onclick="navigateTo('view-trips')" class="btn-ghost px-5 py-2.5 text-sm mt-4">See it in My Trips</button>
            </div>
        </div>`;
    drawQR($('cgQR'), `BIYAHEBICOL-CARGO|${p.ref}|${p.from}>${p.to}|${p.weight}KG`);
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Parcel drop-off booked: ' + p.ref);
}

/* ------------------------------------------------- operator console (demo) */
// What the bus company's staff would use. In production this is a separate app behind a staff login,
// reading the same bookings from the server. Here it reads the seat maps and the bookings on this device.

const GEN_FIRST = ['Maria', 'Jose', 'Juan', 'Ana', 'Mark', 'Grace', 'Paolo', 'Liza', 'Ramon', 'Carla', 'Noel', 'Joy', 'Rico', 'Lea', 'Dante', 'Mila', 'Arnel', 'Tess'];
const GEN_LAST = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Ramos', 'Aquino', 'Villanueva', 'Navarro', 'Castillo', 'Dizon'];
function genPassenger(tripId, date, seat) {
    const r = rng(hashStr(`${tripId}|${date}|${seat}|pax`));
    const pick = (a) => a[Math.floor(r() * a.length)];
    const x = r();
    return { name: `${pick(GEN_FIRST)} ${pick(GEN_LAST)}`.toUpperCase(), ref: 'SL-' + Math.floor(r() * 90000 + 10000) + 'X', channel: r() < 0.6 ? 'Counter' : 'Online', type: x < 0.12 ? 'senior' : x < 0.2 ? 'student' : 'regular', sample: true };
}

function opsTrips() {
    const date = $('opsDate').value || todayLocal(), dir = $('opsDir').value, isToday = date === todayLocal();
    const out = [];
    Object.keys(ROUTES).forEach(dest => tripsFor('PITX, Manila', dest, dir).forEach(tr => {
        const sold = occupied(tr.id, tr.kind, date).size, total = BUS[tr.kind].total;
        const live = isToday ? FIDS.find(f => f.id === tr.id) : null;
        out.push({ tr, date, isToday, sold, total, rev: sold * tr.fare, status: live ? live.status : 'SCHEDULED', eta: live ? live.eta : tr.dep });
    }));
    return out;
}

function renderOps() {
    const rows = opsTrips();
    const sold = rows.reduce((a, r) => a + r.sold, 0), total = rows.reduce((a, r) => a + r.total, 0);
    const sales = opsSales(rows), rev = sales.total;
    const app = DB.bookings.filter(b => b.status !== 'cancelled' && b.legs.some(l => l.date === rows[0].date)).length;
    const kpi = (label, val, sub) => `<div class="card p-4"><div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${label}</div><div class="text-2xl font-black text-slate-800 mt-1">${val}</div><div class="text-xs text-slate-500">${sub}</div></div>`;
    $('opsKpis').innerHTML =
        kpi('Departures', rows.length, fmtDate(rows[0].date)) +
        kpi('Seats sold', `${sold} / ${total}`, `${Math.round(sold / total * 100)}% load factor`) +
        kpi('Fare revenue', formatPHP(rev).replace('.00', ''), 'After discounts, before fees') +
        kpi('App bookings', app, 'Made on this device');
    const stCls = { 'SCHEDULED': 'bg-slate-100 text-slate-600 border-slate-200', 'ON TIME': 'bg-blue-50 text-blue-700 border-blue-200', 'BOARDING': 'bg-green-50 text-green-700 border-green-200', 'DELAYED': 'bg-amber-50 text-amber-700 border-amber-200', 'EARLY': 'bg-purple-50 text-purple-700 border-purple-200' };
    $('opsTrips').innerHTML = rows.map(r => {
        const pct = Math.round(r.sold / r.total * 100);
        return `<tr class="border-b border-slate-100 ${S.manifest === r.tr.id ? 'bg-blue-50' : ''}">
            <td class="p-3 font-mono font-bold text-brand-blue whitespace-nowrap">${r.tr.id}</td>
            <td class="p-3 font-bold text-slate-800 whitespace-nowrap">${esc(short(r.tr.from))} ➔ ${esc(short(r.tr.to))}</td>
            <td class="p-3 whitespace-nowrap">${r.tr.dep}${r.status === 'DELAYED' ? `<div class="text-xs text-amber-700 font-bold">now ${r.eta}</div>` : ''}</td>
            <td class="p-3 whitespace-nowrap">${r.tr.kind === 'fc' ? 'First Class' : 'Standard'}</td>
            <td class="p-3"><div class="flex items-center gap-2 whitespace-nowrap"><div class="w-20 h-2 rounded-full bg-slate-200 overflow-hidden"><div class="h-full ${pct >= 85 ? 'bg-brand-red' : pct >= 60 ? 'bg-amber-500' : 'bg-green-500'}" style="width:${pct}%"></div></div><span class="font-bold tabular-nums">${r.sold}/${r.total}</span></div></td>
            <td class="p-3 text-right tabular-nums whitespace-nowrap">${formatPHP(r.rev).replace('.00', '')}</td>
            <td class="p-3"><span class="pill ${stCls[r.status]} whitespace-nowrap">${r.status}</span></td>
            <td class="p-3 whitespace-nowrap text-right">
                <button onclick="opsManifest('${r.tr.id}')" class="btn-ghost px-3 py-2 text-xs">Manifest</button>
                <button onclick="opsDelay('${r.tr.id}')" ${r.isToday ? '' : 'disabled'} class="btn-ghost px-3 py-2 text-xs !text-amber-700" title="Marks the bus 15 minutes late on the live board and alerts its passengers">+15 min</button>
            </td></tr>`;
    }).join('');
    renderSalesChart(sales);
    renderOpsAdmin();
    renderManifest();
}

function opsDelay(id) {
    const r = opsTrips().find(x => x.tr.id === id); if (!r) return;
    delayBus(id, 15, { label: `${short(r.tr.from)} ➔ ${short(r.tr.to)}`, dep: r.tr.dep, loc: `${short(r.tr.from)} Terminal` });
    renderOps();
    toast(`Bus ${id} marked 15 minutes late. The live board is updated and affected passengers are alerted.`);
}

function opsManifest(id) { S.manifest = id; renderOps(); $('opsManifest').scrollIntoView({ behavior: 'smooth', block: 'start' }); }

function renderManifest() {
    const box = $('opsManifest'), r = opsTrips().find(x => x.tr.id === S.manifest);
    box.classList.toggle('hidden', !r);
    if (!r) return;
    const { tr, date } = r, list = manifestList(tr, date);
    const boarded = list.filter(x => x.boarded).length;
    const occ = occupied(tr.id, tr.kind, date), free = Array.from({ length: r.total }, (_, i) => pad(i + 1)).filter(x => !occ.has(x));
    box.innerHTML = `
        <div class="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div><h3 class="font-black text-slate-800">Manifest · ${tr.id} · ${esc(short(tr.from))} ➔ ${esc(short(tr.to))}</h3>
            <p class="text-xs text-slate-500">${fmtDate(date)}, ${tr.dep} · ${tr.className} · ${list.length} of ${r.total} seats · ${boarded} boarded</p></div>
            <button onclick="S.manifest = null; renderOps()" class="btn-ghost px-4 py-2 text-xs">Close</button>
        </div>
        <div class="overflow-x-auto"><table class="w-full text-sm text-left">
            <thead><tr class="text-[10px] uppercase tracking-widest text-slate-400"><th class="p-3">Seat</th><th class="p-3">Passenger</th><th class="p-3">Booking</th><th class="p-3">Fare</th><th class="p-3">Sold via</th><th class="p-3">Boarded</th></tr></thead>
            <tbody>${list.map(x => `<tr class="border-t border-slate-100 ${x.sample ? '' : x.channel === 'App' ? 'bg-green-50/60' : 'bg-amber-50/70'}">
                <td class="p-3 font-black text-brand-blue">${x.seat}</td>
                <td class="p-3 font-bold text-slate-800 whitespace-nowrap" data-notr>${esc(x.name)}</td>
                <td class="p-3 font-mono text-xs whitespace-nowrap">${x.ref}</td>
                <td class="p-3 whitespace-nowrap">${FARE_SHORT[x.type] ? `<span class="pill bg-green-50 text-green-700 border-green-200">${FARE_SHORT[x.type]} · check ID</span>` : 'Regular'}</td>
                <td class="p-3 whitespace-nowrap">${x.channel}</td>
                <td class="p-3">${x.boarded ? '<i class="fa-solid fa-circle-check text-green-600"></i> Yes' : '<span class="text-slate-400">Not yet</span>'}</td></tr>`).join('')}</tbody>
        </table></div>
        <form class="px-5 py-4 border-t border-slate-200 bg-slate-50 grid grid-cols-2 md:grid-cols-12 gap-3 items-end" onsubmit="event.preventDefault(); opsSell();">
            <div class="col-span-2 md:col-span-12 font-black text-slate-800 text-sm"><i class="fa-solid fa-cash-register text-brand-blue mr-2"></i>Sell a seat at the counter</div>
            <div class="col-span-2 md:col-span-5"><label for="ctName" class="lbl">Passenger name</label><input id="ctName" required minlength="2" maxlength="60" class="inp !bg-white !py-2.5"></div>
            <div class="md:col-span-3"><label for="ctType" class="lbl">Fare type</label><select id="ctType" class="inp !bg-white !py-2.5">${Object.entries(FARE_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
            <div class="md:col-span-2"><label for="ctSeat" class="lbl">Seat</label><select id="ctSeat" class="inp !bg-white !py-2.5" ${free.length ? '' : 'disabled'}>${free.map(x => `<option>${x}</option>`).join('')}</select></div>
            <div class="col-span-2 md:col-span-2"><button class="btn-blue w-full py-2.5 text-sm" ${free.length ? '' : 'disabled'}>${free.length ? 'Sell (cash)' : 'Bus is full'}</button></div>
        </form>
        <p class="px-5 py-3 text-xs text-slate-500 border-t border-slate-100">Green rows were booked in this app, amber rows were sold at this counter. Both take the seat off the passenger seat map at once. The other names are generated samples.</p>`;
}

/* ---------------------------------------------------------- ticket scanner */

function renderScan() {
    const recent = DB.bookings.filter(b => b.status !== 'cancelled').slice(0, 4);
    $('scanPicks').innerHTML = recent.length
        ? recent.map(b => `<button onclick="scanPick('${b.ref}')" class="btn-ghost px-3 py-2 text-xs font-mono">${b.ref}</button>`).join('') + `<button onclick="scanPick('${recent[0].ref}', true)" class="btn-ghost px-3 py-2 text-xs !text-brand-red">Tampered copy of ${recent[0].ref}</button>`
        : '<span class="text-xs text-slate-500">Book a trip in the app first, then its code appears here to scan.</span>';
}
// stands in for the camera: loads the QR text of a booking on this device (optionally with one seat altered)
function scanPick(ref, tamper) {
    const b = findBooking(ref); if (!b) return;
    let code = qrPayload(b);
    if (tamper) code = code.replace(/:(\d\d)/, (m, d) => ':' + pad((parseInt(d) % 20) + 1));
    $('scanInput').value = code;
    scanCheck();
}

function scanShow(kind, title, html) {
    const look = { ok: ['bg-green-600', 'fa-circle-check'], warn: ['bg-amber-500', 'fa-triangle-exclamation'], bad: ['bg-brand-red', 'fa-circle-xmark'] }[kind];
    const box = $('scanResult');
    box.classList.remove('hidden');
    box.innerHTML = `<div class="${look[0]} text-white p-5 flex items-center gap-4"><i class="fa-solid ${look[1]} text-4xl"></i><div class="text-2xl font-black leading-tight">${title}</div></div><div class="p-5 space-y-3 text-sm text-slate-700">${html}</div>`;
}

function scanCheck() {
    const raw = $('scanInput').value.trim();
    if (!raw) { scanShow('bad', 'Nothing to check', '<p>Scan the QR code or type the booking reference.</p>'); return; }
    let ref = raw.toUpperCase(), signed = false;
    if (raw.includes('|')) {
        const parts = raw.split('|'), sig = parts.pop(), base = parts.join('|');
        if (parts[0] !== QR_PREFIX || qrSig(base) !== sig.toUpperCase()) { scanShow('bad', 'Not a valid ticket', '<p>The security signature on this code does not match its contents, so it was edited or made up. Do not board. Send the passenger to the counter.</p>'); return; }
        ref = parts[1]; signed = true;
    }
    const ct = DB.counter.find(x => x.ref === ref);
    if (ct) {
        const line = `<p class="font-bold text-slate-800" data-notr>${esc(ct.name)} · Seat ${ct.seat}</p><p>Counter ticket <span class="font-mono">${ct.ref}</span> · bus ${ct.tripId} · ${fmtDate(ct.date)}</p>`;
        if (ct.date !== ($('scanDate').value || todayLocal())) scanShow('warn', 'Valid ticket, wrong date', line);
        else if (ct.boarded) scanShow('warn', 'Already boarded', line);
        else scanShow('ok', 'Valid ticket', `${line}<button onclick="scanBoardCounter('${ct.ref}')" class="btn-blue w-full py-3.5 mt-2">Board 1 passenger</button>`);
        return;
    }
    const b = DB.bookings.find(x => x.ref === ref);
    if (!b) { scanShow('bad', 'Booking not found', `<p>No booking <span class="font-mono font-bold">${esc(ref)}</span> on this device. In production this looks up the central booking system.</p>`); return; }
    if (b.status === 'cancelled') { scanShow('bad', 'Cancelled booking', `<p><span class="font-mono font-bold">${b.ref}</span> was cancelled and refunded. Do not board.</p>`); return; }
    if (signed && qrPayload(b) !== raw) { scanShow('warn', 'Outdated code', '<p>This booking was changed after the code was shown (rebooked or seats moved). Ask the passenger to reopen the ticket in My Trips and scan again.</p>'); return; }
    const date = $('scanDate').value || todayLocal(), i = b.legs.findIndex(l => l.date === date);
    const legLine = (l) => `${esc(short(l.from))} to ${esc(short(l.to))}, ${fmtDate(l.date)} ${l.dep}, bus ${l.tripId}`;
    if (i < 0) { scanShow('warn', 'Valid ticket, wrong date', `<p>You are boarding for <strong>${fmtDate(date)}</strong>. This ticket is for:</p><ul class="list-disc pl-5">${b.legs.map(l => `<li>${legLine(l)}</li>`).join('')}</ul>`); return; }
    const l = b.legs[i];
    const paxRows = b.pax.map(p => `<div class="flex justify-between gap-3 py-1.5 border-b border-slate-100"><span class="font-bold" data-notr>${esc(p.name)}</span><span class="whitespace-nowrap">${FARE_SHORT[p.type] ? `<span class="pill bg-amber-50 text-amber-700 border-amber-200">Check ${FARE_SHORT[p.type]} ID</span> ` : ''}Seat <strong>${p.seats ? p.seats[i] : l.seats.join(', ')}</strong></span></div>`).join('');
    const ad = b.addons || {}, extras = [ad.bagKg ? `+${ad.bagKg} kg baggage paid` : '', ad.pet ? 'Pet in carrier paid' : '', ad.ins ? 'Insured' : ''].filter(Boolean).join(' · ');
    const detail = `<p class="font-bold text-slate-800">${legLine(l)}</p><p>${l.busClass} · <span class="font-mono">${b.ref}</span> · ${b.pax.length} passenger${b.pax.length === 1 ? '' : 's'}</p>${paxRows}${extras ? `<p class="text-slate-500">${extras}</p>` : ''}`;
    if (l.boarded) { scanShow('warn', 'Already boarded', `<p>Scanned at ${new Date(l.boarded).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. Check that this is not a shared screenshot.</p>${detail}`); return; }
    scanShow('ok', 'Valid ticket', `${detail}<button onclick="scanBoard('${b.ref}', ${i})" class="btn-blue w-full py-3.5 mt-2">Board ${b.pax.length} passenger${b.pax.length === 1 ? '' : 's'}</button>`);
}

function scanBoard(ref, i) {
    const b = DB.bookings.find(x => x.ref === ref); if (!b) return;
    b.legs[i].boarded = Date.now(); save();
    toast(`${b.pax.length} boarded on bus ${b.legs[i].tripId}`);
    scanCheck();
}

/* ------------------------------------------ operator: sales, counter, fares */

// Everyone on a bus: bookings from this app, seats sold at this counter, and generated samples for the rest.
function manifestList(tr, date) {
    const mine = {};
    DB.bookings.forEach(b => {
        if (b.status === 'cancelled') return;
        b.legs.forEach((l, i) => {
            if (l.tripId !== tr.id || l.date !== date) return;
            l.seats.forEach(seat => { const p = b.pax.find(x => x.seats && x.seats[i] === seat) || b.pax[0]; mine[seat] = { name: p.name, ref: b.ref, channel: 'App', type: p.type, boarded: !!l.boarded }; });
        });
    });
    DB.counter.forEach(c => { if (c.tripId === tr.id && c.date === date) mine[c.seat] = { name: c.name, ref: c.ref, channel: 'Counter', type: c.type, boarded: !!c.boarded }; });
    return [...occupied(tr.id, tr.kind, date)].sort().map(seat => Object.assign({ seat }, mine[seat] || genPassenger(tr.id, date, seat)));
}

const SALES_CHANNELS = [
    { key: 'app', label: 'This app', color: '#2a78d6' },
    { key: 'counter', label: 'This counter', color: '#eb6834' },
    { key: 'online', label: 'Online (sample)', color: '#1baf7a' },
    { key: 'walkin', label: 'Counter (sample)', color: '#eda100' }
];
function opsSales(rows) {
    const byRoute = {}, byCh = { app: 0, counter: 0, online: 0, walkin: 0 };
    let total = 0;
    rows.forEach(r => {
        const place = r.tr.dir === 'out' ? short(r.tr.to) : short(r.tr.from);
        manifestList(r.tr, r.date).forEach(x => {
            const amt = Math.round(r.tr.fare * (x.type !== 'regular' ? 1 - DISCOUNT : 1));
            byRoute[place] = (byRoute[place] || 0) + amt;
            byCh[x.sample ? (x.channel === 'Counter' ? 'walkin' : 'online') : (x.channel === 'App' ? 'app' : 'counter')] += amt;
            total += amt;
        });
    });
    return { byRoute, byCh, total };
}

function renderSalesChart(sales) {
    const peso = (n) => formatPHP(n).replace('.00', '');
    const max = Math.max(1, ...Object.values(sales.byRoute));
    const routes = Object.entries(sales.byRoute).map(([place, amt]) => `
        <div class="flex items-center gap-3 text-sm" title="${place}: ${peso(amt)}">
            <div class="w-28 shrink-0 text-slate-600 truncate">${esc(place)}</div>
            <div class="flex-1 h-4"><div class="h-full rounded-r" style="width:${Math.max(1, amt / max * 100)}%;background:#2a78d6"></div></div>
            <div class="w-20 text-right font-bold text-slate-800 tabular-nums">${peso(amt)}</div>
        </div>`).join('');
    const chans = SALES_CHANNELS.filter(c => sales.byCh[c.key] > 0);
    const stack = chans.map(c => `<div title="${c.label}: ${peso(sales.byCh[c.key])}" style="width:${sales.byCh[c.key] / sales.total * 100}%;background:${c.color}" class="h-full"></div>`).join('<div class="w-0.5 bg-white shrink-0"></div>');
    const legend = SALES_CHANNELS.map(c => `
        <div class="flex items-center gap-2 text-sm">
            <span class="w-3 h-3 rounded-sm shrink-0" style="background:${c.color}"></span>
            <span class="flex-1 text-slate-600">${c.label}</span>
            <span class="font-bold text-slate-800 tabular-nums">${peso(sales.byCh[c.key])}</span>
            <span class="w-10 text-right text-xs text-slate-500 tabular-nums">${sales.total ? Math.round(sales.byCh[c.key] / sales.total * 100) : 0}%</span>
        </div>`).join('');
    $('opsSales').innerHTML = `
        <div class="grid md:grid-cols-2 gap-6">
            <div><h3 class="font-black text-slate-800 mb-3">Fare revenue by route</h3><div class="space-y-2">${routes}</div></div>
            <div><h3 class="font-black text-slate-800 mb-3">Where the seats were sold</h3>
                <div class="h-5 flex rounded overflow-hidden mb-3">${stack}</div>
                <div class="space-y-1.5">${legend}</div></div>
        </div>`;
}

function opsSell() {
    const r = opsTrips().find(x => x.tr.id === S.manifest); if (!r) return;
    const seat = $('ctSeat').value, type = $('ctType').value, name = $('ctName').value.trim().toUpperCase();
    if (!seat || occupied(r.tr.id, r.tr.kind, r.date).has(seat)) { toast('That seat was just taken. Pick another.', 'error'); renderOps(); return; }
    const fare = Math.round(r.tr.fare * (type !== 'regular' ? 1 - DISCOUNT : 1)) + TERMINAL_FEE;
    const ref = 'CT-' + Math.floor(Math.random() * 90000 + 10000);
    DB.counter.unshift({ ref, tripId: r.tr.id, date: r.date, kind: r.tr.kind, seat, name, type, fare, ts: Date.now() });
    save(); renderOps();
    toast(`Sold seat ${seat} on bus ${r.tr.id} for ${formatPHP(fare)} cash. Ticket ${ref}.`);
}
function scanBoardCounter(ref) {
    const c = DB.counter.find(x => x.ref === ref); if (!c) return;
    c.boarded = Date.now(); save();
    toast(`1 boarded on bus ${c.tripId}`);
    scanCheck();
}

function renderOpsAdmin() {
    if (document.activeElement && $('opsAdmin').contains(document.activeElement)) return;   // do not wipe a field being typed in
    $('opsAdmin').innerHTML = `
        <form class="card p-5" onsubmit="event.preventDefault(); opsSaveFares();">
            <h3 class="font-black text-slate-800 mb-1"><i class="fa-solid fa-tags text-brand-blue mr-2"></i>Fares</h3>
            <p class="text-xs text-slate-500 mb-4">Per passenger, from Manila. Saved fares show in the passenger app at once.</p>
            <div class="space-y-2">
                <div class="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><div class="col-span-6">Route</div><div class="col-span-3">First Class</div><div class="col-span-3">Standard</div></div>
                ${Object.entries(ROUTES).map(([d, r]) => `<div class="grid grid-cols-12 gap-2 items-center">
                    <label class="col-span-6 text-sm font-bold text-slate-700" for="fare_${r.no}_fc">${esc(short(d))}</label>
                    <input id="fare_${r.no}_fc" type="number" min="100" max="5000" step="10" required value="${r.fc}" aria-label="${esc(short(d))} First Class fare" class="col-span-3 inp !bg-white !py-2 !px-2 tabular-nums">
                    <input id="fare_${r.no}_std" type="number" min="100" max="5000" step="10" required value="${r.std}" aria-label="${esc(short(d))} Standard fare" class="col-span-3 inp !bg-white !py-2 !px-2 tabular-nums">
                </div>`).join('')}
            </div>
            <div class="flex gap-3 mt-4"><button class="btn-blue px-5 py-2.5 text-sm flex-1">Save fares</button><button type="button" onclick="opsResetFares()" class="btn-ghost px-5 py-2.5 text-sm">Reset</button></div>
        </form>
        <form class="card p-5" onsubmit="event.preventDefault(); opsPostAdvisory();">
            <h3 class="font-black text-slate-800 mb-1"><i class="fa-solid fa-bullhorn text-brand-blue mr-2"></i>Travel advisory</h3>
            <p class="text-xs text-slate-500 mb-4">Shown as the banner on the booking page and in Help, and sent to the alerts bell.</p>
            <label for="advInput" class="lbl">Message</label>
            <textarea id="advInput" rows="3" maxlength="160" required class="inp !bg-white" placeholder="e.g. Trips to Daet after 9 PM are cancelled tonight because of flooding in Labo.">${DB.advisory ? esc(DB.advisory.text) : ''}</textarea>
            <div class="flex gap-3 mt-4"><button class="btn-blue px-5 py-2.5 text-sm flex-1">Post advisory</button><button type="button" onclick="opsClearAdvisory()" class="btn-ghost px-5 py-2.5 text-sm">Back to default</button></div>
        </form>`;
}
function opsSaveFares() {
    const f = {};
    Object.entries(ROUTES).forEach(([d, r]) => { f[d] = { fc: parseInt($(`fare_${r.no}_fc`).value), std: parseInt($(`fare_${r.no}_std`).value) }; });
    DB.fares = f; applyFares(); save();
    if (document.activeElement) document.activeElement.blur();
    renderOps(); renderFeatured();
    toast('Fares saved. The passenger app now shows the new prices.');
}
function opsResetFares() { DB.fares = null; applyFares(); save(); if (document.activeElement) document.activeElement.blur(); renderOps(); renderFeatured(); toast('Fares are back to the defaults.'); }
function opsPostAdvisory() {
    const text = $('advInput').value.trim(); if (!text) return;
    DB.advisory = { text, ts: Date.now() }; save();
    renderAdvisory();
    notify('Travel advisory', text, 'adv-' + DB.advisory.ts, true);
    toast('Advisory posted to the booking page, Help and the alerts bell.');
}
function opsClearAdvisory() { DB.advisory = null; save(); if (document.activeElement) document.activeElement.blur(); renderAdvisory(); renderOpsAdmin(); toast('The default advisory is showing again.'); }

/* ----------------------------------------------------------- camera scanner */

let scanStream = null;
const decodeQR = (img) => { const r = window.jsQR ? window.jsQR(img.data, img.width, img.height) : null; return r && r.data ? r.data : null; };
async function scanCamera() {
    if (scanStream) { stopCamera(); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.jsQR) { toast('The camera is not available in this browser. Paste the code or pick a booking below.', 'error'); return; }
    try { scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); }
    catch (e) { scanStream = null; toast('The camera was not allowed. Paste the code or pick a booking below.', 'error'); return; }
    const v = $('scanVideo');
    v.srcObject = scanStream; v.classList.remove('hidden');
    $('scanCamLbl').textContent = 'Stop camera';
    try { await v.play(); } catch (e) { /* autoplay refused: the stream still shows once tapped */ }
    const c = document.createElement('canvas'), ctx = c.getContext('2d', { willReadFrequently: true });
    const loop = () => {
        if (!scanStream) return;
        if (v.readyState >= 2 && v.videoWidth) {
            c.width = v.videoWidth; c.height = v.videoHeight;
            ctx.drawImage(v, 0, 0);
            const code = decodeQR(ctx.getImageData(0, 0, c.width, c.height));
            if (code) { $('scanInput').value = code; stopCamera(); scanCheck(); return; }
        }
        requestAnimationFrame(loop);
    };
    loop();
}
function stopCamera() {
    if (scanStream) scanStream.getTracks().forEach(x => x.stop());
    scanStream = null;
    const v = $('scanVideo'); if (v) { v.srcObject = null; v.classList.add('hidden'); }
    if ($('scanCamLbl')) $('scanCamLbl').textContent = 'Scan with camera';
}

/* ------------------------------------------------------- saved passengers */

function renderSaved() {
    const box = $('savedPax'), on = !!DB.profile && DB.saved.length > 0;
    box.classList.toggle('hidden', !on);
    if (on) box.innerHTML = `<div class="lbl">Saved passengers</div><div class="flex flex-wrap gap-2">${DB.saved.map((x, i) => `<button type="button" onclick="useSaved(${i})" class="bg-slate-100 hover:bg-blue-50 rounded-full px-3 py-1.5 text-xs font-bold text-slate-700"><i class="fa-solid fa-plus text-[10px] text-brand-blue mr-1"></i><span data-notr>${esc(x.name)}</span></button>`).join('')}</div>`;
}
function useSaved(i) {
    const x = DB.saved[i]; if (!x) return;
    for (let n = 0; n < S.search.pax; n++) {
        if ($('paxName' + n).value.trim().toUpperCase() === x.name) { toast('That passenger is already on this booking.'); return; }
    }
    for (let n = 0; n < S.search.pax; n++) {
        if (!$('paxName' + n).value.trim()) { $('paxName' + n).value = x.name; $('paxType' + n).value = x.type; renderSummary(); return; }
    }
    toast('Every passenger already has a name. Clear one to swap.');
}
function removeSaved(i) { DB.saved.splice(i, 1); save(); renderAccount(); }

/* ------------------------------------------------------------ sample data */

// One tap fills the app with a realistic state: an upcoming trip, a past one, a parcel and alerts.
function loadSample(quiet) {
    if (DB.bookings.some(b => b.demo)) { if (!quiet) toast('The sample trip is already loaded.'); return DB.bookings.find(b => b.demo && isUpcoming(b)) || DB.bookings.find(b => b.demo); }
    const now = Date.now(), today = todayLocal(), dest = 'Daet, Camarines Norte';
    let pick = null;   // the next departure at least 5 hours away, so rebooking, cancelling and the scanner all work
    for (let d = 0; d < 3 && !pick; d++) {
        const date = addDays(today, d);
        const tr = tripsFor('PITX, Manila', dest, 'out').find(x => depDate(date, x.dep).getTime() - now > 5 * 3600000 && BUS[x.kind].total - occupied(x.id, x.kind, date).size >= 2);
        if (tr) pick = { tr, date };
    }
    if (!pick) return null;
    const mk = (tr, date, seats, extra) => Object.assign({ dir: tr.dir, tripId: tr.id, kind: tr.kind, busClass: tr.className, from: tr.from, to: tr.to, date, dep: tr.dep, arr: tr.arr, plus: tr.plus, durMin: tr.durMin, seats, door: 0, fare: tr.fare }, extra || {});
    const occ = occupied(pick.tr.id, pick.tr.kind, pick.date), free = Array.from({ length: BUS[pick.tr.kind].total }, (_, i) => pad(i + 1)).filter(x => !occ.has(x) && x !== '02' && x !== '03' && x !== '04').slice(0, 2);
    const ref = () => 'SL-' + Math.floor(Math.random() * 90000 + 10000) + 'X';
    const up = {
        ref: ref(), demo: true, createdAt: now, status: 'confirmed', contact: { mobile: '09171234567', email: '' },
        pax: [{ name: 'JUAN DELA CRUZ', type: 'regular', seats: [free[0]] }, { name: 'MARIA DELA CRUZ', type: 'senior', seats: [free[1]] }],
        addons: { bagKg: 0, pet: false, ins: true }, legs: [mk(pick.tr, pick.date, free)], method: 'GCash',
        total: Math.round(pick.tr.fare * 2 - pick.tr.fare * DISCOUNT) + TERMINAL_FEE + INS_FEE * 2, pointsEarned: 0, pointsUsed: 0, auth: '09:41:07'
    };
    const oldTr = tripsFor('PITX, Manila', 'Naga, Camarines Sur', 'ret')[1], oldDate = addDays(today, -9);
    const done = {
        ref: ref(), demo: true, createdAt: now - 12 * 86400000, status: 'confirmed', contact: { mobile: '09171234567', email: '' },
        pax: [{ name: 'JUAN DELA CRUZ', type: 'regular', seats: ['07'] }], addons: { bagKg: 0, pet: false, ins: false },
        legs: [mk(oldTr, oldDate, ['07'], { boarded: depDate(oldDate, oldTr.dep).getTime() - 15 * 60000 })], method: 'Maya', total: oldTr.fare + TERMINAL_FEE, pointsEarned: 0, pointsUsed: 0, auth: '17:12:44'
    };
    DB.bookings.unshift(up, done);
    DB.parcels.unshift({ ref: 'CG-' + Math.floor(Math.random() * 90000 + 10000), createdAt: now, demo: true, from: 'PITX Manila', to: 'Daet Hub', weight: 4, fee: 300, contents: 'documents', sender: 'JUAN DELA CRUZ', senderMobile: '09171234567', receiver: 'ANA REYES', receiverMobile: '09181112222' });
    if (!DB.follow.includes('SL-902')) DB.follow.push('SL-902');
    save();
    notify('Booking confirmed', `${up.ref}: ${short(up.legs[0].from)} to ${short(up.legs[0].to)}, ${fmtDate(pick.date)} ${pick.tr.dep}.`, 'conf-' + up.ref, true);
    checkReminders();
    delayBus('SL-902', 15);
    updateBell(); refreshView();
    if (!quiet) toast('Sample trip loaded. Open My Trips, the bell, or the operator console.');
    return up;
}

/* --------------------------------------------------------------- route map */

// A schematic of the corridor, not a street map. x, y in a 800 x 290 drawing.
const MAP_PTS = {
    MNL: [48, 62, 'Manila'], TUR: [118, 122, 'Turbina'], LUC: [214, 168, 'Lucena'], ATI: [300, 150, 'Atimonan'], CAL: [384, 122, 'Calauag'], JCT: [456, 128, 'Tabugon'],
    DAE: [540, 84, 'Daet'], JPA: [580, 36, 'J. Panganiban'], SIP: [552, 172, 'Sipocot'], NAG: [640, 200, 'Naga'], PIO: [738, 256, 'Pio Duran']
};
const MAP_TRUNK = ['MNL', 'TUR', 'LUC', 'ATI', 'CAL', 'JCT'];
const MAP_PATH = {
    'Daet, Camarines Norte': MAP_TRUNK.concat(['DAE']), 'Jose Panganiban': MAP_TRUNK.concat(['DAE', 'JPA']),
    'Naga, Camarines Sur': MAP_TRUNK.concat(['SIP', 'NAG']), 'Pio Duran': MAP_TRUNK.concat(['SIP', 'NAG', 'PIO'])
};
function mapPoint(keys, p) {
    const pts = keys.map(k => MAP_PTS[k]), seg = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
    let left = Math.min(1, Math.max(0, p)) * total;
    for (let i = 0; i < seg.length; i++) {
        if (left <= seg[i] || i === seg.length - 1) { const f = seg[i] ? left / seg[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; }
        left -= seg[i];
    }
    return pts[0];
}
function busesOnRoad() {
    const now = Date.now(), out = [];
    Object.keys(ROUTES).forEach((dest, ri) => ['out', 'ret'].forEach(dir => tripsFor('PITX, Manila', dest, dir).forEach(tr => [0, -1].forEach(d => {
        const live = FIDS.find(f => f.id === tr.id), late = live && live.status === 'DELAYED' ? 15 : 0;
        const dep = depDate(addDays(todayLocal(), d), tr.dep).getTime() + late * 60000, p = (now - dep) / (tr.durMin * 60000);
        if (p <= 0 || p >= 1) return;
        const [x, y] = mapPoint(MAP_PATH[dest], dir === 'out' ? p : 1 - p);
        out.push({ tr, dest, late, x, y: y + (ri - 1.5) * 7, eta: fmtTime(parseTime(tr.arr) + late) });
    }))));
    return out;
}
function renderMap() {
    const box = $('routeMap'); if (!box) return;
    const buses = busesOnRoad(), segs = new Set();
    Object.values(MAP_PATH).forEach(k => { for (let i = 1; i < k.length; i++) segs.add(k[i - 1] + '-' + k[i]); });
    const lines = [...segs].map(s => { const [a, b] = s.split('-').map(k => MAP_PTS[k]); return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#475569" stroke-width="4" stroke-linecap="round"/>`; }).join('');
    const ends = ['MNL', 'DAE', 'JPA', 'NAG', 'PIO'];
    const stops = Object.entries(MAP_PTS).map(([k, p]) => `<circle cx="${p[0]}" cy="${p[1]}" r="${ends.includes(k) ? 6 : 4}" fill="#0f172a" stroke="${ends.includes(k) ? '#e2e8f0' : '#64748b'}" stroke-width="2"/>
        <text x="${p[0]}" y="${p[1] + (['DAE', 'JPA', 'CAL', 'ATI'].includes(k) ? -12 : 20)}" text-anchor="middle" font-size="${ends.includes(k) ? 13 : 11}" font-weight="${ends.includes(k) ? 700 : 500}" fill="${ends.includes(k) ? '#e2e8f0' : '#94a3b8'}">${p[2]}</text>`).join('');
    const marks = buses.map(b => {
        const sel = S.mapBus === b.tr.id;
        const shape = b.late
            ? `<rect x="${b.x - 6}" y="${b.y - 6}" width="12" height="12" transform="rotate(45 ${b.x} ${b.y})" fill="#f59e0b" stroke="#0f172a" stroke-width="2"/>`
            : `<circle cx="${b.x}" cy="${b.y}" r="6.5" fill="#d4af37" stroke="#0f172a" stroke-width="2"/>`;
        return `<g role="button" tabindex="0" aria-label="Bus ${b.tr.id}, ${short(b.tr.from)} to ${short(b.tr.to)}${b.late ? ', delayed' : ''}" style="cursor:pointer" onclick="mapPick('${b.tr.id}')" onkeydown="if(event.key==='Enter')mapPick('${b.tr.id}')">
            <title>${b.tr.id} · ${short(b.tr.from)} to ${short(b.tr.to)} · arrives ${b.eta}${b.late ? ' · delayed' : ''}</title>
            <circle cx="${b.x}" cy="${b.y}" r="16" fill="transparent"/>${sel ? `<circle cx="${b.x}" cy="${b.y}" r="12" fill="none" stroke="#ffffff" stroke-width="2"/>` : ''}${shape}</g>`;
    }).join('');
    box.innerHTML = `<svg viewBox="0 0 800 290" class="w-full h-auto" role="img" aria-label="Route map from Manila to Bicol with buses now on the road">${lines}${stops}${marks}</svg>`;
    $('mapCount').textContent = buses.length ? `${buses.length} bus${buses.length === 1 ? '' : 'es'} on the road` : 'No buses on the road right now';
    const b = buses.find(x => x.tr.id === S.mapBus);
    $('mapInfo').innerHTML = b
        ? `<div class="flex items-center justify-between gap-3"><div><div class="font-mono font-bold text-accent-gold">${b.tr.id}</div><div class="font-bold">${esc(short(b.tr.from))} ➔ ${esc(short(b.tr.to))}</div><div class="text-sm text-slate-400">${b.tr.className} · arrives ${b.eta} · ${b.late ? 'Running 15 minutes late' : 'On schedule'}</div></div>
            <button onclick="toggleFollow('${b.tr.id}')" class="btn-ghost px-4 py-2 text-xs whitespace-nowrap">${DB.follow.includes(b.tr.id) ? 'Stop alerts' : 'Alert me'}</button></div>`
        : '<div class="text-sm text-slate-400"><span class="inline-block w-3 h-3 rounded-full bg-accent-gold align-middle mr-1"></span> On schedule <span class="inline-block w-2.5 h-2.5 rotate-45 bg-amber-500 align-middle ml-4 mr-1.5"></span> Delayed · Tap a bus for its arrival time.</div>';
}
function mapPick(id) { S.mapBus = S.mapBus === id ? null : id; renderMap(); }

/* ------------------------------------------------------------- guided tour */

const pause = (ms) => new Promise(r => setTimeout(r, ms));
async function tourSearch() {
    S.search = { origin: 'PITX, Manila', dest: 'Daet, Camarines Norte', date: addDays(todayLocal(), 1), ret: '', pax: 1, round: false, rev: false };
    S.legs = []; S.leg = 0; S.filter = 'all';
    navigateTo('view-results');
}
async function tourSeats() {
    await tourSearch();
    const tr = S.trips.find(x => BUS[x.kind].total - occupied(x.id, x.kind, S.search.date).size >= 1);
    openSeatSelection(tr.id);
    await pause(350);
}
async function tourCheckout() {
    await tourSeats();
    [...document.querySelectorAll('#seatGrid button')].find(b => !b.disabled).click();
    confirmSeats();
    await pause(750);
}
async function tourTicket() { const b = loadSample(true); if (b) viewTicket(b.ref); }
async function tourScan() {
    const b = loadSample(true); if (!b) return;
    navigateTo('view-scan');
    $('scanDate').value = b.legs[0].date;
    $('scanInput').value = qrPayload(b);
    scanCheck();
}
const TOUR = [
    { view: 'view-home', sel: '#searchForm', title: 'Search a trip', text: 'Choose where you board and where you are going. The switch under the two fields reverses the direction, and Round Trip adds a return date.' },
    { prep: tourSearch, sel: '#resultsList', title: 'Choose a bus', text: 'Each departure shows the class, the fare and the seats left. Booking closes 30 minutes before the bus leaves.' },
    { prep: tourSeats, sel: '#seatGrid', keepModal: true, title: 'Pick the exact seat', text: 'Grey seats are taken. Gold seats by the door have extra legroom for ₱50 more.' },
    { prep: tourCheckout, sel: '#paxRows', title: 'Passengers, discounts and add-ons', text: 'Every passenger gets a name, a fare type and a seat. Senior, PWD and student fares take 20% off. Extra baggage, a pet and insurance are just below.' },
    { prep: tourTicket, sel: '#printableTicket', title: 'The e-ticket', text: 'A paid ticket carries a signed QR code and stays on the phone, even without a signal.' },
    { view: 'view-trips', sel: '#tripsList', title: 'My Trips', text: 'Rebook to another date, cancel for a refund, add the trip to a calendar or share it.' },
    { view: 'view-track', sel: '#routeMap', title: 'Live bus tracking', text: 'Buses on the road right now. Tap one for its arrival time, and tap the bell to be alerted if it runs late.' },
    { view: 'view-ops', sel: '#opsKpis', title: 'The operator console', text: 'What your staff see: every departure, seats sold, revenue, the passenger manifest, counter sales, fares and advisories.' },
    { prep: tourScan, sel: '#scanResult', title: 'Boarding at the gate', text: 'Staff scan the QR code. A valid ticket boards in one tap, and an edited or reused one is refused.' },
    { view: 'view-home', sel: '[data-lang-toggle]', title: 'That is the tour', text: 'Everything you saw runs on sample data. The language switch at the top changes the whole app to Filipino.' }
];
function tourClear() { document.querySelectorAll('.tour-ring').forEach(el => el.classList.remove('tour-ring')); }
async function tourGo(i) {
    if (i < 0) i = 0;
    if (i >= TOUR.length) { tourEnd(); return; }
    tourClear();
    S.tour = i;
    const st = TOUR[i];
    $('mobileMenu').classList.add('hidden');
    if (!st.keepModal) openModals().forEach(m => closeModal(m.id));
    $('tourCard').classList.remove('hidden');
    $('tourStep').textContent = `${i + 1} of ${TOUR.length}`;
    $('tourTitle').textContent = st.title; $('tourText').textContent = st.text;
    $('tourBack').disabled = i === 0;
    $('tourNext').textContent = i === TOUR.length - 1 ? 'Finish' : 'Next';
    if (st.prep) await st.prep(); else navigateTo(st.view);
    await pause(200);
    if (S.tour !== i) return;   // the visitor already moved on
    const el = [...document.querySelectorAll(st.sel)].find(x => x.offsetParent !== null);
    if (el) { el.classList.add('tour-ring'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
}
function tourEnd() {
    tourClear();
    S.tour = null;
    $('tourCard').classList.add('hidden');
    openModals().forEach(m => closeModal(m.id));
    navigateTo('view-home');
}

/* ------------------------------------------------------------ help, account */

function renderHelp() {
    $('terminalsList').innerHTML = TERMINALS.map(x => `
        <div class="card p-5">
            <h4 class="font-black text-slate-800">${x.name}</h4>
            <p class="text-sm text-slate-600 mt-1">${x.addr}</p>
            <p class="text-xs text-slate-500 mt-1"><i class="fa-regular fa-clock mr-1"></i>${x.hours}</p>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.q)}" target="_blank" rel="noopener" class="inline-block text-sm font-bold text-brand-blue hover:underline mt-3"><i class="fa-solid fa-map-location-dot mr-1"></i>Open in Maps</a>
        </div>`).join('');
    $('faqList').innerHTML = FAQ.map(([q, a]) => `
        <details class="card px-5 py-4">
            <summary class="flex justify-between items-center gap-4 font-bold text-slate-800">${q}<i class="fa-solid fa-chevron-down chev text-slate-400 text-sm transition-transform"></i></summary>
            <p class="text-sm text-slate-600 mt-3">${a}</p>
        </details>`).join('');
}

let installEvt = null;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

function renderAccount() {
    const p = DB.profile;
    const upcoming = DB.bookings.filter(isUpcoming).length;
    $('accountBody').innerHTML = `
        ${p ? `
        <div class="rounded-2xl p-6 bg-brand-blue text-white shadow-xl">
            <div class="text-xs font-bold tracking-widest uppercase text-accent-gold mb-1">Suki Points</div>
            <div class="text-4xl font-black">${DB.points}</div>
            <p class="text-sm text-slate-300 mt-2">Worth ${formatPHP(DB.points)} off your next booking. Earn 1 point for every ₱20 you pay while signed in.</p>
        </div>
        <form class="card p-5 md:p-6 space-y-4" onsubmit="event.preventDefault(); saveProfile();">
            <h3 class="font-black text-slate-800">Your details</h3>
            <div class="grid grid-cols-2 gap-3">
                <div><label for="accFirst" class="lbl">First name</label><input id="accFirst" class="inp" maxlength="40" value="${esc(p.first)}"></div>
                <div><label for="accLast" class="lbl">Last name</label><input id="accLast" class="inp" maxlength="40" value="${esc(p.last)}"></div>
            </div>
            <div><label for="accMobile" class="lbl">Mobile</label><input id="accMobile" class="inp opacity-70" value="${esc(p.mobile)}" readonly></div>
            <div class="flex gap-3"><button class="btn-blue px-6 py-3 flex-1">${t('Save')}</button><button type="button" onclick="signOut()" class="btn-ghost px-6 py-3 flex-1">${t('Sign Out')}</button></div>
        </form>
        ${DB.saved.length ? `<div class="card p-5"><h3 class="font-black text-slate-800 mb-3">Saved passengers</h3><div class="flex flex-wrap gap-2">${DB.saved.map((x, i) => `<span class="inline-flex items-center gap-2 bg-slate-100 rounded-full pl-3 pr-1 py-1 text-sm font-bold text-slate-700"><span data-notr>${esc(x.name)}</span>${FARE_SHORT[x.type] ? `<span class="text-[10px] text-green-700">${FARE_SHORT[x.type]}</span>` : ''}<button onclick="removeSaved(${i})" aria-label="Remove saved passenger" class="w-6 h-6 rounded-full hover:bg-slate-200 text-slate-500"><i class="fa-solid fa-xmark text-xs"></i></button></span>`).join('')}</div></div>` : ''}` : `
        <div class="card p-6 text-center">
            <div class="w-16 h-16 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center text-2xl mx-auto mb-4"><i class="fa-regular fa-user"></i></div>
            <h3 class="font-black text-slate-800 text-lg mb-1">Sign in with your mobile number</h3>
            <p class="text-sm text-slate-500 mb-5">Checkout fills itself in, and you earn 1 point for every ₱20 you pay.</p>
            <button onclick="openModal('authModal')" class="btn-blue px-8 py-3">${t('Sign In')}</button>
        </div>`}
        <div class="card divide-y divide-slate-100">
            <button onclick="navigateTo('view-trips')" class="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50"><i class="fa-solid fa-ticket w-5 text-brand-blue"></i><span class="flex-1 font-bold text-slate-700">${t('My Trips')}</span><span class="text-xs text-slate-400">${upcoming} upcoming</span><i class="fa-solid fa-chevron-right text-xs text-slate-300"></i></button>
            <button onclick="navigateTo('view-cargo')" class="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50"><i class="fa-solid fa-box w-5 text-brand-blue"></i><span class="flex-1 font-bold text-slate-700">${t('Cargo & Parcels')}</span><i class="fa-solid fa-chevron-right text-xs text-slate-300"></i></button>
            <button onclick="navigateTo('view-help')" class="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50"><i class="fa-solid fa-circle-question w-5 text-brand-blue"></i><span class="flex-1 font-bold text-slate-700">${t('Help & Travel Info')}</span><i class="fa-solid fa-chevron-right text-xs text-slate-300"></i></button>
            <button onclick="tourGo(0)" class="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50"><i class="fa-solid fa-route w-5 text-brand-blue"></i><span class="flex-1 font-bold text-slate-700">Take the guided tour</span><i class="fa-solid fa-chevron-right text-xs text-slate-300"></i></button>
            <button onclick="loadSample()" class="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50"><i class="fa-solid fa-wand-magic-sparkles w-5 text-brand-blue"></i><span class="flex-1 font-bold text-slate-700">Load a sample trip</span><i class="fa-solid fa-chevron-right text-xs text-slate-300"></i></button>
            <button onclick="navigateTo('view-ops')" class="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50"><i class="fa-solid fa-clipboard-list w-5 text-brand-blue"></i><span class="flex-1 font-bold text-slate-700">Operator console</span><span class="text-xs text-slate-400">Staff demo</span><i class="fa-solid fa-chevron-right text-xs text-slate-300"></i></button>
            <button onclick="toggleLang()" class="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50"><i class="fa-solid fa-language w-5 text-brand-blue"></i><span class="flex-1 font-bold text-slate-700">${t('Language')}</span><span class="text-xs font-black text-slate-500">${DB.lang === 'fil' ? 'Filipino' : 'English'}</span></button>
        </div>
        <div class="card p-5">
            <h3 class="font-black text-slate-800 mb-1"><i class="fa-solid fa-mobile-screen-button text-brand-blue mr-2"></i>${t('Install App')}</h3>
            ${isStandalone() ? '<p class="text-sm text-green-600 font-bold">Installed. You are using the app.</p>'
                : installEvt ? `<p class="text-sm text-slate-500 mb-3">Add it to your home screen for one-tap booking and offline tickets.</p><button onclick="installApp()" class="btn-blue px-6 py-3">${t('Install App')}</button>`
                : '<p class="text-sm text-slate-500">iPhone: tap Share, then Add to Home Screen. Android: open the browser menu, then Install app.</p>'}
        </div>
        <div class="flex gap-3 justify-center pt-1">
            <a data-social="facebook" target="_blank" rel="noopener" aria-label="Facebook" class="w-11 h-11 rounded-full bg-white border border-slate-200 text-brand-blue flex items-center justify-center text-lg"><i class="fa-brands fa-facebook-f"></i></a>
            <a data-social="tiktok" target="_blank" rel="noopener" aria-label="TikTok" class="w-11 h-11 rounded-full bg-white border border-slate-200 text-brand-blue flex items-center justify-center text-lg"><i class="fa-brands fa-tiktok"></i></a>
            <a data-social="instagram" target="_blank" rel="noopener" aria-label="Instagram" class="w-11 h-11 rounded-full bg-white border border-slate-200 text-brand-blue flex items-center justify-center text-lg"><i class="fa-brands fa-instagram"></i></a>
        </div>
        <button onclick="resetDemo()" class="block mx-auto text-xs text-slate-400 hover:text-brand-red underline">Reset demo data on this device</button>`;
    wireSocial();
}

function saveProfile() {
    DB.profile.first = $('accFirst').value.trim(); DB.profile.last = $('accLast').value.trim();
    save(); updateAuthUI(); toast('Details saved');
}
function resetDemo() {
    openConfirm({
        title: 'Reset demo data?', body: '<p>This clears the bookings, parcels, points and sign-in saved on this device.</p>', okText: 'Reset', cancelText: 'Back',
        onOk: () => { DB.bookings = []; DB.parcels = []; DB.profile = null; DB.points = 0; DB.notes = []; DB.follow = []; DB.counter = []; DB.saved = []; DB.fares = null; DB.advisory = null; applyFares(); S.ticket = null; updateBell(); save(); updateAuthUI(); renderAccount(); toast('Demo data cleared'); }
    });
}
async function installApp() {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice;
    installEvt = null; renderAccount();
}
function wireSocial() { document.querySelectorAll('[data-social]').forEach(a => { a.href = SOCIAL[a.dataset.social]; }); }
const ADVISORY_DEFAULT = 'Road works along Andaya Highway (Quezon) may add 30 to 45 minutes to night trips this week.';
const advKey = () => 'a' + (DB.advisory ? DB.advisory.ts : 0);
function renderAdvisory() {
    const text = DB.advisory ? DB.advisory.text : ADVISORY_DEFAULT;
    $('advText').textContent = text; $('advFirst').textContent = text;
    let seen = false; try { seen = sessionStorage.getItem('sl_adv') === advKey(); } catch (e) { /* ignore */ }
    $('advisory').classList.toggle('hidden', seen);
}
function dismissAdvisory() { $('advisory').classList.add('hidden'); try { sessionStorage.setItem('sl_adv', advKey()); } catch (e) { /* ignore */ } }
function renderFeatured() { document.querySelectorAll('[data-feat]').forEach(el => { const [d, k] = el.dataset.feat.split('|'); el.textContent = formatPHP(ROUTES[d][k]); }); }

/* -------------------------------------------------------------------- init */

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; if (currentView === 'view-account') renderAccount(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('App installed'); if (currentView === 'view-account') renderAccount(); });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* file:// or blocked */ }));

window.addEventListener('DOMContentLoaded', () => {
    const today = todayLocal();
    $('date').value = today; $('date').min = today; $('retDate').min = today;

    const track = $('testimonialTrack');
    let slide = 0;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => { slide = (slide + 1) % track.children.length; track.style.transform = `translateX(-${slide * 100}%)`; }, 4500);

    const tick = () => { $('liveTimeTracker').innerText = new Date().toLocaleTimeString('en-US', { hour12: false }); };
    tick(); setInterval(tick, 1000);

    initOTPInputs();
    document.querySelectorAll('input[name="payment"]').forEach(r => r.addEventListener('change', highlightPayment));
    // digits only in mobile fields
    document.querySelectorAll('input[type="tel"][pattern], #mbMobile').forEach(i => i.addEventListener('input', () => { i.value = i.value.replace(/\D/g, ''); }));
    // tap outside or press Esc to close a dialog
    document.querySelectorAll('.modal[data-dismiss]').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }));
    document.addEventListener('keydown', (e) => {
        const open = openModals(), top = open[open.length - 1];
        if (e.key === 'Escape' && top && top.hasAttribute('data-dismiss')) closeModal(top.id);
        if (e.key === 'Tab' && top) { // keep the keyboard inside the open dialog
            const f = focusables(top); if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && (document.activeElement === first || !top.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && (document.activeElement === last || !top.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
        }
        // links that act as buttons respond to Enter and Space
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('a[role="button"]')) { e.preventDefault(); e.target.click(); }
    });
    document.querySelectorAll('a[onclick]:not([href])').forEach(a => { a.setAttribute('role', 'button'); a.tabIndex = 0; });
    document.querySelectorAll('.modal').forEach((m, i) => {
        m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
        const h = m.querySelector('h3'); if (h) { h.id = h.id || 'modalTitle' + i; m.setAttribute('aria-labelledby', h.id); }
    });
    $('opsDate').value = today; $('scanDate').value = today;
    // translate whatever gets rendered later while Filipino is on
    new MutationObserver(muts => {
        if (DB.lang !== 'fil') return;
        muts.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 3) trNode(n); else if (n.nodeType === 1) trTree(n); }));
    }).observe(document.body, { childList: true, subtree: true });
    updateBell(); checkReminders(); setInterval(checkReminders, 60000);

    const termOpts = TERMINALS.map(x => `<option>${x.name}</option>`).join('');
    $('cgFrom').innerHTML = termOpts; $('cgTo').innerHTML = termOpts; $('cgTo').selectedIndex = 3;

    renderAdvisory(); renderFeatured();
    setInterval(() => { if (currentView === 'view-track') renderMap(); }, 30000);

    renderHelp();
    wireSocial();
    startLiveFIDSUpdates();
    updateAuthUI();
    applyLang();

    const first = showView('view-' + (location.hash.slice(1) || 'home'));
    history.replaceState({ view: first }, '', '#' + first.replace('view-', ''));
});
