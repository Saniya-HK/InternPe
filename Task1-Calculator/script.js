/* ==========================================================================
   State
   ========================================================================== */

let tokens = [];          // the current expression, as structured tokens
let justEvaluated = false; // true right after "=" — next digit starts fresh
let angleMode = 'deg';     // 'deg' | 'rad'
let invMode = false;       // inverse trig functions on/off
let history = [];          // { expression, result }

/* ==========================================================================
   DOM references
   ========================================================================== */

const expressionEl = document.getElementById('expressionDisplay');
const resultEl = document.getElementById('resultDisplay');
const keypad = document.getElementById('keypad');
const sciRows = document.getElementById('sciRows');
const modeButtons = document.querySelectorAll('.mode-btn');
const themeToggle = document.getElementById('themeToggle');
const historyToggle = document.getElementById('historyToggle');
const closeHistory = document.getElementById('closeHistory');
const overlay = document.getElementById('overlay');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const clearHistoryBtn = document.getElementById('clearHistory');
const invToggleBtn = document.getElementById('invToggle');
const angleButtons = document.querySelectorAll('.angle-mode');

/* ==========================================================================
   Display helpers
   ========================================================================== */

const FUNC_LABELS = {
  sin: 'sin', cos: 'cos', tan: 'tan',
  asin: 'sin⁻¹', acos: 'cos⁻¹', atan: 'tan⁻¹',
  log: 'log', ln: 'ln', sqrt: '√'
};

function displayFuncName(name) {
  return FUNC_LABELS[name] || name;
}

function tokensToDisplayString(list) {
  let out = '';
  list.forEach((t) => {
    let piece = '';
    switch (t.type) {
      case 'number': piece = t.value; break;
      case 'const': piece = t.value; break;
      case 'lparen': piece = '('; break;
      case 'rparen': piece = ')'; break;
      case 'postfix': piece = t.value; break;
      case 'function': piece = displayFuncName(t.value) + '('; break;
      case 'operator': piece = t.value; break;
      default: piece = '';
    }
    if (t.type === 'operator' && !t.unary) {
      out += ' ' + piece + ' ';
    } else {
      out += piece;
    }
  });
  return out.replace(/\s+/g, ' ').trim();
}

function render() {
  const str = tokensToDisplayString(tokens);
  resultEl.classList.remove('error');
  resultEl.textContent = str.length ? str : '0';
}

function showError() {
  resultEl.textContent = 'Error';
  resultEl.classList.add('error');
}

/* ==========================================================================
   Token helpers
   ========================================================================== */

function lastToken() {
  return tokens[tokens.length - 1];
}

function parenBalance() {
  let open = 0, close = 0;
  tokens.forEach((t) => {
    if (t.type === 'lparen') open++;
    if (t.type === 'rparen') close++;
  });
  return open - close;
}

/* ==========================================================================
   Input handlers
   ========================================================================== */

function handleNumber(digit) {
  if (justEvaluated) {
    tokens = [];
    justEvaluated = false;
  }
  const last = lastToken();

  if (last && last.type === 'number') {
    if (last.value === '0' && digit === '0') return;
    if (last.value === '0') {
      last.value = digit === '00' ? '0' : digit;
    } else {
      last.value += digit;
    }
  } else if (last && (last.type === 'const' || last.type === 'rparen')) {
    return; // require an operator before starting a new number
  } else {
    tokens.push({ type: 'number', value: digit === '00' ? '0' : digit });
  }
  render();
}

function handleDot() {
  if (justEvaluated) {
    tokens = [];
    justEvaluated = false;
  }
  const last = lastToken();
  if (last && last.type === 'number') {
    if (!last.value.includes('.')) last.value += '.';
  } else if (last && (last.type === 'const' || last.type === 'rparen')) {
    return;
  } else {
    tokens.push({ type: 'number', value: '0.' });
  }
  render();
}

