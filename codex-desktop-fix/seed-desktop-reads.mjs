// Recover the exact request envelopes for pending reads emitted before the
// renderer observer attached. Request bodies stay inside the renderer.
export async function seedDesktopReads(send,sessionId){
 const evaluated=await send('Runtime.evaluate',{expression:`(async()=>{
  const m=await import('app://-/assets/app-shared-6472dfc83b38.js');
  return [...m.XAt.getInstance().pendingRequests.values()].slice(0,100).map(v=>v.cleanup);
 })()`,awaitPromise:true},sessionId);
 if(!evaluated.result?.objectId)return 0;
 const properties=async objectId=>send('Runtime.getProperties',{objectId,ownProperties:true},sessionId);
 let inspected=0;
 try{
  const entries=await properties(evaluated.result.objectId);
  for(const entry of entries.result.filter(p=>/^\d+$/.test(p.name))){
   if(!entry.value?.objectId)continue;
   const fn=await properties(entry.value.objectId);
   const scopesId=fn.internalProperties?.find(p=>p.name==='[[Scopes]]')?.value?.objectId;
   if(!scopesId)continue;
   const scopes=await properties(scopesId);
   const scope=scopes.result.find(p=>p.value?.description==='Closure (sendRequest)');
   if(!scope?.value?.objectId)continue;
   const locals=await properties(scope.value.objectId);
   const request=locals.result.find(p=>p.name==='i')?.value;
   if(!request?.objectId)continue;
   await send('Runtime.callFunctionOn',{objectId:request.objectId,functionDeclaration:`function(){
    window[Symbol.for('codex.startupRepair.desktopReads')]?.seed('fetch',this);
    return true;
   }`,returnByValue:true},sessionId);
   inspected++;
  }
 }finally{await send('Runtime.releaseObject',{objectId:evaluated.result.objectId},sessionId).catch(()=>{});}
 return inspected;
}
