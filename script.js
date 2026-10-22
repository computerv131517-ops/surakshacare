const state={devices:[],membership:null,pendingMembership:null};

document.addEventListener("DOMContentLoaded",()=>{
  addDeviceRow();
  document.getElementById("loginForm").addEventListener("submit",handleLogin);
  document.getElementById("signupForm").addEventListener("submit",handleSignup);
  document.getElementById("instantForm").addEventListener("submit",handleInstant);
  document.getElementById("signupRole")?.addEventListener("change",toggleTechnicianFields);
  toggleTechnicianFields();
  initAuthProfileUI();
});

function scrollToId(id){document.getElementById(id)?.scrollIntoView({behavior:"smooth"});}
function toggleMenu(){document.querySelector(".navbar nav").classList.toggle("mobile-open");}
function openModal(id,role){const m=document.getElementById(id);if(role&&id==="loginModal")document.getElementById("loginRole").value=role;m.classList.add("show");}
function closeModal(id){document.getElementById(id).classList.remove("show");}
function switchModal(a,b){closeModal(a);openModal(b);}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.style.display="block";clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.style.display="none",2800);}
function contactSupport(){toast("Support demo: support@surakshacare.demo | +91 90000 00000");}
function openInstantService(){openModal("instantModal");}

function addDeviceRow(){
  const id=Date.now()+Math.random();
  state.devices.push({id,category:'',product:'',year:String(new Date().getFullYear()),value:'',currentValue:0,annualFee:0});
  renderDevices();
}
function removeDevice(id){state.devices=state.devices.filter(d=>d.id!==id);if(!state.devices.length)addDeviceRow();renderDevices();}
function money(value){return '₹'+Math.round(Number(value)||0).toLocaleString('en-IN');}
function deviceAge(year){return Math.max(0,Math.min(40,new Date().getFullYear()-Number(year||new Date().getFullYear())));}
function depreciationRate(device){
  if(device.category==='Vehicle'){
    if(device.product==='Car')return 0.12;
    if(device.product==='Motorcycle'||device.product==='Scooter')return 0.15;
    if(device.product==='Electric Vehicle')return 0.14;
    return 0.13;
  }
  return 0.10;
}
function estimateCurrentValue(device){
  const price=Number(device.value)||0;
  if(!price||!device.year||!device.product)return 0;
  return Math.round(Math.max(price*0.20,price*Math.pow(1-depreciationRate(device),deviceAge(device.year))));
}
function annualFeeForValue(value,plan){
  let rate,minimum;
  if(value<5000){rate=0.06;minimum=299;}
  else if(value<10000){rate=0.05;minimum=399;}
  else if(value<50000){rate=0.04;minimum=499;}
  else if(value<100000){rate=0.035;minimum=699;}
  else{rate=0.025;minimum=2500;}
  const multiplier=plan==='Premium'?1.25:plan==='VIP'?1.5:1;
  const floor=plan==='Premium'?499:plan==='VIP'?799:minimum;
  return Math.round(Math.max(floor,value*rate*multiplier));
}
function updateDeviceEstimate(device){device.currentValue=estimateCurrentValue(device);device.annualFee=annualFeeForValue(device.currentValue,'Basic');}
function renderDevices(){
  const list=document.getElementById('deviceList');
  state.devices.forEach(updateDeviceEstimate);
  list.innerHTML=state.devices.map(d=>
    '<div class="device-row">'+
    '<label>Category<select onchange="updateDevice('+d.id+',\'category\',this.value);refreshProducts('+d.id+',this.value)"><option value="">Select</option><option '+(d.category==='Appliance'?'selected':'')+'>Appliance</option><option '+(d.category==='Vehicle'?'selected':'')+'>Vehicle</option></select></label>'+
    '<label>Device<select id="prod-'+d.id+'" onchange="updateDevice('+d.id+',\'product\',this.value)"><option value="">Select device</option>'+productOptions(d.category,d.product)+'</select></label>'+
    '<label>Original buying price (₹)<input type="number" min="1" step="100" value="'+(d.value||'')+'" placeholder="e.g. 25000" onchange="updateDevice('+d.id+',\'value\',this.value)"></label>'+
    '<label>Year bought<select onchange="updateDevice('+d.id+',\'year\',this.value)">'+Array.from({length:new Date().getFullYear()-1985+1},(_,i)=>new Date().getFullYear()-i).map(y=>'<option value="'+y+'" '+(Number(d.year)===y?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
    '<div class="device-mini-estimate"><small>Estimated value now</small><strong>'+(d.currentValue?money(d.currentValue):'—')+'</strong><small>Annual Basic: '+(d.currentValue?money(d.annualFee):'—')+'</small></div>'+
    '<button class="remove-device" title="Remove device" onclick="removeDevice('+d.id+')">×</button></div>'
  ).join('');
  const complete=state.devices.filter(d=>d.category&&d.product&&Number(d.value)>0&&d.year);
  document.getElementById('deviceCount').textContent=complete.length;
  const total=complete.reduce((s,d)=>s+d.currentValue,0);
  document.getElementById('totalValue').textContent=money(total);
  const summary=document.getElementById('deviceEstimateSummary');
  if(summary){
    if(!complete.length)summary.textContent='Complete the device details to see the estimated current value and annual fee.';
    else summary.innerHTML='Estimated current value across '+complete.length+' device(s): <strong>'+money(total)+'</strong>. Combined Basic annual estimate: <strong>'+money(complete.reduce((s,d)=>s+d.annualFee,0))+'</strong>'+(complete.length>=3?' (10% multi-device discount shown in plan totals).':'.');
  }
}
function productOptions(cat,selected){
  const arr=cat==='Appliance'?['Refrigerator','Washing Machine','Air Conditioner','Television','Microwave','Water Purifier','Geyser','Other Appliance']:cat==='Vehicle'?['Car','Motorcycle','Scooter','Electric Vehicle','Other Vehicle']:[];
  return arr.map(x=>'<option value="'+x+'" '+(x===selected?'selected':'')+'>'+x+'</option>').join('');
}
function refreshProducts(id,cat){const d=state.devices.find(x=>x.id===id);if(d){d.product='';d.category=cat;renderDevices();}}
function updateDevice(id,key,value){const d=state.devices.find(x=>x.id===id);if(d)d[key]=value;renderDevices();}
function reviewDevices(){
  const valid=state.devices.filter(d=>d.category&&d.product&&Number(d.value)>0&&Number(d.year)>0);
  if(!valid.length){toast('Please complete category, device, buying price and purchase year.');return;}
  state.devices=valid;showProtectionPlans();
}
function showProtectionPlans(){
  state.devices.forEach(updateDeviceEstimate);
  const complete=state.devices.filter(d=>d.currentValue>0);
  const totalCurrent=complete.reduce((s,d)=>s+d.currentValue,0);
  const plans=[{name:'Basic',checkups:'2 checkups/year • standard support'},{name:'Premium',checkups:'3 checkups/year • priority technician'},{name:'VIP',checkups:'3 checkups/year • fastest support'}];
  const breakdown=complete.map(d=>'<div class="estimate-line"><span>'+escapeHtml(d.product)+' ('+deviceAge(d.year)+' yr old)<small>Bought for '+money(d.value)+' · estimated current value '+money(d.currentValue)+'</small></span><strong>'+money(d.annualFee)+'/yr</strong></div>').join('');
  document.getElementById('planChoices').innerHTML='<div class="pricing-note"><b>How the estimate is calculated</b><p>Estimated current value = original buying price × (1 − annual depreciation rate)<sup>device age</sup>, with a 20% minimum residual value. Appliance depreciation: 10%/year; car: 12%; motorcycle/scooter: 15%; electric vehicle: 14%. These are illustrative planning assumptions.</p><p class="pricing-bands">Basic annual fee per device: below ₹5,000: 6% (min ₹299) · ₹5,000–₹9,999: 5% (min ₹399) · ₹10,000–₹49,999: 4% (min ₹499) · ₹50,000–₹99,999: 3.5% (min ₹699) · ₹1,00,000+: 2.5% (min ₹2,500). Premium = 1.25× Basic rate; VIP = 1.5× Basic rate. Three or more devices get 10% off the combined fee.</p><p><b>Estimated current value of all devices:</b> '+money(totalCurrent)+'</p></div><div class="estimate-breakdown">'+breakdown+'</div>'+plans.map(p=>{
    const raw=complete.reduce((s,d)=>s+annualFeeForValue(d.currentValue,p.name),0);
    const discount=complete.length>=3?Math.round(raw*0.10):0;
    const total=Math.max(0,raw-discount);
    return '<div class="plan-choice"><div><b>'+p.name+'</b><small style="display:block;color:#718096">'+p.checkups+'</small><small style="display:block;color:#718096">'+complete.length+' device(s) · '+(complete.length>=3?'10% multi-device discount included':'Add 3+ devices for 10% off')+'</small></div><div style="text-align:right"><strong>'+money(total)+'/yr</strong>'+(discount?'<small style="display:block;color:#13804a">You save '+money(discount)+'</small>':'')+'<button class="btn btn-primary" onclick="confirmProtection(\''+p.name+'\','+total+')">Select</button></div></div>';
  }).join('');
  openModal('planModal');
}
function selectMembership(plan,price,checkups){
  state.pendingMembership={plan,price,checkups};
  const terms=document.getElementById("termsAgree");
  const continueBtn=document.getElementById("termsContinue");
  if(terms) terms.checked=false;
  if(continueBtn) continueBtn.disabled=true;
  closeModal("planModal");
  openModal("termsModal");
}

function toggleTermsButton(){
  const checkbox=document.getElementById("termsAgree");
  const button=document.getElementById("termsContinue");
  if(button) button.disabled=!checkbox?.checked;
}

function acceptMembershipTerms(){
  if(!document.getElementById("termsAgree")?.checked || !state.pendingMembership){
    toast("Please accept the membership terms to continue.");
    return;
  }
  state.membership={...state.pendingMembership,termsAccepted:true,termsAcceptedAt:new Date().toISOString()};
  localStorage.setItem("surakshaCareMembership",JSON.stringify(state.membership));
  localStorage.setItem("surakshaCareTermsConsent",JSON.stringify({accepted:true,plan:state.membership.plan,acceptedAt:state.membership.termsAcceptedAt}));
  syncMembershipToDatabase();
  const selected=state.membership.plan;
  state.pendingMembership=null;
  closeModal("termsModal");
  toast(`${selected} membership terms accepted. Continue with account setup.`);
  setTimeout(()=>openModal("signupModal"),450);
}
function toggleTechnicianFields(){
  const role=document.getElementById("signupRole")?.value;
  const box=document.getElementById("technicianFields");
  if(box) box.style.display=role==="technician"?"block":"none";
}
function databaseReady(){return !!(window.surakshaSupabaseReady && window.surakshaSupabase);}
async function handleSignup(e){
  e.preventDefault();
  const name=document.getElementById("signupName").value.trim();
  const email=document.getElementById("signupEmail").value.trim().toLowerCase();
  const mobile=document.getElementById("signupMobile").value.trim();
  const password=document.getElementById("signupPassword").value;
  const role=(document.getElementById("signupRole")?.value||"customer").toLowerCase();
  const skills=document.getElementById("signupSkills")?.value.trim()||"";
  if(!/^\d{10}$/.test(mobile)){toast("Please enter a valid 10-digit mobile number.");return;}
  if(password.length<6){toast("Password must be at least 6 characters.");return;}

  if(!databaseReady()){
    localStorage.setItem("surakshaCareUser",JSON.stringify({name,email,mobile,role,skills,createdAt:new Date().toISOString()}));
    localStorage.setItem("surakshaCareRole",role==="technician"?"Technician":"Customer");
    closeModal("signupModal");toast("Demo account created. Connect Supabase to store accounts online.");
    setTimeout(()=>openModal("loginModal"),600);return;
  }

  const {data,error}=await window.surakshaSupabase.auth.signUp({
    email,password,
    options:{data:{full_name:name,mobile,role,skills}}
  });
  if(error){toast(error.message||"Account creation failed.");return;}
  localStorage.setItem("surakshaCareUser",JSON.stringify({name,email,mobile,role,skills,createdAt:new Date().toISOString()}));
  localStorage.setItem("surakshaCareRole",role==="technician"?"Technician":"Customer");
  closeModal("signupModal");
  if(data.session){
    const createdUser={name,email,mobile,role,skills};
    renderAccountNav(createdUser);
    toast("Account created and signed in successfully.");
    setTimeout(()=>role==="technician"?showTechnicianDashboard():showCustomerDashboard(),500);
  }else{
    toast("Account created. Please verify your email, then log in.");
    setTimeout(()=>openModal("loginModal"),700);
  }
}
async function handleLogin(e){
  e.preventDefault();
  const email=document.getElementById("loginEmail").value.trim().toLowerCase();
  const password=document.getElementById("loginPassword").value;
  const selectedRole=document.getElementById("loginRole").value;

  if(!databaseReady()){
    toast("Supabase is not connected yet. Use the setup guide to connect real accounts.");return;
  }
  const {data,error}=await window.surakshaSupabase.auth.signInWithPassword({email,password});
  if(error){toast(error.message||"Login failed.");return;}
  const user=data.user;
  const meta=user.user_metadata||{};
  let profile=null;
  const result=await window.surakshaSupabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
  if(!result.error) profile=result.data;
  const actualRole=(profile?.role||meta.role||"customer").toLowerCase();
  const actualLabel=actualRole==="technician"?"Technician":"Customer";
  if(actualLabel!==selectedRole){
    await window.surakshaSupabase.auth.signOut();
    toast("This account is registered as a "+actualLabel+" account. Select the correct role.");return;
  }
  const userRecord={
    id:user.id,name:profile?.full_name||meta.full_name||"",email:user.email||email,
    mobile:profile?.mobile||meta.mobile||"",role:actualRole,skills:profile?.skills||meta.skills||""
  };
  localStorage.setItem("surakshaCareUser",JSON.stringify(userRecord));
  localStorage.setItem("surakshaCareRole",actualLabel);
  renderAccountNav(userRecord);
  closeModal("loginModal");
  toast("Welcome back, "+(userRecord.name||actualLabel)+"!");
  setTimeout(()=>actualRole==="technician"?showTechnicianDashboard():showCustomerDashboard(),350);
}
function currentAuthUser(){return window.surakshaSupabaseReady?window.surakshaSupabase.auth.getUser():Promise.resolve({data:{user:null}});}
async function saveCurrentProfileData(){
  if(!databaseReady()) return;
  const {data}=await window.surakshaSupabase.auth.getUser();
  if(!data?.user) return;
  const u=JSON.parse(localStorage.getItem("surakshaCareUser")||"{}");
  await window.surakshaSupabase.from("profiles").upsert({id:data.user.id,full_name:u.name||null,mobile:u.mobile||null,role:u.role||"customer",skills:u.skills||null},{onConflict:"id"});
}
async function syncDevicesToDatabase(){
  if(!databaseReady()) return;
  const {data}=await window.surakshaSupabase.auth.getUser(); if(!data?.user) return;
  const devices=state.devices.filter(d=>d.category&&d.product&&Number(d.value)>0);
  for(const d of devices){
    await window.surakshaSupabase.from("devices").insert({user_id:data.user.id,category:d.category,product:d.product,approx_value:Number(d.value)||0});
  }
}

async function syncMembershipToDatabase(){
  if(!databaseReady()) return;
  const {data}=await window.surakshaSupabase.auth.getUser(); if(!data?.user || !state.membership) return;
  await window.surakshaSupabase.from("memberships").insert({user_id:data.user.id,plan:state.membership.plan,price:Number(state.membership.price)||0,checkups:Number(state.membership.checkups)||0,terms_accepted_at:state.membership.termsAcceptedAt,status:"active"});
  await syncDevicesToDatabase();
}
async function syncServiceRequestToDatabase(data){
  if(!databaseReady()) return;
  const {data:auth}=await window.surakshaSupabase.auth.getUser(); if(!auth?.user) return;
  await window.surakshaSupabase.from("service_requests").insert({user_id:auth.user.id,request_code:data.id,type:data.type,device:data.device,problem:data.problem,priority:data.priority,location:data.location,preferred_time:data.preferredTime||null,status:data.status});
}

function handleInstant(e){
  e.preventDefault();
  const data={type:document.getElementById("instantType").value,device:document.getElementById("instantDevice").value,problem:document.getElementById("instantProblem").value,location:document.getElementById("instantLocation").value,id:"SC-FAST-"+String(Date.now()).slice(-6),status:"Technician requested"};
  localStorage.setItem("surakshaCareInstant",JSON.stringify(data));closeModal("instantModal");
  toast("Technician request created: "+data.id);
  setTimeout(()=>showTicket(data),500);
}
function showTicket(d){
  document.body.insertAdjacentHTML("beforeend",`<div class="modal show" id="ticketModal"><div class="modal-box"><button class="close" onclick="closeModal('ticketModal')">×</button><div class="modal-icon danger">⚡</div><h2>Request received</h2><p>Your instant technician request has been created.</p><div class="instant-summary"><b>${d.id}</b><br>${d.device} • ${d.type}<br><small>${d.location}</small></div><div class="benefit-card"><span>🔎</span><div><b>Finding an available technician</b><small>Demo status — dispatch will appear here in the live backend.</small></div></div><button class="btn btn-primary full" onclick="closeModal('ticketModal')">Done</button></div></div>`);
}
function initAuthProfileUI(){
  // Show the account control after a previous Supabase session is restored.
  if(!databaseReady()) return;
  window.surakshaSupabase.auth.getSession().then(async ({data,error})=>{
    if(error || !data?.session?.user) return;
    const user=data.session.user;
    const meta=user.user_metadata||{};
    let profile=null;
    const result=await window.surakshaSupabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
    if(!result.error) profile=result.data;
    const role=(profile?.role||meta.role||"customer").toLowerCase();
    const record={
      id:user.id,
      name:profile?.full_name||meta.full_name||user.email||"Customer",
      email:user.email||"",
      mobile:profile?.mobile||meta.mobile||"",
      role,
      skills:profile?.skills||meta.skills||""
    };
    localStorage.setItem("surakshaCareUser",JSON.stringify(record));
    localStorage.setItem("surakshaCareRole",role==="technician"?"Technician":"Customer");
    renderAccountNav(record);
  });
}

function renderAccountNav(user){
  const actions=document.querySelector(".nav-actions");
  if(!actions) return;
  let account=document.getElementById("surakshaAccountNav");
  if(!account){
    account=document.createElement("div");
    account.id="surakshaAccountNav";
    account.style.cssText="display:flex;align-items:center;gap:9px;";
    actions.appendChild(account);
  }
  const name=(user?.name||user?.email||"My Profile").toString();
  const initials=name.trim().split(/\\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"U";
  actions.querySelectorAll("button").forEach(button=>{ if(button.id!=="surakshaLogoutBtn") button.style.display="none"; });
  account.innerHTML=
    '<button class="btn btn-ghost" type="button" onclick="openMyDashboard()" style="display:flex;align-items:center;gap:8px;">'+
    '<span style="width:30px;height:30px;border-radius:50%;background:#1769e0;color:white;display:inline-grid;place-items:center;font-weight:800;">'+initials+'</span>'+
    '<span style="text-align:left"><span style="display:block;font-size:12px;color:#64748b">My Profile</span><strong style="display:block;max-width:125px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escapeAccountText(name)+'</strong></span></button>'+
    '<button id="surakshaLogoutBtn" class="btn btn-outline" type="button" onclick="logoutSurakshaCare()">Logout</button>';
  account.style.display="flex";
}

function escapeAccountText(value){
  return String(value||"").replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
}

function openMyDashboard(){
  const user=JSON.parse(localStorage.getItem("surakshaCareUser")||"{}");
  const role=String(user.role||localStorage.getItem("surakshaCareRole")||"customer").toLowerCase();
  document.getElementById("dashModal")?.remove();
  if(role==="technician") showTechnicianDashboard();
  else if(role==="admin") showAdminDashboard();
  else showCustomerDashboard();
}

async function logoutSurakshaCare(){
  if(databaseReady()){
    const {error}=await window.surakshaSupabase.auth.signOut();
    if(error){toast(error.message||"Could not sign out.");return;}
  }
  localStorage.removeItem("surakshaCareUser");
  localStorage.removeItem("surakshaCareRole");
  document.getElementById("dashModal")?.remove();
  const account=document.getElementById("surakshaAccountNav");
  account?.remove();
  document.querySelectorAll(".nav-actions button").forEach(button=>button.style.display="");
  toast("You have been logged out.");
}

function dashboardShell(title,subtitle,items){
  document.body.insertAdjacentHTML("beforeend",`<div class="modal show" id="dashModal"><div class="modal-box wide"><button class="close" onclick="closeModal('dashModal')">×</button><div class="eyebrow blue">SURAKSHACARE DASHBOARD</div><h2>${title}</h2><p>${subtitle}</p><div class="dashboard-items">${items.map(x=>`<div class="benefit-card"><span>${x[0]}</span><div><b>${x[1]}</b><small>${x[2]}</small></div></div>`).join("")}</div></div></div>`);
}
function showCustomerDashboard(){const u=JSON.parse(localStorage.getItem("surakshaCareUser")||"{}");dashboardShell("Customer Dashboard","Welcome "+(u.name||"Customer")+". Manage your devices, membership and service requests.",[["🛡️","Membership","View active plan, renewal and checkup allowance."],["📱","My Devices",`${state.devices.length||0} registered device(s).`],["📅","Upcoming Checkups","Schedule and track your preventive visits."],["⚡","Instant Service","Request urgent technician support."],["💳","Payments","View membership and service payment records."],["📋","Service History","Review completed technician visits and reports."]]);}
function showTechnicianDashboard(){dashboardShell("Technician Dashboard","Manage assigned service jobs and preventive checkups.",[["📍","Assigned Jobs","See customers and service locations."],["📅","Today's Schedule","Upcoming checkups and repair appointments."],["🔧","Service Reports","Record diagnosis, work completed and recommendations."],["📷","Job Evidence","Attach before/after photos in the future backend."],["⭐","Customer Ratings","View feedback and service performance."]]);}
function showAdminDashboard(){dashboardShell("Admin Dashboard","Monitor the complete SurakshaCare operation.",[["👥","Customers","Manage registered members and customer accounts."],["🔧","Technicians","Assign technicians and manage availability."],["💳","Payments","Monitor memberships and service payments."],["🛡️","Memberships","Manage plans, renewals and device coverage."],["📊","Operations","Track requests, checkups and service completion."],["⚙️","Settings","Configure plans, pricing and service areas."]]);}

// Feature upgrade: health assessment, service tracking, reminders and support
function openHealthCheck(){openModal("healthModal");}
function calculateHealthScore(){
  const age=Number(document.getElementById("healthAge").value)||0;
  const usage=document.getElementById("healthUsage").value;
  const issues=document.getElementById("healthIssues").value;
  let score=100-Math.min(age*5,35);
  if(usage==="Moderate") score-=5;
  if(usage==="Heavy") score-=12;
  if(issues==="Yes") score-=15;
  return Math.max(40,Math.min(99,score));
}
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("healthForm")?.addEventListener("submit",e=>{
    e.preventDefault();
    const device=document.getElementById("healthDevice").value.trim();
    const score=calculateHealthScore();
    const usage=document.getElementById("healthUsage").value;
    const issues=document.getElementById("healthIssues").value;
    localStorage.setItem("surakshaCareHealth",JSON.stringify({device,score,usage,issues,date:new Date().toISOString()}));
    syncHealthToDatabase({device,score,usage,issues});
    document.getElementById("healthScore").textContent=score+"%";
    document.getElementById("healthDeviceName").textContent=device;
    document.getElementById("healthAdvice").textContent=score>=85?"Good condition. Continue preventive maintenance.":score>=65?"Needs attention. Consider a preventive checkup soon.":"High attention recommended. Schedule technician support soon.";
    document.getElementById("nextCheckup").textContent=score>=85?"Within 3 months":"Within 30 days";
    closeModal("healthModal");toast("Health assessment complete: "+score+"% for "+device);
  });
  document.getElementById("complaintForm")?.addEventListener("submit",e=>{
    e.preventDefault();
    const complaint={type:document.getElementById("complaintType").value,message:document.getElementById("complaintMessage").value,id:"SC-CMP-"+String(Date.now()).slice(-6),date:new Date().toISOString()};
    localStorage.setItem("surakshaCareComplaint",JSON.stringify(complaint));
    syncComplaintToDatabase(complaint);
    closeModal("complaintModal");toast("Complaint submitted: "+complaint.id);
  });
  document.getElementById("reviewForm")?.addEventListener("submit",e=>{
    e.preventDefault();
    const reviews=getReviews();
    const review={name:document.getElementById("reviewName").value.trim(),serviceId:document.getElementById("reviewServiceId").value.trim(),rating:Number(document.getElementById("reviewRating").value),comment:document.getElementById("reviewComment").value.trim(),date:new Date().toISOString()};
    reviews.push(review);
    localStorage.setItem("surakshaCareReviews",JSON.stringify(reviews));
    syncReviewToDatabase(review);
    e.target.reset(); closeModal("reviewModal"); renderReviews(); toast("Thanks! Your customer review was added.");
  });
});

async function syncHealthToDatabase(h){
  if(!databaseReady()) return;
  const {data}=await window.surakshaSupabase.auth.getUser(); if(!data?.user) return;
  await window.surakshaSupabase.from("health_assessments").insert({user_id:data.user.id,device:h.device,score:h.score,usage:h.usage,previous_issues:h.issues});
}
async function syncComplaintToDatabase(c){
  if(!databaseReady()) return;
  const {data}=await window.surakshaSupabase.auth.getUser(); if(!data?.user) return;
  await window.surakshaSupabase.from("complaints").insert({user_id:data.user.id,complaint_code:c.id,type:c.type,message:c.message,status:"open"});
}
async function syncReviewToDatabase(r){
  if(!databaseReady()) return;
  const {data}=await window.surakshaSupabase.auth.getUser(); if(!data?.user) return;
  await window.surakshaSupabase.from("reviews").insert({user_id:data.user.id,service_id:r.serviceId||null,rating:Number(r.rating),comment:r.comment});
}

function updateServiceTracker(status){
  const map={"Technician requested":0,"Assigned":1,"On the way":2,"Completed":3};
  const idx=map[status]??0;
  document.querySelectorAll(".status-steps span").forEach((el,i)=>el.classList.toggle("active",i<=idx));
  const text=document.getElementById("serviceStatusText");
  if(text) text.textContent="Current status: "+status+". Request details are stored in your account database when Supabase is connected.";
}

function handleInstant(e){
  e.preventDefault();
  const data={type:document.getElementById("instantType").value,device:document.getElementById("instantDevice").value,problem:document.getElementById("instantProblem").value,priority:document.getElementById("instantPriority").value,location:document.getElementById("instantLocation").value,preferredTime:document.getElementById("instantTime").value,id:"SC-FAST-"+String(Date.now()).slice(-6),status:"Technician requested",createdAt:new Date().toISOString()};
  localStorage.setItem("surakshaCareInstant",JSON.stringify(data));
  syncServiceRequestToDatabase(data);
  closeModal("instantModal");updateServiceTracker(data.status);toast("Technician request created: "+data.id);
  setTimeout(()=>showTicket(data),500);
}

function showTicket(d){
  document.body.insertAdjacentHTML("beforeend",`<div class="modal show" id="ticketModal"><div class="modal-box"><button class="close" onclick="closeModal('ticketModal')">×</button><div class="modal-icon danger">⚡</div><h2>Request received</h2><p>Your instant technician request has been created.</p><div class="instant-summary"><b>${d.id}</b><br>${d.device} • ${d.type}<br><strong>${d.priority} priority</strong><br><small>${d.location}</small></div><div class="benefit-card"><span>🔎</span><div><b>Technician dispatch</b><small>Status: ${d.status}. Demo ETA will be connected to the live technician backend.</small></div></div><button class="btn btn-primary full" onclick="closeModal('ticketModal')">Track Request</button></div></div>`);
}

function showCustomerDashboard(){
  const u=JSON.parse(localStorage.getItem("surakshaCareUser")||"{}");
  const instant=JSON.parse(localStorage.getItem("surakshaCareInstant")||"null");
  const health=JSON.parse(localStorage.getItem("surakshaCareHealth")||"null");
  const membership=JSON.parse(localStorage.getItem("surakshaCareMembership")||"null");
  dashboardShell("Customer Dashboard","Welcome "+(u.name||"Customer")+". Your protection, health and service activity in one place.",[
    ["🛡️","Membership",membership?membership.plan+" • "+membership.checkups+" checkups/year":"Choose a membership plan."],
    ["📱","My Devices",`${state.devices.filter(d=>d.product).length||0} registered device(s).`],
    ["❤️","Device Health",health?health.device+" • "+health.score+"% health":"Run a health assessment."],
    ["📅","Upcoming Checkups","Schedule, reschedule and track preventive visits in the backend."],
    ["⚡","Service Tracker",instant?instant.id+" • "+instant.status:"No active technician request."],
    ["💳","Payments","View membership and service payment records."],
    ["📋","Service History","Review completed technician visits and reports."],
    ["💬","Help & Complaint",`<button class="mini-action" onclick="closeModal('dashModal');openModal('complaintModal')">Open support</button>`]
  ]);
}

function showTechnicianDashboard(){dashboardShell("Technician Dashboard","Manage assigned service jobs, preventive checkups and service evidence.",[["📍","Assigned Jobs","See customers, locations, priority and current status."],["📅","Today's Schedule","Upcoming checkups and repair appointments."],["✅","Checkup Checklist","Record inspection points, findings and recommendations."],["🔧","Service Reports","Record diagnosis, work completed, parts and next steps."],["📷","Job Evidence","Attach before/after photos in the future backend."],["⭐","Customer Ratings","View feedback and service performance."],["🚗","Navigation","Open customer location and route in the future live dashboard."]]);}
function showAdminDashboard(){dashboardShell("Admin Dashboard","Monitor the complete SurakshaCare operation with clear KPIs.",[["👥","Customers","Manage registered members and customer accounts."],["🔧","Technicians","Assign technicians, priorities and availability."],["⚡","Live Requests","Monitor Normal, Urgent and Emergency service requests."],["💳","Payments","Monitor memberships, invoices and service payments."],["🛡️","Memberships","Manage plans, renewals and device coverage."],["📊","Analytics","Track requests, checkups, revenue and completion rates."],["💬","Complaints","Review customer issues and resolution status."],["⚙️","Settings","Configure plans, pricing and service areas."]]);}


function getReviews(){return JSON.parse(localStorage.getItem("surakshaCareReviews")||"[]");}
function renderReviews(){
  const reviews=getReviews();
  const avg=reviews.length?reviews.reduce((sum,r)=>sum+Number(r.rating),0)/reviews.length:0;
  const avgText=reviews.length?avg.toFixed(1):"0.0";
  const stars=reviews.length?"★".repeat(Math.round(avg))+"☆".repeat(5-Math.round(avg)):"☆☆☆☆☆";
  const avgEl=document.getElementById("averageRating"); if(avgEl) avgEl.textContent=avgText;
  const starsEl=document.getElementById("averageStars"); if(starsEl) starsEl.textContent=stars;
  const countEl=document.getElementById("reviewCount"); if(countEl) countEl.textContent=`Based on ${reviews.length} review${reviews.length===1?"":"s"}`;
  const hero=document.getElementById("heroRating"); const heroText=document.getElementById("heroRatingText");
  if(hero) hero.textContent=reviews.length?avgText+"/5":"New";
  if(heroText) heroText.textContent=reviews.length?`${reviews.length} customer review${reviews.length===1?"":"s"}`:"No reviews yet";
  const list=document.getElementById("reviewList"); if(!list) return;
  if(!reviews.length){list.innerHTML='<div class="empty-reviews"><span>💬</span><h3>No customer reviews yet</h3><p>Complete a service and be the first customer to leave feedback.</p><button class="btn btn-outline" onclick="openModal(\'reviewModal\')">Leave the first review</button></div>';return;}
  list.innerHTML=reviews.slice().reverse().map(r=>`<article class="review-card"><div class="review-top"><div><b>${escapeHtml(r.name)}</b><small>${new Date(r.date).toLocaleDateString()}</small></div><strong>★ ${r.rating}/5</strong></div><p>${escapeHtml(r.comment)}</p>${r.serviceId?`<small class="review-id">Service: ${escapeHtml(r.serviceId)}</small>`:""}</article>`).join("");
}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));}

window.addEventListener("load",()=>{
  renderReviews();
  const saved=JSON.parse(localStorage.getItem("surakshaCareInstant")||"null");
  if(saved) updateServiceTracker(saved.status||"Technician requested");
  const h=JSON.parse(localStorage.getItem("surakshaCareHealth")||"null");
  if(h){document.getElementById("healthScore").textContent=h.score+"%";document.getElementById("healthDeviceName").textContent=h.device;document.getElementById("healthAdvice").textContent=h.score>=85?"Good condition. Continue preventive maintenance.":"Needs attention. Consider a preventive checkup soon.";}
});
