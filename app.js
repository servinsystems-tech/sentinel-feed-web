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
document.querySelectorAll('[data-plan]').forEach(button=>button.addEventListener('click',async()=>{
 const priceId=config.prices[button.dataset.plan];
 const validEnvironment=config.environment==='sandbox'?config.token.startsWith('test_'):config.environment==='production'&&config.token.startsWith('live_');
 if(!validEnvironment||!/^pri_[a-z0-9]+$/.test(priceId||'')){report('This plan is temporarily unavailable. Please check back soon.');return;}
 button.disabled=true;button.setAttribute('aria-busy','true');
 report(config.environment==='sandbox'?'Opening a test checkout. No real payment will be taken.':'Opening secure checkout…');
 try{const paddle=await loadPaddle();paddle.Checkout.open({items:[{priceId,quantity:1}]});}
 catch(error){report('Secure checkout could not load. Check your connection or browser blockers and try again.');}
 finally{button.disabled=false;button.removeAttribute('aria-busy');}
}));
