const state={accounts:[],seed:[],posts:[],likes:new Set(JSON.parse(localStorage.getItem("taswar_likes")||"[]")),activeTab:"timeline",selectedHandle:null};
const LS_PROFILE="taswar_user_profile"; const LS_POSTS="taswar_user_posts";
const $=(s)=>document.querySelector(s); const $$=(s)=>Array.from(document.querySelectorAll(s));
const saveLikes=()=>localStorage.setItem("taswar_likes",JSON.stringify([...state.likes]));
const fieldTouched={label:false,color:false,handle:false};

function nowInfo(){const d=new Date();return {d,hh:String(d.getHours()).padStart(2,"0"),mm:String(d.getMinutes()).padStart(2,"0"),key:d.toISOString().slice(0,10)};}
function timeToMin(t){const [h,m]=String(t||"00:00").split(":").map(Number);return h*60+m;}
function iconHTML(icon){return `<div class="avatar" style="background:${icon.color||"#00ffa1"}">${(icon.label||"U").slice(0,2).toUpperCase()}</div>`;}
function loadUserData(){return {profile:JSON.parse(localStorage.getItem(LS_PROFILE)||"null"),posts:JSON.parse(localStorage.getItem(LS_POSTS)||"[]")};}
function saveUser(profile,posts){localStorage.setItem(LS_PROFILE,JSON.stringify(profile));localStorage.setItem(LS_POSTS,JSON.stringify(posts));}

function hashString(str){let h=0; for(let i=0;i<str.length;i++){h=(h*31+str.charCodeAt(i))>>>0;} return h;}
function genColor(seed){const h=hashString(seed)%360; return `hsl(${h} 70% 55%)`;}
function normalizeHandle(name){const base=(name||"user").toLowerCase().replace(/[^a-z0-9_\-]+/g,"_").replace(/^_+|_+$/g,"")||"user"; return `@${base}_${(hashString(name||"user")%1000).toString().padStart(3,"0")}`;}
function genLabel(name){const letters=(name||"U").replace(/[^A-Za-z]/g,"").toUpperCase(); if(letters.length>=2) return letters.slice(0,2); if(letters.length===1) return (letters+"X").slice(0,2); return "US";}
function applyAutoFromName(){const name=$("#uName").value.trim(); if(!name) return; if(!fieldTouched.label || !$("#uLabel").value.trim()) $("#uLabel").value=genLabel(name); if(!fieldTouched.handle || !$("#uHandle").value.trim()) $("#uHandle").value=normalizeHandle(name); if(!fieldTouched.color || !$("#uColor").value) $("#uColor").value=genColor(name);}

function dedupePosts(posts){const map=new Map(); for(const p of posts){const k=`${p.handle}|${p.time}|${p.content}`; const prev=map.get(k); if(!prev || new Date(p.timestamp||0)>new Date(prev.timestamp||0)) map.set(k,p);} return [...map.values()];}
function buildSeedPosts(accounts){const n=nowInfo(); const nowMin=n.d.getHours()*60+n.d.getMinutes(); const day=n.key; const out=[]; for(const a of accounts){for(const p of a.posts||[]){if(timeToMin(p.time)>nowMin) continue; out.push({id:`seed|${a.handle}|${day}|${p.time}|${(p.content||"").slice(0,36)}`,source:"seed",day,time:p.time,timestamp:`${day}T${p.time}:00`,name:a.name,handle:a.handle,icon:a.icon||{label:"U",color:"#00ffa1"},verified:!!a.verified,profile:a.profile||"",content:p.content||"",reply_to:p.reply_to||"",attachments:p.attachments||[]});}} return out;}
function getAllPosts(){const user=loadUserData(); const mine=(user.posts||[]).map((p,i)=>({id:p.id||`me|${i}|${p.timestamp||new Date().toISOString()}`,source:"user",day:(p.timestamp||"").slice(0,10),time:p.time||"00:00",timestamp:p.timestamp,name:user.profile?.name||"ユーザー",handle:user.profile?.handle||"@user",icon:user.profile?.icon||{label:"ME",color:"#00ffa1"},verified:false,profile:user.profile?.profile||"",content:p.content||"",reply_to:p.reply_to||"",attachments:p.attachments||[]})); return dedupePosts([...state.seed,...mine]).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));}

function openTab(tab){state.activeTab=tab; $$(".tab").forEach(x=>x.classList.remove("active")); $("#tab-"+tab).classList.add("active"); $$(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab)); if(tab==="user") renderOwnUserView();}

