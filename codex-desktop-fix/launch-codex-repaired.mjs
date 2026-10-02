import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {seedDesktopReads} from './seed-desktop-reads.mjs';

// Retry Codex's own initialization snapshot if its initial host notification is missed.
// Uses an inherited pipe, with no TCP debugging listener or modifications to app files.
const app=process.argv[2];
if(!app||!fs.existsSync(app)) throw Error('Installed Codex executable not found');
const logPath=path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1')),'startup-repair.log');
const log=message=>fs.appendFileSync(logPath,`${new Date().toISOString()} ${message}\n`);
const recoverDesktopReads=fs.readFileSync(new URL('./recover-desktop-reads.js',import.meta.url),'utf8');
const child=spawn(app,['--remote-debugging-pipe'],{stdio:['ignore','ignore','ignore','pipe','pipe'],windowsHide:false});
let nextId=0,buffer='',finished=false;
const requests=new Map();
log(`Launched desktop PID ${child.pid}`);
function cleanup(){if(finished)return;finished=true;for(const p of requests.values()){clearTimeout(p.timer);p.reject(Error('Desktop closed'));}requests.clear();}
child.on('exit',code=>{log(`Desktop exited (${code})`);cleanup();process.exitCode=0;});
child.on('error',error=>{log(`Launch error: ${error.message}`);cleanup();});
child.stdio[3].on('error',()=>cleanup());
child.stdio[4].on('error',()=>cleanup());
child.stdio[4].on('data',data=>{
  buffer+=data.toString();let index;
  while((index=buffer.indexOf('\0'))>=0){
    const raw=buffer.slice(0,index);buffer=buffer.slice(index+1);
    let message;try{message=JSON.parse(raw)}catch{continue}
    const request=requests.get(message.id);if(!request)continue;
    clearTimeout(request.timer);requests.delete(message.id);
    message.error?request.reject(Error(message.error.message)):request.resolve(message.result);
  }
});
function send(method,params={},sessionId){return new Promise((resolve,reject)=>{
  if(finished)return reject(Error('Desktop closed'));
  const id=++nextId;
  const timer=setTimeout(()=>{requests.delete(id);reject(Error(`${method} timed out`));},10000);
  requests.set(id,{resolve,reject,timer});
  child.stdio[3].write(JSON.stringify({id,method,params,...sessionId?{sessionId}:{}})+'\0');
});}
const delay=ms=>new Promise(resolve=>{const timer=setTimeout(resolve,ms);timer.unref();});
const probe=`(()=>({ready:document.querySelector('[aria-label="Hide sidebar"]')!==null||document.querySelector('[aria-label="Show sidebar"]')!==null,loading:document.querySelector('[class*="delayedBlossom"]')!==null,bridge:typeof window.electronBridge?.sendMessageFromView==='function'}))()`;
const refreshStalledModels=`(async()=>{
 const nodes=[];function walk(f){if(!f)return;nodes.push(f);walk(f.child);walk(f.sibling)}walk(window.__codexRoot?._internalRoot?.current);
 const qc=nodes.find(f=>f.memoizedProps?.queryClient)?.memoizedProps.queryClient;
 const q=qc?.getQueryCache().getAll().find(q=>q.queryKey[0]==='models'&&q.queryKey[2]==='local'&&q.state.status==='pending'&&q.state.fetchStatus==='fetching');
 if(!q)return {needed:false};
 await qc.cancelQueries({queryKey:q.queryKey,exact:true});
 return await Promise.race([qc.refetchQueries({queryKey:q.queryKey,exact:true}).then(()=>({needed:true,status:q.state.status,count:q.state.data?.data?.length})),new Promise(resolve=>setTimeout(()=>resolve({needed:true,status:'pending'}),8000))]);
})()`;
async function repair(){
  await delay(500);let sessionId,attempts=0,lastAttempt=0;
  const earliestSnapshot=Date.now()+7500;
  const deadline=Date.now()+105000;
  try{
    while(!finished&&Date.now()<deadline){
      if(!sessionId){
        const {targetInfos}=await send('Target.getTargets');
        const target=targetInfos.find(t=>t.type==='page'&&t.url==='app://-/index.html');
        if(!target){await delay(500);continue;}
        ({sessionId}=await send('Target.attachToTarget',{targetId:target.targetId,flatten:true}));
        await send('Page.addScriptToEvaluateOnNewDocument',{source:recoverDesktopReads},sessionId);
        const recovery=await send('Runtime.evaluate',{expression:recoverDesktopReads,returnByValue:true},sessionId);
        if(recovery.result?.value?.installed)log('Installed desktop read recovery before startup handshake');
      }
      const result=await send('Runtime.evaluate',{expression:probe,returnByValue:true},sessionId);
      const state=result.result?.value;
      if(state?.ready){
        log(`Verified main interface ready; snapshot retries=${attempts}`);
        try{log(`Inspected ${await seedDesktopReads(send,sessionId)} early pending desktop reads`);}
        catch(error){log(`Early-read inspection unavailable: ${error.message}`);}
        // A model/list request sent during the missed handshake may also be stranded.
        // Give ordinary catalog requests time to finish, then retry only a pending read.
        await delay(3000);
        const models=await send('Runtime.evaluate',{expression:refreshStalledModels,awaitPromise:true,returnByValue:true},sessionId);
        if(models.result?.value?.needed)log(`Retried stalled model catalog: ${models.result.value.status}`);
        if(process.argv.includes('--capture')){
          const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},sessionId);
          fs.writeFileSync(path.join(path.dirname(logPath),'startup-repair-verified.png'),Buffer.from(image.data,'base64'));
          log('Saved diagnostic screenshot');
        }
        return;
      }
      if(state?.loading&&state.bridge&&attempts<4&&Date.now()>=earliestSnapshot&&Date.now()-lastAttempt>10000){
        await send('Runtime.evaluate',{expression:`window.electronBridge.sendMessageFromView({type:'ready',initializationOnly:true}).then(()=>true)`,awaitPromise:true,returnByValue:true},sessionId);
        attempts++;lastAttempt=Date.now();log(`Requested initialization snapshot (${attempts})`);
      }
      await delay(2000);
    }
    if(!finished)log('Startup did not reach the main interface within the repair deadline');
  }catch(error){if(!finished)log(`Repair diagnostic: ${error.message}`);}
  finally{if(sessionId&&!finished)await send('Target.detachFromTarget',{sessionId}).catch(()=>{});}
}
repair();
// Chromium owns these inherited pipes for its lifetime. Keep them open after detaching.
