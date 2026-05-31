const session = requireAuth();
if (!session) throw new Error('no session');

let selectedFile = null;

document.getElementById('greeting').textContent = `👋 ${session.name}`;
document.getElementById('tgEmail').textContent = session.email;

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'login.html';
});

document.querySelectorAll('.nav-item[data-panel]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const panel = btn.dataset.panel;
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    document.getElementById(`panel-${panel}`).classList.add('active');
    document.getElementById('sidebar').classList.remove('open');
  });
});

document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    selectedFile = e.dataTransfer.files[0];
    document.getElementById('selectedFile').textContent = selectedFile.name;
  }
});

fileInput.addEventListener('change', (e) => {
  selectedFile = e.target.files[0] || null;
  document.getElementById('selectedFile').textContent = selectedFile
    ? selectedFile.name
    : '';
});

function showToast(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `status-toast status-${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

async function loadFiles() {
  try {
    const data = await apiGet(`/files/list?user_id=${session.id}`);
    const list = document.getElementById('filesList');
    document.getElementById('statFiles').textContent = data.files?.length || 0;

    if (data.files?.length) {
      list.innerHTML = data.files.map((f) => `<li>📄 ${f}</li>`).join('');
    } else {
      list.innerHTML = `<li style="color:var(--muted)">${t('no_files')}</li>`;
    }
  } catch {
    document.getElementById('filesList').innerHTML = `<li>${t('err_network')}</li>`;
  }
}

async function loadTelegramStatus() {
  try {
    const data = await apiGet(`/telegram/status/${session.id}`);
    const linked = data.linked;
    document.getElementById('statTg').textContent = linked ? '✓' : '—';
    document.getElementById('statStreak').textContent = data.streak_days ?? 0;
    document.getElementById('tgStatus').textContent = linked
      ? `✅ ${t('tg_linked')}`
      : `⏳ ${t('tg_not_linked')}`;
  } catch {
    document.getElementById('tgStatus').textContent = t('tg_not_linked');
  }
}

document.getElementById('uploadBtn').addEventListener('click', async () => {
  if (!selectedFile) {
    showToast('uploadStatus', 'Select a file first', 'error');
    return;
  }
  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  const formData = new FormData();
  formData.append('file', selectedFile);
  try {
    const res = await fetch(
      `${API_BASE}/files/upload?user_id=${session.id}`,
      { method: 'POST', body: formData }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error || 'Upload failed');
    showToast('uploadStatus', `✅ ${data.filename} — ${data.chunks} chunks`, 'success');
    selectedFile = null;
    document.getElementById('selectedFile').textContent = '';
    fileInput.value = '';
    loadFiles();
  } catch (e) {
    showToast('uploadStatus', e.message === 'Failed to fetch' ? t('err_network') : e.message, 'error');
  }
  btn.disabled = false;
});

document.getElementById('refreshFiles').addEventListener('click', loadFiles);

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const question = input.value.trim();
  if (!question) return;

  addMsg(question, 'user');
  input.value = '';
  const btn = document.getElementById('sendBtn');
  btn.disabled = true;

  const thinking = addMsg(t('thinking'), 'ai', 'thinkingMsg');

  try {
    const data = await apiPost('/chat/ask', { user_id: session.id, question });
    thinking.remove();
    addMsg(data.answer, 'ai');
  } catch (e) {
    thinking.remove();
    addMsg(e.message === 'Failed to fetch' ? t('err_network') : e.message, 'ai');
  }
  btn.disabled = false;
}

function addMsg(text, type, id) {
  const box = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `msg msg-${type}`;
  div.textContent = text;
  if (id) div.id = id;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

document.getElementById('quizBtn').addEventListener('click', async () => {
  const btn = document.getElementById('quizBtn');
  btn.disabled = true;
  try {
    const data = await apiPost('/quiz/generate', {
      user_id: session.id,
      difficulty: document.getElementById('quizDifficulty').value,
      num_questions: parseInt(document.getElementById('quizCount').value, 10),
    });
    if (data.error) throw new Error(data.error);
    showToast('quizStatus', '✅ Quiz ready', 'success');
    const el = document.getElementById('quizResult');
    el.innerHTML = (data.questions || [])
      .map(
        (q, i) => `
      <div class="quiz-item">
        <strong>Q${i + 1}:</strong> ${q.question}
        <ul style="margin:8px 0;padding-left:18px;color:var(--muted)">
          ${(q.options || []).map((o) => `<li>${o}</li>`).join('')}
        </ul>
        <div style="font-size:0.85rem;color:var(--success)">✓ ${q.correct_answer || ''}</div>
      </div>`
      )
      .join('');
  } catch (e) {
    showToast('quizStatus', e.message, 'error');
  }
  btn.disabled = false;
});

document.getElementById('planBtn').addEventListener('click', async () => {
  const goal = document.getElementById('planGoal').value.trim();
  const target_date = document.getElementById('planTargetDate').value;
  const daily_hours = parseFloat(document.getElementById('planDailyHours').value);
  if (!goal || !target_date) {
    showToast('planStatus', t('err_fill'), 'error');
    return;
  }
  const btn = document.getElementById('planBtn');
  btn.disabled = true;
  try {
    const data = await apiPost('/plan/generate', {
      user_id: session.id,
      goal,
      target_date,
      daily_hours,
    });
    if (data.error) throw new Error(data.error);
    showToast('planStatus', '✅ Plan generated', 'success');
    document.getElementById('planResult').innerHTML = `
      <div class="plan-block">
        <p><strong>${data.summary || ''}</strong></p>
        <p style="margin-top:8px;color:var(--muted)">Target: ${data.target_date}</p>
        ${(data.weekly_breakdown || [])
          .map(
            (w) => `
          <div style="margin-top:12px">
            <strong>Week ${w.week}: ${w.focus}</strong>
            ${(w.days || [])
              .map(
                (d) => `
              <div style="margin-top:8px;font-size:0.88rem">
                Day ${d.day} — ${d.topic}<br/>
                <span style="color:var(--muted)">${d.material}</span>
              </div>`
              )
              .join('')}
          </div>`
          )
          .join('')}
      </div>`;
  } catch (e) {
    showToast('planStatus', e.message, 'error');
  }
  btn.disabled = false;
});

loadFiles();
loadTelegramStatus();
