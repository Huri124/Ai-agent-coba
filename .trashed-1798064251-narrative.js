const SYSTEM = `Kamu adalah editor naskah anime recap berbahasa Indonesia.
Jadikan transkrip/ringkasan yang diberikan sebagai satu-satunya sumber fakta.
WAJIB: pertahankan urutan kejadian dan informasi penting; jangan mengarang adegan, dialog, motif, atau sebab-akibat; jangan menghilangkan kejadian penting; rapikan kalimat dan penghubung agar enak didengar; gunakan bahasa Indonesia santai, natural, seperti bercerita kepada teman; jangan terlalu formal, kaku, atau dramatis; hindari pengulangan; buat paragraf pendek.
Untuk judul proyek yang memiliki chapter, pertahankan penanda CHAPTER bila ada. Jangan gunakan kata 'adegan' atau 'panel' dalam narasi.
Jika informasi sumber tidak jelas, jangan menebak. Tandai bagian yang perlu konfirmasi secara singkat. Akhiri dengan 3 saran judul yang sesuai isi cerita.`;

export async function onRequestOptions() {
  return new Response(null,{status:204,headers:cors()});
}
export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY && !env.OPENROUTER_API_KEY) {
    return Response.json({error:"Belum ada provider AI yang dikonfigurasi di Cloudflare."},{status:503,headers:cors()});
  }
  let body;
  try { body = await request.json(); } catch { return Response.json({error:"Format permintaan tidak valid."},{status:400,headers:cors()}); }
  const source=String(body.source||"").trim();
  if(source.length<30) return Response.json({error:"Sumber cerita terlalu pendek. Tempel transkrip/ringkasan yang lebih lengkap."},{status:400,headers:cors()});
  if(source.length>60000) return Response.json({error:"Sumber terlalu panjang untuk tahap ini. Bagi menjadi beberapa bagian."},{status:413,headers:cors()});
  const format=body.format==="short"?"Buat versi Shorts yang ringkas, sekitar 20–60 detik, tanpa mengubah urutan inti.":body.format==="both"?"Buat dua bagian: versi Shorts dan versi video panjang.": "Buat narasi video panjang yang mengalir dan tetap setia pada sumber.";
  const style=body.style==="neutral"?"Gunakan bahasa Indonesia natural dan netral.":"Gunakan bahasa Indonesia santai/tongkrongan yang tetap jelas.";
  const prompt=`Judul proyek: ${String(body.project||"Anime recap")}\nInstruksi format: ${format}\nPreferensi bahasa: ${style}\n\nSUMBER CERITA:\n${source}\n\nTulis naskah final berdasarkan sumber di atas.`;
  const providers=[];
  if(env.GEMINI_API_KEY) providers.push(()=>gemini(env,prompt));
  if(env.OPENROUTER_API_KEY) providers.push(()=>openrouter(env,prompt));
  const failures=[];
  for(const call of providers){
    try{
      const result=await call();
      return Response.json({status:"completed",provider:result.provider,model:result.model,output:result.output},{headers:cors()});
    }catch(e){
      failures.push(String(e.message||e));
      if(!isQuotaError(e)) break;
    }
  }
  const exhausted=failures.length>0 && failures.every(x=>/429|quota|rate.?limit|resource.?exhausted|credits|insufficient/i.test(x));
  if(exhausted) return Response.json({status:"queued",message:"Kuota gratis habis. Tidak ada layanan berbayar yang dipanggil.",providers:failures},{status:202,headers:cors()});
  return Response.json({error:"Semua provider gagal. Periksa konfigurasi atau coba lagi.",details:failures},{status:502,headers:cors()});
}
async function gemini(env,prompt){
 const model=env.GEMINI_MODEL||"gemini-2.5-flash";
 const url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
 const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:SYSTEM}]},contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:0.55,maxOutputTokens:8192}})});
 const j=await r.json();
 if(!r.ok) throw new Error(`Gemini ${r.status}: ${j.error?.message||"request failed"}`);
 const output=(j.candidates||[]).flatMap(c=>c.content?.parts||[]).map(p=>p.text||"").join("\n").trim();
 if(!output) throw new Error("Gemini mengembalikan hasil kosong");
 return {provider:"Gemini",model,output};
}
async function openrouter(env,prompt){
 const model=env.OPENROUTER_MODEL||"google/gemini-2.0-flash-exp:free";
 const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{"Authorization":`Bearer ${env.OPENROUTER_API_KEY}`,"Content-Type":"application/json","HTTP-Referer":env.APP_URL||"https://anime-studio-ai.pages.dev","X-Title":"Anime Studio AI"},body:JSON.stringify({model,messages:[{role:"system",content:SYSTEM},{role:"user",content:prompt}],temperature:0.55,max_tokens:8192})});
 const j=await r.json();
 if(!r.ok) throw new Error(`OpenRouter ${r.status}: ${j.error?.message||"request failed"}`);
 const output=j.choices?.[0]?.message?.content||"";
 if(!output) throw new Error("OpenRouter mengembalikan hasil kosong");
 return {provider:"OpenRouter",model,output};
}
function isQuotaError(e){return /429|quota|rate.?limit|resource.?exhausted|credits|insufficient/i.test(String(e.message||e))}
function cors(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"}}