function handleOperator(op) {
  if (justEvaluated) justEvaluated = false;
  const last = lastToken();

  if (!last) {
    if (op === '−') tokens.push({ type: 'operator', value: '−', unary: true });
    render();
    return;
  }

  if (last.type === 'operator') {
    if (op === '−' && !last.unary) {
      tokens.push({ type: 'operator', value: '−', unary: true });
    } else {
      last.value = op;
      last.unary = false;
    }
    render();
    return;
  }

  if (last.type === 'lparen' || last.type === 'function') {
    if (op === '−') tokens.push({ type: 'operator', value: '−', unary: true });
    render();
    return;
  }

  tokens.push({ type: 'operator', value: op });
  render();
}

function handleConst(name) {
  if (justEvaluated) {
    tokens = [];
    justEvaluated = false;
  }
  const last = lastToken();
  if (last && (last.type === 'number' || last.type === 'const' || last.type === 'rparen')) {
    tokens.push({ type: 'operator', value: '×' });
  }
  tokens.push({ type: 'const', value: name === 'pi' ? 'π' : 'e' });
  render();
}

function handleFunction(name) {
  if (justEvaluated) {
    tokens = [];
    justEvaluated = false;
  }
  const last = lastToken();
  if (last && (last.type === 'number' || last.type === 'const' || last.type === 'rparen')) {
    tokens.push({ type: 'operator', value: '×' });
  }
  let fname = name;
  if (invMode && (name === 'sin' || name === 'cos' || name === 'tan')) {
    fname = 'a' + name;
  }
  tokens.push({ type: 'function', value: fname });
  tokens.push({ type: 'lparen', value: '(' });
  render();
}

function handleParen(kind) {
  if (justEvaluated) {
    tokens = [];
    justEvaluated = false;
  }
  const last = lastToken();
  if (kind === 'open') {
    if (last && (last.type === 'number' || last.type === 'const' || last.type === 'rparen')) {
      tokens.push({ type: 'operator', value: '×' });
    }
    tokens.push({ type: 'lparen', value: '(' });
  } else {
    if (parenBalance() > 0 && last && (last.type === 'number' || last.type === 'const' || last.type === 'rparen')) {
      tokens.push({ type: 'rparen', value: ')' });
    }
  }
  render();
}

function handlePostfix(kind) {
  const last = lastToken();
  if (!last) return;
  if (last.type === 'number' || last.type === 'const' || last.type === 'rparen') {
    tokens.push({ type: 'postfix', value: kind === 'percent' ? '%' : '!' });
    render();
  }
}

function deleteLast() {
  if (justEvaluated) {
    clearCalculator();
    return;
  }
  const last = lastToken();
  if (!last) return;
  if (last.type === 'number' && last.value.length > 1) {
    last.value = last.value.slice(0, -1);
  } else {
    tokens.pop();
  }
  render();
}

function clearCalculator() {
  tokens = [];
  justEvaluated = false;
  expressionEl.textContent = '';
  resultEl.classList.remove('error');
  resultEl.textContent = '0';
}

/* ==========================================================================
   Evaluation (shunting-yard -> RPN -> evaluate)
   ========================================================================== */

const PRECEDENCE = { '+': 2, '−': 2, '×': 3, '÷': 3, '^': 4 };
const RIGHT_ASSOC = { '^': true };

function toRad(deg) { return angleMode === 'deg' ? (deg * Math.PI) / 180 : deg; }
function fromRad(rad) { return angleMode === 'deg' ? (rad * 180) / Math.PI : rad; }

function factorial(n) {
  if (n < 0 || !Number.isInteger(n) || n > 170) throw new Error('Error');
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function applyFunction(name, a) {
  switch (name) {
    case 'sin': return Math.sin(toRad(a));
    case 'cos': return Math.cos(toRad(a));
    case 'tan': return Math.tan(toRad(a));
    case 'asin': return fromRad(Math.asin(a));
    case 'acos': return fromRad(Math.acos(a));
    case 'atan': return fromRad(Math.atan(a));
    case 'log': return Math.log10(a);
    case 'ln': return Math.log(a);
    case 'sqrt':
      if (a < 0) throw new Error('Error');
      return Math.sqrt(a);
    case 'u-': return -a;
    default: throw new Error('Error');
  }
}

function applyBinary(op, a, b) {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷':
      if (b === 0) throw new Error('Error');
      return a / b;
    case '^': return Math.pow(a, b);
    default: throw new Error('Error');
  }
}

