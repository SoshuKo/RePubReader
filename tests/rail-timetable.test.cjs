const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('地理/realtimemap.html','utf8');
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
const geometry=script.slice(script.indexOf('    const ST='),script.indexOf('    const stationLayer='));
const ctx=vm.createContext({});vm.runInContext(geometry+'\nthis.lines=lines;this.ST=ST;',ctx);
const enriched=ctx.lines.map(l=>({...l,points:l.stations.map(([name,mark,code])=>({name,mark,code,xy:ctx.ST[code]}))}));
const {build}=require('../地理/assets/js/rail-timetable.js');
const trains=build(enriched);
const trip=(id,start)=>trains.find(t=>t.id===id+'-'+start);
const at=(tr,code)=>tr.events.find(e=>e.code===code);
test('all events retain valid ordered timing and surveyed or labelled schematic coordinates',()=>{
  for(const t of trains){for(const [i,e] of t.events.entries()){
    assert.ok(e.xy&&e.xy.every(Number.isFinite),t.id);assert.ok(Number.isFinite(e.arr)&&e.dep>=e.arr,t.id);
    if(i)assert.ok(e.arr>=t.events[i-1].dep-1e-8,t.id+' '+e.code);
  }}
});
test('Tsapa meets at Kirago and preserves final train',()=>{
  const down=trip('tsapa-down',360),up=trip('tsapa-up',372);
  assert.deepEqual([at(down,'71').arr,at(down,'71').dep],[398,408]);
  assert.deepEqual([at(up,'71').arr,at(up,'71').dep],[399,408]);
  assert.equal(down.events.at(-1).arr,435);assert.equal(up.events.at(-1).arr,448);
  assert.equal(trip('tsapa-up',1332).events.at(-1).arr,1408);
  assert.equal(trains.filter(t=>t.id.startsWith('tsapa-down-')&&t.events[0].arr>=0&&t.events[0].arr<1440).length,9);
});
test('airport splitting, coupling and end-to-end timing',()=>{
  const down=trip('alinar-down',605),up=trip('alinar-up',610);
  assert.deepEqual([at(down,'53').arr,at(down,'53').dep],[684,690]);
  assert.deepEqual([at(up,'53').arr,at(up,'53').dep],[743,751]);
  assert.equal(down.events.at(-1).arr,823);assert.equal(up.events.at(-1).arr,830);
  assert.equal(trip('km-express-up',594).events.at(-1).arr%60,15);
});
test('explicit durations and international timetables',()=>{
  for(const [id,start,duration] of [['kirt-down',385,155],['seran-down',600,209],['km-local-down',600,235],['km-express-down',692,201],['brt-down',600,169],['brt-industrial-down',620,22],['metro1-down',600,47],['metro2-down',600,27]]){
    const tr=trip(id,start);assert.ok(tr,id);assert.ok(Math.abs(tr.events.at(-1).arr-start-duration)<1e-7,id);
  }
  const tr=trip('duram-down',600);assert.equal(at(tr,'0E').arr-at(tr,'05').dep,136);
  const intl=trip('intl-dulabay-out',540);assert.deepEqual([at(intl,'0E').arr,at(intl,'0E').dep],[675,678]);assert.equal(intl.events.at(-1).arr,733);
});
test('midnight copies preserve late arrivals and night freight',()=>{
  assert.equal(trip('brt-down',-150).events.at(-1).arr,19);
  assert.equal(trains.filter(t=>t.type==='freight'&&t.events[0].arr>=0&&t.events[0].arr<1440).length,4);
  assert.ok(trip('metro1-down',0)); assert.ok(trip('metro1-down',60));
});
test('urban day/rush slot counts',()=>{
  const count=(line,start,type)=>trains.filter(t=>t.line===line&&t.events[0].code==='20'&&t.events[0].arr>=start&&t.events[0].arr<start+60&&(!type||t.type===type)).length;
  assert.equal(count('ハヴァレイキ線',600),6);assert.equal(count('ハヴァレイキ線',420),10);
});
test('page initializes and controls work at mobile and desktop widths',()=>{
  for(const width of [320,390,768,1440]){
    const nodes=new Map();
    function element(){return {style:{setProperty(){}},classList:{add(){},toggle(){}},children:[],listeners:{},value:'',clientWidth:width-40,clientHeight:500,innerHTML:'',textContent:'',setAttribute(){},addEventListener(name,fn){this.listeners[name]=fn;},appendChild(node){this.children.push(node);},remove(){},getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};},setPointerCapture(){}};}
    const document={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element};
    document.getElementById('modeSelect').value='manual';document.getElementById('manualTime').value='10:00';
    const c=vm.createContext({document,window:{addEventListener(){}},Date,performance:{now:()=>0},setInterval(){},RailTimetable:{build}});
    vm.runInContext(script,c);
    assert.ok(nodes.get('trainLayer').children.length>0);
    vm.runInContext('this.testScale=scale;',c);assert.ok(c.testScale>0&&c.testScale<=1);
    nodes.get('lineFilter').value='ツァパ線';nodes.get('lineFilter').listeners.change();
    assert.ok(nodes.get('lineStatus').textContent.includes('ツァパ線'));
    nodes.get('zoomIn').listeners.click();nodes.get('zoomReset').listeners.click();
    nodes.get('manualTime').value='00:10';nodes.get('manualTime').listeners.input();
    assert.ok(nodes.get('clockText').textContent.includes('00:10'));
  }
});
