/* Source: ../docs/カラベイ_鉄道ダイヤ.txt (2026-10-12).
 * Explicit timing is authoritative; unspecified intermediate times are estimates.
 * This is a timetable visualization, not a signalling/rolling-stock simulator.
 */
(function(root){
  'use strict';
  const peak=m=>(m>=360&&m<540)||(m>=1020&&m<1200);
  function departures(first,last,slots,peakSlots=slots,period=60){
    const out=new Set([first,last]);
    for(let t=first;t<=last;t++) if((peak(t%1440)?peakSlots:slots).includes(t%period)) out.add(t);
    return [...out].sort((a,b)=>a-b);
  }
  function build(lines){
    const points=new Map(), edges=new Map(), specs=[];
    lines.forEach(l=>{
      l.points.forEach(p=>points.set(p.code,p));
      l.points.slice(1).forEach((p,i)=>{
        const s=l.segments[i], a=l.points[i].code;
        edges.set(a+'|'+p.code,s); edges.set(p.code+'|'+a,s);
      });
    });
    const route=(name,a,b)=>{
      const codes=lines.find(l=>l.name===name).points.map(p=>p.code);
      const i=codes.indexOf(a),j=codes.indexOf(b);
      if(i<0||j<0) throw Error('Unknown route '+name+' '+a+' '+b);
      return i<j?codes.slice(i,j+1):codes.slice(j,i+1).reverse();
    };
    function add(id,line,path,type,starts,extra={}){
      const l=lines.find(l=>l.name===line);
      specs.push({id,line,path,type,starts,color:l?.color||'#22C1E6',...extra});
    }
    function both(id,line,a,b,type,starts,extra={}){
      add(id+'-down',line,route(line,a,b),type,starts,extra);
      add(id+'-up',line,route(line,b,a),type,starts,extra);
    }
    const coastal='湾岸線', hav='ハヴァレイキ線', short='イラー=セラン短絡線 / KIRT', km='KMRTゴネイキ線', brt='デュラベイBRT';
    both('coast-north',coastal,'05','00','local',departures(300,1350,[5]),{});
    both('coast-north-extra',coastal,'05','01','local',departures(360,1195,[55]).filter(peak));
    both('coast-central',coastal,'05','0E','local',departures(300,1260,[10],[10,40]));
    both('coast-south',coastal,'0E','11','local',departures(300,1380,[20],[20,50]));
    const rapidStarts=departures(330,1320,[35]);
    rapidStarts.forEach(t=>both('coast-rapid-'+t,coastal,'0E',peak(t)||Math.floor(t/60)%2===0?'00':'01','rapid',[t]));
    const shortcut=route(short,'05','0E');
    const duramPath=[...route(coastal,'00','05'),...shortcut.slice(1),...route(coastal,'0E','11').slice(1)];
    add('duram-down',coastal,duramPath,'limited',departures(300,1200,[0]),{name:'ドゥラム',lines:[coastal,short],stopCodes:['00','01','04','05','0E','11'],dwell:{'05':3,'0E':3},anchors:{'05':[-3,0],'0E':[136,139]},relativeAnchor:'05'});
    add('duram-up',coastal,[...duramPath].reverse(),'limited',departures(300,1200,[0]),{name:'ドゥラム',lines:[coastal,short],stopCodes:['00','01','04','05','0E','11'],dwell:{'05':3,'0E':3},anchors:{'0E':[-3,0],'05':[136,139]},relativeAnchor:'0E'});
    both('seran','セラン線','0E','27','local',departures(330,1230,[0],[0,30]),{duration:209});
    both('kirt',short,'05','0E','local',departures(330,1290,[25]),{duration:155,dwell:{'53':2},name:'KIRT普通'});
    both('freight',short,'05','0E','freight',[30,90],{duration:190,stopCodes:['05','0E'],name:'夜間貨物'});
    both('magase',hav,'20','30','limited',departures(330,1080,[0]),{name:'マガセ',stopCodes:['20','05','24','27','29','30']});
    both('hav-semi',hav,'20','29','semi',departures(330,1380,[20],[12]));
    const havRapid=departures(330,1380,[40],[24]);
    havRapid.forEach(t=>both('hav-rapid-'+t,hav,'20',Math.floor(t/60)%2===0?'D0':'29','rapid',[t]));
    both('hav-local',hav,'20','29','local',departures(300,1380,[10],[6,30,48]));
    both('hav-maridia',hav,'20','22','local',departures(270,1470,[30,50],[18,42]));
    both('hav-ilaa-extra',hav,'20','05','local',departures(360,1194,[36,54]).filter(peak));
    both('mountain',hav,'29','30','local',departures(330,1200,[30],[30,90],120));
    both('border',hav,'30','34','local',departures(360,1200,[0],[0,60],120),{dwell:{'34':5}});
    add('intl-frikau-out',coastal,route(coastal,'05','00'),'intl',[480],{name:'フリカウ',stopCodes:['05','00'],anchors:{'05':[0,0],'00':[100,100]}});
    add('intl-frikau-in',coastal,route(coastal,'00','05'),'intl',[1070],{name:'フリカウ',stopCodes:['00','05'],anchors:{'00':[0,0],'05':[100,100]}});
    const intlPath=[...shortcut,...route(coastal,'0E','11').slice(1)];
    add('intl-dulabay-out',coastal,intlPath,'intl',[540,960],{name:'デュラベイ',lines:[coastal,short],stopCodes:['05','0E','11'],anchors:{'05':[0,0],'0E':[135,138],'11':[193,193]}});
    add('intl-dulabay-in',coastal,[...intlPath].reverse(),'intl',[600,1020],{name:'デュラベイ',lines:[coastal,short],stopCodes:['11','0E','05'],anchors:{'11':[0,0],'0E':[55,58],'05':[193,193]}});
    const airportPath=['20',...shortcut,...route(coastal,'0E','11').slice(1)];
    add('alinar-down', 'Á-Lĭnar',airportPath,'airport',departures(285,1260,[5]),{color:'#22C1E6',lines:[hav,short,coastal],stopCodes:['20','05','53','0E','0F','10','11'],anchors:{'20':[0,0],'05':[10,13],'53':[79,85],'0E':[150,153],'0F':[170,171],'10':[195,196],'11':[218,218]}});
    add('alinar-up','Á-Lĭnar',[...airportPath].reverse(),'airport',departures(285,1260,[10]),{color:'#22C1E6',lines:[coastal,short,hav],stopCodes:['20','05','53','0E','0F','10','11'],anchors:{'11':[0,0],'10':[22,23],'0F':[47,48],'0E':[65,68],'53':[133,141],'05':[207,210],'20':[220,220]}});
    both('km-local',km,'53','64','local',departures(300,1200,[0],[0,60],120),{duration:235});
    add('km-express-down',km,route(km,'53','64'),'rapid',departures(332,1172,[92],[32,92],120),{duration:201,stopCodes:['53','62','63','64'],name:'Á-Lĭnar接続急行'});
    add('km-express-up',km,route(km,'64','53'),'rapid',departures(354,1194,[114],[54,114],120),{duration:201,stopCodes:['53','62','63','64'],name:'Á-Lĭnar接続急行'});
    add('tsapa-down','ツァパ線',route('ツァパ線','0A','74'),'local',departures(360,1320,[0],[0],120),{anchors:{'0A':[0,0],'70':[22,23],'71':[38,48],'72':[58,60],'73':[66,67],'74':[75,75]}});
    add('tsapa-up','ツァパ線',route('ツァパ線','74','0A'),'local',departures(372,1332,[12],[12],120),{anchors:{'74':[0,0],'73':[8,9],'72':[15,17],'71':[27,36],'70':[52,53],'0A':[76,76]}});
    add('brt-down',brt,route(brt,'10','85'),'brt',departures(270,1290,[0],[0,30]),{anchors:{'10':[0,0],'80':[28,29],'81':[73,74],'82':[100,101],'83':[120,121],'63':[145,147],'84':[165,166],'85':[169,169]}});
    add('brt-up',brt,route(brt,'85','10'),'brt',departures(270,1290,[0],[0,30]),{anchors:{'85':[0,0],'84':[3,4],'63':[22,24],'83':[48,49],'82':[68,69],'81':[95,96],'80':[140,141],'10':[169,169]}});
    both('brt-industrial',brt,'63','85','brt',departures(240,1500,[20],[20,50]),{duration:22});
    for(const [line,id,first,last,day,rush] of [['地下鉄1号線','metro1',270,1500,5,3],['地下鉄2号線','metro2',300,1470,6,4]]){
      const starts=[];
      for(let m=first;m<=last;m++){
        const local=m%1440;
        const step=m>=1440?15:peak(local)?rush:local<360||local>=1200?10:day;
        const origin=m>=1440?1440:local>=1200?1200:local>=1020?1020:local>=540?540:local>=360?360:first;
        if((m-origin)%step===0||m===last) starts.push(m);
      }
      const l=lines.find(l=>l.name===line), path=l.points.map(p=>p.code);
      const anchors={}; let offset=0;
      path.forEach((c,i)=>{if(i)offset+=(id==='metro1'&&i===1?12:6);anchors[c]=[offset,offset+(i&&i<path.length-1?1:0)];if(i&&i<path.length-1)offset++;});
      add(id+'-down',line,path,'local',starts,{anchors});
      const reverse={}; path.forEach(c=>{const [a,d]=anchors[c];reverse[c]=[offset-d,offset-a];});
      add(id+'-up',line,[...path].reverse(),'local',starts,{anchors:reverse});
    }
    function make(s,start){
      const path=s.path.map(c=>points.get(c));
      if(path.some(p=>!p))throw Error('Missing station: '+s.id);
      const segs=path.slice(1).map((p,i)=>edges.get(path[i].code+'|'+p.code)||[5,null]);
      const stopCodes=s.stopCodes||path.filter((p,i)=>i===0||i===path.length-1||s.type==='local'||s.type==='brt'||p.mark==='hub'||(s.type==='rapid'&&p.mark==='rapid')||(s.type==='semi'&&p.mark==='semi')).map(p=>p.code);
      let t=0;
      const events=path.map((p,i)=>{
        const stop=stopCodes.includes(p.code);
        const dwell=s.dwell?.[p.code]??(['05','24','27'].includes(p.code)?3:p.mark==='hub'||p.mark==='rapid'?2:1);
        const slotDwell=s.line===hav&&i>0&&i<path.length-1&&['20','05','22','23','24','25','26','27','28','29'].includes(p.code);
        const arr=t,dep=arr+((stop||slotDwell)&&i>0&&i<path.length-1?dwell:0);
        if(i<segs.length){const speed=s.type==='freight'?105:s.type==='limited'||s.type==='intl'||s.type==='airport'?110:s.type==='rapid'?85:68;const urban=s.line===hav&&['20','05','22','23','24','25','26','27','28','29'].includes(p.code)&&['20','05','22','23','24','25','26','27','28','29'].includes(path[i+1].code);t=dep+segs[i][0]/(urban?66:s.line===hav?Math.min(speed,s.type==='limited'?99:66):speed)*60;}
        return {...p,arr,dep,stop};
      });
      if(s.duration){
        const totalDwell=events.reduce((n,e)=>n+e.dep-e.arr,0), factor=(s.duration-totalDwell)/(events.at(-1).arr-totalDwell);
        let at=0;
        events.forEach((e,i)=>{const dwell=e.dep-e.arr,run=i?e.arr-events[i-1]._dep:0; e._dep=e.dep;e.arr=at+run*factor;e.dep=e.arr+dwell;at=e.dep;});
        events.forEach(e=>delete e._dep);
      }
      if(s.anchors){
        const anchors=Object.entries(s.anchors).map(([code,time])=>({i:path.findIndex(p=>p.code===code),time})).sort((a,b)=>a.i-b.i);
        if(s.relativeAnchor){const a=events[anchors[0].i];const base=a.dep; anchors.forEach(a=>a.time=a.time.map(t=>t+base));}
        // Interpolate running time only; anchor arrivals/departures retain their exact dwell.
        for(let k=0;k<anchors.length-1;k++){
          const a=anchors[k],b=anchors[k+1];
          const weights=segs.slice(a.i,b.i).map(s=>s[0]); const sum=weights.reduce((a,b)=>a+b,0);
          let at=a.time[1];
          for(let i=a.i+1;i<b.i;i++){at+=(b.time[0]-a.time[1])*weights[i-a.i-1]/sum;events[i].arr=events[i].dep=at;events[i].stop=false;}
        }
        anchors.forEach(a=>{events[a.i].arr=a.time[0];events[a.i].dep=a.time[1];});
        const last=anchors.at(-1); if(last.i<events.length-1){let at=last.time[1];for(let i=last.i+1;i<events.length;i++){const run=segs[i-1][0]/110*60,dwell=events[i].dep-events[i].arr;events[i].arr=at+run;events[i].dep=events[i].arr+dwell;at=events[i].dep;}}
      }
      events.forEach(e=>{if(!e.stop)e.dep=e.arr;e.arr+=start;e.dep+=start;});
      return {id:s.id+'-'+start,line:s.line,name:s.name,color:s.color,type:s.type,lines:s.lines||[s.line],to:path.at(-1).name,events,segs,estimated:!s.anchors||!!s.relativeAnchor};
    }
    // Three calendar copies retain yesterday's late arrivals and tomorrow's midnight departures.
    return specs.flatMap(s=>s.starts.flatMap(start=>[-1440,0,1440].map(day=>make(s,start+day))));
  }
  root.RailTimetable={build,departures,peak};
  if(typeof module!=='undefined')module.exports=root.RailTimetable;
})(typeof globalThis!=='undefined'?globalThis:this);
