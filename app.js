(() => {
  const $ = (id) => document.getElementById(id);
  const cfg = window.ENGLISH_CARDS_CONFIG || {};
  const state = { supabase: null, user: null, cards: [], mode: "login", currentQuiz: null, listenIndex: 0, listenRunning: false, favoriteIds: new Set() };

  function notice(message, type = "") {
    const el = $("notice");
    el.textContent = message;
    el.className = "notice show" + (type ? " " + type : "");
  }
  function clearNotice() { $("notice").textContent = ""; $("notice").className = "notice"; }
  function client() {
    if (state.supabase) return state.supabase;
    if (!cfg.supabaseUrl || !cfg.supabasePublishableKey ||
        cfg.supabaseUrl.includes("COLE_AQUI") || cfg.supabasePublishableKey.includes("COLE_AQUI")) {
      throw new Error("Falta configurar a URL e a chave publicável no arquivo js/config.js.");
    }
    if (!window.supabase?.createClient) throw new Error("Não foi possível carregar a biblioteca do Supabase. Verifique sua conexão.");
    state.supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
    return state.supabase;
  }
  function setMode(mode) {
    state.mode = mode;
    const signup = mode === "signup";
    $("loginTab").classList.toggle("active", !signup);
    $("signupTab").classList.toggle("active", signup);
    $("nameField").hidden = !signup;
    $("displayName").required = signup;
    $("password").autocomplete = signup ? "new-password" : "current-password";
    $("submitButton").textContent = signup ? "Criar minha conta" : "Entrar";
    $("formTitle").textContent = signup ? "Crie sua conta" : "Bem-vindo!";
    $("formDescription").textContent = signup ? "Crie seu espaço pessoal de vocabulário." : "Entre na sua conta para acessar seu vocabulário.";
    $("forgotButton").hidden = signup;
    clearNotice();
  }
  function showApp(user) {
    state.user = user;
    $("authLayout").hidden = true;
    $("appLayout").hidden = false;
    $("userGreeting").textContent = "Conectado como " + (user.email || "usuário");
    loadCards();
  }
  function showAuth() { $("authLayout").hidden = false; $("appLayout").hidden = true; }
  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function detectTarget(english, target) {
    if (target && target.trim()) return target.trim();
    return english.trim().replace(/[.!?]+$/, "");
  }
  function highlight(text, target) {
    const safe = escapeHtml(text);
    const safeTarget = escapeHtml(target);
    if (!safeTarget) return safe;
    const index = safe.toLowerCase().indexOf(safeTarget.toLowerCase());
    if (index < 0) return safe;
    return safe.slice(0,index) + "<mark>" + safe.slice(index,index+safeTarget.length) + "</mark>" + safe.slice(index+safeTarget.length);
  }
  function speak(text, lang = "en-US", rate = 0.9) {
    if (!("speechSynthesis" in window)) { alert("Este navegador não oferece áudio de voz."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang; utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }
  async function loadCards() {
    try {
      const c = client();
      const { data, error } = await c.from("vocabulary_cards").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      state.cards = data || [];
      const { data: favs, error: favError } = await c.from("card_favorites").select("card_id").eq("user_id", state.user.id);
      if (!favError) state.favoriteIds = new Set((favs || []).map(x => x.card_id));
      renderCards();
      renderVocabulary();
      prepareQuiz();
    } catch (e) {
      $("cardsEmpty").hidden = false;
      $("cardsEmpty").textContent = e.message + " Confirme também se as políticas de segurança (RLS) foram configuradas.";
    }
  }
  function renderCards() {
    const search = ($("cardSearch").value || "").toLowerCase().trim();
    const onlyFav = $("favoritesOnly").checked;
    const list = state.cards.filter(card => {
      const matches = [card.english,card.portuguese,card.category].some(v => (v || "").toLowerCase().includes(search));
      return matches && (!onlyFav || state.favoriteIds.has(card.id));
    });
    $("cardsList").innerHTML = list.map(card => `
      <article class="word-card">
        <div class="muted">${escapeHtml(card.category || "Geral")}</div>
        <h2>${highlight(card.english, detectTarget(card.english, card.target_phrase))}</h2>
        <div class="translation">${escapeHtml(card.portuguese || "")}</div>
        ${card.example1_en ? `<div class="example">${highlight(card.example1_en, detectTarget(card.english, card.target_phrase))}<small>${escapeHtml(card.example1_pt || "")}</small></div>` : ""}
        ${card.example2_en ? `<div class="example">${highlight(card.example2_en, detectTarget(card.english, card.target_phrase))}<small>${escapeHtml(card.example2_pt || "")}</small></div>` : ""}
        ${card.notes ? `<p class="muted">${escapeHtml(card.notes)}</p>` : ""}
        <div class="card-actions">
          <button class="small-button" data-speak="${escapeHtml(card.id)}">🔊 Ouvir inglês</button>
          <button class="small-button" data-fav="${escapeHtml(card.id)}">${state.favoriteIds.has(card.id) ? "⭐ Favorito" : "☆ Favoritar"}</button>
          <button class="small-button" data-rate="hard" data-id="${escapeHtml(card.id)}">Difícil</button>
          <button class="small-button" data-rate="good" data-id="${escapeHtml(card.id)}">Bom</button>
          <button class="small-button" data-rate="easy" data-id="${escapeHtml(card.id)}">Fácil</button>
          <button class="small-button" data-edit="${escapeHtml(card.id)}">Editar</button>
        </div>
      </article>`).join("");
    $("cardsEmpty").hidden = list.length > 0;
    if (!list.length) $("cardsEmpty").textContent = state.cards.length ? "Nenhum card corresponde à busca." : "Você ainda não tem cards. Clique em “Novo card” para adicionar sua primeira palavra.";
  }
  function renderVocabulary() {
    $("vocabularyList").innerHTML = state.cards.map(card => `<div class="vocabulary-row"><div><strong>${escapeHtml(card.english)}</strong> — ${escapeHtml(card.portuguese)}</div><div class="form-actions"><button class="small-button" data-edit="${escapeHtml(card.id)}">Editar</button><button class="small-button" data-delete="${escapeHtml(card.id)}">Excluir</button></div></div>`).join("");
  }
  function resetCardForm() {
    $("cardForm").reset(); $("cardForm").dataset.editId = ""; $("cardEditor").hidden = true;
  }
  function editCard(id) {
    const c = state.cards.find(x => x.id === id); if (!c) return;
    $("cardEditor").hidden = false; $("cardForm").dataset.editId = id;
    $("english").value = c.english || ""; $("portuguese").value = c.portuguese || "";
    $("targetPhrase").value = c.target_phrase || ""; $("category").value = c.category || "Geral";
    $("example1En").value = c.example1_en || ""; $("example1Pt").value = c.example1_pt || "";
    $("example2En").value = c.example2_en || ""; $("example2Pt").value = c.example2_pt || "";
    $("notes").value = c.notes || ""; $("english").focus();
  }
  async function saveCard(event) {
    event.preventDefault();
    try {
      const c = client(), editId = $("cardForm").dataset.editId;
      const english = $("english").value.trim();
      const payload = {
        owner_id: state.user.id, english, portuguese: $("portuguese").value.trim(),
        target_phrase: detectTarget(english, $("targetPhrase").value),
        category: $("category").value.trim() || "Geral",
        example1_en: $("example1En").value.trim(), example1_pt: $("example1Pt").value.trim(),
        example2_en: $("example2En").value.trim(), example2_pt: $("example2Pt").value.trim(),
        notes: $("notes").value.trim(), updated_at: new Date().toISOString()
      };
      const result = editId
        ? await c.from("vocabulary_cards").update(payload).eq("id", editId).eq("owner_id", state.user.id)
        : await c.from("vocabulary_cards").insert(payload);
      if (result.error) throw result.error;
      resetCardForm(); await loadCards();
    } catch (e) { alert("Não foi possível salvar: " + e.message); }
  }
  async function toggleFavorite(id) {
    try {
      const c = client();
      if (state.favoriteIds.has(id)) {
        const { error } = await c.from("card_favorites").delete().eq("card_id", id).eq("user_id", state.user.id);
        if (error) throw error; state.favoriteIds.delete(id);
      } else {
        const { error } = await c.from("card_favorites").insert({card_id:id,user_id:state.user.id});
        if (error) throw error; state.favoriteIds.add(id);
      }
      renderCards();
    } catch(e) { alert("Não foi possível atualizar o favorito: " + e.message); }
  }
  async function rateCard(id, rating) {
    try {
      const c = client();
      const hours = rating === "hard" ? 6 : rating === "good" ? 24*3 : 24*7;
      const next = new Date(Date.now() + hours*3600000).toISOString();
      const { error } = await c.from("card_reviews").insert({user_id:state.user.id,card_id:id,rating,next_review_at:next});
      if (error) throw error;
      alert(rating === "hard" ? "Vamos revisar esta palavra em cerca de 6 horas." : rating === "good" ? "Próxima revisão em cerca de 3 dias." : "Próxima revisão em cerca de 7 dias.");
    } catch(e) { alert("Não foi possível registrar a revisão: " + e.message); }
  }
  function prepareQuiz() {
    state.currentQuiz = state.cards.length ? state.cards[Math.floor(Math.random()*state.cards.length)] : null;
    $("quizQuestion").textContent = state.currentQuiz ? `Como você traduz “${state.currentQuiz.english}”?` : "Adicione pelo menos um card para começar.";
    $("quizAnswer").value = ""; $("quizFeedback").textContent = "";
  }
  function checkQuiz() {
    if (!state.currentQuiz) return;
    const expected = (state.currentQuiz.portuguese || "").trim().toLocaleLowerCase("pt-BR");
    const answer = $("quizAnswer").value.trim().toLocaleLowerCase("pt-BR");
    $("quizFeedback").textContent = answer === expected ? "Muito bem! Resposta correta. 🎉" : `Resposta esperada: ${state.currentQuiz.portuguese}`;
  }
  function speakCardSequence(card, includePt, rate, repetitions) {
    return new Promise(resolve => {
      const synth = window.speechSynthesis;
      const queue = [];
      for (let i=0;i<repetitions;i++) queue.push({text:card.english,lang:"en-US"});
      if (includePt && card.portuguese) queue.push({text:card.portuguese,lang:"pt-BR"});
      if (card.example1_en) { queue.push({text:card.example1_en,lang:"en-US"}); if(includePt&&card.example1_pt) queue.push({text:card.example1_pt,lang:"pt-BR"}); }
      if (card.example2_en) { queue.push({text:card.example2_en,lang:"en-US"}); if(includePt&&card.example2_pt) queue.push({text:card.example2_pt,lang:"pt-BR"}); }
      let i=0;
      const next=()=> {
        if (!state.listenRunning || i>=queue.length) { resolve(); return; }
        const item=queue[i++], utterance=new SpeechSynthesisUtterance(item.text);
        utterance.lang=item.lang; utterance.rate=rate; utterance.onend=()=>setTimeout(next,650); utterance.onerror=()=>setTimeout(next,300);
        synth.speak(utterance);
      };
      next();
    });
  }
  async function startListen() {
    if (!state.cards.length) { $("listenStatus").textContent="Adicione cards antes de iniciar."; return; }
    state.listenRunning=true; state.listenIndex=0; window.speechSynthesis.cancel();
    const includePt=$("speakPortuguese").checked, rate=Number($("listenSpeed").value), reps=Number($("repeatCount").value);
    $("playListen").disabled=true;
    while(state.listenRunning) {
      const card=state.cards[state.listenIndex % state.cards.length];
      $("listenStatus").textContent=`Ouvindo ${state.listenIndex+1} de ${state.cards.length}: ${card.english}`;
      await speakCardSequence(card,includePt,rate,reps);
      if (!state.listenRunning) break;
      state.listenIndex++;
      if(state.listenIndex>=state.cards.length) { state.listenRunning=false; $("listenStatus").textContent="Fim da lista. Você pode começar novamente."; break; }
    }
    $("playListen").disabled=false;
  }
  function csvEscape(value) { return '"' + String(value ?? "").replace(/"/g,'""') + '"'; }
  function exportCsv() {
    const cols=["english","portuguese","target_phrase","example1_en","example1_pt","example2_en","example2_pt","category","notes"];
    const rows=[cols.join(","),...state.cards.map(c=>cols.map(k=>csvEscape(c[k])).join(","))];
    const blob=new Blob(["\ufeff"+rows.join("\r\n")],{type:"text/csv;charset=utf-8;"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="english-cards-vocabulario.csv"; a.click(); URL.revokeObjectURL(a.href);
  }
  function parseCsv(text) {
    const rows=[]; let row=[], cell="", quoted=false;
    for(let i=0;i<text.length;i++){const ch=text[i],next=text[i+1];if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;}else if(ch==='"'){quoted=!quoted;}else if(ch===','&&!quoted){row.push(cell);cell="";}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell="";}else cell+=ch;}
    row.push(cell);if(row.some(v=>v.trim()))rows.push(row);return rows;
  }
  async function importCsv(file) {
    try {
      const rows=parseCsv((await file.text()).replace(/^\ufeff/,""));
      if(rows.length<2) throw new Error("O CSV não contém linhas de vocabulário.");
      const headers=rows[0].map(h=>h.trim().toLowerCase());
      const required=["english","portuguese"]; if(required.some(h=>!headers.includes(h))) throw new Error("Inclua as colunas english e portuguese no CSV.");
      const payload=rows.slice(1).map(row=>{const obj={};headers.forEach((h,i)=>obj[h]=row[i]||"");return {owner_id:state.user.id,english:(obj.english||"").trim(),portuguese:(obj.portuguese||"").trim(),target_phrase:detectTarget(obj.english||"",obj.target_phrase||""),example1_en:obj.example1_en||"",example1_pt:obj.example1_pt||"",example2_en:obj.example2_en||"",example2_pt:obj.example2_pt||"",category:obj.category||"Geral",notes:obj.notes||""};}).filter(x=>x.english&&x.portuguese);
      if(!payload.length) throw new Error("Nenhuma linha válida encontrada.");
      const {error}=await client().from("vocabulary_cards").insert(payload); if(error) throw error;
      alert(`${payload.length} cards importados.`); await loadCards();
    } catch(e){alert("Falha ao importar CSV: "+e.message);}
    finally{$("importCsv").value="";}
  }
  document.addEventListener("click", async event => {
    const nav=event.target.closest("[data-page]");
    if(nav){document.querySelectorAll(".nav-tab").forEach(b=>b.classList.toggle("active",b===nav));document.querySelectorAll(".page").forEach(p=>p.hidden=p.id!=="page-"+nav.dataset.page);}
    const fav=event.target.closest("[data-fav]"); if(fav) await toggleFavorite(fav.dataset.fav);
    const sp=event.target.closest("[data-speak]"); if(sp){const card=state.cards.find(c=>c.id===sp.dataset.speak);if(card)speak(card.english,"en-US",0.9);}
    const rate=event.target.closest("[data-rate]"); if(rate) await rateCard(rate.dataset.id,rate.dataset.rate);
    const edit=event.target.closest("[data-edit]"); if(edit){$("page-cards").hidden=false;document.querySelectorAll(".page").forEach(p=>p.hidden=p.id!=="page-cards");document.querySelectorAll(".nav-tab").forEach(b=>b.classList.toggle("active",b.dataset.page==="cards"));editCard(edit.dataset.edit);}
    const del=event.target.closest("[data-delete]"); if(del&&confirm("Excluir este card?")){const {error}=await client().from("vocabulary_cards").delete().eq("id",del.dataset.delete).eq("owner_id",state.user.id);if(error)alert(error.message);else await loadCards();}
  });
  $("loginTab").addEventListener("click",()=>setMode("login"));
  $("signupTab").addEventListener("click",()=>setMode("signup"));
  $("authForm").addEventListener("submit",async event=>{
    event.preventDefault();clearNotice();$("submitButton").disabled=true;
    try{
      const c=client();let result;
      if(state.mode==="signup"){
       result=await c.auth.signUp({
  email:$("email").value.trim(),
  password:$("password").value,
  options:{
    data:{display_name:$("displayName").value.trim()},
    emailRedirectTo:window.location.origin+window.location.pathname
  }
});
        if(result.error)throw result.error;
        if(result.data.session)showApp(result.data.user);else notice("Cadastro criado! Confira seu e-mail para confirmar a conta antes de entrar.","success");
      }else{
        result=await c.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
        if(result.error)throw result.error;showApp(result.data.user);
      }
    }catch(e){notice(e.message||"Não foi possível concluir a operação.","error");}
    finally{$("submitButton").disabled=false;}
  });
  $("forgotButton").addEventListener("click",async()=>{
    clearNotice();if(!$("email").value.trim()){notice("Digite seu e-mail primeiro.");$("email").focus();return;}
    try{const {error}=await client().auth.resetPasswordForEmail($("email").value.trim(),{redirectTo:location.origin+location.pathname});if(error)throw error;notice("Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.","success");}catch(e){notice(e.message,"error");}
  });
  $("logoutButton").addEventListener("click",async()=>{try{const {error}=await client().auth.signOut();if(error)throw error;state.user=null;showAuth();setMode("login");}catch(e){alert(e.message);}});
  $("newCardButton").addEventListener("click",()=>{$("cardEditor").hidden=false;$("cardForm").reset();$("cardForm").dataset.editId="";$("english").focus();});
  $("cancelCardButton").addEventListener("click",resetCardForm);
  $("cardForm").addEventListener("submit",saveCard);
  $("cardSearch").addEventListener("input",renderCards);$("favoritesOnly").addEventListener("change",renderCards);
  $("listenSpeed").addEventListener("input",()=>$("speedLabel").textContent=Number($("listenSpeed").value).toFixed(2)+"×");
  $("playListen").addEventListener("click",startListen);
  $("stopListen").addEventListener("click",()=>{state.listenRunning=false;window.speechSynthesis?.cancel();$("listenStatus").textContent="Reprodução parada."; $("playListen").disabled=false;});
  $("checkQuiz").addEventListener("click",checkQuiz);$("nextQuiz").addEventListener("click",prepareQuiz);
  $("exportCsv").addEventListener("click",exportCsv);$("importCsv").addEventListener("change",e=>{if(e.target.files[0])importCsv(e.target.files[0]);});
  (async()=>{
    try{const c=client();const {data:{session},error}=await c.auth.getSession();if(error)throw error;if(session)showApp(session.user);c.auth.onAuthStateChange((_event,s)=>{if(s)showApp(s.user);else showAuth();});}
    catch(e){console.info("English Cards: "+e.message);}
  })();
})();
