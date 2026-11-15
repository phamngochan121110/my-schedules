const $=id=>document.getElementById(id);
const TYPES={birthday:{icon:"🎂",color:"#ffbefb",label:"Sinh nhật"},study:{icon:"📚",color:"#dc95ff",label:"Học tập"},food:{icon:"🍰",color:"#fff0a6",label:"Ăn uống"},bike:{icon:"🚲",color:"#b9e8d0",label:"Đạp xe"},school:{icon:"🏫",color:"#c9d9ff",label:"Trường học"},swim:{icon:"🏊",color:"#aee7f2",label:"Bơi lội"},shopping:{icon:"🛍️",color:"#ffc9df",label:"Mua sắm"},exam:{icon:"📝",color:"#ffcf9d",label:"Thi cử"},travel:{icon:"✈️",color:"#c5d9ff",label:"Du lịch"},meeting:{icon:"💌",color:"#ffd1e8",label:"Hẹn gặp"},outing:{icon:"🎡",color:"#ffd9a8",label:"Đi chơi"},other:{icon:"🌷",color:"#e8d4ff",label:"Khác"}};
const today=new Date(); const keyDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const load=k=>{try{return JSON.parse(localStorage.getItem(k)||"[]")}catch{return []}};
let events=load("ms_events"),tasks=load("ms_tasks"),countdowns=load("ms_countdowns");
let view="calendar",shown=new Date(today.getFullYear(),today.getMonth(),1),selected=keyDate(today);
let reminded=new Set();
function save(){localStorage.setItem("ms_events",JSON.stringify(events));localStorage.setItem("ms_tasks",JSON.stringify(tasks));localStorage.setItem("ms_countdowns",JSON.stringify(countdowns))}
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2300)}
function fmt(d,opts={day:"numeric",month:"long",year:"numeric"}){return new Intl.DateTimeFormat((localStorage.getItem("ms_language")||"vi")==="vi"?"vi-VN":"en-US",opts).format(d)}
function dateFrom(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
// Vietnamese lunar calendar conversion (UTC+7), valid for modern Gregorian dates.
const PI=Math.PI, TZ=7;
function jdFromDate(dd,mm,yy){let a=Math.floor((14-mm)/12),y=yy+4800-a,m=mm+12*a-3;let jd=dd+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;if(jd<2299161)jd=dd+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-32083;return jd}
function newMoon(k){let T=k/1236.85,T2=T*T,T3=T2*T,dr=PI/180;let Jd1=2415020.75933+29.53058868*k+0.0001178*T2-0.000000155*T3;Jd1+=0.00033*Math.sin((166.56+132.87*T-0.009173*T2)*dr);let M=359.2242+29.10535608*k-0.0000333*T2-0.00000347*T3;let Mp=306.0253+385.81691806*k+0.0107306*T2+0.00001236*T3;let F=21.2964+390.67050646*k-0.0016528*T2-0.00000239*T3;let C1=(0.1734-0.000393*T)*Math.sin(M*dr)+0.0021*Math.sin(2*dr*M);C1-=0.4068*Math.sin(Mp*dr)+0.0161*Math.sin(2*dr*Mp);C1-=0.0004*Math.sin(3*dr*Mp);C1+=0.0104*Math.sin(2*dr*F)-0.0051*Math.sin((M+Mp)*dr);C1-=0.0074*Math.sin((M-Mp)*dr)+0.0004*Math.sin((2*F+M)*dr);C1-=0.0004*Math.sin((2*F-M)*dr)-0.0006*Math.sin((2*F+Mp)*dr);C1+=0.0010*Math.sin((2*F-Mp)*dr)+0.0005*Math.sin((2*Mp+M)*dr);let deltat=T<-11?0.001+0.000839*T+0.0002261*T2-0.00000845*T3-0.000000081*T*T3:-0.000278+0.000265*T+0.000262*T2;return Jd1+C1-deltat}
function sunLong(jdn){let T=(jdn-2451545)/36525,T2=T*T,dr=PI/180;let M=357.52910+35999.05030*T-0.0001559*T2-0.00000048*T*T2;let L0=280.46645+36000.76983*T+0.0003032*T2;let DL=(1.914600-0.004817*T-0.000014*T2)*Math.sin(dr*M)+(0.019993-0.000101*T)*Math.sin(2*dr*M)+0.000290*Math.sin(3*dr*M);let L=(L0+DL)*dr;L=L-PI*2*Math.floor(L/(PI*2));return L}
function getNewMoonDay(k){return Math.floor(newMoon(k)+0.5+TZ/24)}
function getSunLongitude(day){return Math.floor(sunLong(day-0.5-TZ/24)/PI*6)}
function getLunarMonth11(yy){let off=jdFromDate(31,12,yy)-2415021,k=Math.floor(off/29.530588853),nm=getNewMoonDay(k);if(getSunLongitude(nm)>=9)nm=getNewMoonDay(k-1);return nm}
function getLeapMonthOffset(a11){let k=Math.floor(0.5+(a11-2415021.076998695)/29.530588853),last=0,i=1,arc=getSunLongitude(getNewMoonDay(k+i));do{last=arc;i++;arc=getSunLongitude(getNewMoonDay(k+i))}while(arc!==last&&i<14);return i-1}
function solarToLunar(dd,mm,yy){let day=jdFromDate(dd,mm,yy),k=Math.floor((day-2415021.076998695)/29.530588853),monthStart=getNewMoonDay(k+1);if(monthStart>day)monthStart=getNewMoonDay(k);let a11=getLunarMonth11(yy),b11=a11, lunarYear;if(a11>=monthStart){lunarYear=yy;a11=getLunarMonth11(yy-1)}else{lunarYear=yy+1;b11=getLunarMonth11(yy+1)}let lunarDay=day-monthStart+1,diff=Math.floor((monthStart-a11)/29),lunarLeap=0,lunarMonth=diff+11;if(b11-a11>365){let leapDiff=getLeapMonthOffset(a11);if(diff>=leapDiff){lunarMonth=diff+10;if(diff===leapDiff)lunarLeap=1}}if(lunarMonth>12)lunarMonth-=12;if(lunarMonth>=11&&diff<4)lunarYear--;return [lunarDay,lunarMonth,lunarYear,lunarLeap]}
function lunarText(s){let d=dateFrom(s),l=solarToLunar(d.getDate(),d.getMonth()+1,d.getFullYear());return `${l[0]}/${l[1]}${l[3]?" nhuận":""}`}
function evOn(s){return events.filter(e=>e.date===s).sort((a,b)=>(a.time||"").localeCompare(b.time||""))}
function setView(v){view=v;document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===v));render()}
function render(){const titles={calendar:"Calendar",events:"Scheduled",tasks:"To-do list",countdowns:"Countdowns",stats:"Statistics"};$("pageTitle").innerHTML=(titles[view]||"Calendar")+' <span>♡</span>';$("todayLabel").textContent="Hôm nay · "+fmt(today,{day:"numeric",month:"short"});if(view==="calendar")renderCalendar();if(view==="events")renderEvents();if(view==="tasks")renderTasks();if(view==="countdowns")renderCountdowns();if(view==="stats")renderStats();renderDetail()}
function typeIcon(type){return type==="outing"?'<img class="outing-icon" src="outing.svg" alt="" aria-hidden="true">' : TYPES[type].icon}
function renderCalendar(){let y=shown.getFullYear(),m=shown.getMonth(),first=new Date(y,m,1),offset=(first.getDay()+6)%7,start=new Date(y,m,1-offset);let cells="";for(let i=0;i<42;i++){let d=new Date(start);d.setDate(start.getDate()+i);let s=keyDate(d),ev=evOn(s),one=ev[0],bg=one?TYPES[one.type].color:"#fff",multi=ev.length>1;let darker=bg.replace(/^#/,"");let rgb=[0,2,4].map(i=>parseInt(darker.slice(i,i+2),16));let darkColor="#"+rgb.map(v=>Math.max(0,Math.round(v*.72)).toString(16).padStart(2,"0")).join("");let style=ev.length?`style="background:${bg}55;${multi?`border:2px solid ${darkColor};`:``}"`:"";cells+=`<button class="day-cell ${d.getMonth()!==m?"other-month":""} ${s===keyDate(today)?"today":""} ${s===selected?"selected":""} ${multi?"multi":""}" data-date="${s}" ${style}><span class="solar">${d.getDate()}</span><div class="lunar">${lunarText(s)}</div><div class="event-dots">${ev.slice(0,3).map(e=>`<span class="event-dot" title="<span data-user-content>${esc(e.name)}</span>">${typeIcon(e.type)}</span>`).join("")}${ev.length>3?`<span class="more-events">+${ev.length-3}</span>`:""}</div></button>`}
$("content").innerHTML=`<div class="calendar-card"><div class="calendar-toolbar"><div class="month-picker-wrap"><button class="month-title month-title-button" id="monthPickerToggle" type="button" aria-expanded="false"><span class="month-title-label">${fmt(shown,{month:"long",year:"numeric"})}</span><span class="month-picker-caret">⌄</span></button><div class="month-picker hidden" id="monthPicker"><div class="month-picker-head"><button type="button" class="picker-year-step" id="pickerPrevYear">‹</button><select id="pickerYear" aria-label="${(localStorage.getItem("ms_language")||"vi")==="vi"?"Năm":"Year"}"></select><button type="button" class="picker-year-step" id="pickerNextYear">›</button></div><div class="month-picker-grid" id="pickerMonths"></div><button type="button" class="picker-current" id="pickerCurrent">${(localStorage.getItem("ms_language")||"vi")==="vi"?"Về tháng hiện tại":"Go to current month"}</button></div></div><div class="month-actions"><button class="today-btn" id="goToday">Hôm nay</button><button class="icon-btn" id="prevMonth">‹</button><button class="icon-btn" id="nextMonth">›</button></div></div><div class="weekdays">${["T2","T3","T4","T5","T6","T7","CN"].map(x=>`<div>${x}</div>`).join("")}</div><div class="calendar-grid">${cells}</div><div class="calendar-legend"><span><i class="legend-dot" style="background:#ffbefb"></i>Sinh nhật</span><span><i class="legend-dot" style="background:#dc95ff"></i>Học tập</span><span>✦ Chọn ngày để xem chi tiết</span></div></div><div class="below-grid"><div class="mini-card"><h3>✧ Sắp tới</h3><p>${upcomingEvents().slice(0,2).map(e=>`${typeIcon(e.type)} ${esc(e.name)} · ${fmt(dateFrom(e.date),{day:"numeric",month:"short"})}`).join("<br>")||"Chưa có sự kiện sắp tới."}</p></div><div class="mini-card"><h3>♡ Một việc nhỏ hôm nay</h3><p>${tasks.filter(t=>!t.done).length} công việc đang chờ bạn hoàn thành. Cứ từ từ nhé!</p></div></div>`;

const pickerToggle=$("monthPickerToggle"),picker=$("monthPicker");
function closeMonthPicker(){picker.classList.add("hidden");pickerToggle.setAttribute("aria-expanded","false");}
function openMonthPicker(){
 const lang=localStorage.getItem("ms_language")||"vi";
 const year=shown.getFullYear();
 $("pickerYear").innerHTML="";
 for(let y=1900;y<=2100;y++){const o=document.createElement("option");o.value=y;o.textContent=y;if(y===year)o.selected=true;$("pickerYear").appendChild(o);}
 $("pickerMonths").innerHTML="";
 for(let month=0;month<12;month++){
  const b=document.createElement("button");b.type="button";b.className="picker-month"+(month===shown.getMonth()?" active":"");
  b.textContent=lang==="vi"?"Tháng "+(month+1):new Intl.DateTimeFormat("en-US",{month:"short"}).format(new Date(year,month,1));
  b.onclick=()=>{const day=dateFrom(selected).getDate(),last=new Date(Number($("pickerYear").value),month+1,0).getDate();shown=new Date(Number($("pickerYear").value),month,1);selected=keyDate(new Date(shown.getFullYear(),month,Math.min(day,last)));render();};
  $("pickerMonths").appendChild(b);
 }
 $("pickerCurrent").textContent=lang==="vi"?"Về tháng hiện tại":"Go to current month"; $("pickerYear").setAttribute("aria-label",lang==="vi"?"Năm":"Year"); picker.classList.remove("hidden");pickerToggle.setAttribute("aria-expanded","true");
}
pickerToggle.onclick=()=>picker.classList.contains("hidden")?openMonthPicker():closeMonthPicker();
$("pickerYear").onchange=()=>{shown=new Date(Number($("pickerYear").value),shown.getMonth(),1);openMonthPicker();};
$("pickerPrevYear").onclick=()=>{$("pickerYear").value=Number($("pickerYear").value)-1;$("pickerYear").dispatchEvent(new Event("change"));};
$("pickerNextYear").onclick=()=>{$("pickerYear").value=Number($("pickerYear").value)+1;$("pickerYear").dispatchEvent(new Event("change"));};
$("pickerCurrent").onclick=()=>{shown=new Date(today.getFullYear(),today.getMonth(),1);selected=keyDate(today);render();};
$("content").querySelectorAll("[data-date]").forEach(b=>b.onclick=()=>{selected=b.dataset.date;render()});$("prevMonth").onclick=()=>{shown.setMonth(shown.getMonth()-1);render()};$("nextMonth").onclick=()=>{shown.setMonth(shown.getMonth()+1);render()};$("goToday").onclick=()=>{shown=new Date(today.getFullYear(),today.getMonth(),1);selected=keyDate(today);render()}}
function renderDetail(){let d=dateFrom(selected),ev=evOn(selected);$("detailTitle").textContent=fmt(d,{day:"numeric",month:"long"});$("detailContent").innerHTML=`<div class="date-summary"><strong>${d.getDate()} <small style="font-size:13px">/ ${d.getMonth()+1}</small></strong><small>${fmt(d,{weekday:"long",year:"numeric"})} · Âm lịch ${lunarText(selected)}</small></div>${ev.length?ev.map(e=>`<div class="event-item" data-edit="${e.id}" style="border-left-color:${TYPES[e.type].color}"><b>${typeIcon(e.type)} ${esc(e.name)}</b><small>${e.time?time12(e.time):"Cả ngày"} · ${TYPES[e.type].label}</small>${e.note?`<small><span data-user-content>${esc(e.note)}</span></small>`:""}</div>`).join(""):`<div class="empty-state">Chưa có sự kiện nào trong ngày này.<br>Thêm một điều đáng mong chờ nhé! ♡</div>`}<button class="primary-btn" style="width:100%;margin-top:10px" id="addSelected">＋ Thêm vào ngày này</button>`;$("detailContent").querySelectorAll("[data-edit]").forEach(el=>el.onclick=()=>openEvent(el.dataset.edit));$("addSelected").onclick=()=>openEvent(null,selected)}
function upcomingEvents(){return [...events].filter(e=>e.date>=keyDate(today)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))}
function renderEvents(){let arr=[...events].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));$("content").innerHTML=`<div class="section-card"><div class="section-heading"><div><h2>Tất cả sự kiện ✧</h2><p>Những điều quan trọng bạn đã đánh dấu</p></div><button class="primary-btn" id="addInView">＋ Thêm mới</button></div>${arr.length?arr.map(e=>`<div class="list-row"><div class="list-icon" style="background:${TYPES[e.type].color}55">${typeIcon(e.type)}</div><div class="list-main"><b>${esc(e.name)}</b><small>${fmt(dateFrom(e.date))} · ${e.time?time12(e.time):"Cả ngày"} · ${TYPES[e.type].label}</small></div><button class="small-btn" data-edit="${e.id}">Chi tiết</button></div>`).join(""):`<div class="empty-state">Chưa có sự kiện. Hãy thêm sự kiện đầu tiên của bạn!</div>`}</div>`;$("addInView").onclick=()=>openEvent();$("content").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openEvent(b.dataset.edit))}
function renderTasks(){$("content").innerHTML=`<div class="section-card"><div class="section-heading"><div><h2>To-do list ☑</h2><p>Viết ra từng việc nhỏ và đánh dấu khi hoàn thành</p></div></div><form id="taskForm" style="display:flex;gap:8px;margin-bottom:15px"><input id="taskInput" required maxlength="100" placeholder="Bạn cần làm gì?" style="flex:1;min-width:0;border:1px solid var(--line);border-radius:10px;padding:10px;font:600 12px Nunito"><input id="taskDue" type="date" style="border:1px solid var(--line);border-radius:10px;padding:8px;font:600 11px Nunito"><button class="primary-btn">＋</button></form>${tasks.length?tasks.map(t=>`<div class="list-row"><input type="checkbox" class="task-check" data-task="${t.id}" ${t.done?"checked":""}><div class="list-main"><b style="${t.done?"text-decoration:line-through;opacity:.5":""}"><span data-user-content>${esc(t.name)}</span></b><small>${t.due?fmt(dateFrom(t.due)):"Không đặt hạn"}</small></div><button class="small-btn" data-del-task="${t.id}">Xóa</button></div>`).join(""):`<div class="empty-state">Danh sách đang trống. Thêm một việc nhỏ nhé!</div>`}</div>`;$("taskForm").onsubmit=e=>{e.preventDefault();tasks.push({id:crypto.randomUUID(),name:$("taskInput").value,due:$("taskDue").value,done:false});save();render()};$("content").querySelectorAll("[data-task]").forEach(c=>c.onchange=()=>{let t=tasks.find(x=>x.id===c.dataset.task);t.done=c.checked;save();render()});$("content").querySelectorAll("[data-del-task]").forEach(b=>b.onclick=()=>{tasks=tasks.filter(t=>t.id!==b.dataset.delTask);save();render()})}
function renderCountdowns(){$("content").innerHTML=`<div class="section-card"><div class="section-heading"><div><h2>Countdowns ⌛</h2><p>Đếm ngược đến những ngày bạn mong chờ</p></div></div><form id="countForm" class="form-row" style="align-items:end"><label style="flex:1">Tên ngày đặc biệt<input id="countName" required placeholder="Ví dụ: Kỳ nghỉ hè"></label><label>Ngày<input id="countDate" type="date" required></label><button class="primary-btn" style="margin-bottom:12px">＋ Thêm</button></form>${countdowns.length?countdowns.map(c=>{let n=Math.ceil((dateFrom(c.date)-new Date(new Date().toDateString()))/86400000);return `<div class="list-row"><div class="list-icon">🎀</div><div class="list-main"><b><span data-user-content>${esc(c.name)}</span></b><small>${fmt(dateFrom(c.date))}</small></div><div class="count-number">${n===0?"Hôm nay":n<0?"Đã qua":n+" ngày"}</div><button class="small-btn" data-del-count="${c.id}">×</button></div>`}).join(""):`<div class="empty-state">Thêm ngày sinh nhật, chuyến đi hoặc cột mốc đáng nhớ.</div>`}</div>`;$("countForm").onsubmit=e=>{e.preventDefault();countdowns.push({id:crypto.randomUUID(),name:$("countName").value,date:$("countDate").value});save();render()};$("content").querySelectorAll("[data-del-count]").forEach(b=>b.onclick=()=>{countdowns=countdowns.filter(c=>c.id!==b.dataset.delCount);save();render()})}
function renderStats(){let total=events.length,up=upcomingEvents().length,done=tasks.filter(t=>t.done).length;let counts=Object.keys(TYPES).map(k=>({k,n:events.filter(e=>e.type===k).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n),max=Math.max(1,...counts.map(x=>x.n));$("content").innerHTML=`<div class="stat-grid"><div class="stat-box"><strong>${total}</strong><small>TỔNG SỰ KIỆN</small></div><div class="stat-box"><strong>${up}</strong><small>SẮP DIỄN RA</small></div><div class="stat-box"><strong>${done}/${tasks.length}</strong><small>VIỆC ĐÃ XONG</small></div></div><div class="section-card"><div class="section-heading"><div><h2>Thống kê lịch trình</h2><p>Tổng quan những gì bạn đã lên kế hoạch</p></div></div>${counts.length?counts.map(x=>`<div class="bar-row"><span>${typeIcon(x.k)} ${TYPES[x.k].label}</span><div class="bar"><i style="width:${x.n/max*100}%"></i></div><b>${x.n}</b></div>`).join(""):`<div class="empty-state">Chưa có dữ liệu để thống kê. Hãy thêm sự kiện nhé!</div>`}</div>`}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function time12(t){if(!t)return "";let [h,m]=t.split(":").map(Number);return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`}
function openEvent(id=null,date=selected){let e=events.find(x=>x.id===id);$("eventForm").reset();$("eventId").value=e?.id||"";$("eventName").value=e?.name||"";$("eventDate").value=e?.date||date;$("eventTime").value=e?.time||"";$("eventType").value=e?.type||"birthday";$("eventReminder").value=e?.reminder||"0";$("eventNote").value=e?.note||"";$("modalHeading").textContent=e?"Chỉnh sửa sự kiện":"Thêm sự kiện";$("deleteEvent").style.visibility=e?"visible":"hidden";$("eventModal").classList.remove("hidden")}
$("eventForm").onsubmit=e=>{e.preventDefault();let id=$("eventId").value;let obj={id:id||crypto.randomUUID(),name:$("eventName").value.trim(),date:$("eventDate").value,time:$("eventTime").value,type:$("eventType").value,reminder:$("eventReminder").value,note:$("eventNote").value.trim()};if(id)events=events.map(x=>x.id===id?obj:x);else events.push(obj);selected=obj.date;shown=new Date(dateFrom(obj.date).getFullYear(),dateFrom(obj.date).getMonth(),1);save();$("eventModal").classList.add("hidden");render();toast("Đã lưu sự kiện ♡");scheduleReminder(obj)};
$("deleteEvent").onclick=()=>{let id=$("eventId").value;if(id&&confirm("Xóa sự kiện này?")){events=events.filter(e=>e.id!==id);save();$("eventModal").classList.add("hidden");render();toast("Đã xóa sự kiện")}};
$("closeModal").onclick=()=>$("eventModal").classList.add("hidden");$("quickAdd").onclick=()=>openEvent();$("backupBtn").onclick=()=>$("backupModal").classList.remove("hidden");$("closeBackup").onclick=()=>$("backupModal").classList.add("hidden");
$("exportBtn").onclick=()=>{let blob=new Blob([JSON.stringify({version:1,events,tasks,countdowns},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="my-schedules-backup.json";a.click();URL.revokeObjectURL(a.href);toast("Đã tạo bản sao lưu")};
$("importFile").onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let data=JSON.parse(await f.text());if(!Array.isArray(data.events)||!Array.isArray(data.tasks)||!Array.isArray(data.countdowns))throw Error();if(!confirm("Nhập bản sao lưu và thay thế dữ liệu hiện tại?"))return;events=data.events;tasks=data.tasks;countdowns=data.countdowns;save();render();$("backupModal").classList.add("hidden");toast("Khôi phục dữ liệu thành công")}catch{toast("Tệp sao lưu không hợp lệ")}e.target.value=""};
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>setView(b.dataset.view));
function scheduleReminder(e){if(!e.reminder||!e.time||!("Notification"in window)||Notification.permission!=="granted")return;let when=new Date(`${e.date}T${e.time}`).getTime()-Number(e.reminder)*60000;if(when>Date.now()&&when-Date.now()<2147480000)setTimeout(()=>new Notification("My Schedules ♡",{body:`Sắp đến: ${e.name}`}),when-Date.now())}
if("Notification"in window&&Notification.permission==="default"){/* Ask only when the user chooses to enable reminders. */}
document.addEventListener("click",e=>{if(e.target.id==="quickAdd"&&"Notification"in window&&Notification.permission==="default"){Notification.requestPermission()}});
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();

if("Notification" in window && Notification.permission === "granted"){events.forEach(scheduleReminder)}


const DAILY_QUOTES = [
{en:"Only that day dawns to which we are awake.",vi:"Ngày mới chỉ thật sự bắt đầu khi ta biết trân trọng nó.",by:"Henry David Thoreau",src:"Walden (1854)",url:"https://www.gutenberg.org/ebooks/205"},
{en:"Peace is always beautiful.",vi:"Bình yên luôn mang một vẻ đẹp riêng.",by:"Walt Whitman",src:"The Sleepers, Leaves of Grass",url:"https://www.gutenberg.org/ebooks/1322"},
{en:"As long as you live, keep learning how to live.",vi:"Còn sống là còn học cách sống tốt hơn.",by:"Seneca",src:"Letters to Lucilius, Letter 76",url:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius"},
{en:"Sweet are the uses of adversity.",vi:"Khó khăn cũng có thể đem lại những điều quý giá.",by:"William Shakespeare",src:"As You Like It, Act 2, Scene 1",url:"https://www.gutenberg.org/ebooks/1523"},
{en:"No man is an island.",vi:"Không ai phải đi qua mọi điều một mình.",by:"John Donne",src:"Meditation XVII (1624)",url:"https://www.gutenberg.org/ebooks/23772"},
{en:"Knowledge is power.",vi:"Tri thức là sức mạnh.",by:"Francis Bacon",src:"Meditationes Sacrae (1597)",url:"https://en.wikisource.org/wiki/Meditationes_Sacrae"},
{en:"Well begun is half done.",vi:"Khởi đầu tốt đẹp là đã đi được nửa chặng đường.",by:"Traditional saying",src:"Common classical proverb",url:"https://classics.mit.edu/Aristotle/nicomachaen.html"},
{en:"Very little indeed is necessary for living a happy life.",vi:"Để sống vui vẻ, đôi khi ta không cần quá nhiều.",by:"Marcus Aurelius",src:"Meditations, Book VII",url:"https://www.gutenberg.org/ebooks/"},
{en:"Start where you are. Use what you have. Do what you can.",vi:"Bắt đầu từ nơi bạn đang đứng, với những gì bạn có.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"A little progress each day adds up to big results.",vi:"Một chút tiến bộ mỗi ngày sẽ tạo nên điều lớn lao.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"You do not have to do everything today.",vi:"Bạn không cần phải hoàn thành mọi thứ chỉ trong hôm nay.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Let today be a fresh page.",vi:"Hãy để hôm nay là một trang giấy mới.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Your pace is still a pace forward.",vi:"Đi theo nhịp độ của riêng mình vẫn là đang tiến về phía trước.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Make room for small moments of joy.",vi:"Hãy dành chỗ cho những niềm vui bé xinh.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Rest is part of the journey, too.",vi:"Nghỉ ngơi cũng là một phần của hành trình.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"You can begin again, gently.",vi:"Bạn luôn có thể bắt đầu lại, thật nhẹ nhàng.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"One kind thought can brighten a whole day.",vi:"Một suy nghĩ tử tế có thể làm sáng bừng cả ngày.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Celebrate how far you have come.",vi:"Hãy trân trọng quãng đường bạn đã đi qua.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Small steps still move you forward.",vi:"Những bước nhỏ vẫn đưa bạn tiến lên.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Give yourself time to grow.",vi:"Hãy cho bản thân thời gian để trưởng thành.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"A calm mind makes space for good ideas.",vi:"Tâm trí bình yên sẽ có chỗ cho những ý tưởng tốt đẹp.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Today is a good day to try again.",vi:"Hôm nay là một ngày tốt để thử lại.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Notice the good things, however small.",vi:"Hãy để ý những điều tốt đẹp, dù chúng nhỏ bé.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"You are allowed to take things one step at a time.",vi:"Bạn có thể giải quyết mọi thứ từng bước một.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"A new day brings new possibilities.",vi:"Ngày mới luôn mang theo những khả năng mới.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Be proud of the effort you make.",vi:"Hãy tự hào về những nỗ lực của mình.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Let your plans leave space for wonder.",vi:"Hãy để lịch trình có chỗ cho những điều bất ngờ.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"Keep the memories, learn from the moments.",vi:"Giữ lại kỷ niệm và học từ từng khoảnh khắc.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"A small act of kindness matters.",vi:"Một hành động tử tế nhỏ bé cũng rất đáng quý.",by:"My Schedules",src:"Lời nhắn riêng",url:""},
{en:"You are growing in ways you cannot yet see.",vi:"Bạn đang trưởng thành theo những cách có thể chưa nhận ra.",by:"My Schedules",src:"Lời nhắn riêng",url:""}
];
const PAIRS = [
  [
    "Calendar",
    "Lịch"
  ],
  [
    "Scheduled",
    "Sự kiện"
  ],
  [
    "To-do list",
    "Việc cần làm"
  ],
  [
    "Countdowns",
    "Đếm ngược"
  ],
  [
    "Statistics",
    "Thống kê"
  ],
  [
    "YOUR PERSONAL PLANNER",
    "LỊCH TRÌNH CÁ NHÂN"
  ],
  [
    "YOUR DAY",
    "NGÀY CỦA BẠN"
  ],
  [
    "Hi, Hân!",
    "Chào, Hân!"
  ],
  [
    "little plans, big days",
    "kế hoạch nhỏ, ngày vui"
  ],
  [
    "Your space, your pace",
    "Không gian của riêng bạn"
  ],
  [
    "Your data is saved on this device.",
    "Dữ liệu được lưu trên thiết bị này."
  ],
  [
    "Solar and lunar calendars together",
    "Lịch dương · lịch âm hiển thị cùng lúc"
  ],
  [
    "Coming up",
    "Sắp tới"
  ],
  [
    "A little task for today",
    "Một việc nhỏ hôm nay"
  ],
  [
    "All events ✧",
    "Tất cả sự kiện ✧"
  ],
  [
    "The important things you've marked",
    "Những điều quan trọng bạn đã đánh dấu"
  ],
  [
    "Write down little tasks and tick them off",
    "Viết ra từng việc nhỏ và đánh dấu khi hoàn thành"
  ],
  [
    "What do you need to do?",
    "Bạn cần làm gì?"
  ],
  [
    "No due date",
    "Không đặt hạn"
  ],
  [
    "Your list is empty. Add a little task!",
    "Danh sách đang trống. Thêm một việc nhỏ nhé!"
  ],
  [
    "Count down to days you're looking forward to",
    "Đếm ngược đến những ngày bạn mong chờ"
  ],
  [
    "Special day name",
    "Tên ngày đặc biệt"
  ],
  [
    "Schedule statistics",
    "Thống kê lịch trình"
  ],
  [
    "An overview of what you've planned",
    "Tổng quan những gì bạn đã lên kế hoạch"
  ],
  [
    "TOTAL EVENTS",
    "TỔNG SỰ KIỆN"
  ],
  [
    "UPCOMING",
    "SẮP DIỄN RA"
  ],
  [
    "TASKS DONE",
    "VIỆC ĐÃ XONG"
  ],
  [
    "MAKE A LITTLE PLAN",
    "LÊN KẾ HOẠCH NHỎ"
  ],
  [
    "Add event",
    "Thêm sự kiện"
  ],
  [
    "Event name",
    "Tên sự kiện"
  ],
  [
    "Date",
    "Ngày"
  ],
  [
    "Time",
    "Giờ"
  ],
  [
    "Event type",
    "Loại sự kiện"
  ],
  [
    "Remind me",
    "Nhắc trước"
  ],
  [
    "Notes",
    "Ghi chú"
  ],
  [
    "Delete event",
    "Xóa sự kiện"
  ],
  [
    "Save event ♡",
    "Lưu sự kiện ♡"
  ],
  [
    "YOUR DATA",
    "DỮ LIỆU CỦA BẠN"
  ],
  [
    "Backup & restore",
    "Sao lưu & khôi phục"
  ],
  [
    "Export backup",
    "Xuất bản sao lưu"
  ],
  [
    "Import backup",
    "Nhập bản sao lưu"
  ],
  [
    "No reminder",
    "Không nhắc"
  ],
  [
    "10 minutes",
    "10 phút"
  ],
  [
    "30 minutes",
    "30 phút"
  ],
  [
    "1 hour",
    "1 giờ"
  ],
  [
    "1 day",
    "1 ngày"
  ],
  [
    "Today",
    "Hôm nay"
  ],
  [
    "Add to this day",
    "Thêm vào ngày này"
  ],
  [
    "No events on this day.",
    "Chưa có sự kiện nào trong ngày này."
  ],
  [
    "Choose a day to see details",
    "Chọn ngày để xem chi tiết"
  ],
  [
    "All day",
    "Cả ngày"
  ],
  [
    "Details",
    "Chi tiết"
  ],
  [
    "Delete",
    "Xóa"
  ],
  [
    "Event saved ♡",
    "Đã lưu sự kiện ♡"
  ],
  [
    "Event deleted",
    "Đã xóa sự kiện"
  ],
  [
    "No upcoming events.",
    "Chưa có sự kiện sắp tới."
  ],
  [
    "Tasks are waiting for you. Take your time!",
    "Công việc đang chờ bạn hoàn thành. Cứ từ từ nhé!"
  ],
  [
    "Passed",
    "Đãผ่าน"
  ],
  [
    "＋ Add new",
    "＋ Thêm mới"
  ],
  [
    "＋ Add",
    "＋ Thêm"
  ],
  [
    "Backup / restore",
    "Sao lưu / khôi phục"
  ],
  [
    "Monday",
    "Thứ Hai"
  ],
  [
    "Tuesday",
    "Thứ Ba"
  ],
  [
    "Wednesday",
    "Thứ Tư"
  ],
  [
    "Thursday",
    "Thứ Năm"
  ],
  [
    "Friday",
    "Thứ Sáu"
  ],
  [
    "Saturday",
    "Thứ Bảy"
  ],
  [
    "Sunday",
    "Chủ Nhật"
  ],
  [
    "Mon",
    "T2"
  ],
  [
    "Tue",
    "T3"
  ],
  [
    "Wed",
    "T4"
  ],
  [
    "Thu",
    "T5"
  ],
  [
    "Fri",
    "T6"
  ],
  [
    "Sat",
    "T7"
  ],
  [
    "Sun",
    "CN"
  ],
  [
    "Birthday",
    "Sinh nhật"
  ],
  [
    "Study",
    "Học tập"
  ],
  [
    "Food",
    "Ăn uống"
  ],
  [
    "Cycling",
    "Đạp xe"
  ],
  [
    "School",
    "Trường học"
  ],
  [
    "Swimming",
    "Bơi lội"
  ],
  [
    "Shopping",
    "Mua sắm"
  ],
  [
    "Exams",
    "Thi cử"
  ],
  [
    "Travel",
    "Du lịch"
  ],
  [
    "Meetup",
    "Hẹn gặp"
  ],
  [
    "Other",
    "Khác"
  ],
  [
    "Example: Birthday, math test...",
    "Ví dụ: Sinh nhật, kiểm tra Toán..."
  ],
  [
    "Add a little note for this day...",
    "Thêm thông tin nhỏ cho ngày này..."
  ],
  [
    "No events yet. Add your first event!",
    "Chưa có sự kiện. Hãy thêm sự kiện đầu tiên của bạn!"
  ],
  [
    "An event, trip or milestone to remember.",
    "Thêm ngày sinh nhật, chuyến đi hoặc cột mốc đáng nhớ."
  ],
  [
    "Today",
    "Hôm nay"
  ],
  [
    "days",
    "ngày"
  ],
  [
    "day",
    "ngày"
  ],
  [
    "Calendar",
    "Lịch"
  ],
  [
    "Settings",
    "Cài đặt"
  ],
  [
    "Greeting on the sidebar",
    "Lời chào ở thanh bên"
  ],
  [
    "Language",
    "Ngôn ngữ"
  ],
  [
    "Your preferences are saved on this device.",
    "Tùy chọn được lưu trên thiết bị này."
  ],
  [
    "Save ♡",
    "Lưu ♡"
  ],
  [
    "Solar calendar",
    "Lịch dương"
  ],
  [
    "Lunar calendar",
    "Lịch âm"
  ],
  [
    "No events",
    "Chưa có sự kiện"
  ],
  [
    "A little at a time",
    "Từng chút một"
  ]
];;
function applyLanguage(){
 const lang=localStorage.getItem("ms_language")||"vi";
 document.documentElement.lang=lang;
 const dict={};
 PAIRS.forEach(function(pair){
  const en=pair[0],vi=pair[1];
  dict[en]=lang==="vi"?vi:en;
  dict[vi]=lang==="vi"?vi:en;
 });
 const keys=Object.keys(dict).sort((a,b)=>b.length-a.length);
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 let node;
 while(node=walker.nextNode()){
  if(node.parentElement && node.parentElement.closest("[data-user-content]")) continue;
  let value=node.nodeValue;
  keys.forEach(function(key){
   if(key && value.includes(key)) value=value.split(key).join(dict[key]);
  });
  node.nodeValue=value;
 }
 document.querySelectorAll("[placeholder],[title],[aria-label]").forEach(function(el){
  ["placeholder","title","aria-label"].forEach(function(attr){
   const value=el.getAttribute(attr);
   if(value && dict[value]) el.setAttribute(attr,dict[value]);
  });
 });
 $("settingsTitle").textContent=lang==="vi"?"Cài đặt ⚙":"Settings ⚙";
 $("greetingLabel").firstChild.textContent=lang==="vi"?"Lời chào ở thanh bên":"Sidebar greeting";
 $("languageLabel").firstChild.textContent=lang==="vi"?"Ngôn ngữ":"Language";
 $("settingsHint").textContent=lang==="vi"?"Tùy chọn được lưu trên thiết bị này.":"Your preferences are saved on this device.";
 $("saveSettings").textContent=lang==="vi"?"Lưu ♡":"Save ♡";
 $("settingsBtn").lastChild.textContent=lang==="vi"?" Cài đặt":" Settings";
}
function renderDailyQuote(){
 const now=new Date(),start=new Date(now.getFullYear(),0,0);
 const day=Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate())-start)/86400000);
 const q=DAILY_QUOTES[(day-1)%DAILY_QUOTES.length],lang=localStorage.getItem("ms_language")||"vi";
 $("dailyQuoteText").textContent=lang==="vi"?q.vi:q.en;
 const author=esc(q.by),source=esc(q.src);
 $("dailyQuoteSource").innerHTML=q.url?"♡ "+author+" · <a href=\""+q.url+"\" target=\"_blank\" rel=\"noopener noreferrer\">"+source+"</a>":(q.by?"♡ "+author+" · "+source:(lang==="vi"?"♡ LỜI NHẮN MỖI NGÀY":"♡ DAILY INSPIRATION"));
}
function openSettings(){
 $("greetingInput").value=localStorage.getItem("ms_greeting")||"Hi, Hân!";
 $("languageSelect").value=localStorage.getItem("ms_language")||"vi";
 $("settingsModal").classList.remove("hidden");
}
$("settingsBtn").onclick=openSettings;
$("closeSettings").onclick=function(){$("settingsModal").classList.add("hidden");};
$("settingsForm").onsubmit=function(e){
 e.preventDefault();
 localStorage.setItem("ms_greeting",$("greetingInput").value.trim()||"Hi, Hân!");
 localStorage.setItem("ms_language",$("languageSelect").value);
 $("helloGreeting").innerHTML=esc(localStorage.getItem("ms_greeting"))+" <span>♡</span>";
 $("settingsModal").classList.add("hidden");
 render();
 applyLanguage();
 renderDailyQuote();
 toast($("languageSelect").value==="vi"?"Đã lưu cài đặt ♡":"Settings saved ♡");
};
const savedGreeting=localStorage.getItem("ms_greeting");
if(savedGreeting)$("helloGreeting").innerHTML=esc(savedGreeting)+" <span>♡</span>";
const originalRender=render;
render=function(){originalRender();applyLanguage();renderDailyQuote();};
applyLanguage();
renderDailyQuote();


const originalGreetingDefault="Hi, Hân!";
const oldRenderLanguage=render;
render=function(){oldRenderLanguage();};
const originalApplyLanguage=applyLanguage;
applyLanguage=function(){
 originalApplyLanguage();
 const lang=localStorage.getItem("ms_language")||"vi";
 const custom=localStorage.getItem("ms_greeting");
 if(!custom || custom==="Hi, Hân!" || custom==="Chào, Hân!") $("helloGreeting").innerHTML=(lang==="vi"?"Chào, Hân!":"Hi, Hân!")+" <span>♡</span>";
 const typeLabels=lang==="vi"
  ?["Sinh nhật","Học tập","Ăn uống","Đạp xe","Trường học","Bơi lội","Mua sắm","Thi cử","Du lịch","Hẹn gặp","Đi chơi","Khác"]
  :["Birthday","Study","Food","Cycling","School","Swimming","Shopping","Exams","Travel","Meetup","Going out","Other"];
 Object.keys(TYPES).forEach((key,i)=>TYPES[key].label=typeLabels[i]);
};
const previousOpenSettings=openSettings;
openSettings=function(){
 previousOpenSettings();
 if(!localStorage.getItem("ms_greeting")) $("greetingInput").value=(localStorage.getItem("ms_language")==="vi"?"Chào, Hân!":"Hi, Hân!");
};
const previousSettingsSubmit=$("settingsForm").onsubmit;
$("settingsForm").onsubmit=function(e){
 e.preventDefault();
 const chosenGreeting=$("greetingInput").value.trim();
 const lang=$("languageSelect").value;
 const defaultGreeting=lang==="vi"?"Chào, Hân!":"Hi, Hân!";
 if(chosenGreeting && chosenGreeting!==defaultGreeting) localStorage.setItem("ms_greeting",chosenGreeting);
 else localStorage.removeItem("ms_greeting");
 localStorage.setItem("ms_language",lang);
 $("helloGreeting").innerHTML=esc(localStorage.getItem("ms_greeting")||defaultGreeting)+" <span>♡</span>";
 $("settingsModal").classList.add("hidden");
 render();
 applyLanguage();
 renderDailyQuote();
 toast(lang==="vi"?"Đã lưu cài đặt ♡":"Settings saved ♡");
};

applyLanguage();render();renderDailyQuote();

const baseLunarText=lunarText;
lunarText=function(s){
 const result=baseLunarText(s);
 return (localStorage.getItem("ms_language")||"vi")==="en"?result.replace(" nhuận"," leap"):result;
};

PAIRS.push(["Âm lịch","Lunar calendar"],["Lịch âm","Lunar calendar"],["Lịch dương","Solar calendar"],["Chỉnh sửa sự kiện","Edit event"],["Chi tiết ngày","Day details"]);
applyLanguage();
render();
renderDailyQuote();

PAIRS.push(["Lịch dương · lịch âm hiển thị cùng lúc","Solar · lunar calendar"],["Về tháng hiện tại","Go to current month"]);


// Appearance preference: saved locally and kept when switching languages.
function applyTheme(){
 const theme=localStorage.getItem("ms_theme")||"light";
 document.documentElement.dataset.theme=theme;
 document.body.dataset.theme=theme;
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=theme==="dark"?"#21182b":"#8c56d4";
}
const previousOpenSettingsForTheme=openSettings;
openSettings=function(){
 previousOpenSettingsForTheme();
 $("themeSelect").value=localStorage.getItem("ms_theme")||"light";
 const lang=localStorage.getItem("ms_language")||"vi";
 $("themeLabel").firstChild.textContent=lang==="vi"?"Giao diện":"Appearance";
 $("themeSelect").options[0].text=lang==="vi"?"☀️ Sáng":"☀️ Light";
 $("themeSelect").options[1].text=lang==="vi"?"🌙 Tối":"🌙 Dark";
};
const previousSettingsSubmitForTheme=$("settingsForm").onsubmit;
$("settingsForm").onsubmit=function(e){
 const theme=$("themeSelect").value;
 previousSettingsSubmitForTheme.call(this,e);
 localStorage.setItem("ms_theme",theme);
 applyTheme();
};
applyTheme();

PAIRS.push(["🎡 Going out","🎡 Đi chơi"]);
applyLanguage();applyTheme();

// Extra bilingual daily quotes supplied by the site owner.
DAILY_QUOTES.push(...[{"en":"Life is what happens when you're busy making other plans.","vi":"Cuộc sống là những gì diễn ra khi bạn đang bận rộn với những kế hoạch khác.","by":"","src":"","url":""},{"en":"In the end, we only regret the chances we didn’t take.","vi":"Cuối cùng, điều khiến ta nuối tiếc nhất thường là những cơ hội mình đã không nắm bắt.","by":"","src":"","url":""},{"en":"Life is really simple, but we insist on making it complicated.","vi":"Cuộc sống vốn rất giản đơn, chỉ là đôi khi ta tự khiến nó trở nên phức tạp.","by":"","src":"","url":""},{"en":"Happiness is not something ready-made. It comes from your own actions.","vi":"Hạnh phúc không phải thứ có sẵn. Nó đến từ chính những hành động của bạn.","by":"","src":"","url":""},{"en":"Do not go where the path may lead, go instead where there is no path and leave a trail.","vi":"Đừng chỉ đi theo lối mòn; hãy mở ra con đường của riêng mình.","by":"","src":"","url":""},{"en":"Life isn’t about finding yourself. Life is about creating yourself.","vi":"Cuộc sống không phải là tìm ra bản thân, mà là tạo nên con người bạn muốn trở thành.","by":"","src":"","url":""},{"en":"Turn your wounds into wisdom.","vi":"Biến những tổn thương thành bài học.","by":"","src":"","url":""},{"en":"The purpose of our lives is to be happy.","vi":"Mục đích của cuộc sống là tìm thấy hạnh phúc.","by":"","src":"","url":""},{"en":"Keep your face always toward the sunshine, and shadows will fall behind you.","vi":"Hãy luôn hướng về phía ánh mặt trời, bóng tối sẽ ở lại phía sau.","by":"","src":"","url":""},{"en":"Life is short, and it is up to you to make it sweet.","vi":"Cuộc sống ngắn ngủi, hãy tự làm cho nó trở nên ngọt ngào.","by":"","src":"","url":""},{"en":"You only live once, but if you do it right, once is enough.","vi":"Bạn chỉ sống một lần, nhưng sống trọn vẹn thì một lần cũng đủ.","by":"","src":"","url":""},{"en":"Difficulties in life are intended to make us better, not bitter.","vi":"Khó khăn đến để giúp ta trưởng thành hơn, không phải cay đắng hơn.","by":"","src":"","url":""},{"en":"Life is either a daring adventure or nothing at all.","vi":"Cuộc sống là một cuộc phiêu lưu can đảm, hoặc chẳng là gì cả.","by":"","src":"","url":""},{"en":"The biggest adventure you can take is to live the life of your dreams.","vi":"Cuộc phiêu lưu lớn nhất là sống cuộc đời mà bạn hằng mơ ước.","by":"","src":"","url":""},{"en":"To live is the rarest thing in the world. Most people exist, that is all.","vi":"Sống thật sự là điều hiếm có; nhiều người chỉ đơn thuần tồn tại.","by":"","src":"","url":""},{"en":"Love all, trust a few, do wrong to none.","vi":"Hãy yêu thương mọi người, tin tưởng một vài người và đừng làm hại ai.","by":"","src":"","url":""},{"en":"Where there is love, there is life.","vi":"Nơi nào có tình yêu thương, nơi đó có sự sống.","by":"","src":"","url":""},{"en":"We accept the love we think we deserve.","vi":"Ta thường đón nhận tình yêu mà mình nghĩ rằng bản thân xứng đáng có được.","by":"","src":"","url":""},{"en":"Love is composed of a single soul inhabiting two bodies.","vi":"Tình yêu là một tâm hồn cùng trú ngụ trong hai cơ thể.","by":"","src":"","url":""},{"en":"The best thing to hold onto in life is each other.","vi":"Điều quý giá nhất ta có thể nắm giữ trong đời là những người thương yêu nhau.","by":"","src":"","url":""},{"en":"Love doesn’t make the world go round. Love is what makes the ride worthwhile.","vi":"Tình yêu không làm thế giới quay, nhưng khiến hành trình này đáng giá.","by":"","src":"","url":""},{"en":"To love and be loved is to feel the sun from both sides.","vi":"Yêu và được yêu giống như cảm nhận ánh mặt trời từ cả hai phía.","by":"","src":"","url":""},{"en":"Love is not about possession. Love is about appreciation.","vi":"Tình yêu không phải sự sở hữu, mà là sự trân trọng.","by":"","src":"","url":""},{"en":"The giving of love is an education in itself.","vi":"Trao đi yêu thương cũng là một bài học quý giá.","by":"","src":"","url":""},{"en":"Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.","vi":"Được yêu thương sâu sắc cho ta sức mạnh; yêu thương sâu sắc cho ta lòng can đảm.","by":"","src":"","url":""},{"en":"Love recognizes no barriers.","vi":"Tình yêu không biết đến những rào cản.","by":"","src":"","url":""},{"en":"The heart wants what it wants.","vi":"Trái tim luôn có những điều nó mong muốn.","by":"","src":"","url":""},{"en":"Love is when the other person’s happiness is more important than your own.","vi":"Yêu là khi hạnh phúc của người kia cũng quan trọng như hạnh phúc của chính mình.","by":"","src":"","url":""},{"en":"There is only one happiness in this life: to love and be loved.","vi":"Có một niềm hạnh phúc lớn lao trong đời: được yêu và biết yêu thương.","by":"","src":"","url":""},{"en":"A real friend is one who walks in when the rest of the world walks out.","vi":"Người bạn thật sự sẽ ở lại khi mọi người đều rời đi.","by":"","src":"","url":""},{"en":"Friendship is the only cement that will ever hold the world together.","vi":"Tình bạn là chất keo gắn kết thế giới.","by":"","src":"","url":""},{"en":"A friend is someone who knows all about you and still loves you.","vi":"Bạn bè là người hiểu rõ bạn mà vẫn luôn quý mến bạn.","by":"","src":"","url":""},{"en":"True friendship comes when the silence between two people is comfortable.","vi":"Tình bạn chân thành là khi im lặng bên nhau cũng thấy thoải mái.","by":"","src":"","url":""},{"en":"Friends are the family you choose.","vi":"Bạn bè là gia đình mà ta tự lựa chọn.","by":"","src":"","url":""},{"en":"There are no strangers here; only friends you haven’t yet met.","vi":"Ở đây không có người xa lạ, chỉ có những người bạn bạn chưa gặp.","by":"","src":"","url":""},{"en":"Friendship multiplies the good of life and divides the evil.","vi":"Tình bạn nhân đôi niềm vui và san sẻ những điều khó khăn.","by":"","src":"","url":""},{"en":"Good friends are like stars. You don’t always see them, but you know they’re always there.","vi":"Bạn tốt giống như những vì sao: không phải lúc nào cũng thấy, nhưng luôn biết họ ở đó.","by":"","src":"","url":""},{"en":"Walking with a friend in the dark is better than walking alone in the light.","vi":"Đi cùng bạn trong bóng tối vẫn tốt hơn đi một mình dưới ánh sáng.","by":"","src":"","url":""},{"en":"True friends are never apart, maybe in distance but never in heart.","vi":"Bạn thật sự có thể xa nhau về khoảng cách, nhưng không xa nhau trong trái tim.","by":"","src":"","url":""},{"en":"A sweet friendship refreshes the soul.","vi":"Một tình bạn đẹp làm tâm hồn thêm tươi mới.","by":"","src":"","url":""},{"en":"Success is not final, failure is not fatal: it is the courage to continue that counts.","vi":"Thành công không phải điểm kết thúc, thất bại không phải dấu chấm hết; điều quan trọng là can đảm bước tiếp.","by":"","src":"","url":""},{"en":"It always seems impossible until it’s done.","vi":"Mọi việc dường như bất khả thi cho đến khi được hoàn thành.","by":"","src":"","url":""},{"en":"Don’t watch the clock; do what it does. Keep going.","vi":"Đừng mải nhìn đồng hồ; hãy tiếp tục tiến lên như nó.","by":"","src":"","url":""},{"en":"Energy and persistence conquer all things.","vi":"Năng lượng và sự kiên trì có thể chinh phục mọi điều.","by":"","src":"","url":""},{"en":"The harder you work for something, the greater you’ll feel when you achieve it.","vi":"Bạn càng nỗ lực vì điều gì, niềm vui khi đạt được nó càng lớn.","by":"","src":"","url":""},{"en":"Great works are performed not by strength but by perseverance.","vi":"Những điều lớn lao được tạo nên không chỉ bằng sức mạnh, mà bằng sự kiên trì.","by":"","src":"","url":""},{"en":"The difference between ordinary and extraordinary is that little extra.","vi":"Khác biệt giữa bình thường và phi thường nằm ở một chút cố gắng thêm.","by":"","src":"","url":""},{"en":"Hard work beats talent when talent doesn’t work hard.","vi":"Nỗ lực sẽ vượt qua tài năng nếu tài năng không chịu cố gắng.","by":"","src":"","url":""},{"en":"Act as if what you do makes a difference. It does.","vi":"Hãy hành động như thể việc bạn làm tạo nên khác biệt, bởi vì đúng là như vậy.","by":"","src":"","url":""},{"en":"Little by little, one travels far.","vi":"Từng chút một, ta sẽ đi được rất xa.","by":"","src":"","url":""},{"en":"Fall seven times and stand up eight.","vi":"Ngã bảy lần, đứng dậy tám lần.","by":"","src":"","url":""},{"en":"Live as if you were to die tomorrow. Learn as if you were to live forever.","vi":"Hãy sống như thể ngày mai là ngày cuối, và học như thể bạn sẽ sống mãi.","by":"","src":"","url":""},{"en":"Education is the most powerful weapon which you can use to change the world.","vi":"Giáo dục là công cụ mạnh mẽ giúp bạn thay đổi thế giới.","by":"","src":"","url":""},{"en":"The beautiful thing about learning is that no one can take it away from you.","vi":"Điều tuyệt vời của việc học là không ai có thể lấy kiến thức khỏi bạn.","by":"","src":"","url":""},{"en":"An investment in knowledge pays the best interest.","vi":"Đầu tư vào tri thức luôn mang lại lợi ích xứng đáng.","by":"","src":"","url":""},{"en":"The expert in anything was once a beginner.","vi":"Người giỏi trong bất kỳ lĩnh vực nào cũng từng là người mới bắt đầu.","by":"","src":"","url":""},{"en":"Learning never exhausts the mind.","vi":"Việc học không bao giờ làm tâm trí cạn kiệt.","by":"","src":"","url":""},{"en":"Never stop learning, because life never stops teaching.","vi":"Đừng ngừng học hỏi, bởi cuộc sống không bao giờ ngừng dạy ta.","by":"","src":"","url":""},{"en":"Family is not an important thing. It’s everything.","vi":"Gia đình không chỉ là điều quan trọng. Gia đình là tất cả.","by":"","src":"","url":""},{"en":"The love of a family is life’s greatest blessing.","vi":"Tình yêu gia đình là món quà quý giá nhất của cuộc sống.","by":"","src":"","url":""},{"en":"Family means no one gets left behind or forgotten.","vi":"Gia đình nghĩa là không ai bị bỏ lại phía sau hay bị lãng quên.","by":"","src":"","url":""},{"en":"A happy family is but an earlier heaven.","vi":"Một gia đình hạnh phúc chính là thiên đường ngay trong cuộc sống này.","by":"","src":"","url":""},{"en":"Family is the compass that guides us.","vi":"Gia đình là chiếc la bàn dẫn lối cho chúng ta.","by":"","src":"","url":""},{"en":"A warm smile is the universal language of kindness.","vi":"Nụ cười ấm áp là ngôn ngữ chung của lòng tốt.","by":"","src":"","url":""},{"en":"Gratitude turns what we have into enough.","vi":"Lòng biết ơn biến những gì ta có thành đủ đầy.","by":"","src":"","url":""},{"en":"The more grateful I am, the more beauty I see.","vi":"Càng biết ơn, ta càng nhìn thấy nhiều vẻ đẹp trong cuộc sống.","by":"","src":"","url":""},{"en":"Success is not the key to happiness. Happiness is the key to success.","vi":"Thành công không phải chìa khóa của hạnh phúc; hạnh phúc mới là chìa khóa của thành công.","by":"","src":"","url":""},{"en":"Believe you can and you’re halfway there.","vi":"Tin rằng mình có thể là bạn đã đi được nửa chặng đường.","by":"","src":"","url":""},{"en":"Your time is limited, don’t waste it living someone else’s life.","vi":"Thời gian của bạn có hạn, đừng lãng phí nó để sống cuộc đời của người khác.","by":"","src":"","url":""},{"en":"It does not matter how slowly you go as long as you do not stop.","vi":"Bạn đi chậm thế nào không quan trọng, miễn là đừng dừng lại.","by":"","src":"","url":""}]);

renderDailyQuote();

PAIRS.push(...[["Go to current month","Về tháng hiện tại"],["Month","Tháng"],["Year","Năm"],["Hôm nay","Today"],["Sắp tới","Coming up"],["Một việc nhỏ hôm nay","A little task for today"],["Chọn ngày để xem chi tiết","Choose a day to see details"],["Sinh nhật","Birthday"],["Học tập","Study"],["Công việc đang chờ bạn hoàn thành. Cứ từ từ nhé!","Tasks are waiting for you. Take your time!"],["Chưa có sự kiện nào trong ngày này.","No events on this day."],["Thêm một điều đáng mong chờ nhé!","Add something to look forward to!"],["Thêm vào ngày này","Add to this day"],["Tháng hiện tại","Current month"],["Đi chơi","Going out"]]);
applyLanguage();
