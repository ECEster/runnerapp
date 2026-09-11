// regio.js — shared script for regional calendar pages
// Requires REGIO_PROVINCES to be defined before this script loads

var calYear, calMonth;
var filteredEvents = [];

var MONTHS_NL = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
var MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var DAYS_NL = ['Ma','Di','Wo','Do','Vr','Za','Zo'];
var DAYS_EN = ['Mo','Tu','We','Th','Fr','Sa','Su'];

function getBadgeClass(type) { return 'badge-' + type.toLowerCase().replace(/\s+/g, '-'); }
function getTypeName(type, lang) {
  var names = {
    nl: { 'marathon':'Marathon','trail':'Trail','bosloop':'Bosloop','cross':'Cross','gemengd parcours':'Gemengd parcours','wegevenement':'Wegevenement','parkloop':'Parkloop','funrun':'Fun Run','survivalrun':'Survival Run','ultrarun':'Ultrarun','virtuele run':'Virtuele Run','estafette':'Estafette','coopertest':'Coopertest','studentenevenement':'Studentenevenement','sportief wandelen':'Sportief Wandelen','inclusieve runs':'Inclusieve Run','gecertificeerd parcours':'Gecert. Parcours' },
    en: { 'marathon':'Marathon','trail':'Trail','bosloop':'Forest Run','cross':'Cross Country','gemengd parcours':'Mixed Terrain','wegevenement':'Road Race','parkloop':'Park Run','funrun':'Fun Run','survivalrun':'Survival Run','ultrarun':'Ultra Run','virtuele run':'Virtual Run','estafette':'Relay','coopertest':'Cooper Test','studentenevenement':'Student Event','sportief wandelen':'Sports Walking','inclusieve runs':'Inclusive Run','gecertificeerd parcours':'Certified Course' }
  };
  return (names[lang]||names.nl)[type]||type;
}

function getFilters() {
  return {
    type:     document.getElementById('f-type').value,
    province: document.getElementById('f-province').value,
    distance: document.getElementById('f-distance').value,
    dateFrom: document.getElementById('f-date-from').value,
    dateTo:   document.getElementById('f-date-to').value,
    search:   document.getElementById('f-search').value.trim().toLowerCase()
  };
}

function filterEvents() {
  var f = getFilters();
  var todayStr = new Date().toISOString().split('T')[0];
  return EVENTS.filter(function(ev) {
    if (ev.date < todayStr) return false;
    // Always restrict to this regio's provinces
    if (REGIO_PROVINCES.indexOf(ev.province) === -1) return false;
    if (f.type && ev.type !== f.type) return false;
    if (f.province && ev.province !== f.province) return false;
    if (f.distance && ev.distances.indexOf(f.distance) === -1) return false;
    if (f.dateFrom && ev.date < f.dateFrom) return false;
    if (f.dateTo && ev.date > f.dateTo) return false;
    if (f.search && !(ev.name_nl.toLowerCase().indexOf(f.search) !== -1 || ev.city.toLowerCase().indexOf(f.search) !== -1)) return false;
    return true;
  });
}

function applyFilters() {
  var lang = getLang();
  var sort = document.getElementById('sort-select').value;
  filteredEvents = filterEvents();
  if (sort === 'name') {
    filteredEvents.sort(function(a,b){ return (lang==='en'?a.name_en:a.name_nl).localeCompare(lang==='en'?b.name_en:b.name_nl); });
  } else {
    filteredEvents.sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
  }
  renderList(lang);
  renderCalendar();
  var countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = filteredEvents.length + ' evenementen';
}

function renderList(lang) {
  var el = document.getElementById('events-list');
  if (!filteredEvents.length) {
    el.innerHTML = '<div class="no-events-msg" style="grid-column:1/-1"><div class="no-events-msg__icon">🏃</div><h3>Geen evenementen gevonden</h3><p>Pas de filters aan om meer evenementen te zien.</p></div>';
    return;
  }
  el.innerHTML = filteredEvents.map(function(ev) {
    var name = lang==='en' ? ev.name_en : ev.name_nl;
    var dateStr = formatDate(ev.date, lang);
    var badgeClass = getBadgeClass(ev.type);
    var typeName = getTypeName(ev.type, lang);
    var priceHtml = ev.paid ? '<span class="event-card__price">'+formatPrice(ev.price)+'</span>' : '<span class="event-card__price free">Gratis</span>';
    var freeBadge = !ev.paid ? '<span class="event-card__free-badge">Gratis</span>' : '';
    var distChips = ev.distances.map(function(d){ return '<span class="event-card__dist-chip">'+d+'</span>'; }).join('');
    return '<div class="event-card">'+
      '<div class="event-card__img">'+
        '<img src="'+ev.image+'" alt="'+name+'" loading="lazy">'+freeBadge+
      '</div>'+
      '<div class="event-card__body">'+
        '<div class="event-card__date">📅 '+dateStr+'</div>'+
        '<div class="event-card__title">'+name+'</div>'+
        '<div class="event-card__meta"><span>📍 '+ev.city+'</span><span>'+ev.province+'</span></div>'+
        '<div class="event-card__distances">'+distChips+'</div>'+
        '<span class="event-card__type '+badgeClass+'">'+typeName+'</span>'+
        '<div class="event-card__footer">'+priceHtml+'<a href="evenement.html?id='+ev.id+'" class="btn btn--ghost btn--sm">Meer info</a></div>'+
      '</div>'+
    '</div>';
  }).join('');
}