function postCard(p){
  const liked=state.likes.has(p.id);
  const caps=(p.attachments||[]).map(a=>`<div class="caption">画像キャプション: ${a.description||""}</div>`).join("");
  return `<article class="post" data-id="${p.id}">
    <a href="#" class="go-profile" data-handle="${p.handle}">${iconHTML(p.icon)}</a>
    <div class="meta" style="flex:1">
      <div><a href="#" class="go-profile name" data-handle="${p.handle}">${p.name}</a><a href="#" class="go-profile handle" data-handle="${p.handle}">${p.handle}</a>${p.verified?'<span class="ver">✔</span>':''}<span class="small"> · ${p.time}</span></div>
      ${p.reply_to?`<div class="small">返信先 ${p.reply_to}</div>`:""}
      <div class="content">${(p.content||"").replace(/</g,"&lt;")}</div>
      ${caps}
      <div class="tools">
        <button class="like ${liked?"on":""}" data-id="${p.id}">いいね</button>
        <button class="copy" data-copy="${encodeURIComponent(p.content||"")}">コピー</button>
        ${p.source==="user"?`<button class="delete" data-id="${p.id}">削除</button>`:""}
      </div>
    </div>
  </article>`;
}

function renderFeed(){state.seed=buildSeedPosts(state.accounts); state.posts=getAllPosts(); $("#feed").innerHTML=state.posts.map(postCard).join(""); $("#timeNow").textContent=`現在時刻 ${new Date().toLocaleString("ja-JP")}`;}

function renderOwnUserView(){
  const user=loadUserData();
  if(!user.profile){ $("#profileView").innerHTML="<p>まずタイムラインの投稿フォームでユーザー情報を設定してください。</p>"; $("#userPosts").innerHTML="<p class='small'>投稿なし</p>"; $("#userLikes").innerHTML="<p class='small'>いいねなし</p>"; return; }
  const me={...user.profile,verified:false};
  $("#profileView").innerHTML=`<div class="profile-head">${iconHTML(me.icon||{label:"ME",color:"#00ffa1"})}<div><div><strong>${me.name}</strong> <span class="handle">${me.handle}</span></div><p class="bio">${me.profile||""}</p></div></div>`;
  const posts=state.posts.filter(p=>p.handle===me.handle);
  $("#userPosts").innerHTML=posts.map(postCard).join("")||"<p class='small'>投稿なし</p>";
  const likes=state.posts.filter(p=>state.likes.has(p.id));
  $("#userLikes").innerHTML=likes.map(postCard).join("")||"<p class='small'>いいねなし</p>";
}

function renderExternalProfile(handle){
  const acc=state.accounts.find(a=>a.handle===handle);
  if(!acc){ renderOwnUserView(); return; }
  $("#profileView").innerHTML=`<div class="profile-head">${iconHTML(acc.icon||{label:"U",color:"#00ffa1"})}<div><div><strong>${acc.name}</strong> <span class="handle">${acc.handle}</span>${acc.verified?"<span class='ver'>✔</span>":""}</div><p class="bio">${acc.profile||""}</p></div></div>`;
  const posts=state.posts.filter(p=>p.handle===acc.handle);
  $("#userPosts").innerHTML=posts.map(postCard).join("")||"<p class='small'>投稿なし</p>";
  const likes=state.posts.filter(p=>state.likes.has(p.id));
  $("#userLikes").innerHTML=likes.map(postCard).join("")||"<p class='small'>いいねなし</p>";
}

