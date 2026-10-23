/* English Cards — preenchimento gratuito de tradução e exemplos.
   Usa MyMemory (tradução online gratuita, sujeita a limites/disponibilidade).
   Os exemplos são modelos locais; não usa IA nem exige chave de API. */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const knownExamples = {
    "get by": [
      "I can get by with a little help.",
      "She gets by on a small salary."
    ],
    "give up": [
      "Don't give up when English feels difficult.",
      "He gave up smoking last year."
    ],
    "look after": [
      "I look after my nephew on Saturdays.",
      "Can you look after my plants while I'm away?"
    ],
    "find out": [
      "I need to find out what time the bus leaves.",
      "She called the hotel to find out more information."
    ],
    "figure out": [
      "I'm trying to figure out how this app works.",
      "We finally figured out the answer."
    ],
    "get along": [
      "I get along well with my coworkers.",
      "Do you get along with your neighbors?"
    ],
    "run into": [
      "I ran into an old friend at the supermarket.",
      "We ran into a problem during the trip."
    ],
    "take care of": [
      "I need to take care of a few things today.",
      "She takes care of her grandmother."
    ],
    "deal with": [
      "I have to deal with a difficult situation.",
      "He knows how to deal with customer complaints."
    ],
    "put off": [
      "Don't put off your English practice.",
      "They put off the meeting until Friday."
    ],
    "carry on": [
      "Please carry on with your work.",
      "She carried on studying despite the noise."
    ],
    "come across": [
      "I came across an interesting article yesterday.",
      "He comes across as a very friendly person."
    ],
    "get over": [
      "It took me a week to get over the flu.",
      "She's trying to get over her fear of speaking English."
    ],
    "work out": [
      "I hope everything works out well.",
      "We worked out a solution together."
    ],
    "turn out": [
      "The party turned out to be great.",
      "It turned out that we were on the wrong bus."
    ],
    "bring up": [
      "She brought up an important question.",
      "He doesn't like to bring up that subject."
    ],
    "keep up": [
      "It's hard to keep up with fast speakers.",
      "Keep up the good work!"
    ],
    "set up": [
      "I need to set up a new email account.",
      "They set up a meeting for Monday."
    ],
    "go through": [
      "Let's go through the instructions together.",
      "She's going through a difficult time."
    ],
    "make up": [
      "They made up after the argument.",
      "He made up a funny story."
    ],
    "perceive": [
      "People may perceive the situation differently.",
      "I perceived a change in his attitude."
    ],
    "disorganized": [
      "My desk gets disorganized when I'm busy.",
      "The notes were disorganized and hard to follow."
    ]
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  async function translate(text) {
    const url = "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(text) + "&langpair=en|pt-BR";
    const response = await fetch(url);
    if (!response.ok) throw new Error("O serviço de tradução está indisponível no momento.");
    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    if (!translated || data?.responseStatus >= 400) {
      throw new Error("Não foi possível traduzir esse texto agora.");
    }
    return String(translated).replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  }

  function buildExamples(phrase) {
    const normalized = phrase.trim().toLowerCase().replace(/[.!?]+$/, "");
    if (knownExamples[normalized]) return [...knownExamples[normalized]];
    // Modelos seguros e úteis para expressões que ainda não têm exemplos específicos.
    return [
      `I heard the expression "${phrase}" in a conversation.`,
      `Can you show me how to use "${phrase}" in a sentence?`
    ];
  }

  function addControls() {
    const english = $("english");
    const form = $("cardForm");
    if (!english || !form || $("autoGenerateButton")) return false;

    const field = english.closest(".field") || english.parentElement;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "autoGenerateButton";
    button.className = "secondary-button";
    button.textContent = "✨ Gerar tradução e exemplos (grátis)";
    button.style.marginTop = "8px";
    button.style.width = "100%";
    field.appendChild(button);

    const status = document.createElement("p");
    status.id = "autoGenerateStatus";
    status.className = "muted";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.style.margin = "8px 0 0";
    field.appendChild(status);

    button.addEventListener("click", async () => {
      const phrase = english.value.trim();
      if (!phrase) {
        status.textContent = "Digite uma palavra ou expressão em inglês primeiro.";
        english.focus();
        return;
      }

      button.disabled = true;
      button.textContent = "⏳ Gerando...";
      status.textContent = "Buscando tradução e preparando dois exemplos. Pode levar alguns segundos.";

      try {
        const examples = buildExamples(phrase);
        const [meaning, ex1pt, ex2pt] = await Promise.all([
          translate(phrase),
          translate(examples[0]),
          translate(examples[1])
        ]);

        // Preenche os campos para que o usuário possa revisar antes de salvar.
        $("portuguese").value = meaning;
        $("example1En").value = examples[0];
        $("example1Pt").value = ex1pt;
        $("example2En").value = examples[1];
        $("example2Pt").value = ex2pt;
        if (!$("targetPhrase").value.trim()) $("targetPhrase").value = phrase;
        status.textContent = "Pronto! Confira as traduções e os exemplos antes de salvar. A tradução automática pode precisar de ajustes.";
      } catch (error) {
        status.textContent = (error && error.message ? error.message : "Não foi possível gerar o conteúdo.") +
          " Confira sua conexão e tente novamente. O serviço gratuito pode ter limites.";
      } finally {
        button.disabled = false;
        button.textContent = "✨ Gerar tradução e exemplos (grátis)";
      }
    });

    return true;
  }

  // app.js usa defer; tentamos quando o documento já foi carregado.
  if (!addControls()) {
    document.addEventListener("DOMContentLoaded", addControls, { once: true });
  }
})();