function renderCalendar() {
  var lang = getLang();
  var months = lang==='en' ? MONTHS_EN : MONTHS_NL;
  var days   = lang==='en' ? DAYS_EN : DAYS_NL;
  document.getElementById('cal-title').textContent =
    months[calMonth].charAt(0).toUpperCase()+months[calMonth].slice(1)+' '+calYear;

  var grid = document.getElementById('calendar-grid');
  var html = days.map(function(d){ return '<div class="calendar-dow">'+d+'</div>'; }).join('');
  var firstDay   = new Date(calYear, calMonth, 1).getDay();
  var startOffset = (firstDay + 6) % 7;
  var daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  var daysInPrev  = new Date(calYear, calMonth, 0).getDate();
  var today = new Date(); today.setHours(0,0,0,0);

  var evByDay = {};
  filteredEvents.forEach(function(ev) {
    var d = new Date(ev.date);
    if (d.getFullYear()===calYear && d.getMonth()===calMonth) {
      var day = d.getDate();
      if (!evByDay[day]) evByDay[day] = [];
      evByDay[day].push(ev);
    }
  });

  var totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  for (var i=0; i<totalCells; i++) {
    var dayNum, isOther=false;
    if (i < startOffset) { dayNum = daysInPrev - startOffset + i + 1; isOther=true; }
    else if (i >= startOffset + daysInMonth) { dayNum = i - startOffset - daysInMonth + 1; isOther=true; }
    else { dayNum = i - startOffset + 1; }
    var cellDate = isOther ? null : new Date(calYear, calMonth, dayNum);
    var isToday  = cellDate && cellDate.getTime()===today.getTime();
    var evs = (!isOther && evByDay[dayNum]) ? evByDay[dayNum] : [];
    var cls = 'calendar-day';
    if (isOther) cls += ' other-month';
    if (isToday) cls += ' today';
    if (evs.length) cls += ' has-events';
    var dots = evs.slice(0,5).map(function(ev){ return '<div class="cal-dot cal-dot--accent" title="'+(lang==='en'?ev.name_en:ev.name_nl)+'"></div>'; }).join('');
    var clickAttr = evs.length && !isOther ? ' onclick="openDayPanel('+calYear+','+(calMonth)+','+dayNum+')"' : '';
    html += '<div class="'+cls+'"'+clickAttr+'>'+
      '<div class="cal-day-num">'+dayNum+'</div>'+
      '<div class="cal-dots">'+dots+'</div>'+
    '</div>';
  }
  grid.innerHTML = html;
}

function openDayPanel(year, month, day) {
  var lang = getLang();
  var months = lang==='en' ? MONTHS_EN : MONTHS_NL;
  var evs = filteredEvents.filter(function(ev){
    var d = new Date(ev.date);
    return d.getFullYear()===year && d.getMonth()===month && d.getDate()===day;
  });
  var panel = document.getElementById('day-panel');
  document.getElementById('day-panel-title').textContent = day+' '+months[month]+' '+year;
  if (!evs.length) { panel.classList.add('hidden'); return; }
  document.getElementById('day-panel-list').innerHTML = evs.map(function(ev){
    var name = lang==='en'?ev.name_en:ev.name_nl;
    var badgeClass = getBadgeClass(ev.type);
    var typeName = getTypeName(ev.type, lang);
    return '<div style="display:flex;align-items:center;gap:1rem;padding:0.6rem 0;border-bottom:1px solid var(--surface2)">'+
      '<span class="event-card__badge '+badgeClass+'" style="position:static;font-size:0.72rem;padding:3px 10px;">'+typeName+'</span>'+
      '<span style="font-weight:600;flex:1">'+name+'</span>'+
      '<span style="color:var(--mid);font-size:0.82rem">'+ev.city+'</span>'+
      '<a href="evenement.html?id='+ev.id+'" class="btn btn--ghost btn--sm">Meer info</a>'+
    '</div>';
  }).join('');
  panel.classList.remove('hidden');
  panel.scrollIntoView({behavior:'smooth', block:'nearest'});
}

function closeDayPanel() { document.getElementById('day-panel').classList.add('hidden'); }
function calPrev() { calMonth--; if (calMonth < 0) { calMonth=11; calYear--; } renderCalendar(); }
function calNext() { calMonth++; if (calMonth > 11) { calMonth=0; calYear++; } renderCalendar(); }

function clearFilters() {
  document.getElementById('f-type').value='';
  document.getElementById('f-province').value='';
  document.getElementById('f-distance').value='';
  document.getElementById('f-date-from').value='';
  document.getElementById('f-date-to').value='';
  document.getElementById('f-search').value='';
  applyFilters();
}

function toggleLang() {
  var cur = getLang();
  setLang(cur==='nl'?'en':'nl');
  var lang = getLang();
  var btnM = document.getElementById('lang-toggle-mobile');
  if (btnM) btnM.textContent = I18N[lang].nav_language;
  applyFilters();
  applyI18n(lang);
}
function toggleMobileNav() { document.getElementById('mobile-nav').classList.toggle('open'); }

// Init
(async function() {
  var now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();
  var lang = getLang();
  applyI18n(lang);
  var btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = I18N[lang].nav_language;
  var btnM = document.getElementById('lang-toggle-mobile');
  if (btnM) btnM.textContent = I18N[lang].nav_language;
  // Haal ook evenementen op die via het admin-paneel zijn toegevoegd
  await loadEventsFromDB().catch(function(){ return false; });
  applyFilters();
})();
