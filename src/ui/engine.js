'use strict';

// Motor genérico de "conversa": só desenha bolhas, digitação e cartões. Não conhece impressora,
// driver, rede ou qualquer regra de negócio — quem alimenta o conteúdo é content.js.

const PACING = {
  thinkingBase: 600,
  thinkingPerChar: 8,
  thinkingMax: 1500,
  perToken: 90,
};

const MAX_VISIBLE_MESSAGES = 4;

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function wait(ms) {
  return reducedMotion() ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

function tokens(text) {
  return text.match(/\S+\s*|\s+/g) || [];
}

function delayFor(token) {
  const trimmed = token.trimEnd();
  if (!trimmed) return PACING.perToken;
  const last = trimmed[trimmed.length - 1];
  if ('.!?'.includes(last)) return PACING.perToken * 7;
  if (',;:'.includes(last)) return PACING.perToken * 3;
  return PACING.perToken;
}

function thinkingTime(text) {
  return Math.min(PACING.thinkingBase + PACING.thinkingPerChar * text.length, PACING.thinkingMax);
}

class ChatEngine {
  constructor(chatEl, scrollEl, boardEl) {
    this.chatEl = chatEl;
    this.scrollEl = scrollEl;
    this.boardEl = boardEl;
  }

  dimPrevious() {
    [...this.chatEl.children].forEach((el) => el.classList.add('dim'));
  }

  append(el) {
    this.chatEl.appendChild(el);
    while (this.chatEl.children.length > MAX_VISIBLE_MESSAGES) {
      this.chatEl.removeChild(this.chatEl.firstChild);
    }
    requestAnimationFrame(() => el.classList.add('enter'));
    this.scrollToEnd();
  }

  scrollToEnd() {
    this.scrollEl.scrollTo({ top: this.scrollEl.scrollHeight, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  bubbleShell(fromComputer) {
    const div = document.createElement('div');
    div.className = `bubble ${fromComputer ? 'bubble-computer' : 'bubble-user'}`;
    return div;
  }

  addBubble(fromComputer, text) {
    this.dimPrevious();
    const bubble = this.bubbleShell(fromComputer);
    const span = document.createElement('span');
    if (text) span.textContent = text;
    bubble.appendChild(span);
    this.append(bubble);
    return { bubble, span };
  }

  showTyping() {
    this.dimPrevious();
    const bubble = this.bubbleShell(true);
    bubble.classList.add('typing');
    bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    this.append(bubble);
    return bubble;
  }

  async stream(target, text) {
    for (const token of tokens(text)) {
      const span = document.createElement('span');
      span.textContent = token;
      target.appendChild(span);
      this.scrollToEnd();
      await wait(delayFor(token));
    }
  }

  async speak(typingBubble, text) {
    typingBubble.classList.remove('typing');
    typingBubble.innerHTML = '';
    const span = document.createElement('span');
    typingBubble.appendChild(span);
    await this.stream(span, text);
  }

  async say(text) {
    const typing = this.showTyping();
    await wait(thinkingTime(text));
    await this.speak(typing, text);
  }

  addUserChoice(text) {
    this.addBubble(false, text);
  }

  showBoard(title, lines, color = '#6B7280') {
    this.boardEl.innerHTML = '';
    this.boardEl.style.display = 'block';

    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.borderLeftColor = color;

    const heading = document.createElement('div');
    heading.className = 'result-heading';
    heading.textContent = title;
    card.appendChild(heading);

    lines.forEach((line) => {
      const p = document.createElement('div');
      p.className = 'result-line';
      p.textContent = line;
      card.appendChild(p);
    });

    this.boardEl.appendChild(card);
  }

  hideBoard() {
    this.boardEl.style.display = 'none';
    this.boardEl.innerHTML = '';
  }
}

window.ChatEngine = ChatEngine;