function evaluateTokens(list) {
  if (list.length === 0) throw new Error('Error');

  // Auto-close any unbalanced open parentheses at evaluation time.
  const balance = parenBalance();
  const evalTokens = list.slice();
  for (let i = 0; i < balance; i++) evalTokens.push({ type: 'rparen', value: ')' });

  // Reject a trailing operator (nothing to evaluate it against).
  const last = evalTokens[evalTokens.length - 1];
  if (last && last.type === 'operator') throw new Error('Error');

  const output = [];
  const opStack = [];

  evalTokens.forEach((token) => {
    if (token.type === 'number') {
      output.push({ type: 'number', value: parseFloat(token.value) });
    } else if (token.type === 'const') {
      output.push({ type: 'number', value: token.value === 'π' ? Math.PI : Math.E });
    } else if (token.type === 'function') {
      opStack.push(token);
    } else if (token.type === 'lparen') {
      opStack.push(token);
    } else if (token.type === 'rparen') {
      while (opStack.length && opStack[opStack.length - 1].type !== 'lparen') {
        output.push(opStack.pop());
      }
      opStack.pop(); // discard the '('
      if (opStack.length && opStack[opStack.length - 1].type === 'function') {
        output.push(opStack.pop());
      }
    } else if (token.type === 'postfix') {
      output.push(token);
    } else if (token.type === 'operator') {
      const o1 = token.unary ? 'u-' : token.value;
      const p1 = token.unary ? 5 : PRECEDENCE[token.value];
      while (opStack.length) {
        const top = opStack[opStack.length - 1];
        if (top.type === 'lparen') break;
        let p2;
        if (top.type === 'function') p2 = 6;
        else if (top.type === 'operator') p2 = top.unary ? 5 : PRECEDENCE[top.value];
        else break;
        const rightAssoc = !token.unary && RIGHT_ASSOC[o1];
        if (p2 > p1 || (p2 === p1 && !rightAssoc)) output.push(opStack.pop());
        else break;
      }
      opStack.push(token);
    }
  });

  while (opStack.length) output.push(opStack.pop());

  const stack = [];
  output.forEach((t) => {
    if (t.type === 'number') {
      stack.push(t.value);
    } else if (t.type === 'postfix') {
      const a = stack.pop();
      stack.push(t.value === '%' ? a / 100 : factorial(a));
    } else if (t.type === 'function' || (t.type === 'operator' && t.unary)) {
      const a = stack.pop();
      stack.push(applyFunction(t.unary ? 'u-' : t.value, a));
    } else if (t.type === 'operator') {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(applyBinary(t.value, a, b));
    }
  });

  if (stack.length !== 1 || !isFinite(stack[0])) throw new Error('Error');
  return stack[0];
}

function formatNumber(num) {
  if (!isFinite(num)) return 'Error';
  if (Object.is(num, -0)) num = 0;
  const rounded = parseFloat(num.toPrecision(12));
  return rounded.toString();
}

function calculate() {
  if (tokens.length === 0) return;
  const exprStr = tokensToDisplayString(tokens);
  try {
    const value = evaluateTokens(tokens);
    const resultStr = formatNumber(value);
    expressionEl.textContent = exprStr;
    resultEl.classList.remove('error');
    resultEl.textContent = resultStr;
    addToHistory(exprStr, resultStr);
    tokens = [{ type: 'number', value: String(value) }];
    justEvaluated = true;
  } catch (err) {
    expressionEl.textContent = exprStr;
    showError();
    tokens = [];
    justEvaluated = true;
  }
}

/* ==========================================================================
   History
   ========================================================================== */

function loadHistory() {
  try {
    const raw = localStorage.getItem('calculator_history');
    history = raw ? JSON.parse(raw) : [];
  } catch (err) {
    history = [];
  }
  renderHistory();
}

function saveHistory() {
  localStorage.setItem('calculator_history', JSON.stringify(history));
}

function addToHistory(expression, result) {
  history.unshift({ expression, result });
  if (history.length > 100) history.length = 100;
  saveHistory();
  renderHistory();
}

