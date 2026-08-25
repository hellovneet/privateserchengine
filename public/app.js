const form=document.getElementById("searchForm"),input=document.getElementById("query");
const results=document.getElementById("results"),status=document.getElementById("status");
const clock=document.getElementById("clock");

setInterval(()=>{clock.textContent=new Date().toLocaleTimeString([], {hour12:false})},1000);

document.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>{
  input.value=b.dataset.q; form.requestSubmit();
}));

form.addEventListener("submit",async e=>{
 e.preventDefault(); const q=input.value.trim();
 if(!q){status.textContent="EMPTY_QUERY";return}
 status.textContent="SEARCHING…"; results.innerHTML='<div class="boot"><div>&gt; resolving query...</div><div>&gt; contacting search gateway...</div></div>';
 try{
   const r=await fetch("/api/search?q="+encodeURIComponent(q)),d=await r.json();
   if(!r.ok)throw new Error(d.error||"Search failed");
   status.textContent=d.warning ? "FALLBACK" : `FOUND_${d.results.length}`;
   if(!d.results.length){results.innerHTML='<div class="empty">&gt; no matching nodes found.</div>';return}
   results.innerHTML="";
   if(d.warning){
     const note=document.createElement("div");
     note.className="boot";
     note.textContent="> gateway fallback: direct search link provided.";
     results.append(note);
   }
   d.results.forEach((x,i)=>{
     const el=document.createElement("article");el.className="result";el.style.animationDelay=(i*25)+"ms";
     const h=document.createElement("h2"),a=document.createElement("a");
     a.href=x.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=x.title||"Untitled";
     h.innerHTML=`<span class="num">[${String(i+1).padStart(2,"0")}]</span>`;h.append(a);
     const u=document.createElement("div");u.className="url";u.textContent=x.url;
     const p=document.createElement("p");p.textContent=x.snippet||"No description available.";
     el.append(h,u,p);results.append(el);
   });
 }catch(err){status.textContent="ERROR";results.innerHTML=`<div class="error">&gt; ${escapeHtml(err.message)}</div>`}
});
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

const canvas=document.getElementById("matrix"),ctx=canvas.getContext("2d");
let w,h,cols,drops;
function resize(){w=canvas.width=innerWidth;h=canvas.height=innerHeight;cols=Math.floor(w/15);drops=Array(cols).fill(0).map(()=>Math.random()*h/15)}
resize();addEventListener("resize",resize);
setInterval(()=>{
 ctx.fillStyle="rgba(5,8,7,.18)";ctx.fillRect(0,0,w,h);ctx.fillStyle="#35d979";ctx.font="12px monospace";
 drops.forEach((y,i)=>{ctx.fillText(Math.random()>.5?"1":"0",i*15,y*15);drops[i]=y*15>h&&Math.random()>.975?0:y+1});
},65);