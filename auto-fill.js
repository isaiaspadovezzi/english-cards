/* English Cards — tradução, sugestões, revisão de inglês e exclusão rápida.
   Sem chave de API. Usa MyMemory para tradução e Datamuse/LanguageTool para sugestões,
   ambos serviços externos gratuitos sujeitos a limites/disponibilidade.
*/
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const phraseExamples = {
    "used to": [
      ["I used to live in Ireland.", "Eu morava na Irlanda (antes, mas não moro mais)."],
      ["I used to work at a hotel.", "Eu trabalhava em um hotel (antes, mas não trabalho mais)."]
    ],
    "i used to": [
      ["I used to live in Ireland.", "Eu morava na Irlanda (antes, mas não moro mais)."],
      ["I used to work at a hotel.", "Eu trabalhava em um hotel (antes, mas não trabalho mais)."]
    ],
    "get by": [
      ["I can get by with a little help.", "Consigo me virar com um pouco de ajuda."],
      ["She gets by on a small salary.", "Ela consegue se virar com um salário baixo."]
    ],
    "get by on my own": [
      ["I can get by on my own.", "Consigo me virar sozinho."],
      ["I learned how to get by on my own when I moved abroad.", "Aprendi a me virar sozinho quando me mudei para o exterior."]
    ],
    "give up": [
      ["Don't give up when English feels difficult.", "Não desista quando o inglês parecer difícil."],
      ["He gave up smoking last year.", "Ele parou de fumar no ano passado."]
    ],
    "look after": [
      ["I look after my nephew on Saturdays.", "Eu cuido do meu sobrinho aos sábados."],
      ["Can you look after my plants while I'm away?", "Você pode cuidar das minhas plantas enquanto eu estiver fora?"]
    ],
    "find out": [
      ["I need to find out what time the bus leaves.", "Preciso descobrir a que horas o ônibus sai."],
      ["She called the hotel to find out more information.", "Ela ligou para o hotel para descobrir mais informações."]
    ],
    "figure out": [
      ["I'm trying to figure out how this app works.", "Estou tentando entender como este aplicativo funciona."],
      ["We finally figured out the answer.", "Finalmente descobrimos a resposta."]
    ],
    "get along": [
      ["I get along well with my coworkers.", "Eu me dou bem com meus colegas de trabalho."],
      ["Do you get along with your neighbors?", "Você se dá bem com seus vizinhos?"]
    ],
    "run into": [
      ["I ran into an old friend at the supermarket.", "Encontrei um velho amigo por acaso no supermercado."],
      ["We ran into a problem during the trip.", "Tivemos um problema durante a viagem."]
    ],
    "take care of": [
      ["I need to take care of a few things today.", "Preciso resolver algumas coisas hoje."],
      ["She takes care of her grandmother.", "Ela cuida da avó."]
    ],
    "deal with": [
      ["I have to deal with a difficult situation.", "Tenho que lidar com uma situação difícil."],
      ["He knows how to deal with customer complaints.", "Ele sabe como lidar com reclamações de clientes."]
    ],
    "put off": [
      ["Don't put off your English practice.", "Não adie sua prática de inglês."],
      ["They put off the meeting until Friday.", "Eles adiaram a reunião para sexta-feira."]
    ],
    "carry on": [
      ["Please carry on with your work.", "Por favor, continue seu trabalho."],
      ["She carried on studying despite the noise.", "Ela continuou estudando apesar do barulho."]
    ],
    "come across": [
      ["I came across an interesting article yesterday.", "Encontrei um artigo interessante por acaso ontem."],
      ["He comes across as a very friendly person.", "Ele passa a impressão de ser uma pessoa muito simpática."]
    ],
    "get over": [
      ["It took me a week to get over the flu.", "Levei uma semana para me recuperar da gripe."],
      ["She's trying to get over her fear of speaking English.", "Ela está tentando superar o medo de falar inglês."]
    ],
    "work out": [
      ["I hope everything works out well.", "Espero que tudo dê certo."],
      ["We worked out a solution together.", "Encontramos uma solução juntos."]
    ],
    "turn out": [
      ["The party turned out to be great.", "A festa acabou sendo ótima."],
      ["It turned out that we were on the wrong bus.", "Acontece que estávamos no ônibus errado."]
    ],
    "bring up": [
      ["She brought up an important question.", "Ela levantou uma questão importante."],
      ["He doesn't like to bring up that subject.", "Ele não gosta de tocar nesse assunto."]
    ],
    "keep up": [
      ["It's hard to keep up with fast speakers.", "É difícil acompanhar pessoas que falam rápido."],
      ["Keep up the good work!", "Continue fazendo um bom trabalho!"]
    ],
    "set up": [
      ["I need to set up a new email account.", "Preciso configurar uma nova conta de e-mail."],
      ["They set up a meeting for Monday.", "Eles marcaram uma reunião para segunda-feira."]
    ],
    "go through": [
      ["Let's go through the instructions together.", "Vamos revisar as instruções juntos."],
      ["She's going through a difficult time.", "Ela está passando por um momento difícil."]
    ],
    "make up": [
      ["They made up after the argument.", "Eles fizeram as pazes depois da discussão."],
      ["He made up a funny story.", "Ele inventou uma história engraçada."]
    ],
    "perceive": [
      ["People may perceive the situation differently.", "As pessoas podem perceber a situação de maneiras diferentes."],
      ["I perceived a change in his attitude.", "Percebi uma mudança na atitude dele."]
    ],
    "disorganized": [
      ["My desk gets disorganized when I'm busy.", "Minha mesa fica desorganizada quando estou ocupado."],
      ["The notes were disorganized and hard to follow.", "As anotações estavam desorganizadas e difíceis de acompanhar."]
    ]
  };

  function ensureStatus() {
    const english = $("english");
    if (!english) return null;
    let status = $("autoToolsStatus");
    if (!status) {
      status = document.createElement("div");
      status.id = "autoToolsStatus";
      status.className = "muted";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.style.cssText = "font-size:13px;margin:8px 0;line-height:1.5";
      const field = english.closest(".field") || english.parentElement;
      field.appendChild(status);
    }
    return status;
  }

  function addStyle() {
    if ($("autoToolsStyle")) return;
    const style = document.createElement("style");
    style.id = "autoToolsStyle";
    style.textContent = `
      #english { spellcheck: true; }
      .ec-suggestions { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; }
      .ec-suggestion { border:1px solid #c7c9f5; background:#f4f4ff; color:#38388f; border-radius:8px; padding:6px 9px; cursor:pointer; font-size:13px; }
      .ec-warning { display:inline-block; color:#a16207; background:#fffbeb; border:1px solid #fde68a; padding:7px 9px; border-radius:8px; margin-top:6px; }
      .ec-delete { color:#b42318!important; border-color:#fecaca!important; }
      .ec-inline { margin-top:8px; }
      .ec-error { color:#b42318; }
    `;
    document.head.appendChild(style);
  }

  async function translate(text) {
    const url = "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(text) + "&langpair=en|pt-BR";
    const response = await fetch(url);
    if (!response.ok) throw new Error("O serviço de tradução está indisponível.");
    const data = await response.json();
    const result = data?.responseData?.translatedText;
    if (!result || Number(data?.responseStatus) >= 400) throw new Error("Não foi possível traduzir este texto agora.");
    return String(result).replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  }

  async function getSpellingSuggestions(text) {
    const words = text.trim().split(/\s+/);
    const last = words[words.length - 1] || "";
    if (!last || last.length < 3 || /[^a-zA-Z'-]/.test(last)) return [];
    const url = "https://api.datamuse.com/words?sp=" + encodeURIComponent(last) + "&max=5";
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.map(item => item.word).filter(word => word && word.toLowerCase() !== last.toLowerCase()).slice(0,5);
  }

  async function checkGrammar(text) {
    const body = new URLSearchParams({ text, language: "en-US" });
    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body
    });
    if (!response.ok) throw new Error("A correção gramatical está temporariamente indisponível.");
    const data = await response.json();
    return (data.matches || []).filter(match => match.replacements?.length).slice(0,5).map(match => ({
      message: match.message,
      context: match.context?.text || "",
      offset: match.offset,
      length: match.length,
      replacement: match.replacements[0].value
    }));
  }

  function applyReplacement(input, offset, length, replacement) {
    const old = input.value;
    input.value = old.slice(0, offset) + replacement + old.slice(offset + length);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }

  function ensureSuggestionsContainer() {
    let box = $("englishSuggestions");
    if (!box) {
      box = document.createElement("div");
      box.id = "englishSuggestions";
      box.className = "ec-suggestions";
      const english = $("english");
      (english.closest(".field") || english.parentElement).appendChild(box);
    }
    return box;
  }

  function renderWordSuggestions(words, currentText) {
    const box = ensureSuggestionsContainer();
    box.replaceChildren();
    if (!words.length) return;
    const input = $("english");
    const last = currentText.trim().split(/\s+/).pop();
    const prefixOffset = currentText.lastIndexOf(last);
    words.forEach(word => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ec-suggestion";
      button.textContent = "Usar: " + word;
      button.addEventListener("click", () => {
        const before = input.value.slice(0, prefixOffset);
        const after = input.value.slice(prefixOffset + last.length);
        input.value = before + word + after;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        box.replaceChildren();
        input.focus();
      });
      box.appendChild(button);
    });
  }

  function addGrammarResults(matches) {
    const box = ensureSuggestionsContainer();
    box.replaceChildren();
    if (!matches.length) {
      const status = ensureStatus();
      status.textContent = "A verificação não encontrou uma sugestão clara. Confira o sentido da frase antes de salvar.";
      return;
    }
    matches.forEach(match => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ec-suggestion";
      button.textContent = `Corrigir para: ${match.replacement}`;
      button.title = match.message;
      button.addEventListener("click", () => {
        applyReplacement($("english"), match.offset, match.length, match.replacement);
        box.replaceChildren();
        ensureStatus().textContent = "Sugestão aplicada. Confira a frase e gere novamente a tradução.";
      });
      box.appendChild(button);
    });
    ensureStatus().textContent = "Sugestões de revisão encontradas. Clique numa opção para aplicá-la.";
  }

  function chooseExamples(phrase) {
    const key = phrase.trim().toLowerCase().replace(/[.!?]+$/, "").replace(/\s+/g, " ");
    return phraseExamples[key] || null;
  }

  async function generate() {
    const english = $("english");
    const phrase = english?.value.trim();
    const status = ensureStatus();
    if (!phrase) {
      status.textContent = "Digite uma palavra ou expressão em inglês primeiro.";
      english?.focus();
      return;
    }
    const button = $("autoGenerateButton");
    if (button) { button.disabled = true; button.textContent = "⏳ Gerando…"; }
    status.textContent = "Buscando a tradução…";
    try {
      const meaning = await translate(phrase);
      $("portuguese").value = meaning;
      const examples = chooseExamples(phrase);
      if (examples) {
        $("example1En").value = examples[0][0];
        $("example1Pt").value = examples[0][1];
        $("example2En").value = examples[1][0];
        $("example2Pt").value = examples[1][1];
        status.textContent = "Tradução e exemplos específicos preenchidos. Confira se o significado corresponde ao contexto que você quer aprender.";
      } else {
        $("example1En").value = "";
        $("example1Pt").value = "";
        $("example2En").value = "";
        $("example2Pt").value = "";
        status.textContent = "Tradução preenchida. Não encontrei exemplos confiáveis para esta expressão na lista local; os campos de exemplo ficaram vazios para evitar frases artificiais. Use “Revisar inglês” para procurar correções e depois acrescente exemplos reais.";
      }
      if (!$("targetPhrase").value.trim()) $("targetPhrase").value = phrase;
    } catch (error) {
      status.textContent = (error?.message || "Não foi possível gerar a tradução.") + " O serviço gratuito pode ter limites. Você pode preencher os campos manualmente.";
    } finally {
      if (button) { button.disabled = false; button.textContent = "✨ Gerar tradução e exemplos (grátis)"; }
    }
  }

  async function reviewEnglish() {
    const phrase = $("english")?.value.trim();
    const status = ensureStatus();
    if (!phrase) { status.textContent = "Digite a palavra ou frase que deseja revisar."; return; }
    status.textContent = "Verificando a frase em inglês…";
    const button = $("reviewEnglishButton");
    if (button) button.disabled = true;
    try {
      const matches = await checkGrammar(phrase);
      addGrammarResults(matches);
    } catch (error) {
      status.textContent = (error?.message || "Não foi possível revisar a frase.") + " O navegador pode estar bloqueando o serviço ou o limite gratuito pode ter sido atingido.";
    } finally {
      if (button) button.disabled = false;
    }
  }

  function installEditorTools() {
    const english = $("english"), form = $("cardForm");
    if (!english || !form || $("autoGenerateButton")) return false;
    addStyle();
    english.setAttribute("spellcheck", "true");
    english.setAttribute("autocomplete", "off");

    const field = english.closest(".field") || english.parentElement;
    const generateButton = document.createElement("button");
    generateButton.type = "button";
    generateButton.id = "autoGenerateButton";
    generateButton.className = "secondary-button ec-inline";
    generateButton.style.width = "100%";
    generateButton.textContent = "✨ Gerar tradução e exemplos (grátis)";
    generateButton.addEventListener("click", generate);
    field.appendChild(generateButton);

    const reviewButton = document.createElement("button");
    reviewButton.type = "button";
    reviewButton.id = "reviewEnglishButton";
    reviewButton.className = "secondary-button ec-inline";
    reviewButton.style.width = "100%";
    reviewButton.textContent = "✓ Revisar inglês e sugerir correções";
    reviewButton.addEventListener("click", reviewEnglish);
    field.appendChild(reviewButton);

    let typingTimer = null;
    let lastSuggested = "";
    english.addEventListener("input", () => {
      clearTimeout(typingTimer);
      const text = english.value.trim();
      if (!text || text === lastSuggested) return;
      typingTimer = setTimeout(async () => {
        try {
          const suggestions = await getSpellingSuggestions(text);
          if (english.value.trim() === text && suggestions.length) {
            lastSuggested = text;
            renderWordSuggestions(suggestions, text);
          }
        } catch (_) { /* Sugestões são opcionais; não bloqueiam o formulário. */ }
      }, 500);
    });
    return true;
  }

  // Adiciona o botão excluir em cada card do grid; app.js já escuta [data-delete].
  function addDeleteButtons() {
    const list = $("cardsList");
    if (!list) return;
    list.querySelectorAll(".word-card").forEach(card => {
      if (card.querySelector("[data-delete]")) return;
      const edit = card.querySelector("[data-edit]");
      const id = edit?.getAttribute("data-edit");
      if (!id) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "small-button ec-delete";
      button.dataset.delete = id;
      button.textContent = "🗑 Excluir";
      button.setAttribute("aria-label", "Excluir este card");
      const actions = card.querySelector(".card-actions");
      if (actions) actions.appendChild(button);
    });
  }

  function start() {
    installEditorTools();
    addDeleteButtons();
    const list = $("cardsList");
    if (list && !list.dataset.deleteObserver) {
      const observer = new MutationObserver(addDeleteButtons);
      observer.observe(list, { childList: true, subtree: true });
      list.dataset.deleteObserver = "1";
    }
    const english = $("english");
    if (english && !english.dataset.autoToolsEditListener) {
      english.dataset.autoToolsEditListener = "1";
      english.addEventListener("input", () => {
        // Atualiza a expressão-chave somente se estiver vazia ou ainda igual ao valor anterior.
        if (!$("targetPhrase").value.trim()) $("targetPhrase").value = english.value.trim();
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  // app.js renders cards asynchronously after login.
  const appObserver = new MutationObserver(() => { installEditorTools(); addDeleteButtons(); });
  appObserver.observe(document.documentElement, { childList: true, subtree: true });
})();