function bind(){
  $("#modalClose")?.addEventListener("click",closeExternalProfileModal);
  $("#profileModal")?.addEventListener("click",(e)=>{ if(e.target?.dataset?.close==="1") closeExternalProfileModal(); });
  $$(".nav-btn").forEach(b=>b.onclick=()=>openTab(b.dataset.tab));
  ["#uLabel","#uColor","#uHandle"].forEach(sel=>$(sel).addEventListener("input",()=>{ if(sel==="#uLabel") fieldTouched.label=true; if(sel==="#uColor") fieldTouched.color=true; if(sel==="#uHandle") fieldTouched.handle=true; }));
  $("#uName").addEventListener("input",applyAutoFromName);

  $("#composer").onsubmit=(e)=>{
    e.preventDefault();
    const name=$("#uName").value.trim(); if(!name) return alert("ユーザー名は必須です。");
    applyAutoFromName();
    const profile={name,handle:$("#uHandle").value.trim()||normalizeHandle(name),profile:$("#uProfile").value.trim()||"",icon:{label:($("#uLabel").value.trim()||genLabel(name)).slice(0,2).toUpperCase(),color:$("#uColor").value||genColor(name)}};
    const text=$("#postText").value.trim(); if(!text) return;
    const caption=$("#postCaption").value.trim(); const d=new Date(); const time=`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    const {posts}=loadUserData(); posts.push({id:`me|${Date.now()}`,time,timestamp:d.toISOString(),content:text,attachments:caption?[{type:"image",description:caption}]:[]});
    saveUser(profile,posts); $("#postText").value=""; $("#postCaption").value=""; renderFeed();
  };

  document.body.addEventListener("click",(e)=>{
    const t=e.target;
    if(t.matches(".go-profile")){ e.preventDefault(); const handle=t.dataset.handle; const u=loadUserData(); if(u.profile && u.profile.handle===handle){ openTab("user"); renderOwnUserView(); } else { openExternalProfileModal(handle); } }
    if(t.matches(".like")){ const id=t.dataset.id; state.likes.has(id)?state.likes.delete(id):state.likes.add(id); saveLikes(); renderFeed(); if(state.activeTab==="user") renderOwnUserView(); }
    if(t.matches(".copy")){ navigator.clipboard.writeText(decodeURIComponent(t.dataset.copy||"")); }
    if(t.matches(".delete")){
      const id=t.dataset.id;
      if(!confirm("この投稿を本当に削除しますか？")) return;
      const u=loadUserData();
      u.posts=(u.posts||[]).filter(p=>p.id!==id);
      saveUser(u.profile,u.posts);
      renderFeed();
      if(state.activeTab==="user") renderOwnUserView();
    }
  });

  $("#importJson").addEventListener("change",async(e)=>{
    const f=e.target.files?.[0]; if(!f) return;
    try{ const j=JSON.parse(await f.text()); const nm=(j.name||"ユーザー").trim(); const profile={name:nm,handle:(j.handle||normalizeHandle(nm)).trim(),profile:(j.profile||""),icon:j.icon||{label:genLabel(nm),color:genColor(nm)}}; const posts=(j.posts||[]).map(p=>({id:`me|${Date.now()}|${Math.random()}`,time:p.time||"00:00",timestamp:p.timestamp||new Date().toISOString(),content:p.content||"",attachments:p.attachments||[]})); saveUser(profile,posts); renderFeed(); openTab("user"); }catch{ alert("JSON読込に失敗しました"); }
  });

  $("#exportJson").onclick=()=>{ const {profile,posts}=loadUserData(); const data={name:profile?.name||"",handle:profile?.handle||"",profile:profile?.profile||"",icon:profile?.icon||{label:"ME",color:"#00ffa1"},posts:posts||[]}; const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="taswar_user_export.json"; a.click(); URL.revokeObjectURL(a.href); };
  $("#templateJson").onclick=()=>{ const tpl={name:"ユーザー名",handle:"@your_id",profile:"",icon:{label:"YU",color:"#00ffa1"},posts:[{time:"12:00",timestamp:new Date().toISOString(),content:"本文",attachments:[{type:"image",description:"画像キャプション"}]}]}; const b=new Blob([JSON.stringify(tpl,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="taswar_template.json"; a.click(); URL.revokeObjectURL(a.href); };
  $("#resetAccount").onclick=()=>{
    if(!confirm("アカウント情報と自分の投稿を本当にリセットしますか？")) return;
    localStorage.removeItem(LS_PROFILE);
    localStorage.removeItem(LS_POSTS);
    ["#uLabel","#uName","#uHandle","#uProfile","#postText","#postCaption"].forEach(s=>{ const el=$(s); if(el) el.value=""; });
    $("#uColor").value="#00ffa1";
    fieldTouched.label=false; fieldTouched.color=false; fieldTouched.handle=false;
    renderFeed();
    openTab("timeline");
  };
}


let __lastMinuteKey = "";
function startRealtimeClock(){
  const tick=()=>{
    const d=new Date();
    const minuteKey=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    if($("#timeNow")) $("#timeNow").textContent=`現在時刻 ${d.toLocaleString("ja-JP")}`;
    if(minuteKey!==__lastMinuteKey){
      __lastMinuteKey=minuteKey;
      renderFeed();
      if(state.activeTab==="user") renderOwnUserView();
    }
  };
  tick();
  setInterval(tick,1000);
}
async function init(){
  const res=await fetch("./timeline.json"); const data=await res.json(); state.accounts=data.accounts||[]; state.seed=buildSeedPosts(state.accounts);
  bind(); renderFeed(); startRealtimeClock();
  const user=loadUserData();
  if(user.profile){ $("#uLabel").value=user.profile.icon?.label||"ME"; $("#uColor").value=user.profile.icon?.color||"#00ffa1"; $("#uName").value=user.profile.name||""; $("#uHandle").value=user.profile.handle||""; $("#uProfile").value=user.profile.profile||""; fieldTouched.label=true; fieldTouched.color=true; fieldTouched.handle=true; }
}
init();



function openExternalProfileModal(handle){
  const acc=state.accounts.find(a=>a.handle===handle);
  if(!acc) return;
  const posts=state.posts.filter(p=>p.handle===acc.handle);
  $("#modalProfile").innerHTML=`<div class="card"><div class="profile-head">${iconHTML(acc.icon||{label:"U",color:"#00ffa1"})}<div><div><strong>${acc.name}</strong> <span class="handle">${acc.handle}</span>${acc.verified?"<span class='ver'>✔</span>":""}</div><p class="bio">${acc.profile||""}</p></div></div></div>`;
  $("#modalPosts").innerHTML=`<div class="card"><h3>投稿一覧</h3>${posts.map(postCard).join("")||"<p class='small'>投稿なし</p>"}</div>`;
  $("#profileModal").hidden=false;
}

function closeExternalProfileModal(){
  if($("#profileModal")) $("#profileModal").hidden=true;
}