function clearHistory() {
  if (history.length === 0) return;
  const confirmed = window.confirm('Clear all calculation history? This cannot be undone.');
  if (!confirmed) return;
  history = [];
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.querySelectorAll('.history-item').forEach((el) => el.remove());

  if (history.length === 0) {
    historyEmpty.style.display = 'block';
    return;
  }
  historyEmpty.style.display = 'none';

  history.forEach((entry) => {
    const item = document.createElement('button');
    item.className = 'history-item';
    item.innerHTML =
      '<div class="h-expression">' + escapeHtml(entry.expression) + '</div>' +
      '<div class="h-result">' + escapeHtml(entry.result) + '</div>';
    item.addEventListener('click', () => {
      tokens = [{ type: 'number', value: entry.result }];
      justEvaluated = true;
      expressionEl.textContent = '';
      resultEl.classList.remove('error');
      resultEl.textContent = entry.result;
      toggleHistoryPanel(false);
    });
    historyList.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ==========================================================================
   Theme
   ========================================================================== */

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('calculator_theme', next);
  themeToggle.setAttribute('aria-label', next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

function loadTheme() {
  const saved = localStorage.getItem('calculator_theme');
  const theme = saved === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

/* ==========================================================================
   History panel open/close
   ========================================================================== */

function toggleHistoryPanel(open) {
  historyPanel.classList.toggle('open', open);
  overlay.classList.toggle('visible', open);
}

/* ==========================================================================
   Mode switching
   ========================================================================== */

function setMode(mode) {
  modeButtons.forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  sciRows.classList.toggle('visible', mode === 'scientific');
}

function setAngleMode(mode) {
  angleMode = mode;
  angleButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.angle === mode);
  });
}

function toggleInv() {
  invMode = !invMode;
  invToggleBtn.classList.toggle('active', invMode);
  document.querySelectorAll('[data-func="sin"]').forEach((b) => {
    b.textContent = invMode ? 'sin⁻¹' : 'sin';
  });
  document.querySelectorAll('[data-func="cos"]').forEach((b) => {
    b.textContent = invMode ? 'cos⁻¹' : 'cos';
  });
  document.querySelectorAll('[data-func="tan"]').forEach((b) => {
    b.textContent = invMode ? 'tan⁻¹' : 'tan';
  });
}

/* ==========================================================================
   Event wiring
   ========================================================================== */

keypad.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  if (btn.dataset.num !== undefined) return handleNumber(btn.dataset.num);
  if (btn.dataset.op !== undefined) return handleOperator(btn.dataset.op);
  if (btn.dataset.const !== undefined) return handleConst(btn.dataset.const);
  if (btn.dataset.func !== undefined) return handleFunction(btn.dataset.func);
  if (btn.dataset.angle !== undefined) return setAngleMode(btn.dataset.angle);

  switch (btn.dataset.action) {
    case 'clear': return clearCalculator();
    case 'delete': return deleteLast();
    case 'dot': return handleDot();
    case 'equals': return calculate();
    case 'percent': return handlePostfix('percent');
    case 'factorial': return handlePostfix('factorial');
    case 'open-paren': return handleParen('open');
    case 'close-paren': return handleParen('close');
    default: return;
  }
});

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

invToggleBtn.addEventListener('click', toggleInv);

themeToggle.addEventListener('click', toggleTheme);

historyToggle.addEventListener('click', () => toggleHistoryPanel(true));
closeHistory.addEventListener('click', () => toggleHistoryPanel(false));
overlay.addEventListener('click', () => toggleHistoryPanel(false));
clearHistoryBtn.addEventListener('click', clearHistory);

document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') return handleNumber(e.key);
  if (e.key === '.') return handleDot();
  if (e.key === '+') return handleOperator('+');
  if (e.key === '-') return handleOperator('−');
  if (e.key === '*') return handleOperator('×');
  if (e.key === '/') { e.preventDefault(); return handleOperator('÷'); }
  if (e.key === '^') return handleOperator('^');
  if (e.key === '%') return handlePostfix('percent');
  if (e.key === '(') return handleParen('open');
  if (e.key === ')') return handleParen('close');
  if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); return calculate(); }
  if (e.key === 'Backspace') return deleteLast();
  if (e.key === 'Escape') return clearCalculator();
});

/* ==========================================================================
   Init
   ========================================================================== */

loadTheme();
loadHistory();
setMode('basic');
setAngleMode('deg');
clearCalculator();
