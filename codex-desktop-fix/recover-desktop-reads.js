(()=>{
// Reversible renderer workaround for lost READ replies in desktop build 26.928.1915.0.
// Keep original IDs and parameters; never replay a turn, command, write, or lock.
const marker=Symbol.for('codex.startupRepair.desktopReads');
if(window[marker])return {installed:true,alreadyInstalled:true};
const rpcReads=new Set(['config/read','configRequirements/read','model/list',
 'collaborationMode/list','permissionProfile/list','app/installed',
 'thread/attachment/list','thread/list','account/read']);
const localReads=new Set(['codex-home','get-global-state','get-configuration',
 'get-setting','get-settings','locale-info','workspace-root-options',
 'git-origins','codex-command-keymap-state','inbox-items','list-automations']);
const state={version:1,pending:new Map(),retried:0,completed:0,errors:0,
 recent:[],busy:false,module:null};
window[marker]=state;
function record(type,payload,at=Date.now()){
 let id;
 if(type==='fetch'&&payload?.method==='POST'&&
    payload.url?.startsWith('vscode://codex/')&&
    localReads.has(payload.url.slice('vscode://codex/'.length)))id=payload.requestId;
 if(type==='mcp-request'&&['local','durable'].includes(payload?.hostId)&&
    rpcReads.has(payload?.request?.method))id=payload.request.id;
 if(typeof id!=='string'||state.pending.has(id))return;
 if(state.pending.size>=1000)return;
 state.pending.set(id,{type,payload,at,nextAt:at+30000,retries:0});
}
state.seed=record;
const capture=e=>{try{record(e.detail?.type,e.detail)}catch{state.errors++}};
window.addEventListener('codex-message-from-view',capture);
function registry(){
 const nodes=[];function walk(f){if(!f)return;nodes.push(f);walk(f.child);walk(f.sibling)}
 walk(window.__codexRoot?._internalRoot?.current);
 for(const f of nodes)for(const v of f.updateQueue?.memoCache?.data?.flat()??[])
  if(v&&typeof v==='object'&&'getImplForHostId' in v&&typeof v.getImplForHostId==='function')return v;
}
async function sweep(){
 if(state.busy)return;state.busy=true;
 try{
  if(!window.__codexRoot)return;
  if(!state.module){
   // Deliberately tied to the inspected build; fail closed if its internals change.
   state.module=await import('app://-/assets/app-shared-6472dfc83b38.js');
  }
  const fetchClient=state.module.XAt?.getInstance?.();
  const bus=state.module.uun?.getInstance?.();
  if(!(fetchClient?.pendingRequests instanceof Map)||!bus?.dispatchMessage)return;
  const reg=registry(),clients=new Map();
  if(reg)for(const host of ['local','durable']){
   const client=reg.getImplForHostId(host)?.requestClient;
   if(!(client?.requestPromises instanceof Map))continue;
   clients.set(host,client);
   // The serialized coalescing key retains exact parameters for reads sent
   // before this observer was installed.
   for(const [key,pending] of client.pendingConfigReadRequests??[]){
    if(pending.method!=='config/read'||pending.startedAtMs==null)continue;
    const id=[...client.requestPromises].find(([,v])=>v===pending)?.[0];
    if(!id)continue;
    const {params}=JSON.parse(key);
    record('mcp-request',{hostId:host,request:{id,method:'config/read',params},
     priority:pending.priority,source:pending.source},pending.queuedAtMs);
   }
  }
  for(const [id,item] of state.pending){
   const client=item.type==='fetch'?fetchClient:clients.get(item.payload.hostId);
   if(!client)continue;
   const pending=(item.type==='fetch'?client.pendingRequests:client.requestPromises).has(id);
   if(!pending){state.pending.delete(id);state.completed++;continue;}
   if(Date.now()<item.nextAt||item.retries>=3)continue;
   item.retries++;item.nextAt=Date.now()+30000*2**item.retries;
   const payload={...item.payload};
   if(item.type==='mcp-request'){
    delete payload.expiresAtMs;
    payload.priority='interactive';
    payload.dispatchedAtMs=Date.now();
    client.dispatchMessage(item.type,payload);
   }else bus.dispatchMessage(item.type,payload);
   state.retried++;
   state.recent.push({at:Date.now(),method:item.type==='fetch'?
    payload.url.slice('vscode://codex/'.length):payload.request.method,attempt:item.retries});
   if(state.recent.length>30)state.recent.shift();
  }
 }catch{state.errors++;}finally{state.busy=false;}
}
state.sweep=sweep;
state.timer=setInterval(sweep,10000);
state.stop=()=>{clearInterval(state.timer);window.removeEventListener('codex-message-from-view',capture);state.pending.clear();delete window[marker]};
const old=window[Symbol.for('codex.startupRepair.configReads')];
if(old?.timer)clearInterval(old.timer);
void sweep();
return {installed:true,version:state.version};
})()
