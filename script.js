const state={devices:[],membership:null,pendingMembership:null};

document.addEventListener("DOMContentLoaded",()=>{
  addDeviceRow();
  document.getElementById("loginForm").addEventListener("submit",handleLogin);
  document.getElementById("signupForm").addEventListener("submit",handleSignup);
  document.getElementById("instantForm").addEventListener("submit",handleInstant);
  document.getElementById("signupRole")?.addEventListener("change",toggleTechnicianFields);
  toggleTechnicianFields();
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
  state.devices.push({id,category:"",product:"",year:"",value:""});
  renderDevices();
}
function removeDevice(id){state.devices=state.devices.filter(d=>d.id!==id);if(!state.devices.length)addDeviceRow();renderDevices();}
function renderDevices(){
  const list=document.getElementById("deviceList");
  list.innerHTML=state.devices.map((d,i)=>`
    <div class="device-row">
      <label>Category<select onchange="updateDevice(${d.id},'category',this.value);refreshProducts(${d.id},this.value)"><option value="">Select</option><option ${d.category==="Appliance"?"selected":""}>Appliance</option><option ${d.category==="Vehicle"?"selected":""}>Vehicle</option></select></label>
      <label>Device<select id="prod-${d.id}" onchange="updateDevice(${d.id},'product',this.value)"><option value="">Select category first</option>${productOptions(d.category,d.product)}</select></label>
      <label>Approx. value<input type="number" value="${d.value}" placeholder="₹ value" onchange="updateDevice(${d.id},'value',this.value)"></label>
      <button class="remove-device" onclick="removeDevice(${d.id})">×</button>
    </div>`).join("");
  document.getElementById("deviceCount").textContent=state.devices.filter(d=>d.product).length;
  document.getElementById("totalValue").textContent="₹"+state.devices.reduce((s,d)=>s+(Number(d.value)||0),0).toLocaleString("en-IN");
}
function productOptions(cat,selected){
  const arr=cat==="Appliance"?["Refrigerator","Washing Machine","Air Conditioner","Television","Microwave","Water Purifier","Geyser","Other Appliance"]:cat==="Vehicle"?["Car","Motorcycle","Scooter","Electric Vehicle","Other Vehicle"]:[];
  return arr.map(x=>`<option ${x===selected?"selected":""}>${x}</option>`).join("");
}
function refreshProducts(id,cat){const d=state.devices.find(x=>x.id===id);if(d){d.product="";d.category=cat;renderDevices();}}
function updateDevice(id,key,value){const d=state.devices.find(x=>x.id===id);if(d)d[key]=value;document.getElementById("deviceCount").textContent=state.devices.filter(d=>d.product).length;document.getElementById("totalValue").textContent="₹"+state.devices.reduce((s,d)=>s+(Number(d.value)||0),0).toLocaleString("en-IN");}
function reviewDevices(){
  const valid=state.devices.filter(d=>d.category&&d.product&&Number(d.value)>0);
  if(!valid.length){toast("Please add at least one complete device.");return;}
  state.devices=valid;showProtectionPlans();
}
function showProtectionPlans(){
  const total=state.devices.reduce((s,d)=>s+Number(d.value),0);
  document.getElementById("planChoices").innerHTML=[
    ["Basic",Math.max(999,Math.round(total*.012)), "2 checkups/year • standard support"],
    ["Premium",Math.max(1999,Math.round(total*.02)), "3 checkups/year • priority technician"],
    ["VIP",Math.max(2999,Math.round(total*.03)), "3 checkups/year • fastest support"]
  ].map(p=>`<div class="plan-choice"><div><b>${p[0]}</b><small style="display:block;color:#718096">${p[2]}</small></div><div><strong>₹${p[1].toLocaleString("en-IN")}/yr</strong> <button class="btn btn-primary" onclick="confirmProtection('${p[0]}',${p[1]})">Select</button></div></div>`).join("");
  openModal("planModal");
}
function confirmProtection(plan,price){
  localStorage.setItem("surakshaCareProtection",JSON.stringify({devices:state.devices,plan,price,date:new Date().toISOString()}));
  closeModal("planModal");
  toast(`${plan} protection selected. Continue with login to activate.`);
  setTimeout(()=>openModal("signupModal"),500);
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
