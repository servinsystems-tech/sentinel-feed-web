'use strict';
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navigation-links');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open');}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav?.classList.contains('open')){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');menu.focus();}});
const config=JSON.parse(document.querySelector('#checkout-config').textContent);
const status=document.querySelector('#checkout-status');
let paddlePromise;
function report(message){status.textContent=message;status.scrollIntoView({behavior:'smooth',block:'nearest'});}
function loadPaddle(){
 if(paddlePromise)return paddlePromise;
 paddlePromise=new Promise((resolve,reject)=>{
  const sdk=document.createElement('script');
  sdk.src='https://cdn.paddle.com/paddle/v2/paddle.js';
  const timer=setTimeout(()=>{sdk.onload=null;sdk.onerror=null;sdk.remove();reject(new Error('timeout'));},12000);
  sdk.onerror=()=>{clearTimeout(timer);sdk.remove();reject(new Error('load'));};
  sdk.onload=()=>{clearTimeout(timer);try{
   if(config.environment==='sandbox')window.Paddle.Environment.set('sandbox');
   window.Paddle.Initialize({token:config.token,checkout:{settings:{displayMode:'overlay',theme:'dark',locale:'en'}},eventCallback:event=>{
    if(event.name==='checkout.completed')report(config.environment==='sandbox'?'Test checkout completed. No real payment was made.':'Thank you. Paddle will send your receipt. Your subscription is picked up during the next scheduled sync.');
    if(event.name==='checkout.error')report('Checkout could not be completed. Please try again. For billing help, use Paddle support.');
   }});
   resolve(window.Paddle);
  }catch(error){reject(error);}};
  document.head.appendChild(sdk);
 });
 paddlePromise.catch(()=>{paddlePromise=undefined;});
 return paddlePromise;
}
function validEmail(value){
 return value.length<=254&&/^[a-z0-9._!#$%&'*+/=?^`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(value)&&!value.includes('..');
}
function validEndpoint(value){
 if(!/^https:\/\//i.test(value)||value.length>2048||value!==value.trim()||/[\s<>#]/.test(value))return false;
 try{
  const url=new URL(value);
  const host=url.hostname.replace(/\.$/,'').toLowerCase();
  if(url.protocol!=='https:'||url.username||url.password||value.split('/')[2]?.includes('@')||url.hash||url.port==='0')return false;
  if(/(^|\.)(localhost|local|internal|lan|home|test|invalid)$/.test(host))return false;
  return /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*$/.test(host)&&!url.pathname.startsWith('//');
 }catch{return false;}
}
async function openCheckout(plan,button,customData){
 const priceId=config.prices[plan];
 const validEnvironment=config.environment==='sandbox'?config.token.startsWith('test_'):config.environment==='production'&&config.token.startsWith('live_');
 if(!validEnvironment||!/^pri_[a-z0-9]+$/.test(priceId||'')){report('This plan is temporarily unavailable. Please check back soon.');return;}
 button.disabled=true;button.setAttribute('aria-busy','true');
 report(config.environment==='sandbox'?'Opening a test checkout. No real payment will be taken.':'Opening secure checkout…');
 try{
  const paddle=await loadPaddle();
  const checkout={items:[{priceId,quantity:1}]};
  if(customData)checkout.customData=customData;
  paddle.Checkout.open(checkout);
 }
 catch(error){report('Secure checkout could not load. Check your connection or browser blockers and try again.');}
 finally{button.disabled=false;button.removeAttribute('aria-busy');}
}
const teamForm=document.querySelector('#team-setup');
const enterpriseForm=document.querySelector('#enterprise-setup');
document.querySelectorAll('[data-plan]').forEach(button=>button.addEventListener('click',()=>{
 const plan=button.dataset.plan;
 if(plan==='personal'){openCheckout(plan,button);return;}
 teamForm.hidden=plan!=='team';
 enterpriseForm.hidden=plan!=='enterprise';
 const active=plan==='team'?teamForm:enterpriseForm;
 active.scrollIntoView({behavior:'smooth',block:'center'});
 active.querySelector('input').focus();
}));
teamForm.addEventListener('submit',event=>{
 event.preventDefault();
 const emails=[];
 for(const input of teamForm.querySelectorAll('input')){
  const email=input.value.trim().toLowerCase();
  if(email&&!validEmail(email)){report('Enter valid recipient email addresses before checkout.');input.focus();return;}
  if(email&&!emails.includes(email))emails.push(email);
 }
 if(emails.length>4){report('A Team can include at most four additional recipients.');return;}
 const customData={sentinelfeed_plan:'team'};
 emails.forEach((email,index)=>{customData[`team_email_${index+1}`]=email;});
 openCheckout('team',teamForm.querySelector('[type=submit]'),customData);
});
enterpriseForm.addEventListener('submit',event=>{
 event.preventDefault();
 const input=enterpriseForm.querySelector('input');
 const endpoint=input.value.trim();
 if(!validEndpoint(endpoint)){report('Enter a public HTTPS endpoint without credentials or a fragment.');input.focus();return;}
 openCheckout('enterprise',enterpriseForm.querySelector('[type=submit]'),{
  sentinelfeed_plan:'enterprise',data_stream_endpoint:endpoint,
 });
});
