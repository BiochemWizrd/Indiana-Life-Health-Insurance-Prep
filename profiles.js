(function(){
'use strict';
const LEGACY='licenselab-indiana-life-health-2026-v1';
const LIST=LEGACY+'-profiles-v1';
const SESSION=LEGACY+'-active-tab-v1';
const PREFIX=LEGACY+'-user-';
let active=null;
const gate=document.getElementById('authGate');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function getProfiles(){
  try{const x=JSON.parse(localStorage.getItem(LIST)||'[]');return Array.isArray(x)?x.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.salt==='string'&&typeof p.hash==='string'):[]}
  catch(e){return []}
}
function hex(buffer){return Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('')}
async function passwordHash(password,salt){
  if(!window.crypto||!crypto.subtle)throw Error('Use a modern browser over HTTPS to access local profiles.');
  const enc=new TextEncoder();
  const bytes=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  const saltBytes=new Uint8Array((salt.match(/.{2}/g)||[]).map(x=>parseInt(x,16)));
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:saltBytes,iterations:180000,hash:'SHA-256'},bytes,256));
}
function setError(msg){
  const n=gate.querySelector('#authError');
  if(n){n.textContent=msg||'';n.hidden=!msg}
}
function reveal(p){
  active=p;
  try{sessionStorage.setItem(SESSION,p.id)}catch(e){}
  gate.hidden=true;
  document.body.classList.remove('profile-locked');
  if(typeof window.onLicenseLabProfileChange==='function')window.onLicenseLabProfileChange(p);
}
function logout(){
  active=null;
  try{sessionStorage.removeItem(SESSION)}catch(e){}
  if(typeof window.onLicenseLabProfileChange==='function')window.onLicenseLabProfileChange(null);
  document.body.classList.add('profile-locked');
  gate.hidden=false;
  show('login');
}
async function signIn(){
  const selector=gate.querySelector('#profileSelect');
  const code=gate.querySelector('#profileCode');
  const button=gate.querySelector('#authSubmit');
  const p=getProfiles().find(x=>x.id===selector?.value);
  if(!p||!code||!code.value){setError('Select a profile and enter its passcode.');return}
  button.disabled=true;button.textContent='Checking passcode...';
  try{
    if(await passwordHash(code.value,p.salt)!==p.hash){setError('Incorrect passcode. Try again.');return}
    reveal(p)
  }catch(e){setError(e.message||'Unable to sign in.')}
  finally{button.disabled=false;button.textContent='Sign in'}
}
async function register(){
  const name=gate.querySelector('#profileName')?.value.trim().replace(/\s+/g,' ');
  const code=gate.querySelector('#profileCode')?.value||'';
  const confirmCode=gate.querySelector('#profileConfirm')?.value||'';
  const button=gate.querySelector('#authSubmit');
  if(!name||name.length<2||name.length>40){setError('Enter a name between 2 and 40 characters.');return}
  if(code.length<6){setError('Choose a passcode of at least 6 characters.');return}
  if(code!==confirmCode){setError('The passcodes do not match.');return}
  const profiles=getProfiles();
  if(profiles.some(p=>p.name.toLowerCase()===name.toLowerCase())){setError('This name already exists on this browser. Sign in or use another name.');return}
  button.disabled=true;button.textContent='Creating profile...';
  try{
    const hadLegacy=profiles.length===0&&!!localStorage.getItem(LEGACY);
    const id=crypto.randomUUID?crypto.randomUUID():hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
    const salt=hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
    const hash=await passwordHash(code,salt);
    const p={id,name,salt,hash,createdAt:Date.now()};
    let existingData=null;
    if(hadLegacy&&confirm('Existing study progress was found in this browser. Copy it into '+name+"'s new profile? Your original saved data will remain as a backup.")){
      existingData=localStorage.getItem(LEGACY);
    }
    if(existingData)localStorage.setItem(PREFIX+id,existingData);
    localStorage.setItem(LIST,JSON.stringify([...profiles,p]));
    reveal(p)
  }catch(e){setError(e.message||'Unable to create profile. Check that browser storage is enabled.')}
  finally{button.disabled=false;button.textContent='Create profile'}
}
function show(mode){
  const profiles=getProfiles();
  if(!profiles.length)mode='register';
  const registerMode=mode==='register';
  gate.hidden=false;
  document.body.classList.add('profile-locked');
  let form;
  if(registerMode){
    form='<label for="profileName">Your name</label><input id="profileName" maxlength="40" minlength="2" required autocomplete="name" placeholder="e.g., Taylor" autofocus>'+
      '<label for="profileCode">Create a passcode</label><input id="profileCode" type="password" minlength="6" autocomplete="new-password" required placeholder="6 or more characters">'+
      '<label for="profileConfirm">Confirm passcode</label><input id="profileConfirm" type="password" minlength="6" autocomplete="new-password" required placeholder="Enter it again">'+
      '<button type="submit" id="authSubmit" class="auth-primary">Create profile</button>';
  }else{
    const opts=profiles.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');
    form='<label for="profileSelect">Choose your profile</label><select id="profileSelect" required>'+opts+'</select>'+
      '<label for="profileCode">Your passcode</label><input id="profileCode" type="password" autocomplete="current-password" required placeholder="Enter your passcode">'+
      '<button type="submit" id="authSubmit" class="auth-primary">Sign in</button>';
  }
  gate.innerHTML='<div class="auth-card" role="region" aria-label="Profile sign-in">'+
      '<div class="auth-logo">✦ &nbsp; LicenseLab <span>INDIANA</span></div>'+
      '<div class="auth-graphic">L<span>&amp;</span>H</div>'+
      '<p class="auth-eyebrow">INDIANA INSURANCE EXAM PREP</p>'+
      '<h1>'+(registerMode?'Create your study profile':'Welcome back')+'</h1>'+
      '<p class="auth-sub">'+(registerMode?'Your quizzes, mock exam scores, and missed questions will be saved under your own name.':'Sign in to continue your own study progress, separate from other profiles on this browser.')+'</p>'+
      '<form id="authForm">'+form+'<p id="authError" class="auth-error" role="alert" hidden></p></form>'+
      (profiles.length?'<button type="button" id="authSwitch" class="auth-link">'+(registerMode?'Already have a profile? Sign in':'New student? Create a profile')+'</button>':'')+
      '<p class="auth-limits">Profiles and passcodes are stored on this browser only. This is not a secure online account: progress does not sync across browsers or devices. Export your study backup regularly.</p>'+
      '</div>';
  gate.querySelector('#authForm').onsubmit=e=>{e.preventDefault();if(registerMode)register();else signIn()};
  const sw=gate.querySelector('#authSwitch');
  if(sw)sw.onclick=()=>show(registerMode?'login':'register');
  gate.querySelector('#profileCode')?.addEventListener('input',()=>setError(''));
}
function initialize(){
  let id=null;
  try{id=sessionStorage.getItem(SESSION)}catch(e){}
  const p=getProfiles().find(x=>x.id===id);
  if(p)reveal(p);else show('login');
}
window.LicenseLabProfiles={initialize,storageKey:()=>active?PREFIX+active.id:null,current:()=>active,signOut:logout,show};
})();