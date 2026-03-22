
    const ST={"00":[381,200],"01":[460,165],"02":[489,188],"03":[486,216],"04":[461,239],"05":[452,262],"06":[399,274],"07":[377,327],"08":[356,352],"09":[324,363],"0A":[248,367],"0B":[272,433],"0C":[325,438],"0D":[345,472],"0E":[375,502],"0F":[362,548],"10":[346,612],"11":[324,668],"20":[408,233],"22":[477,277],"23":[511,298],"24":[545,331],"25":[584,364],"26":[620,397],"27":[647,423],"28":[670,422],"29":[694,448],"2A":[719,482],"2B":[753,538],"2C":[805,583],"2D":[847,618],"2E":[881,640],"2F":[907,653],"30":[948,682],"31":[977,729],"32":[970,769],"33":[941,822],"34":[956,833],"40":[432,492],"41":[460,513],"42":[488,516],"43":[540,511],"44":[596,475],"45":[632,449],"50":[457,276],"51":[468,294],"52":[466,326],"53":[456,389],"54":[411,412],"55":[388,428],"56":[376,470],"60":[452,429],"61":[483,433],"62":[518,553],"63":[530,627],"64":[629,641],"70":[263,324],"71":[254,283],"72":[246,259],"73":[248,240],"74":[259,223],"80":[386,643],"81":[412,561],"82":[464,563],"83":[490,581],"84":[557,610],"85":[561,594]};
    const BT={"00":[414,171],"01":[478,174],"02":[491,202],"03":[471,223],"04":[458,252],"05":[425,267],"06":[387,301],"07":[367,340],"08":[340,359],"09":[295,346],"0A":[241,399],"0B":[304,430],"0C":[339,454],"0D":[355,488],"0E":[372,527],"0F":[357,582],"10":[327,642],"20":[434,238],"21":[465,269],"22":[496,287],"23":[529,313],"24":[564,352],"25":[606,382],"26":[633,415],"27":[659,422],"28":[684,434],"29":[707,465],"2A":[736,513],"2B":[780,563],"2C":[830,602],"2D":[864,633],"2E":[898,641],"2F":[927,673],"30":[975,696],"31":[958,750],"32":[972,795],"33":[949,828],"40":[406,500],"41":[453,497],"42":[474,517],"43":[515,515],"44":[567,490],"45":[616,462],"46":[642,439],"50":[456,269],"51":[464,283],"52":[468,310],"53":[464,359],"54":[435,404],"55":[399,421],"56":[378,449],"57":[374,488],"60":[446,412],"61":[469,433],"62":[491,460],"63":[505,535],"64":[522,584],"65":[587,649],"70":[262,348],"71":[256,303],"72":[251,269],"73":[247,251],"74":[252,232],"80":[365,638],"81":[406,606],"82":[438,558],"83":[480,571],"84":[509,606],"85":[544,624],"86":[558,602]};

    const MARK_TEXT={hub:"全列車停車",semi:"区間特急停車",rapid:"急行・普通停車",local:"普通停車"};
    const TYPE_LABEL={local:"普通",rapid:"急行",semi:"区間特急",limited:"特急",intl:"国際特急",brt:"BRT"};
    const SPEED_FACTOR={local:1,rapid:1.2,semi:1.35,limited:1.5,intl:1.6,brt:1,airport:1.35};
    const SERVICE_START=5*60+45, SERVICE_END=23*60, DWELL_MIN=1;

    const lines=[
      {name:"湾岸線",color:"#0000FF",baseSpeed:68,stations:[["ギュラベイ","hub","00"],["ティナネイキ","rapid","01"],["ギリディネイ","local","02"],["ミリフマレイ","local","03"],["ショリギナセイ","rapid","04"],["イラー中央","hub","05"],["イリビレイセイ","local","06"],["ラゼハビメイ","local","07"],["フミシラレイ","local","08"],["ナピリラセイ","local","09"],["ダリギナセイ","local","0A"],["ガネイキ","local","0B"],["ネウリフマレイ","local","0C"],["マウキビレイ","rapid","0D"],["セラン中央","hub","0E"],["リウニシェベン","rapid","0F"],["ミュネイキ","rapid","10"],["デュラベイ","hub","11"]],segments:[[57.7,"00"],[23.8,"01"],[18.4,"02"],[23.7,"03"],[18.7,"04"],[33.9,"05"],[39.9,"06"],[21.2,"07"],[21.6,"08"],[52.4,"09"],[51.0,"0A"],[36.1,"0B"],[26.5,"0C"],[27.1,"0D"],[30.8,"0E"],[45.7,"0F"],[40.3,"10"]],services:[{type:"local",headway:60,offset:15,from:"11",to:"0E"},{type:"local",headway:60,offset:10,from:"0E",to:"11"},{type:"local",headway:30,offset:5,from:"0E",to:"05"},{type:"local",headway:30,offset:25,from:"05",to:"0E"},{type:"local",headway:30,offset:10,from:"05",to:"00"},{type:"local",headway:30,offset:7,from:"00",to:"05"},{type:"rapid",headway:30,offset:10,from:"0E",to:"00"},{type:"rapid",headway:30,offset:15,from:"00",to:"0E"},{type:"limited",headway:120,offset:0,from:"11",to:"00"},{type:"limited",headway:120,offset:30,from:"00",to:"11"},{type:"intl",headway:480,offset:0,from:"05",to:"00"},{type:"intl",headway:480,offset:110,from:"00",to:"05"},{type:"intl",headway:420,offset:60,from:"05",to:"11"},{type:"intl",headway:420,offset:180,from:"11",to:"05"}]},
      {name:"ハヴァレイキ線",color:"#00FF00",baseSpeed:66,stations:[["タネイ・トライポート","hub","20"],["イラー中央","hub","05"],["マリディア","hub","22"],["ギジェイキニ","semi","23"],["ティナレイキ","hub","24"],["ミラフレイ","semi","25"],["ナーキ","semi","26"],["アーケイ中央","hub","27"],["ティレリウレイ","semi","28"],["ラデイキ","hub","29"],["ヴィーラー","local","2A"],["アラデイキ","local","2B"],["ギザレイキ","local","2C"],["ヤーキ","local","2D"],["ゾルアー","local","2E"],["ノビレイ","rapid","2F"],["ハヴァレイキ","hub","30"],["ビライタン","rapid","31"],["ゾパイタン","local","32"],["ヴィシャーン","local","33"],["ヤシャーン","hub","34"]],segments:[[5.0,"20"],[33.0,"21"],[38.0,"22"],[42.2,"23"],[41.9,"24"],[39.8,"25"],[32.3,"26"],[17.7,"27"],[25.4,"28"],[29.0,"29"],[43.6,"2A"],[48.1,"2B"],[38.3,"2C"],[25.1,"2D"],[21.9,"2E"],[33.0,"2F"],[45.6,"30"],[42.4,"31"],[43.5,"32"],[14.6,"33"]],services:[{type:"local",headway:60,offset:30,from:"34",to:"30"},{type:"local",headway:60,offset:20,from:"30",to:"34"},{type:"local",headway:60,offset:55,from:"30",to:"29"},{type:"local",headway:60,offset:20,from:"29",to:"30"},{type:"local",headway:30,offset:20,from:"29",to:"20"},{type:"local",headway:30,offset:25,from:"20",to:"29"},{type:"rapid",headway:30,offset:15,from:"30",to:"20"},{type:"rapid",headway:30,offset:5,from:"20",to:"30"},{type:"semi",headway:30,offset:5,from:"29",to:"20"},{type:"semi",headway:30,offset:10,from:"20",to:"29"},{type:"limited",headway:120,offset:0,from:"20",to:"30"},{type:"limited",headway:120,offset:60,from:"30",to:"20"}]},
      {name:"セラン線",color:"#FF0000",baseSpeed:58,stations:[["セラン中央","hub","0E"],["ビーパン","rapid","40"],["キカーン","local","41"],["マリアネイ","local","42"],["ハリアネイ","local","43"],["ギリディウネイ","rapid","45"],["アーケイ中央","hub","27"]],segments:[[42.4,"40"],[20.8,"41"],[21.8,"42"],[31.3,"43"],[50.16,"44"],[20.4,"46"]],services:[{type:"local",departures:["06:00","09:00","12:00","15:00","18:00","21:00"],from:"0E",to:"27"},{type:"local",departures:["06:00","09:00","12:00","15:00","18:00","21:00"],from:"27",to:"0E"}]},
      {name:"KIRT貨物線",color:"#454CE0",baseSpeed:62,stations:[["イラー中央","hub","05"],["イリケレイ第一","local","50"],["ギリネヴァレイ","local","51"],["イリケレイ第二","local","52"],["ビライツァ","rapid","53"],["ニヴィギナセイ第一","local","54"],["イギリヴィ","local","55"],["ニヴィギナセイ第二","local","56"],["セラン中央","hub","0E"]],segments:[[39,"50"],[41.11,"51"],[39,"52"],[40,"53"],[39,"54"],[40.11,"55"],[39,"56"],[39,"57"]],services:[{type:"local",headway:30,offset:7,from:"05",to:"0E"},{type:"local",headway:30,offset:7,from:"0E",to:"05"},{type:"rapid",headway:60,offset:20,from:"05",to:"0E"},{type:"rapid",headway:60,offset:20,from:"0E",to:"05"}]},
      {name:"KMTRゴネイキ線",color:"#009F9F",baseSpeed:75,stations:[["ビライツァ","rapid","53"],["フリウヴァレン","local","60"],["ミウニアネイ","local","61"],["マリアネイ","local","42"],["ティリ・マジェイ","rapid","62"],["キラティ","rapid","63"],["ゴネイキ","rapid","64"]],segments:[[78.96,"60"],[61.05,"61"],[37.09,"62"],[48.58,"63"],[44.24,"64"],[71.65,"65"]],services:[{type:"local",headway:60,offset:10,from:"53",to:"64"},{type:"local",headway:60,offset:40,from:"53",to:"64"},{type:"local",headway:60,offset:0,from:"64",to:"53"},{type:"local",headway:60,offset:30,from:"64",to:"53"},{type:"rapid",headway:60,offset:45,from:"53",to:"64"},{type:"rapid",headway:60,offset:35,from:"64",to:"53"}]},
      {name:"ツァパ線",color:"#A0A000",baseSpeed:55,stations:[["ダリギナセイ","local","0A"],["キラアネイ","local","70"],["キラゴー","local","71"],["キラツァパ","local","72"],["ノツァパ","local","73"],["ノゴー","local","74"]],segments:[[39.6,"70"],[26.3,"71"],[14.3,"72"],[8.8,"73"],[14.3,"74"]],services:[{type:"local",headway:60,offset:0}]},
      {name:"デュラベイBRT",color:"#A000A0",baseSpeed:85,stations:[["ミュネイキ","rapid","10"],["サツァディアン","local","80"],["ティリディアン","local","81"],["ティリ・チャラヒヴァン","local","82"],["ティレウキニ","local","83"],["キラティ","rapid","63"],["フリペレイ","local","84"],["デュラル・コンビナート","hub","85"]],segments:[[34.6,"80"],[55.5,"81"],[31.5,"82"],[22.4,"83"],[32.0,"84"],[26.3,"85"],[2.0,"86"]],services:[{type:"brt",departures:["05:25","05:55","06:00","06:15","06:30","06:45","07:00","07:15","07:30","07:45","08:00","08:15","08:30","08:45","09:25","09:55","10:25","10:55","11:25","11:55","12:25","12:55","13:25","13:55","14:25","14:55","15:25","15:55","16:25","16:55","17:00","17:15","17:30","17:45","18:00","18:15","18:30","18:45","19:00","19:15","19:30","19:45","20:25","20:55","21:25","21:55","22:25","22:55","23:25","23:55","00:25","00:55"],from:"10",to:"85"},{type:"brt",departures:["05:25","05:55","06:05","06:20","06:35","06:50","07:05","07:20","07:35","07:50","08:05","08:20","08:35","08:50","09:25","09:55","10:25","10:55","11:25","11:55","12:25","12:55","13:25","13:55","14:25","14:55","15:25","15:55","16:25","16:55","17:05","17:20","17:35","17:50","18:05","18:20","18:35","18:50","19:05","19:20","19:35","19:50","20:25","20:55","21:25","21:55","22:25","22:55","23:25","23:55","00:25","00:55"],from:"85",to:"10"}]}
    ];

    const stationLayer=document.getElementById("stationLayer"), trainLayer=document.getElementById("trainLayer");
    const stationInfo=document.getElementById("stationInfo"), trainInfo=document.getElementById("trainInfo"), statusInfo=document.getElementById("statusInfo");
    const followTools=document.getElementById("followTools"), followTrainBtn=document.getElementById("followTrainBtn"), announceToggle=document.getElementById("announceToggle"), announceBox=document.getElementById("announceBox");
    const lineLegend=document.getElementById("lineLegend"), lineStatus=document.getElementById("lineStatus");
    const modeSelect=document.getElementById("modeSelect"), manualTime=document.getElementById("manualTime"), speedSelect=document.getElementById("speedSelect"), lineFilter=document.getElementById("lineFilter");
    const clockText=document.getElementById("clockText"), mapViewport=document.getElementById("mapViewport"), mapStage=document.getElementById("mapStage"), pauseBtn=document.getElementById("pauseBtn"), reloadBtn=document.getElementById("reloadBtn"), stationNameToggle=document.getElementById("stationNameToggle");

    let selectedStation=null, selectedTrain=null, activeLine="all";
    let followedTrainId=null, followOnly=false, announceEnabled=false;
    let simMinute=null, simLastMs=null, simSpeed=1, isPaused=false, showStationNames=true;

    let scale=1, panX=0, panY=0;
    const minScale=0.6, maxScale=3.5;
    let dragStart=null; const pointers=new Map(); let pinchStart=null;

    function applyTransform(){ mapStage.style.transform=`translate(${panX}px, ${panY}px) scale(${scale})`; }
    function clampPan(){
      const vw=mapViewport.clientWidth, vh=mapViewport.clientHeight, cw=1428*scale, ch=1005*scale;
      const minX=Math.min(0,vw-cw), minY=Math.min(0,vh-ch);
      panX = (cw<=vw)?(vw-cw)/2:Math.min(0,Math.max(minX,panX));
      panY = (ch<=vh)?(vh-ch)/2:Math.min(0,Math.max(minY,panY));
    }
    function zoomAt(cx,cy,delta){
      const r=mapViewport.getBoundingClientRect();
      const ox=(cx-r.left-panX)/scale, oy=(cy-r.top-panY)/scale;
      scale=Math.max(minScale,Math.min(maxScale,scale*delta));
      panX=cx-r.left-ox*scale; panY=cy-r.top-oy*scale;
      clampPan(); applyTransform();
    }

    mapViewport.addEventListener("wheel",(e)=>{ e.preventDefault(); zoomAt(e.clientX,e.clientY,e.deltaY<0?1.1:0.9); },{passive:false});
    mapViewport.addEventListener("pointerdown",(e)=>{ if (e.target.closest(".station, .train, .zoom-btn, select, input, button")) return; mapViewport.setPointerCapture(e.pointerId); pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); if(pointers.size===1) dragStart={x:e.clientX-panX,y:e.clientY-panY}; if(pointers.size===2){ const v=[...pointers.values()]; pinchStart={dist:Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y)}; } });
    mapViewport.addEventListener("pointermove",(e)=>{ if(!pointers.has(e.pointerId)) return; pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); if(pointers.size===1&&dragStart){ panX=e.clientX-dragStart.x; panY=e.clientY-dragStart.y; clampPan(); applyTransform(); } else if(pointers.size===2&&pinchStart){ const v=[...pointers.values()]; const cX=(v[0].x+v[1].x)/2,cY=(v[0].y+v[1].y)/2; const dist=Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y); zoomAt(cX,cY,dist/Math.max(1,pinchStart.dist)); pinchStart={dist}; } });
    function endPointer(e){ pointers.delete(e.pointerId); if(pointers.size===0){dragStart=null;pinchStart=null;} }
    mapViewport.addEventListener("pointerup",endPointer); mapViewport.addEventListener("pointercancel",endPointer);
    document.getElementById("zoomIn").addEventListener("click",()=>{const r=mapViewport.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/2,1.12);});
    document.getElementById("zoomOut").addEventListener("click",()=>{const r=mapViewport.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/2,0.88);});
    document.getElementById("zoomReset").addEventListener("click",()=>{scale=1;panX=0;panY=0;clampPan();applyTransform();});
    window.addEventListener("resize",()=>{clampPan();applyTransform();});

    function hexInc2(code){ const n=parseInt(code,16); return Number.isNaN(n)?null:(n+1).toString(16).toUpperCase().padStart(2,"0"); }
    function resolveStationXY(line, idx){
      const code=line.stations[idx][2];
      if(ST[code]) return ST[code];
      const plus=hexInc2(code);
      if(code!=="00" && plus && ST[plus]) return ST[plus];
      const prevSeg=idx>0?line.segments[idx-1]:null, nextSeg=idx<line.segments.length?line.segments[idx]:null;
      const prev=idx>0?resolveStationXY(line,idx-1):null, next=idx<line.stations.length-1?resolveStationXY(line,idx+1):null;
      if(nextSeg&&BT[nextSeg[1]]&&next){ const m=BT[nextSeg[1]]; return [Math.round(2*m[0]-next[0]),Math.round(2*m[1]-next[1])]; }
      if(prevSeg&&BT[prevSeg[1]]&&prev){ const m=BT[prevSeg[1]]; return [Math.round(2*m[0]-prev[0]),Math.round(2*m[1]-prev[1])]; }
      return null;
    }

    const enrichedLines=lines.map(line=>({...line,points:line.stations.map((s,i)=>({name:s[0],mark:s[1],code:s[2],xy:resolveStationXY(line,i)}))}));
    const stationMap=new Map();
    enrichedLines.forEach(line=>line.points.forEach(p=>{ if(!p.xy)return; if(!stationMap.has(p.name)) stationMap.set(p.name,{name:p.name,xy:p.xy,marks:{},lines:new Set()}); const st=stationMap.get(p.name); st.marks[line.name]=p.mark; st.lines.add(line.name);}));
    const stations=[...stationMap.values()];

    function visibleLine(name){ return activeLine==="all"||activeLine===name; }
    function visibleStation(st){ return activeLine==="all"||st.lines.has(activeLine); }

    function renderLineFilter(){ lineFilter.innerHTML=['<option value="all">全路線</option>',...enrichedLines.map(l=>`<option value="${l.name}">${l.name}</option>`)].join(""); }
    function labelClass(x,y){ const c=[]; if(x>=1100)c.push("left"); if(y<=90||y>=860)c.push("down"); return c.join(" "); }

    function renderLegend(){ lineLegend.innerHTML=enrichedLines.map(l=>`<span class="badge ${visibleLine(l.name)?'active':''}"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${l.color};margin-right:6px;"></span>${l.name}</span>`).join(""); lineStatus.textContent=`表示路線: ${activeLine==="all"?"全路線":activeLine}`; }

    function renderStations(){
      stationLayer.innerHTML="";
      stations.forEach(st=>{
        if(!visibleStation(st)) return;
        const b=document.createElement("button"); b.type="button"; b.className="station"; if(selectedStation===st.name)b.classList.add("selected");
        b.style.left=`${st.xy[0]}px`; b.style.top=`${st.xy[1]}px`; b.title=st.name;
        b.addEventListener("pointerdown",(ev)=>{ ev.preventDefault(); ev.stopPropagation(); selectedStation=selectedStation===st.name?null:st.name; selectedTrain=null; const t=(typeof simMinute==="number")?simMinute:inputMinute(); refreshInfo(); renderStations(); renderTrains(t); });
        const n=document.createElement("div"); n.className=`station-name ${labelClass(st.xy[0],st.xy[1])}`.trim(); n.style.left=`${st.xy[0]}px`; n.style.top=`${st.xy[1]}px`; n.textContent=st.name; n.style.display=showStationNames?"block":"none";
        stationLayer.appendChild(b); stationLayer.appendChild(n);
      });
    }

    function stopRule(lineName,type){ if(type==="local"||type==="brt") return (m,i,max)=>true; if(type==="rapid") return (m,i,max)=>i===0||i===max||m==="hub"||m==="rapid"; if(type==="semi") return (m,i,max)=>i===0||i===max||m==="hub"||m==="semi"; if(type==="limited"||type==="intl"){ if(lineName==="KIRT貨物線") return (m,i,max)=>i===0||i===max||m==="hub"||m==="rapid"; return (m,i,max)=>i===0||i===max||m==="hub";} return ()=>true; }
    function runMin(line,type,dist){ return (dist/(line.baseSpeed*(SPEED_FACTOR[type]||1)))*60; }
    function ordered(line,dir){ return dir===1 ? {p:line.points.slice(),s:line.segments.slice()} : {p:line.points.slice().reverse(),s:line.segments.slice().reverse()}; }
    function orderedByCodes(line,fromCode,toCode){
      const i=line.points.findIndex(p=>p.code===fromCode), j=line.points.findIndex(p=>p.code===toCode);
      if(i<0||j<0||i===j) return null;
      if(i<j) return {p:line.points.slice(i,j+1),s:line.segments.slice(i,j)};
      return {p:line.points.slice(j,i+1).reverse(),s:line.segments.slice(j,i).reverse()};
    }

    const NIGHT_CUTOFF_MIN=25*60;
    const MARK_RANK={hub:0,semi:1,rapid:2,local:3};

    function allowedMarksForCutoff(lineName,type){
      if(type==="semi") return new Set(["hub","semi"]);
      if(type==="rapid"||type==="airport") return new Set(["hub","semi","rapid"]);
      if(type==="limited"||type==="intl"){
        if(lineName==="KIRT\u8ca8\u7269\u7dda") return new Set(["hub","rapid"]);
        return new Set(["hub"]);
      }
      return new Set(["hub","semi","rapid","local"]);
    }

    function truncateAfterNight(train,lineName){
      if(!train||!train.events||!train.events.length) return train;
      const tail=train.events[train.events.length-1];
      if(tail.dep<=NIGHT_CUTOFF_MIN) return train;

      const candidates=train.events.map((e,i)=>({e,i})).filter(x=>x.e.arr>=NIGHT_CUTOFF_MIN && x.e.stop);
      if(!candidates.length) return train;

      const allow=allowedMarksForCutoff(lineName,train.type);
      let bestRank=Infinity;
      for(const {e} of candidates){
        if(allow.has(e.mark)) bestRank=Math.min(bestRank, MARK_RANK[e.mark] ?? 99);
      }

      const pick=(bestRank<Infinity)
        ? candidates.find(({e})=>allow.has(e.mark) && (MARK_RANK[e.mark] ?? 99)===bestRank)
        : candidates[0];
      const cutIdx=pick.i;

      train.events=train.events.slice(0,cutIdx+1);
      const last=train.events[train.events.length-1];
      last.dep=Math.max(last.dep,last.arr+DWELL_MIN);
      train.segs=train.segs.slice(0,cutIdx);
      train.to=last.name;
      return train;
    }

    function buildTrain(line,svc,start,dir=1){
      const ord=(svc.from&&svc.to)?orderedByCodes(line,svc.from,svc.to):ordered(line,dir);
      if(!ord||ord.p.length<2) return null;
      const rule=stopRule(line.name,svc.type), ev=[]; let t=start;
      ord.p.forEach((p,i)=>{ const max=ord.p.length-1, stop=rule(p.mark,i,max), arr=t; let dep=arr; if(stop&&i!==0)dep+=DWELL_MIN; if(i===max)dep=arr+DWELL_MIN; ev.push({name:p.name,code:p.code,mark:p.mark,xy:p.xy,arr,dep,stop}); if(i<ord.s.length)t=dep+runMin(line,svc.type,ord.s[i][0]); });
      const tag=(svc.from&&svc.to)?`${svc.from}-${svc.to}`:`dir${dir}`;
      return truncateAfterNight({id:`${line.name}-${svc.type}-${tag}-${Math.round(start)}`,line:line.name,color:line.color,type:svc.type,to:ord.p[ord.p.length-1].name,events:ev,segs:ord.s}, line.name);
    }

    const codePointMap=new Map();
    const pairSegMap=new Map();
    enrichedLines.forEach(line=>{
      line.points.forEach(p=>{ if(!codePointMap.has(p.code)) codePointMap.set(p.code,p); });
      for(let i=0;i<line.points.length-1;i++){
        const a=line.points[i].code,b=line.points[i+1].code;
        const seg=line.segments[i];
        pairSegMap.set(`${a}|${b}`,{seg:seg[1],dist:seg[0]});
        pairSegMap.set(`${b}|${a}`,{seg:seg[1],dist:seg[0]});
      }
    });

    function hmToServiceMin(hm){
      const [h,m]=hm.split(":").map(Number);
      let v=h*60+m;
      if(v<SERVICE_START) v+=1440;
      return v;
    }
    function serviceStarts(svc){
      if(Array.isArray(svc.departures)) return svc.departures.map(hmToServiceMin).filter(t=>t>=SERVICE_START&&t<=SERVICE_END);
      const out=[];
      for(let t=SERVICE_START+(svc.offset||0);t<=SERVICE_END;t+=(svc.headway||60)) out.push(t);
      return out;
    }

    function buildSpecialTrain(spec,start){
      const points=spec.path.map(c=>codePointMap.get(c)).filter(Boolean);
      if(points.length<2) return null;
      const ev=[], segs=[]; let t=start;
      points.forEach((p,i)=>{
        const stopSet=spec.stopCodes?new Set(spec.stopCodes):null;
        const stop = i===0 || i===points.length-1 || (stopSet?stopSet.has(p.code):true);
        const arr=t;
        let dep=arr;
        if(stop&&i!==0) dep += (spec.dwellByCode&&spec.dwellByCode[p.code]!=null)?spec.dwellByCode[p.code]:DWELL_MIN;
        if(i===points.length-1) dep=arr+DWELL_MIN;
        ev.push({name:p.name,code:p.code,mark:p.mark,xy:p.xy,arr,dep,stop});
        if(i<points.length-1){
          const a=points[i].code,b=points[i+1].code;
          const seg=pairSegMap.get(`${a}|${b}`);
          const dist=seg?seg.dist:20;
          const segCode=seg?seg.seg:null;
          t=dep + (dist/((spec.baseSpeed||70)*(SPEED_FACTOR[spec.type]||1)))*60;
          segs.push([dist,segCode]);
        }
      });
      return truncateAfterNight({id:`${spec.id}-${Math.round(start)}`,line:spec.label,color:spec.color,type:spec.type,to:points[points.length-1].name,events:ev,segs,lines:spec.lines||[spec.label]}, (spec.cutoffLine||((spec.lines&&spec.lines[0])||spec.label)));
    }

    const specialServices=[
      {id:"wangan-ltd-up",label:"湾岸線",lines:["湾岸線","KIRT貨物線"],color:"#0000FF",type:"limited",baseSpeed:74,path:["11","10","0F","0E","56","55","54","53","52","51","50","05","04","01","00"],stopCodes:["11","0E","05","04","01","00"],departures:["06:00","07:00","08:00","10:00","12:00","14:00","15:30","17:00","18:30","20:00"]},
      {id:"wangan-ltd-down",label:"湾岸線",lines:["湾岸線","KIRT貨物線"],color:"#0000FF",type:"limited",baseSpeed:74,path:["00","01","04","05","50","51","52","53","54","55","56","0E","0F","10","11"],stopCodes:["00","01","04","05","0E","11"],departures:["06:00","07:00","08:00","10:00","12:00","14:00","15:30","17:00","18:30","20:00"]},
      {id:"intl-frikau-out",label:"湾岸線",lines:["湾岸線"],color:"#0000FF",type:"intl",baseSpeed:76,path:["05","04","01","00"],stopCodes:["05","00"],departures:["08:00"]},
      {id:"intl-frikau-in",label:"湾岸線",lines:["湾岸線"],color:"#0000FF",type:"intl",baseSpeed:76,path:["00","01","04","05"],stopCodes:["00","05"],departures:["17:50"]},
      {id:"intl-dulabay-out",label:"湾岸線",lines:["湾岸線","KIRT貨物線"],color:"#0000FF",type:"intl",baseSpeed:76,path:["05","50","51","52","53","54","55","56","0E","0F","10","11"],stopCodes:["05","0E","11"],departures:["09:00","16:00"]},
      {id:"intl-dulabay-in",label:"湾岸線",lines:["湾岸線","KIRT貨物線"],color:"#0000FF",type:"intl",baseSpeed:76,path:["11","10","0F","0E","56","55","54","53","52","51","50","05"],stopCodes:["11","0E","05"],departures:["10:00","17:00"]},
      {id:"alinar-down",label:"Á-Lĭnar",lines:["ハヴァレイキ線","KIRT貨物線","湾岸線"],color:"#22C1E6",type:"airport",baseSpeed:78,path:["20","05","50","51","52","53","54","55","56","0E","0F","10","11"],stopCodes:["20","05","53","0E","0F","10","11"],dwellByCode:{"05":3,"53":2,"0E":2},departures:["05:05","06:05","07:05","08:05","09:05","10:05","11:05","12:05","13:05","14:05","15:05","16:05","17:05","18:05","19:05","20:05","21:05","22:05","23:05","00:05"]},
      {id:"alinar-up",label:"Á-Lĭnar",lines:["湾岸線","KIRT貨物線","ハヴァレイキ線"],color:"#22C1E6",type:"airport",baseSpeed:78,path:["11","10","0F","0E","56","55","54","53","52","51","50","05","20"],stopCodes:["11","10","0F","0E","53","05","20"],dwellByCode:{"0E":2,"53":2,"05":3},departures:["05:51","06:51","07:51","08:51","09:51","10:51","11:51","12:51","13:51","14:51","15:51","16:51","17:51","18:51","19:51","20:51","21:51","22:51","23:51","00:51"]}
    ];

    const trains=[];
    enrichedLines.forEach(line=>line.services.forEach(svc=>{
      const starts=serviceStarts(svc);
      if(svc.from&&svc.to){
        for(const t of starts){ const tr=buildTrain(line,svc,t,1); if(tr) trains.push(tr); }
      }else{
        for(const dir of [1,-1]) for(const t of starts){ const tr=buildTrain(line,svc,t,dir); if(tr) trains.push(tr); }
      }
    }));
    specialServices.forEach(s=>serviceStarts(s).forEach(t=>{ const tr=buildSpecialTrain(s,t); if(tr) trains.push(tr); }));
    const LAST_SERVICE_MIN=Math.max(SERVICE_END,...trains.map(tr=>tr.events[tr.events.length-1]?.dep||SERVICE_END));

    function minuteFrom(h,m,s){ let v=h*60+m+s/60; if(v<SERVICE_START)v+=1440; return v; }
    function normalizeServiceMinute(v){ let m=((v%1440)+1440)%1440; if(m<SERVICE_START)m+=1440; return m; }
    function inputMinute(){ if(modeSelect.value==="manual"){ const [h,m]=(manualTime.value||"10:00").split(":").map(Number); return minuteFrom(h,m,0); } const n=new Date(); return minuteFrom(n.getHours(),n.getMinutes(),n.getSeconds()); }
    function resetSimClock(){ simMinute=inputMinute(); simLastMs=performance.now(); }
    function stepSimClock(){ if(simMinute===null||simLastMs===null) resetSimClock(); const now=performance.now(), dt=(now-simLastMs)/60000; simLastMs=now; if(modeSelect.value==="realtime"&&simSpeed===1) simMinute=inputMinute(); else simMinute=normalizeServiceMinute(simMinute+dt*simSpeed); return simMinute; }
    function fmt(min){ const n=((Math.floor(min)%1440)+1440)%1440; return `${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`; }
    function lerpPath(a,m,b,r){ if(!m)return [a[0]+(b[0]-a[0])*r,a[1]+(b[1]-a[1])*r]; if(r<0.5){const rr=r*2; return [a[0]+(m[0]-a[0])*rr,a[1]+(m[1]-a[1])*rr];} const rr=(r-0.5)*2; return [m[0]+(b[0]-m[0])*rr,m[1]+(b[1]-m[1])*rr]; }

    function posOf(tr,at){ const e=tr.events; if(!e.length||at<e[0].arr||at>e[e.length-1].dep) return null; for(let i=0;i<e.length;i++){ const c=e[i]; if(c.xy&&at>=c.arr&&at<=c.dep&&c.stop) return {x:c.xy[0],y:c.xy[1],status:"停車中",at:c.name,arr:c.arr,dep:c.dep}; if(i<e.length-1){ const n=e[i+1], rs=c.dep, re=n.arr; if(c.xy&&n.xy&&at>=rs&&at<re){ const mid=BT[tr.segs[i][1]]||null; const [x,y]=lerpPath(c.xy,mid,n.xy,(at-rs)/Math.max(.01,re-rs)); return {x,y,status:"運転中",from:c.name,to:n.name,arr:re,dep:rs}; } } } return null; }

    function stationHtml(name){ const st=stationMap.get(name); if(!st) return "駅をクリックすると停車種別を表示します。"; const chips=Object.entries(st.marks).filter(([ln])=>visibleLine(ln)).map(([ln,m])=>`<span class="badge">${ln}: ${MARK_TEXT[m]||"普通停車"}</span>`).join(""); return `<strong>${name}</strong><br>${chips||"表示路線に該当なし"}`; }
    function refreshInfo(){
      if(selectedStation&&!visibleStation(stationMap.get(selectedStation))) selectedStation=null;
      stationInfo.innerHTML=selectedStation?stationHtml(selectedStation):"駅をクリックすると停車種別を表示します。";
      if(!selectedTrain){
        trainInfo.textContent="列車をクリックすると行き先・種別を表示します。";
        updateFollowUI();
        updateAnnouncement(null,null);
      }
    }

    function centerOnMap(x,y){
      const vw=mapViewport.clientWidth, vh=mapViewport.clientHeight;
      panX = vw/2 - x*scale;
      panY = vh/2 - y*scale;
      clampPan();
      applyTransform();
    }

    function updateFollowUI(){
      if(!followTools || !followTrainBtn || !announceToggle || !announceBox) return;
      const hasSelected=!!selectedTrain;
      const isFollowing=!!(followOnly && followedTrainId && hasSelected && selectedTrain.id===followedTrainId);
      followTools.style.display=hasSelected?"flex":"none";
      followTrainBtn.textContent=isFollowing?"追跡を解除":"この列車だけを追う";
      announceToggle.disabled=!isFollowing;
      if(!isFollowing){
        announceToggle.checked=false;
        announceEnabled=false;
        announceBox.style.display="none";
      }
    }

    function buildAnnouncement(tr,cur){
      if(!tr||!cur) return "";
      const line=tr.line, type=TYPE_LABEL[tr.type]||tr.type, dest=tr.to;
      const ev=tr.events;
      const stopList=ev.filter((e,i)=>e.stop||i===0||i===ev.length-1).map(e=>e.name);
      const isStopped=!!cur.at;

      if(isStopped){
        const idx=ev.findIndex(e=>e.name===cur.at && Math.abs(e.arr-cur.arr)<0.02);
        if(idx===0) return `お待たせいたしました。この電車は、${line}、${type}、${dest}行きです。発車までしばらくお待ちください。`;
        if(idx===ev.length-1) return `まもなく、終点、${dest}、${dest}です。お忘れ物のないよう、お手回り品にご注意ください。`;
        const next=ev[idx+1]?.name||dest;
        return `次は、${next}、${next}です。この電車は、${type}、${dest}行きです。`;
      }

      const fromIdx=ev.findIndex(e=>e.name===cur.from);
      const toIdx=ev.findIndex(e=>e.name===cur.to);
      if(fromIdx===0){
        const coreStops=stopList.slice(1,Math.min(stopList.length,6)).join(", ");
        return `ご利用いただきありがとうございます。この電車は、${line}、${type}、${dest}行きです。主な停車駅は、${coreStops||dest}です。次は、${cur.to}、${cur.to}です。`;
      }
      if(toIdx===ev.length-1) return `まもなく、終点、${dest}、${dest}です。お忘れ物のないよう、お手回り品にご注意ください。`;
      return `まもなく、${cur.to}、${cur.to}です。`;
    }

    function updateAnnouncement(tr,cur){
      if(!announceBox) return;
      const canShow=!!(followOnly && announceEnabled && selectedTrain && tr && selectedTrain.id===tr.id && cur);
      if(!canShow){
        announceBox.style.display="none";
        announceBox.textContent="";
        return;
      }
      announceBox.style.display="block";
      announceBox.textContent=buildAnnouncement(tr,cur);
    }

    const trainNodes=new Map();
    function selectTrain(tr,at){
      selectedTrain={id:tr.id}; selectedStation=null; renderStations();
      const cur=posOf(tr,at);
      if(!cur){
        trainInfo.textContent="この列車は現在表示対象外です。";
        updateFollowUI();
        updateAnnouncement(null,null);
        return;
      }
      const isStopped=!!cur.at;
      const loc=isStopped
        ? `${cur.at} (stopped ${fmt(cur.arr)}-${fmt(cur.dep)})`
        : `${cur.from} -> ${cur.to} (running ${fmt(cur.dep)}-${fmt(cur.arr)})`;
      trainInfo.innerHTML=`<strong>${tr.line}</strong> ${TYPE_LABEL[tr.type]||tr.type}<br>行き先: <strong>${tr.to}</strong><br>現在: ${loc}`;
      updateFollowUI();
      updateAnnouncement(tr,cur);
    }

    function renderTrains(at){
      if(at<SERVICE_START||at>LAST_SERVICE_MIN){
        statusInfo.innerHTML='<span class="warn">Out of service (first 05:45 to last-train arrival).</span>';
        trainLayer.innerHTML="";
        trainNodes.clear();
        trainInfo.textContent="現在時刻では運行していません。";
        updateAnnouncement(null,null);
        return;
      }

      const active=[];
      for(const tr of trains){
        const lineOk=Array.isArray(tr.lines)?tr.lines.some(ln=>visibleLine(ln)):visibleLine(tr.line);
        if(!lineOk) continue;
        if(followOnly && followedTrainId && tr.id!==followedTrainId) continue;
        const p=posOf(tr,at);
        if(p) active.push({tr,p});
      }
      statusInfo.textContent=`運行中列車: ${active.length} 本`;

      const activeIds=new Set(active.map(a=>a.tr.id));
      for(const [id,node] of trainNodes.entries()){
        if(!activeIds.has(id)){
          node.remove();
          trainNodes.delete(id);
        }
      }

      for(const {tr,p} of active){
        let node=trainNodes.get(tr.id);
        if(!node){
          node=document.createElement("button");
          node.type="button";
          node.className="train";
          node.style.background=tr.color;
          node.title=`${tr.line} ${TYPE_LABEL[tr.type]||tr.type} ${tr.to}`;
          node.addEventListener("pointerdown",(ev)=>{
            ev.preventDefault();
            ev.stopPropagation();
            const t=(typeof simMinute==="number")?simMinute:at;
            selectTrain(tr,t);
            renderTrains(t);
          });
          trainLayer.appendChild(node);
          trainNodes.set(tr.id,node);
        }
        node.style.left=`${p.x}px`;
        node.style.top=`${p.y}px`;
        node.classList.toggle("selected", !!(selectedTrain&&selectedTrain.id===tr.id));
      }

      if(selectedTrain && !activeIds.has(selectedTrain.id)){
        trainInfo.textContent="選択中の列車はこの時刻では運行していません。";
      }

      if(followOnly && followedTrainId){
        const f=active.find(a=>a.tr.id===followedTrainId);
        if(f){
          centerOnMap(f.p.x,f.p.y);
          updateAnnouncement(f.tr,f.p);
          if(!selectedTrain || selectedTrain.id!==followedTrainId){
            selectTrain(f.tr,at);
          }
        }else{
          updateAnnouncement(null,null);
        }
      }else if(selectedTrain){
        const s=active.find(a=>a.tr.id===selectedTrain.id);
        updateAnnouncement(s?.tr||null,s?.p||null);
      }else{
        updateAnnouncement(null,null);
      }
    }

    function updateClock(at){
      if(modeSelect.value==="realtime"&&simSpeed===1&&!isPaused){ const n=new Date(); const f=(x)=>String(x).padStart(2,"0"); clockText.textContent=`現在時刻: ${n.getFullYear()}-${f(n.getMonth()+1)}-${f(n.getDate())} ${f(n.getHours())}:${f(n.getMinutes())}:${f(n.getSeconds())}`; return; }
      clockText.textContent=`表示時刻: ${fmt(at)}（${simSpeed}倍${isPaused?"・停止中":""}）`;
    }

    function renderStatic(){ renderLegend(); refreshInfo(); renderStations(); updateFollowUI(); }
    function renderTick(fixedMinute){ const t=(typeof fixedMinute==="number")?fixedMinute:stepSimClock(); updateClock(t); renderTrains(t); }

    modeSelect.addEventListener("change",()=>{
      manualTime.disabled=modeSelect.value!=="manual";
      selectedTrain=null;
      followOnly=false;
      followedTrainId=null;
      announceEnabled=false;
      if(announceToggle) announceToggle.checked=false;
      resetSimClock();
      renderStatic();
      renderTick(simMinute);
    });
    manualTime.addEventListener("input",()=>{ if(modeSelect.value==="manual"){ resetSimClock(); renderTick(simMinute); } });
    lineFilter.addEventListener("change",()=>{
      activeLine=lineFilter.value;
      selectedStation=null;
      selectedTrain=null;
      followOnly=false;
      followedTrainId=null;
      announceEnabled=false;
      if(announceToggle) announceToggle.checked=false;
      renderStatic();
      renderTick();
    });
    if(followTrainBtn){
      followTrainBtn.addEventListener("click",()=>{
        if(!selectedTrain) return;
        if(followOnly && followedTrainId===selectedTrain.id){
          followOnly=false;
          followedTrainId=null;
          announceEnabled=false;
          if(announceToggle) announceToggle.checked=false;
        } else {
          followOnly=true;
          followedTrainId=selectedTrain.id;
        }
        updateFollowUI();
        renderTick(simMinute);
      });
    }
    if(announceToggle){
      announceToggle.addEventListener("change",()=>{
        announceEnabled = !!announceToggle.checked;
        renderTick((typeof simMinute==="number")?simMinute:inputMinute());
      });
    }
    if(reloadBtn){
      reloadBtn.addEventListener("click",()=>{
        const t=(typeof simMinute==="number")?simMinute:inputMinute();
        simLastMs=performance.now();
        renderTick(t);
      });
    }
    if(stationNameToggle){
      stationNameToggle.addEventListener("change",()=>{
        showStationNames = stationNameToggle.value!=="off";
        renderStations();
      });
    }
    speedSelect.addEventListener("change",()=>{ simSpeed=Number(speedSelect.value||"1"); simLastMs=performance.now(); renderTick((typeof simMinute==="number")?simMinute:inputMinute()); });
    pauseBtn.addEventListener("click",()=>{ isPaused=!isPaused; pauseBtn.textContent=isPaused?"再開":"一時停止"; if(!isPaused){ resetSimClock(); renderTick(simMinute); } else { updateClock(simMinute ?? inputMinute()); } });

    renderLineFilter();
    activeLine="all"; lineFilter.value="all";
    if(stationNameToggle) stationNameToggle.value="on";
    showStationNames=true;
    simSpeed=Number(speedSelect.value||"1");
    resetSimClock();
    renderStatic();
    renderTick(simMinute);
    clampPan(); applyTransform();
    setInterval(()=>{ if(!isPaused) renderTick(); }, 450);
  