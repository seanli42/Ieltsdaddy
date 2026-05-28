import './style.css';

// ===== COS 远程音频配置 =====
const AUDIO_BASE_URL = 'https://daddybucket-1256084115.cos.ap-guangzhou.myqcloud.com';
function audioUrl(path) {
  return AUDIO_BASE_URL ? AUDIO_BASE_URL + path : path;
}
// ===== 本地缓存系统（减少 COS 流量） =====
const CACHE_VER = '2';
function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d._v === CACHE_VER ? d : null;
  } catch { return null; }
}
function cacheSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({_v: CACHE_VER, ...data}));
  } catch(e) { /* 忽略存满错误 */ }
}
// ==========================================

// 音频列表：优先从缓存加载，后台刷新
let AUDIO_LIST = [];
let AUDIO_LIST_LOADED = false;

const manifestUrl = (AUDIO_BASE_URL || '') + '/manifest.json';

// 优先从本地缓存加载（秒级，无网络消耗）
const cachedManifest = cacheGet('manifest');
if (cachedManifest && cachedManifest.list) {
  AUDIO_LIST = cachedManifest.list;
  AUDIO_LIST_LOADED = true;
  console.log('[CACHE] manifest loaded from cache:', AUDIO_LIST.length, 'entries');
  if (document.getElementById('audioList')) renderAudioList();
}

// 后台拉取最新列表，更新缓存
fetch(manifestUrl).then(r => r.json()).then(list => {
  AUDIO_LIST = list;
  AUDIO_LIST_LOADED = true;
  cacheSet('manifest', {list, ts: Date.now()});
  console.log('[MANIFEST] loaded from COS:', list.length, 'entries');
  if (document.getElementById('audioList')) renderAudioList();
}).catch(e => {
  console.error('[MANIFEST] load failed:', e, 'url:', manifestUrl);
});


const TARGET_PLAYS = 100;

// 全局状态
let MY_AUDIOS = [];
let currentCategory = 'listening';
let currentAudioId = null;
let lrcLines = [];
let currentLrcIndex = -1;
let isPlaying = false;
let currentTime = 0;
let playbackRate = 1;
let sentenceStartTime = 0;
let favorites = [];
let sentenceStats = {};
let interval = null;
let _timeupdateAttached = false;
let isLoopingSentence = false; // 单句循环模式
let loopSentenceStart = -1; // 单句循环：句子开始时间
let loopSentenceEnd = -1;   // 单句循环：句子结束时间（下一句开始时间）
let favPlayMode = false; // 收藏列表播放模式：句子结束后跳到下一条收藏
let favPlayIndex = -1;   // 当前播放的是 favDisplayOrder 中第几位
let favSentenceEndTime = Infinity; // 当前收藏句子的结束时间（下一句的开始时间或 Infinity）
let favDisplayOrder = []; // 收藏页当前显示顺序
let favLoop5x = false;
let favLoop5xCount = 0;

let isFavListLooping = true; // 收藏页列表循环（存 favorites[] 的原始下标，与 UI 一致）
let playlist = []; // 播放列表（存储 audioId 数组）
let playlistIndex = -1; // 当前在播放列表中的位置
let isPlaylistLooping = false; // 播放列表循环模式
let isSentenceLoop5x = false; // 单句循环5次后自动下一句
let sentenceLoop5xCount = 0;  // 当前句子已循环次数
let loop5xTarget = parseInt(localStorage.getItem('loop5xTarget')) || 5;
let isSelectMode = false; // 多选模式
let shortWordThreshold = parseInt(localStorage.getItem('shortWordThreshold')) || 5; // 短句阈值

function getDefaultAudios() { return [...AUDIO_LIST]; }

function loadMyAudios() {
  const saved = localStorage.getItem('damo_my_audios');
  if (saved) MY_AUDIOS = JSON.parse(saved);
}

function parseLRC(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const result = [];
  // 格式一：标准 [mm:ss.xx] 或 [mm:ss.xxx]
  const regStd = /\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)/;
  // 格式二：纯秒数 [秒.百毫秒] 如 [000.05] 或 [002.86]
  const regSec = /^\[(\d+)\.(\d{2})\](.*)/;
  for (const line of lines) {
    let m = line.match(regStd);
    if (m) {
      const divisor = m[3].length === 3 ? 1000 : 100;
      const time = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3]) / divisor;
      const txt = m[4].trim();
      if (txt) result.push({ time, text: txt });
      continue;
    }
    m = line.match(regSec);
    if (m) {
      const time = parseInt(m[1]) + parseInt(m[2]) / 100;
      const txt = m[3].trim();
      if (txt) result.push({ time, text: txt });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function getStatsKey() { return currentAudioId || 'default'; }

function getOrCreateStats(time) {
  const key = getStatsKey();
  const timeKey = Math.round(time * 100) / 100;
  if (!sentenceStats[key]) sentenceStats[key] = {};
  if (!sentenceStats[key][timeKey]) sentenceStats[key][timeKey] = { plays: 0 };
  return sentenceStats[key][timeKey];
}

function getSentenceProgress(time) {
  const stats = getOrCreateStats(time);
  return Math.min(Math.round((stats.plays / TARGET_PLAYS) * 100), 100);
}

function isSentenceMastered(time) {
  return getOrCreateStats(time).plays >= TARGET_PLAYS;
}

function getAudioMasteredCount(audioId) {
  const audio = getAllAudios().find(a => a.id === audioId);
  if (!audio) return 0;
  return parseLRC(audio.lrc).filter(l => isSentenceMastered(l.time)).length;
}

function countLrcLines(lrc) { return parseLRC(lrc).length; }

function getAllAudios() {
  return [...getDefaultAudios(), ...MY_AUDIOS];
}

function getDuration() {
  const audio = getAllAudios().find(a => a.id === currentAudioId);
  // 优先使用 audio 元素的实际时长
  const audioEl = document.getElementById('globalAudio');
  if (audioEl && audioEl.duration > 0) {
    return audioEl.duration;
  }
  return audio ? audio.duration : 0;
}

function recordSentencePlays() {
  if (currentLrcIndex < 0 || !isPlaying) return;
  const elapsed = (Date.now() - sentenceStartTime) / 1000;
  if (elapsed > 0.5) {
    const key = getStatsKey();
    if (!sentenceStats[key]) sentenceStats[key] = {};
    const timeKey = Math.round(lrcLines[currentLrcIndex].time * 100) / 100;
    if (!sentenceStats[key][timeKey]) sentenceStats[key][timeKey] = { plays: 0 };
    sentenceStats[key][timeKey].plays++;
    saveData();
  }
}

function togglePlay() {
  if (isPlaying) pausePlay(); else startPlay();
}

function startPlay() {
  console.log('[DEBUG] startPlay called, currentAudioId:', currentAudioId);
  
  if (!currentAudioId && getAllAudios().length > 0) {
    selectAudio(getAllAudios()[0].id);
  }
  if (currentLrcIndex < 0 && lrcLines.length > 0) {
    currentLrcIndex = 0;
    updateUI();
  }
  sentenceStartTime = Date.now();
  isPlaying = true;
  
  // 获取音频元素
  let globalAudio = document.getElementById('globalAudio');
  console.log('[DEBUG] globalAudio element:', globalAudio);
  console.log('[DEBUG] globalAudio.src:', globalAudio ? globalAudio.src : 'null');
  
  if (globalAudio) {
    // 检查音频是否已加载
    if (!globalAudio.src || globalAudio.src === window.location.href) {
      // 没有设置 src，先选择一个音频
      const audio = getAllAudios().find(a => a.id === currentAudioId);
      if (audio && audio.file) {
        globalAudio.src = audioUrl(audio.file);
        globalAudio.load();
        console.log('[DEBUG] Set audio src to:', audioUrl(audio.file));
      }
    }
    
    // 播放（倍速始终跟随 playbackRate）
    globalAudio.playbackRate = playbackRate;
    globalAudio.play().then(() => {
      console.log('[DEBUG] Audio playing');
      // 锁屏/后台时 timeupdate 事件仍会触发，保持光标同步
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    }).catch(e => {
      console.log('[DEBUG] Audio play error:', e.message);
    });
    
    // 添加 timeupdate 事件（只添加一次），后台播放时仍触发
    if (!_timeupdateAttached) {
      _timeupdateAttached = true;
      globalAudio.addEventListener('timeupdate', () => {
        if (!favPlayMode) {
          const ct = globalAudio.currentTime;
          let newIdx = -1;
          for (let i = 0; i < lrcLines.length; i++) {
            if (lrcLines[i].time <= ct) newIdx = i;
            else break;
          }
          if (newIdx >= 0 && newIdx !== currentLrcIndex) {
            currentLrcIndex = newIdx;
            sentenceStartTime = Date.now();
            updateCurrentSentenceStats();
            updateFavBtn();
            updateUI();
          }
        }
      });
    }
  } else {
    console.log('[DEBUG] ERROR: globalAudio not found!');
  }
  
  const btn = document.getElementById('playBtn');
  if (btn) btn.textContent = '⏸️';
  updateMediaSession();
  if (interval) clearInterval(interval);
  interval = setInterval(() => {
    if (globalAudio) {
      currentTime = globalAudio.currentTime;
    }
    
    // 每50ms输出一次关键状态
    if (!window._tickCount) window._tickCount = 0;
    window._tickCount++;
    if (window._tickCount % 5 === 0) {
      console.log('[TICK]', {
        t: currentTime.toFixed(3),
        idx: currentLrcIndex,
        next: currentLrcIndex < lrcLines.length - 1 ? lrcLines[currentLrcIndex + 1].time.toFixed(3) : 'N/A',
        loop: isLoopingSentence,
        fav: favPlayMode
      });
    }
    
    if (currentLrcIndex < lrcLines.length - 1) {
      const nextTime = lrcLines[currentLrcIndex + 1].time;
      if (currentTime >= nextTime) {
        console.log('[CROSS] 越过', { fromIdx: currentLrcIndex, fromTime: lrcLines[currentLrcIndex].time, toTime: nextTime, isLooping: isLoopingSentence });
        
        // 单句循环模式：播放到句子结束时跳回
        if (isLoopingSentence && loopSentenceEnd > 0 && currentTime >= loopSentenceEnd - 0.05) {
          console.log('[LOOP] 单句循环跳回', { 
            from: currentTime.toFixed(3), 
            to: loopSentenceStart,
            text: lrcLines[currentLrcIndex]?.text 
          });
          globalAudio.currentTime = loopSentenceStart;
          // 重新计算 currentLrcIndex
          let idx = -1;
          for (let i = 0; i < lrcLines.length; i++) {
            if (lrcLines[i].time <= loopSentenceStart) idx = i;
            else break;
          }
          currentLrcIndex = idx;
          recordSentencePlays();
          
          // 5次循环：计数满5次后关闭循环，自动继续下一句
          if (isSentenceLoop5x) {
            if (isShortSentence(lrcLines[currentLrcIndex]?.text)) { sentenceLoop5xCount = loop5xTarget; }
            else { sentenceLoop5xCount++; }
            updateLoop5xProgress();
            if (sentenceLoop5xCount >= loop5xTarget) {
              console.log('[LOOP5X] 5次完成，继续下一句5x循环');
              // 先保存结束边界
              const savedEnd = loopSentenceEnd;
              // 找到当前循环块的最后一行的索引
              let blockEnd = currentLrcIndex;
              while (blockEnd < lrcLines.length - 1 && lrcLines[blockEnd + 1].time < savedEnd - 0.001) {
                blockEnd++;
              }
              // 推进到下一句
              if (blockEnd + 1 < lrcLines.length) {
                const nextIdx = blockEnd + 1;
                currentLrcIndex = nextIdx;
                sentenceStartTime = Date.now();
                globalAudio.currentTime = lrcLines[nextIdx].time;
                // 为下一句重新设置循环边界
                let newBlockStart = nextIdx;
                while (newBlockStart > 0 && (lrcLines[newBlockStart].time - lrcLines[newBlockStart - 1].time) < 0.5) newBlockStart--;
                let newBlockEnd = nextIdx;
                while (newBlockEnd < lrcLines.length - 1 && (lrcLines[newBlockEnd + 1].time - lrcLines[newBlockEnd].time) < 0.5) newBlockEnd++;
                loopSentenceStart = lrcLines[newBlockStart].time;
                loopSentenceEnd = (newBlockEnd < lrcLines.length - 1) ? lrcLines[newBlockEnd + 1].time : loopSentenceStart + 10;
                sentenceLoop5xCount = 1;
                updateCurrentSentenceStats();
                updateFavBtn();
                updateUI();
                updateLoop5xProgress();
              } else {
                // 已是最后一句，关闭5x模式
                isSentenceLoop5x = false;
                isLoopingSentence = false;
                loopSentenceStart = -1;
                loopSentenceEnd = -1;
                sentenceLoop5xCount = 0;
                updateLoopBtn();
                updateLoop5xBtn();
                updateLoop5xProgress();
                showToast('✅ 全篇5次循环完成');
              }
              return;
            } else {
              return; // 未满5次，跳回继续循环
            }
          } else {
            return; // 普通无限循环
          }
        }
        
        recordSentencePlays();
        
        if (!favPlayMode) {
          // 普通模式：继续文章下一句
          console.log('[NEXT] 普通模式切到', currentLrcIndex + 1);
          currentLrcIndex++;
          sentenceStartTime = Date.now();
          updateCurrentSentenceStats();
          updateFavBtn();
          updateUI();
        }
        // favPlayMode：不在这里处理，由下面的 favSentenceEndTime 统一处理
      }
    }
    // 收藏列表播放模式：检查当前收藏句子是否已结束
    if (favPlayMode && !isLoopingSentence && currentTime >= favSentenceEndTime) {
      recordSentencePlays();
      if (favLoop5x) {
        const _ft = (favorites[favDisplayOrder[favPlayIndex]] || {}).text;
        if (isShortSentence(_ft)) { favLoop5xCount = loop5xTarget; } else { favLoop5xCount++; }
        if (favLoop5xCount < loop5xTarget) {
          const rawIdx = favDisplayOrder[favPlayIndex];
          playFavSentenceInMode(rawIdx);
          return;
        }
        favLoop5xCount = 0;
      }
      const nextPos = favPlayIndex + 1;
      if (nextPos >= favDisplayOrder.length) {
        if (isFavListLooping) {
          favPlayIndex = 0;
          updateFavHighlight();
          playFavSentenceInMode(favDisplayOrder[0]);
          return;
        }
        pausePlay();
        favPlayMode = false;
        favPlayIndex = -1;
        updateFavHighlight();
        showToast('列表播放完成');
        return;
      }
      favPlayIndex = nextPos;
      updateFavHighlight();
      playFavSentenceInMode(favDisplayOrder[nextPos]);
      return;
    }
    if (currentTime >= getDuration() && getDuration() > 0) {
      currentTime = getDuration();
      pausePlay();
      playNextAudio(); // 自动播下一曲
      return;
    }
    
    // 每 tick 从 currentTime 重新计算 currentLrcIndex，确保光标始终同步
    // 循环模式下也执行（5x循环需要持续同步）
    if (!favPlayMode) {
      let newIdx = -1;
      for (let i = 0; i < lrcLines.length; i++) {
        if (lrcLines[i].time <= currentTime) newIdx = i;
        else break;
      }
      if (newIdx >= 0 && newIdx !== currentLrcIndex) {
        currentLrcIndex = newIdx;
        sentenceStartTime = Date.now();
        updateCurrentSentenceStats();
        updateFavBtn();
        updateUI();
      }
    }
    updateProgressBar();
  }, 100);
}

function pausePlay() {
  isPlaying = false;
  const btn = document.getElementById('playBtn');
  if (btn) btn.textContent = '▶️';
  if (interval) { clearInterval(interval); interval = null; }
  // 保存播放进度
  if (currentAudioId) {
    try { localStorage.setItem('lastAudioId', currentAudioId);
      const ga = document.getElementById('globalAudio');
      if (ga) localStorage.setItem('lastAudioTime', ga.currentTime.toString());
    } catch(e) {}
  }
  // 暂停音频
  const globalAudio = document.getElementById('globalAudio');
  if (globalAudio) globalAudio.pause();
  
  updateMediaSession();
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'paused';
  }
  if (currentLrcIndex >= 0) recordSentencePlays();
}

// ===== 自动下一曲 =====
function playNextAudio() {
  // 如果在播放列表中，走播放列表逻辑
  if (playlist.length > 0) {
    let nextIdx = playlistIndex + 1;
    if (nextIdx >= playlist.length) {
      if (isPlaylistLooping) nextIdx = 0; // 列表循环：回到第一首
      else return; // 不循环：停止
    }
    playlistIndex = nextIdx;
    selectAudio(playlist[nextIdx]);
    return;
  }
  // 否则按当前分类顺序下一首
  const allInCategory = getAllAudios().filter(a => a.category === currentCategory);
  const idx = allInCategory.findIndex(a => a.id === currentAudioId);
  if (idx >= 0 && idx < allInCategory.length - 1) {
    selectAudio(allInCategory[idx + 1].id);
  }
}

function playPrevAudio() {
  if (playlist.length > 0) {
    let prevIdx = playlistIndex - 1;
    if (prevIdx < 0) {
      if (isPlaylistLooping) prevIdx = playlist.length - 1;
      else return;
    }
    playlistIndex = prevIdx;
    selectAudio(playlist[prevIdx]);
    return;
  }
  const allInCategory = getAllAudios().filter(a => a.category === currentCategory);
  const idx = allInCategory.findIndex(a => a.id === currentAudioId);
  if (idx > 0) selectAudio(allInCategory[idx - 1].id);
}

// ===== 播放列表管理 =====
function addToPlaylist(audioId) {
  if (!playlist.includes(audioId)) {
    playlist.push(audioId);
    savePlaylist();
    renderPlaylistBtn();
    showToast(`✅ 已加入播放列表（${playlist.length} 首）`);
  } else {
    removeFromPlaylist(audioId);
  }
}

function removeFromPlaylist(audioId) {
  const idx = playlist.indexOf(audioId);
  if (idx >= 0) {
    playlist.splice(idx, 1);
    if (playlistIndex >= idx) playlistIndex = Math.max(-1, playlistIndex - 1);
    savePlaylist();
    renderPlaylistBtn();
    showToast(`移出播放列表`);
  }
}

function clearPlaylist() {
  playlist = [];
  playlistIndex = -1;
  isPlaylistLooping = false;
  savePlaylist();
  renderPlaylistBtn();
  updatePlaylistPage();
  showToast('播放列表已清空');
}

function playPlaylist() {
  if (playlist.length === 0) { showToast('播放列表为空'); return; }
  playlistIndex = 0;
  selectAudio(playlist[0]);
}

function togglePlaylistLoop() {
  isPlaylistLooping = !isPlaylistLooping;
  updatePlaylistLoopBtn();
  showToast(isPlaylistLooping ? '🔁 列表循环已开启' : '➡️ 列表循环已关闭');
}

function updatePlaylistLoopBtn() {
  const btn = document.getElementById('playlistLoopBtn');
  if (btn) {
    btn.textContent = isPlaylistLooping ? '🔁' : '➡️';
    btn.classList.toggle('active', isPlaylistLooping);
  }
}

function renderPlaylistBtn() {
  const badge = document.getElementById('playlistBadge');
  if (badge) {
    badge.style.display = playlist.length > 0 ? 'block' : 'none';
    badge.textContent = playlist.length;
  }
}

function updatePlaylistPage() {
  const container = document.getElementById('playlistContent');
  if (!container) return;
  if (playlist.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🎵</div><p>播放列表为空</p><p class="hint">在音频列表中长按或点击 ➕ 添加</p></div>`;
    return;
  }
  container.innerHTML = `
    <div class="playlist-toolbar">
      <button onclick="playPlaylist()" class="playlist-play-btn">▶️ 从头播放</button>
      <button onclick="togglePlaylistLoop()" id="playlistLoopBtn" class="${isPlaylistLooping ? 'active' : ''}" style="background:var(--bg3);border:none;color:var(--text);padding:8px 14px;border-radius:8px;cursor:pointer;">${isPlaylistLooping ? '🔁' : '➡️'}</button>
      <button onclick="clearPlaylist()" style="background:var(--bg3);border:none;color:var(--text3);padding:8px 14px;border-radius:8px;cursor:pointer;">🗑️ 清空</button>
    </div>
    ${playlist.map((id, i) => {
      const audio = getAllAudios().find(a => a.id === id);
      if (!audio) return '';
      const isCurrent = id === currentAudioId && playlist.length > 0;
      return `<div class="audio-card ${isCurrent ? 'playing' : ''}" style="${isCurrent ? 'border-left:3px solid var(--primary);' : ''}">
        <div class="audio-card-header" onclick="playlistIndex=${i};selectAudio('${id}')">
          <div>
            <div class="audio-title">${i + 1}. ${audio.title}</div>
            <div class="audio-subtitle">${audio.subtitle || ''}</div>
          </div>
          <span style="font-size:20px;">${isCurrent ? '🎵' : '▶️'}</span>
        </div>
        <div style="text-align:right;margin-top:4px;">
          <button onclick="event.stopPropagation();removeFromPlaylist('${id}')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:12px;">✕ 移出</button>
        </div>
      </div>`;
    }).join('')}
  `;
}

function savePlaylist() {
  localStorage.setItem('damo_playlist', JSON.stringify(playlist));
}

function loadPlaylist() {
  const saved = localStorage.getItem('damo_playlist');
  if (saved) playlist = JSON.parse(saved);
}

// ===== 多选模式 =====
let selectedAudioIds = new Set();

function toggleSelectMode() {
  isSelectMode = !isSelectMode;
  selectedAudioIds.clear();
  renderAudioList();
  const btn = document.getElementById('selectModeBtn');
  if (btn) {
    btn.textContent = isSelectMode ? '✕ 取消' : '☑️ 多选';
    btn.classList.toggle('active', isSelectMode);
  }
  const addBar = document.getElementById('selectAddBar');
  if (addBar) addBar.style.display = isSelectMode ? 'flex' : 'none';
}

function toggleSelectAudio(audioId) {
  if (selectedAudioIds.has(audioId)) selectedAudioIds.delete(audioId);
  else selectedAudioIds.add(audioId);
  const card = document.querySelector(`.audio-card[data-id="${audioId}"]`);
  if (card) card.classList.toggle('selected', selectedAudioIds.has(audioId));
  const countEl = document.getElementById('selectCount');
  if (countEl) countEl.textContent = `已选 ${selectedAudioIds.size} 首`;
}

function addSelectedToPlaylist() {
  if (selectedAudioIds.size === 0) { showToast('请先选择音频'); return; }
  let added = 0;
  selectedAudioIds.forEach(id => {
    if (!playlist.includes(id)) { playlist.push(id); added++; }
  });
  savePlaylist();
  renderPlaylistBtn();
  showToast(`✅ 已添加 ${added} 首到播放列表`);
  toggleSelectMode();
  showPage('playlist');
}

function prevLrc() {
  if (!lrcLines.length) return;
  const i = Math.max(0, currentLrcIndex - 1);
  jumpToLrc(i);
}

function nextLrc() {
  if (!lrcLines.length) return;
  
  // 循环模式：跳到循环块结束后的第一个句子
  if ((isLoopingSentence || isSentenceLoop5x) && currentLrcIndex >= 0 && loopSentenceEnd > 0) {
    let nextIdx = currentLrcIndex + 1;
    while (nextIdx < lrcLines.length && lrcLines[nextIdx].time < loopSentenceEnd - 0.05) {
      nextIdx++;
    }
    if (nextIdx >= lrcLines.length) nextIdx = lrcLines.length - 1;
    jumpToLrc(nextIdx);
    return;
  }
  
  const i = Math.min(lrcLines.length - 1, currentLrcIndex + 1);
  jumpToLrc(i);
}

function jumpToLrc(idx) {
  currentTime = lrcLines[idx].time;
  currentLrcIndex = idx;
  sentenceStartTime = Date.now();
  
  // 实际设置音频播放位置
  const globalAudio = document.getElementById('globalAudio');
  if (globalAudio) {
    globalAudio.currentTime = currentTime;
  }
  
  // 5次循环模式：跳转时重新设置当前句子的循环边界
  if (isSentenceLoop5x) {
    let blockStart = idx;
    while (blockStart > 0 && (lrcLines[blockStart].time - lrcLines[blockStart - 1].time) < 0.5) blockStart--;
    let blockEnd = idx;
    while (blockEnd < lrcLines.length - 1 && (lrcLines[blockEnd + 1].time - lrcLines[blockEnd].time) < 0.5) blockEnd++;
    loopSentenceStart = lrcLines[blockStart].time;
    loopSentenceEnd = (blockEnd < lrcLines.length - 1) ? lrcLines[blockEnd + 1].time : loopSentenceStart + 10;
    sentenceLoop5xCount = 1;
    updateLoop5xProgress();
  }
  
  updateCurrentSentenceStats();
  updateFavBtn();
  updateUI();
  if (!isPlaying) startPlay();
}

function setSpeed(s) {
  playbackRate = s;
  // 应用到音频元素
  const globalAudio = document.getElementById('globalAudio');
  if (globalAudio) {
    globalAudio.playbackRate = s;
  }
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
}

function seekTo(e) {
  const bar = e.currentTarget;
  const rect = bar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  currentTime = percent * getDuration();
  let idx = -1;
  for (let i = 0; i < lrcLines.length; i++) {
    if (lrcLines[i].time <= currentTime) idx = i;
    else break;
  }
  if (idx !== currentLrcIndex) {
    currentLrcIndex = idx;
    sentenceStartTime = Date.now();
    updateCurrentSentenceStats();
    updateFavBtn();
  }
  updateUI();
}

function selectAudio(audioId, stayOnPage = false, autoPlay = true) {
  // 先停止当前播放，避免同时播两路音频
  pausePlay();
  
  currentAudioId = audioId;
  const audio = getAllAudios().find(a => a.id === audioId);
  if (!audio) return;
  const titleEl = document.getElementById('playerTitle');
  const subtitleEl = document.getElementById('playerSubtitle');
  const durationEl = document.getElementById('duration');
  if (titleEl) titleEl.textContent = audio.title;
  if (subtitleEl) subtitleEl.textContent = audio.subtitle;
  if (durationEl) durationEl.textContent = fmt(audio.duration);
  currentTime = 0;
  currentLrcIndex = -1;
  isPlaying = false;
  // 切换歌曲时重置单句循环状态
  isLoopingSentence = false;
  loopSentenceStart = -1;
  loopSentenceEnd = -1;
  updateLoopBtn();
  // 切换歌曲时重置5次循环状态
  isSentenceLoop5x = false;
  sentenceLoop5xCount = 0;
  updateLoop5xBtn();
  updateLoop5xProgress();
  // 设置音频文件
  const globalAudio = document.getElementById('globalAudio');
  if (globalAudio) {
    if (audio.file) {
      globalAudio.src = audioUrl(audio.file);
      globalAudio.load();
    } else {
      globalAudio.src = '';
    }
  }
  // 加载 lrc（优先从缓存）
  if (audio.lrcFile) {
    const lrcKey = 'lrc_' + audio.lrcFile;
    const cached = cacheGet(lrcKey);
    const renderFn = (text) => {
      lrcLines = parseLRC(text);
      renderLrcList();
      updateMasteryStats();
      updateUI();
      if (autoPlay) startPlay();
    };
    if (cached && cached.text) {
      console.log('[CACHE] LRC from cache');
      renderFn(cached.text);
    }
    fetch(audioUrl(audio.lrcFile))
      .then(r => r.text())
      .then(text => {
        cacheSet(lrcKey, {text});
        if (!cached) renderFn(text);
      })
      .catch(e => {
        console.error('[LRC] fetch failed:', e, 'url:', audioUrl(audio.lrcFile));
        lrcLines = [];
        renderLrcList();
        if (autoPlay) startPlay();
      });
  } else if (audio.lrc) {
    lrcLines = parseLRC(audio.lrc);
    if (autoPlay) startPlay();
  } else {
    lrcLines = [];
    if (autoPlay) startPlay();
  }
  updateUI();
  renderLrcList();
  updateMasteryStats();
  // 如果不保持在当前页面，则跳转到播放器页面
  if (!stayOnPage) {
    showPage('player');
  }
}

function updateUI() {
  const ctEl = document.getElementById('currentTime');
  if (ctEl) ctEl.textContent = fmt(currentTime);
  
  // 单句循环模式下，锁定 currentLrcIndex，不让它随时间推进
  if (!isLoopingSentence) {
    let idx = -1;
    for (let i = 0; i < lrcLines.length; i++) {
      if (lrcLines[i].time <= currentTime) idx = i;
      else break;
    }
    if (idx >= 0) {
      currentLrcIndex = idx;
    }
  }
  
  // 显示当前句子（使用锁定的 currentLrcIndex）
  if (currentLrcIndex >= 0 && currentLrcIndex < lrcLines.length) {
    const lrcEl = document.getElementById('currentLrc');
    if (lrcEl) lrcEl.textContent = lrcLines[currentLrcIndex].text;
    renderLrcList();
    const el = document.querySelector(`.lrc-item[data-idx="${currentLrcIndex}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  updateFavBtn();
}

function updateProgressBar() {
  const duration = getDuration();
  const fill = document.getElementById('progressFill');
  if (fill) fill.style.width = `${duration > 0 ? (currentTime / duration) * 100 : 0}%`;
}

function updateCurrentSentenceStats() {
  if (currentLrcIndex < 0) {
    const spEl = document.getElementById('sentencePlays');
    const ppEl = document.getElementById('sentenceProgress');
    if (spEl) spEl.textContent = '0';
    if (ppEl) ppEl.textContent = '0%';
    return;
  }
  const stats = getOrCreateStats(lrcLines[currentLrcIndex].time);
  const spEl = document.getElementById('sentencePlays');
  const ppEl = document.getElementById('sentenceProgress');
  if (spEl) spEl.textContent = stats.plays;
  if (ppEl) ppEl.textContent = `${getSentenceProgress(lrcLines[currentLrcIndex].time)}%`;
}

function updateMasteryStats() {
  const mastered = lrcLines.filter(l => isSentenceMastered(l.time)).length;
  const total = lrcLines.length;
  const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const mpEl = document.getElementById('masteryPercent');
  const mfEl = document.getElementById('masteryFill');
  const mcEl = document.getElementById('masteredCount');
  const tcEl = document.getElementById('totalCount');
  if (mpEl) mpEl.textContent = `${percent}%`;
  if (mfEl) mfEl.style.width = `${percent}%`;
  if (mcEl) mcEl.textContent = mastered;
  if (tcEl) tcEl.textContent = total;
  renderAudioList();
}

function renderLrcList() {
  const container = document.getElementById('lrcList');
  if (!container) return;
  container.innerHTML = lrcLines.map((l, i) => {
    const progress = getSentenceProgress(l.time);
    const isDone = isSentenceMastered(l.time);
    const isFav = isFavorited(l.time);
    const cls = i === currentLrcIndex ? 'active' : '';
    const badge = isDone ? '<span class="badge done">✓</span>' :
                  progress > 0 ? `<span class="badge partial">${progress}%</span>` : '';
    return `<div class="lrc-item ${cls}" data-idx="${i}" onclick="jumpToLrc(${i})">
      <span class="fav ${isFav ? 'active' : ''}" onclick="event.stopPropagation();toggleFav(${l.time})">${isFav ? '★' : '☆'}</span>
      ${badge}
      <span style="flex:1">${l.text}</span>
    </div>`;
  }).join('');
}

// ===== 收藏 =====
function isFavorited(time) {
  return favorites.some(f => f.audioId === currentAudioId && Math.abs(f.time - time) < 0.5);
}

function toggleFav(time) {
  const idx = favorites.findIndex(f => f.audioId === currentAudioId && Math.abs(f.time - time) < 0.5);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    const line = lrcLines.find(l => Math.abs(l.time - time) < 0.5);
    if (line) favorites.push({ audioId: currentAudioId, time: line.time, text: line.text });
  }
  saveFavorites();
  updateFavBtn();
  renderLrcList();
  renderFavorites();
}

function toggleFavoriteCurrent() {
  if (currentLrcIndex >= 0) toggleFav(lrcLines[currentLrcIndex].time);
}

function updateFavBtn() {
  const btn = document.getElementById('mainFavBtn');
  if (!btn) return;
  const isFav = currentLrcIndex >= 0 && isFavorited(lrcLines[currentLrcIndex].time);
  btn.textContent = isFav ? '★' : '☆';
  btn.classList.toggle('active', isFav);
}

function removeFavorite(idx) {
  favorites.splice(idx, 1);
  saveFavorites();
  renderFavorites();
  renderAudioList();
}

// 收藏页播放句子
function playFavSentence(idx, stayOnPage = false, enableLoop = false) {
  const fav = favorites[idx];
  if (!fav) return;

  // 辅助：设置当前收藏句子的结束时间
  const setFavEndTime = (target) => {
    if (favPlayMode && target >= 0 && target < lrcLines.length - 1) {
      favSentenceEndTime = lrcLines[target + 1].time;
    } else {
      favSentenceEndTime = Infinity;
    }
  };

  // 单句循环：只开启，不切换（避免重复调用导致关闭）
  const enableLoopIfNeeded = () => {
    if (enableLoop && !isLoopingSentence) toggleSentenceLoop();
  };

  // 同一音频：直接跳转并播放
  if (fav.audioId === currentAudioId && lrcLines.length > 0) {
    const target = lrcLines.findIndex(l => Math.abs(l.time - fav.time) < 0.5);
    if (target < 0) return;
    setFavEndTime(target);
    jumpToLrc(target);
    const globalAudio = document.getElementById('globalAudio');
    if (globalAudio && globalAudio.paused) {
      globalAudio.play().catch(() => {});
      isPlaying = true;
      updateUI();
    }
    enableLoopIfNeeded();
    if (!stayOnPage) showPage('player');
    return;
  }

  // 切换音频：stayOnPage=true 不跳播放器，autoPlay=true 让主 startPlay interval 处理播放和句子切换
  selectAudio(fav.audioId, stayOnPage, true);
  setTimeout(() => {
    const target = lrcLines.findIndex(l => Math.abs(l.time - fav.time) < 0.5);
    if (target >= 0) {
      setFavEndTime(target);
      jumpToLrc(target);
    }
    enableLoopIfNeeded();
    if (!stayOnPage) showPage('player');
  }, 150);
}

// 收藏页▶️播放：留在收藏页，顺序循环列表播放
function playFavByDisplayPos(displayPos) {
  if (favDisplayOrder.length === 0) return;
  const rawIdx = favDisplayOrder[displayPos];
  favPlayMode = true;
  favPlayIndex = displayPos;
  favSentenceEndTime = Infinity;
  isLoopingSentence = false;
  loopSentenceStart = -1;
  loopSentenceEnd = -1;
  playFavSentence(rawIdx, true, false);
}

// 收藏页🔁循环：单句循环播放（留在收藏页）
function playFavSentenceLoop(idx) {
  favPlayMode = false;
  favPlayIndex = -1;
  favSentenceEndTime = Infinity;
  updateFavHighlight(); // 清除高亮
  playFavSentence(idx, true, true);  // stayOnPage=true, enableLoop=true
}



// 在 favPlayMode 下切换到下一条收藏句子（由主 startPlay interval 调用）
// 逻辑极简：只做跳转和设置 favSentenceEndTime，不创建 interval，不调用 startPlay
function playFavSentenceInMode(idx) {
  const fav = favorites[idx];
  if (!fav) return;

  const doJump = (lrcLinesRef) => {
    const lrcIdx = lrcLinesRef.findIndex(l => Math.abs(l.time - fav.time) < 0.5);
    const target = lrcIdx >= 0 ? lrcIdx : (() => {
      let ci = 0, md = Infinity;
      lrcLinesRef.forEach((l, i) => { const d = Math.abs(l.time - fav.time); if (d < md) { md = d; ci = i; } });
      return ci;
    })();
    if (target < lrcLinesRef.length - 1) favSentenceEndTime = lrcLinesRef[target + 1].time;
    else favSentenceEndTime = Infinity;
    currentLrcIndex = target;
    currentTime = lrcLinesRef[target].time;
    sentenceStartTime = Date.now();
    const globalAudio = document.getElementById('globalAudio');
    if (globalAudio) globalAudio.currentTime = currentTime;
    updateCurrentSentenceStats();
    updateFavBtn();
    updateUI();
  };

  // 同一音频：直接跳转
  if (fav.audioId === currentAudioId && lrcLines.length > 0) {
    doJump(lrcLines);
    return;
  }

  // 切换音频
  currentAudioId = fav.audioId;
  lrcLines = [];
  const audio = getAllAudios().find(a => a.id === fav.audioId);
  if (!audio) return;
  const titleEl = document.getElementById('playerTitle');
  const subtitleEl = document.getElementById('playerSubtitle');
  if (titleEl) titleEl.textContent = audio.title;
  if (subtitleEl) subtitleEl.textContent = audio.subtitle;
  currentTime = 0;
  currentLrcIndex = -1;
  const globalAudio = document.getElementById('globalAudio');
  if (!globalAudio) return;
  globalAudio.pause();
  globalAudio.src = audioUrl(audio.file) || '';
  globalAudio.load();
  globalAudio.addEventListener('canplay', () => {
    globalAudio.playbackRate = playbackRate;
    if (audio.lrcFile) {
      const lrcKey2 = 'lrc_' + audio.lrcFile;
      const cached2 = cacheGet(lrcKey2);
      if (cached2 && cached2.text) {
        lrcLines = parseLRC(cached2.text);
        renderLrcList();
        updateMasteryStats();
        doJump(lrcLines);
        globalAudio.play().catch(() => {});
      } else {
        fetch(audioUrl(audio.lrcFile)).then(r => r.text()).then(text => {
          cacheSet(lrcKey2, {text});
          lrcLines = parseLRC(text);
          renderLrcList();
          updateMasteryStats();
          doJump(lrcLines);
          globalAudio.play().catch(() => {});
        }).catch(e => { console.error('[LRC] fetch2 failed:', e); lrcLines = []; doJump([]); globalAudio.play().catch(() => {}); });
      }
    } else if (audio.lrc) {
      lrcLines = parseLRC(audio.lrc);
      doJump(lrcLines);
      globalAudio.play().catch(() => {});
    } else {
      lrcLines = [];
      doJump([]);
      globalAudio.play().catch(() => {});
    }
  }, { once: true });
  if (globalAudio.readyState >= 3) {
    globalAudio.dispatchEvent(new Event('canplay'));
  }
}



// ===== 单句循环播放 =====
function toggleSentenceLoop() {
  isLoopingSentence = !isLoopingSentence;
  if (isLoopingSentence) {
    // 关闭5次循环模式（互斥）
    if (isSentenceLoop5x) {
      isSentenceLoop5x = false;
      sentenceLoop5xCount = 0;
      updateLoop5xBtn();
      updateLoop5xProgress();
    }
    
    // 使用 currentLrcIndex（用户手动点击的句子），不按时间重新计算
    const idx = currentLrcIndex >= 0 ? currentLrcIndex : 0;
    
    // 找到自然边界：向前找上一个间隔 >0.5秒的句子作为段首
    let blockStart = idx;
    while (blockStart > 0 && (lrcLines[blockStart].time - lrcLines[blockStart - 1].time) < 0.5) {
      blockStart--;
    }
    // 向后找下一个间隔 >0.5秒的句子作为段尾
    let blockEnd = idx;
    while (blockEnd < lrcLines.length - 1 && (lrcLines[blockEnd + 1].time - lrcLines[blockEnd].time) < 0.5) {
      blockEnd++;
    }
    
    loopSentenceStart = lrcLines[blockStart].time;
    loopSentenceEnd = (blockEnd < lrcLines.length - 1) ? lrcLines[blockEnd + 1].time : loopSentenceStart + 10;
    
    console.log('[LOOP] 单句循环开启', {
      clickedIdx: idx,
      blockStart,
      blockEnd,
      startTime: loopSentenceStart,
      endTime: loopSentenceEnd,
      startText: lrcLines[blockStart]?.text,
      endText: lrcLines[blockEnd]?.text
    });
  } else {
    loopSentenceStart = -1;
    loopSentenceEnd = -1;
    console.log('[LOOP] 单句循环关闭');
  }
  updateLoopBtn();
  showToast(isLoopingSentence ? '🔁 单句循环已开启' : '▶️ 单句循环已关闭');
}

function updateLoopBtn() {
  const btn = document.getElementById('loopBtn');
  if (btn) {
    btn.textContent = isLoopingSentence ? '🔁' : '➡️';
    btn.classList.toggle('active', isLoopingSentence);
    btn.title = isLoopingSentence ? '单句循环中，点击关闭' : '点击开启单句循环';
  }
}

// ===== 单句循环5次后自动下一句 =====
function toggleSentenceLoop5x() {
  if (!lrcLines.length) { showToast('⚠️ 请先播放音频'); return; }
  isSentenceLoop5x = !isSentenceLoop5x;
  if (isSentenceLoop5x) {
    // 启用5次循环：利用 isLoopingSentence 的循环机制
    if (!isLoopingSentence) {
      isLoopingSentence = true;
      const idx = currentLrcIndex >= 0 ? currentLrcIndex : 0;
      let blockStart = idx;
      while (blockStart > 0 && (lrcLines[blockStart].time - lrcLines[blockStart - 1].time) < 0.5) {
        blockStart--;
      }
      let blockEnd = idx;
      while (blockEnd < lrcLines.length - 1 && (lrcLines[blockEnd + 1].time - lrcLines[blockEnd].time) < 0.5) {
        blockEnd++;
      }
      loopSentenceStart = lrcLines[blockStart].time;
      loopSentenceEnd = (blockEnd < lrcLines.length - 1) ? lrcLines[blockEnd + 1].time : loopSentenceStart + 10;
      updateLoopBtn();
    }
    sentenceLoop5xCount = 1;
    console.log('[LOOP5X] 5次循环开启', { count: sentenceLoop5xCount });
  } else {
    // 关闭5次循环
    if (isLoopingSentence) {
      isLoopingSentence = false;
      loopSentenceStart = -1;
      loopSentenceEnd = -1;
      updateLoopBtn();
    }
    sentenceLoop5xCount = 0;
    console.log('[LOOP5X] 5次循环关闭');
  }
  updateLoop5xBtn();
  updateLoop5xProgress();
  showToast(isSentenceLoop5x ? '🔂 5次循环开启，每句循环5次后自动下一句' : '▶️ 5次循环已关闭');
}

function updateLoop5xBtn() {
  const btn = document.getElementById('loop5xBtn');
  if (btn) {
    btn.classList.toggle('active', isSentenceLoop5x);
    btn.title = isSentenceLoop5x ? `5次循环中 (${sentenceLoop5xCount}/${loop5xTarget})，点击关闭` : '单句循环5次后自动下一句';
  }
}

function isShortSentence(t) { if (!t) return 1; return t.trim().split(/\s+/).length <= shortWordThreshold; }

function updateLoop5xProgress() {
  const el = document.getElementById('loop5xProgress');
  const countEl = document.getElementById('loop5xCount');
  if (el) {
    el.style.display = isSentenceLoop5x ? 'flex' : 'none';
  }
  if (countEl) {
    countEl.textContent = isSentenceLoop5x ? sentenceLoop5xCount : '0';
  }
  updateLoop5xBtn();
}

function showToast(message) {
  const existing = document.querySelector('.toast-message');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(237, 104, 17, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    animation: fadeInOut 2s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function renderFavorites() {
  const container = document.getElementById('favoritesContent');
  const badge = document.getElementById('favBadge');
  if (!container) return;

  if (favorites.length === 0) {
    if (badge) badge.style.display = 'none';
    container.innerHTML = `<div class="empty-state">
      <div class="icon">📚</div>
      <p>还没有收藏任何句子</p>
      <p class="hint">在播放器中点击 ☆ 收藏</p>
    </div>`;
    return;
  }

  if (badge) {
    badge.style.display = 'block';
    badge.textContent = favorites.length;
  }

  const grouped = {};
  favorites.forEach((f, idx) => {
    const audio = getAllAudios().find(a => a.id === f.audioId);
    const name = audio ? audio.title : f.audioId;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push({ ...f, idx });
  });

  // 构建与页面显示完全一致的顺序（按文章分组后，组内按原始 idx 排列）
  favDisplayOrder = [];
  Object.values(grouped).forEach(items => {
    items.forEach(item => favDisplayOrder.push(item.idx));
  });

  // 变速按钮 HTML（复用播放页逻辑）
  const speedBtns = [0.75, 1, 1.25].map(s => 
    `<button class="fav-speed-btn ${playbackRate === s ? 'active' : ''}" onclick="setSpeed(${s})">${s}x</button>`
  ).join('');

  container.innerHTML = `
    <div class="fav-speed-row">${speedBtns}</div>
    <div class="fav-toolbar" style="display:flex;gap:8px;padding:8px 0;">
      <button onclick="toggleFavLoop5x()" style="background:var(--bg3);border:none;color:var(--text);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">${favLoop5x ? '🔂 5次' : '🔂 5次'}</button>
      <button onclick="toggleFavListLoop()" style="background:var(--bg3);border:none;color:var(--text);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">${isFavListLooping ? '🔁 列表循环' : '➡️'}</button>
    </div>
    ${Object.entries(grouped).map(([audioName, items]) => `
      <div class="fav-audio-group">
        <div class="fav-audio-header">
          <h3>${audioName}</h3>
          <span class="count">${items.length} 句</span>
        </div>
        ${items.map(item => {
          const displayPos = favDisplayOrder.indexOf(item.idx);
          const progress = getSentenceProgress(item.time);
          const stats = getOrCreateStats(item.time);
          const isPlaying = favPlayMode && favPlayIndex === displayPos;
          return `<div class="fav-sentence ${isPlaying ? 'playing' : ''}" data-display-pos="${displayPos}">
            <div class="fav-sentence-text">${item.text}</div>
            <div class="fav-sentence-meta">
              <div class="fav-sentence-info">
                <span>${stats.plays}</span> / ${TARGET_PLAYS} 遍 · ${progress}%
              </div>
              <div class="fav-sentence-actions">
                <button class="fav-action-btn play" onclick="playFavByDisplayPos(${displayPos})">▶️ 播放</button>
                <button class="fav-action-btn loop" onclick="playFavSentenceLoop(${item.idx})">🔁 循环</button>
                <button class="fav-action-btn remove" onclick="removeFavorite(${item.idx})">🗑️</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `).join('')}
  `;
}

// 更新收藏页当前播放句子高亮
function updateFavHighlight() {
  document.querySelectorAll('.fav-sentence.playing').forEach(el => el.classList.remove('playing'));
  if (favPlayMode && favPlayIndex >= 0) {
    const playingEl = document.querySelector(`.fav-sentence[data-display-pos="${favPlayIndex}"]`);
    if (playingEl) playingEl.classList.add('playing');
  }
}

function toggleFavLoop5x() {
  favLoop5x = !favLoop5x;
  if (!favLoop5x) favLoop5xCount = 0;
  renderFavorites();
  showToast(favLoop5x ? '5x' : 'x');
}

function toggleFavListLoop() {
  isFavListLooping = !isFavListLooping;
  renderFavorites();
  showToast(isFavListLooping ? 'loop' : 'no loop');
}

// ===== 数据持久化 =====
function saveData() { localStorage.setItem('damo_sentence_stats', JSON.stringify(sentenceStats)); }
function saveFavorites() { localStorage.setItem('damo_favorites', JSON.stringify(favorites)); }
function loadData() {
  const saved = localStorage.getItem('damo_sentence_stats');
  if (saved) sentenceStats = JSON.parse(saved);
  const fav = localStorage.getItem('damo_favorites');
  if (fav) favorites = JSON.parse(fav);
}

// ===== 分类列表 =====
function switchCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`[data-cat="${cat}"]`);
  if (tab) tab.classList.add('active');
  renderAudioList();
}

function renderAudioList() {
  const container = document.getElementById('audioList');
  if (!container) return;
  
  // 加载中：显示等待动画
  if (!AUDIO_LIST_LOADED) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3);"><div style="font-size:24px;margin-bottom:12px;">⏳</div>正在加载音频列表...</div>';
    return;
  }
  
  const filtered = currentCategory === 'my'
    ? MY_AUDIOS
    : getAllAudios().filter(a => a.category === currentCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text3);">
        ${currentCategory === 'my' ? '📂 暂无自定义音频' : '暂无该分类音频'}
      </div>
      ${currentCategory === 'my' ? `
      <button onclick="openAddAudioModal()" style="width:100%;padding:16px;border-radius:12px;border:2px dashed var(--border);background:transparent;color:var(--primary);font-size:14px;cursor:pointer;">
        ➕ 添加自定义音频
      </button>` : ''}
    `;
    return;
  }

  const toolbar = isSelectMode ? `
    <div id="selectAddBar" style="display:flex;gap:8px;margin-bottom:12px;align-items:center;">
      <span id="selectCount" style="color:var(--text2);font-size:13px;">已选 0 首</span>
      <button onclick="addSelectedToPlaylist()" style="flex:1;padding:8px;border-radius:8px;border:none;background:var(--primary);color:white;font-size:13px;cursor:pointer;">➕ 加入播放列表</button>
    </div>` : '';

  container.innerHTML = (currentCategory === 'my' ? `
    <button onclick="openAddAudioModal()" style="width:100%;padding:12px;margin-bottom:12px;border-radius:10px;border:none;background:var(--primary);color:white;font-size:13px;cursor:pointer;">
      ➕ 添加自定义音频
    </button>
  ` : '') + toolbar + filtered.map(audio => {
    const mastered = getAudioMasteredCount(audio.id);
    const total = countLrcLines(audio.lrc);
    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;
    const inPlaylist = playlist.includes(audio.id);
    const isSelected = selectedAudioIds.has(audio.id);
    return `<div class="audio-card ${isSelected ? 'selected' : ''}" data-id="${audio.id}" onclick="${isSelectMode ? `toggleSelectAudio('${audio.id}')` : `selectAudio('${audio.id}')`}">
      <div class="audio-card-header">
        <div style="flex:1">
          <div class="audio-title">${isSelected ? '☑️ ' : ''}${audio.title}</div>
          <div class="audio-subtitle">${audio.subtitle || ''}</div>
        </div>
        ${isSelectMode ? '' : `<button onclick="event.stopPropagation();addToPlaylist('${audio.id}')" style="background:none;border:1px solid ${inPlaylist ? 'var(--primary)' : 'var(--border)'};color:${inPlaylist ? 'var(--primary)' : 'var(--text3)'};padding:4px 8px;border-radius:6px;cursor:pointer;font-size:12px;white-space:nowrap;">${inPlaylist ? '✓列表' : '＋列表'}</button>`}
      </div>
      <div class="audio-meta">
        <span>⏱️ ${fmt(audio.duration)}</span>
        <span>📝 ${total} 句</span>
        <span>✅ ${mastered} 已掌握</span>
      </div>
    </div>`;
  }).join('');
}

// ===== 添加音频弹窗 =====
function openAddAudioModal() {
  const modal = document.getElementById('addAudioModal');
  if (modal) {
    modal.style.display = 'flex';
    const t = document.getElementById('newAudioTitle');
    const s = document.getElementById('newAudioSubtitle');
    const c = document.getElementById('newAudioCategory');
    const l = document.getElementById('newAudioLrc');
    if (t) t.value = '';
    if (s) s.value = '';
    if (c) c.value = 'listening';
    if (l) l.value = '';
  }
}

function closeAddAudioModal() {
  const modal = document.getElementById('addAudioModal');
  if (modal) modal.style.display = 'none';
}

function saveNewAudio() {
  const title = document.getElementById('newAudioTitle').value.trim();
  const subtitle = document.getElementById('newAudioSubtitle').value.trim();
  const category = document.getElementById('newAudioCategory').value;
  const lrc = document.getElementById('newAudioLrc').value.trim();
  if (!title) { alert('请输入音频标题'); return; }
  if (!lrc) { alert('请输入LRC歌词内容'); return; }

  const id = 'my-audio-' + Date.now();
  const lines = lrc.split('\n');
  let maxTime = 0;
  const reg = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
  for (const line of lines) {
    const m = line.match(reg);
    if (m) {
      const t = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3]) / 100;
      if (t > maxTime) maxTime = t;
    }
  }

  MY_AUDIOS.push({ id, category, isMyAudio: true, title, subtitle, duration: Math.max(maxTime + 10, 60), lrc });
  localStorage.setItem('damo_my_audios', JSON.stringify(MY_AUDIOS));
  renderAudioList();
  closeAddAudioModal();
}

// ===== 导航 =====
function showPage(page) {
  // 切换到非收藏页时退出收藏列表播放模式
  if (page !== 'fav') {
    favPlayMode = false;
    favPlayIndex = -1;
    favSentenceEndTime = Infinity;
    updateFavHighlight(); // 清除高亮
  }
  document.querySelectorAll('.page, .page-with-header').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (page === 'list') {
    const lp = document.getElementById('listPage');
    if (lp) { lp.style.display = 'flex'; renderAudioList(); }
    const nb = document.querySelector('[data-page="list"]');
    if (nb) nb.classList.add('active');
  } else if (page === 'player') {
    const pp = document.getElementById('playerPage');
    if (pp) pp.style.display = 'block';
    const pb = document.querySelector('[data-page="player"]');
    if (pb) pb.classList.add('active');
    
    // 恢复播放器状态
    if (currentAudioId) {
      renderLrcList();
      updateMasteryStats();
      updateLoop5xProgress();
      updateLoop5xBtn();
    }
  } else if (page === 'fav') {
    const fp = document.getElementById('favPage');
    if (fp) { fp.style.display = 'flex'; renderFavorites(); }
    const fb = document.querySelector('[data-page="fav"]');
    if (fb) fb.classList.add('active');
  } else if (page === 'playlist') {
    const plp = document.getElementById('playlistPage');
    if (plp) { plp.style.display = 'flex'; updatePlaylistPage(); }
    const plb = document.querySelector('[data-page="playlist"]');
    if (plb) plb.classList.add('active');
  }
}

// ===== 耳机线控 =====
let lastPlayToggleTime = 0;
const DOUBLE_CLICK_MS = 500;

function handlePlayToggle() {
  const now = Date.now();
  if (now - lastPlayToggleTime < DOUBLE_CLICK_MS) {
    // 双击 → 下一句
    lastPlayToggleTime = 0; // 重置，防止三连击
    nextLrc();
  } else {
    lastPlayToggleTime = now;
    togglePlay();
    // 如果在双击窗口内再次触发，由下一次调用处理
    setTimeout(() => { if (lastPlayToggleTime === now) lastPlayToggleTime = 0; }, DOUBLE_CLICK_MS);
  }
}

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => handlePlayToggle());
  navigator.mediaSession.setActionHandler('pause', () => handlePlayToggle());
  navigator.mediaSession.setActionHandler('previoustrack', () => prevLrc());
  navigator.mediaSession.setActionHandler('nexttrack', () => nextLrc());
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') prevLrc();
  else if (e.key === 'ArrowRight') nextLrc();
  else if (e.key === ' ') { e.preventDefault(); handlePlayToggle(); }
  else if (e.key === 'f' || e.key === 'F') toggleFavoriteCurrent();
  else if (e.key === 'MediaPlayPause') handlePlayToggle();
  else if (e.key === 'MediaTrackNext') nextLrc();
  else if (e.key === 'MediaTrackPrevious') prevLrc();
});

function updateMediaSession() {
  if ('mediaSession' in navigator && currentAudioId) {
    const audio = getAllAudios().find(a => a.id === currentAudioId);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: audio ? audio.title : '达摩外语',
      artist: 'IELTS Learning',
      album: '英语听力练习'
    });
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }
}

// ===== 导出全局函数 =====
window.selectAudio = selectAudio;
window.togglePlay = togglePlay;
window.startPlay = startPlay;
window.pausePlay = pausePlay;
window.prevLrc = prevLrc;
window.nextLrc = nextLrc;
window.jumpToLrc = jumpToLrc;
window.setSpeed = setSpeed;
window.seekTo = seekTo;
window.toggleFav = toggleFav;
window.toggleFavoriteCurrent = toggleFavoriteCurrent;
window.playFavSentence = playFavSentence;
window.playFavSentenceLoop = playFavSentenceLoop;
window.playFavByDisplayPos = playFavByDisplayPos;
window.updateFavHighlight = updateFavHighlight;
window.toggleFavLoop5x = toggleFavLoop5x;
window.toggleFavListLoop = toggleFavListLoop;
window.removeFavorite = removeFavorite;
window.showPage = showPage;
window.switchCategory = switchCategory;
window.openAddAudioModal = openAddAudioModal;
window.closeAddAudioModal = closeAddAudioModal;
window.toggleSentenceLoop = toggleSentenceLoop;
window.setShortWordThreshold = setShortWordThreshold;
window.setLoop5xTarget = setLoop5xTarget;
window.toggleSentenceLoop5x = toggleSentenceLoop5x;
window.saveNewAudio = saveNewAudio;
// 短句阈值设置
function setShortWordThreshold(val) {
  shortWordThreshold = parseInt(val);
  localStorage.setItem('shortWordThreshold', val);
  showToast('\u77ed\u53e5\u9608\u503c\u5df2\u8bbe\u4e3a ' + val + ' \u8bcd');
}
function setLoop5xTarget(val) {
  loop5xTarget = parseInt(val);
  localStorage.setItem('loop5xTarget', val);
  showToast('\u5faa\u73af\u6b21\u6570\u5df2\u8bbe\u4e3a ' + val + ' \u6b21');
}
// 播放列表相关
window.addToPlaylist = addToPlaylist;
window.removeFromPlaylist = removeFromPlaylist;
window.clearPlaylist = clearPlaylist;
window.playPlaylist = playPlaylist;
window.togglePlaylistLoop = togglePlaylistLoop;
window.toggleSelectMode = toggleSelectMode;
window.toggleSelectAudio = toggleSelectAudio;
window.addSelectedToPlaylist = addSelectedToPlaylist;
window.playNextAudio = playNextAudio;
window.playPrevAudio = playPrevAudio;

// ===== 初始化 & 渲染 =====
export function createApp(container) {
  container.innerHTML = `
    <div class="app">
      <!-- 全局音频元素 -->
      <audio id="globalAudio" style="display:none;" 
        onplay="console.log('[AUDIO] play event')"
        onpause="console.log('[AUDIO] pause event'); isPlaying = false;"
        onended="console.log('[AUDIO] ended event'); isPlaying = false; if(interval){clearInterval(interval);interval=null;} updateUI(); playNextAudio();"
        onerror="console.log('[AUDIO] error:', this.error)"
        onloadedmetadata="console.log('[AUDIO] duration:', this.duration)">
      </audio>
      <div class="page-with-header" id="listPage">
        <div class="page-header">
          <div class="app-header">
            <div class="app-header-logo">
              <div class="app-logo-icon">
                <svg width="40" height="40" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                  <!-- Background -->
                  <rect width="64" height="64" fill="#4A90D9"/>
                  <!-- Face base -->
                  <rect x="16" y="12" width="32" height="40" fill="#F5D0A9"/>
                  <!-- Hair -->
                  <rect x="12" y="8" width="40" height="12" fill="#4A3728"/>
                  <rect x="12" y="8" width="8" height="20" fill="#4A3728"/>
                  <rect x="44" y="8" width="8" height="20" fill="#4A3728"/>
                  <!-- Beard -->
                  <rect x="16" y="36" width="32" height="16" fill="#4A3728"/>
                  <rect x="12" y="32" width="8" height="20" fill="#4A3728"/>
                  <rect x="44" y="32" width="8" height="20" fill="#4A3728"/>
                  <rect x="20" y="48" width="24" height="8" fill="#4A3728"/>
                  <!-- Glasses frame -->
                  <rect x="14" y="22" width="16" height="12" fill="#333"/>
                  <rect x="34" y="22" width="16" height="12" fill="#333"/>
                  <rect x="30" y="26" width="4" height="4" fill="#333"/>
                  <!-- Glasses lenses -->
                  <rect x="16" y="24" width="12" height="8" fill="#87CEEB"/>
                  <rect x="36" y="24" width="12" height="8" fill="#87CEEB"/>
                  <!-- Eyes -->
                  <rect x="18" y="26" width="4" height="4" fill="#000"/>
                  <rect x="38" y="26" width="4" height="4" fill="#000"/>
                  <!-- Nose -->
                  <rect x="28" y="32" width="8" height="6" fill="#E8B896"/>
                  <!-- Mouth (smile) -->
                  <rect x="24" y="42" width="16" height="4" fill="#8B4513"/>
                </svg>
              </div>
              <div class="app-logo-text">
                <span class="app-name">雅思爹</span>
                <span class="app-tagline">IELTS Learning</span>
              </div>
            </div>
          </div>
          <div class="category-tabs">
            <button class="cat-tab active" data-cat="listening" onclick="switchCategory('listening')">🎧 听力</button>
            <button class="cat-tab" data-cat="speaking" onclick="switchCategory('speaking')">🗣️ 口语</button>
            <button class="cat-tab" data-cat="writing" onclick="switchCategory('writing')">✍️ 写作</button>
            <button class="cat-tab" data-cat="reading" onclick="switchCategory('reading')">📖 阅读</button>
            <button class="cat-tab" data-cat="my" onclick="switchCategory('my')">📁 我的</button>
          </div>
          <div style="display:flex;justify-content:flex-end;padding:4px 0 8px;">
            <button id="selectModeBtn" onclick="toggleSelectMode()" style="background:var(--bg3);border:none;color:var(--text2);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">☑️ 多选</button>
          </div>
        </div>
        <div class="page-content" id="audioList"></div>
      </div>

      <div class="page" id="playerPage" style="display:none;">
        <div class="player-cover">🎧</div>
        <div class="player-info">
          <div class="player-title" id="playerTitle">选择音频开始</div>
          <div class="player-subtitle" id="playerSubtitle"></div>
        </div>
        <div class="current-sentence-box">
          <span id="currentLrc">点击播放按钮开始</span>
          <button class="fav-btn" id="mainFavBtn" onclick="toggleFavoriteCurrent()">☆</button>
        </div>
        <div class="sentence-stats">
          <div class="stat-box">
            <div class="value" id="sentencePlays">0</div>
            <div class="label">已播放遍数</div>
          </div>
          <div class="stat-box">
            <div class="value" id="sentenceProgress">0%</div>
            <div class="label">进度 (100遍=100%)</div>
          </div>
        </div>
        <div class="global-progress">
          <div class="global-progress-header">
            <span>全文掌握进度</span>
            <span id="masteryPercent">0%</span>
          </div>
          <div class="global-progress-bar">
            <div class="global-progress-fill" id="masteryFill"></div>
          </div>
          <div class="global-progress-text">
            <span id="masteredCount">0</span> / <span id="totalCount">0</span> 句已掌握
          </div>
        </div>
        <div class="progress-container">
          <div class="progress-bar" onclick="seekTo(event)">
            <div class="progress-fill" id="progressFill"></div>
          </div>
          <div class="progress-time">
            <span id="currentTime">00:00</span>
            <span id="duration">00:00</span>
          </div>
        </div>
        <div class="controls">
          <button class="ctrl-btn" onclick="prevLrc()">⏮️</button>
          <button class="ctrl-btn play" id="playBtn" onclick="togglePlay()">▶️</button>
          <button class="ctrl-btn" onclick="nextLrc()">⏭️</button>
          <button class="ctrl-btn" id="loopBtn" onclick="toggleSentenceLoop()" title="点击开启单句循环">➡️</button>
          <button class="ctrl-btn" id="loop5xBtn" onclick="toggleSentenceLoop5x()" title="单句循环5次后自动下一句">🔂</button>
        </div>
        <div class="loop5x-progress" id="loop5xProgress" style="display:none;">
          <span id="loop5xCount">1</span>/<span id="loop5xTargetDisplay">${loop5xTarget}</span> 🔂
        </div>
        <div class="loop5x-settings" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;font-size:12px;color:var(--text2);flex-wrap:wrap;">
          <span>循环次数</span>
          <select onchange="setLoop5xTarget(this.value)" style="background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:6px;font-size:12px;">
            ${[2,3,4,5,6,7,8,9,10].map(n => `<option value="${n}" ${loop5xTarget === n ? 'selected' : ''}>${n} 次</option>`).join('')}
          </select>
          <span>短句≤</span>
          <select onchange="setShortWordThreshold(this.value)" style="background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:6px;font-size:12px;">
            ${[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(n => `<option value="${n}" ${shortWordThreshold === n ? 'selected' : ''}>${n} 词</option>`).join('')}
          </select>
        </div>
        <div class="speed-row">
          <button class="speed-btn" onclick="setSpeed(0.75)">0.75x</button>
          <button class="speed-btn active" onclick="setSpeed(1)">1x</button>
          <button class="speed-btn" onclick="setSpeed(1.25)">1.25x</button>
        </div>
        <div class="lrc-list" id="lrcList"></div>
      </div>

      <div class="page-with-header" id="favPage" style="display:none;">
        <div class="page-header">
          <h2 style="font-size:18px;font-weight:600;margin:0;padding:8px 0;">❤️ 我的收藏</h2>
        </div>
        <div class="page-content" id="favoritesContent"></div>
      </div>

      <div class="page-with-header" id="playlistPage" style="display:none;">
        <div class="page-header">
          <h2 style="font-size:18px;font-weight:600;margin:0;padding:8px 0;">🎵 播放列表</h2>
        </div>
        <div class="page-content" id="playlistContent"></div>
      </div>

      <!-- 添加音频弹窗 -->
      <div id="addAudioModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:1000;align-items:center;justify-content:center;padding:20px;">
        <div style="background:var(--bg2);border-radius:16px;width:100%;max-width:400px;max-height:90vh;overflow-y:auto;">
          <div style="padding:16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <h3 style="font-size:16px;">➕ 添加音频</h3>
            <button onclick="closeAddAudioModal()" style="background:none;border:none;color:var(--text2);font-size:24px;cursor:pointer;">✕</button>
          </div>
          <div style="padding:16px;">
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:12px;color:var(--text2);margin-bottom:6px;">音频标题</label>
              <input type="text" id="newAudioTitle" placeholder="如：我的雅思听力练习" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:14px;box-sizing:border-box;">
            </div>
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:12px;color:var(--text2);margin-bottom:6px;">副标题</label>
              <input type="text" id="newAudioSubtitle" placeholder="如：场景对话练习" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:14px;box-sizing:border-box;">
            </div>
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:12px;color:var(--text2);margin-bottom:6px;">分类</label>
              <select id="newAudioCategory" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:14px;box-sizing:border-box;">
                <option value="listening">🎧 听力</option>
                <option value="speaking">🗣️ 口语</option>
                <option value="writing">✍️ 写作</option>
                <option value="reading">📖 阅读</option>
              </select>
            </div>
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:12px;color:var(--text2);margin-bottom:6px;">LRC歌词内容</label>
              <textarea id="newAudioLrc" placeholder="格式示例：
[00:00.00]第一句台词
[00:05.00]第二句台词
[00:10.00]第三句台词" style="width:100%;height:200px;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:12px;font-family:monospace;box-sizing:border-box;resize:vertical;"></textarea>
            </div>
            <button onclick="saveNewAudio()" style="width:100%;padding:12px;border-radius:8px;border:none;background:var(--primary);color:white;font-size:14px;cursor:pointer;">保存音频</button>
          </div>
        </div>
      </div>

      <!-- 左侧导航 -->
      <nav class="nav">
        <button class="nav-item" data-page="player" onclick="showPage('player')">
          <span class="icon">🎧</span><span class="label">播放</span>
        </button>
        <button class="nav-item active" data-page="list" onclick="showPage('list')">
          <span class="icon">📚</span><span class="label">列表</span>
        </button>
        <button class="nav-item" data-page="playlist" onclick="showPage('playlist')" style="position:relative;">
          <span class="icon">🎵</span><span class="label">歌单</span>
          <span class="badge" id="playlistBadge" style="display:none;">0</span>
        </button>
        <button class="nav-item" data-page="fav" onclick="showPage('fav')" style="position:relative;">
          <span class="icon">❤️</span><span class="label">收藏</span>
          <span class="badge" id="favBadge" style="display:none;">0</span>
        </button>
      </nav>
    </div>
  `;

  // 确保默认显示列表页
  const listPage = document.getElementById('listPage');
  if (listPage) listPage.style.display = 'flex';
  const listNavBtn = document.querySelector('[data-page="list"]');
  if (listNavBtn) listNavBtn.classList.add('active');
  
  loadMyAudios();
  loadData();
  loadPlaylist();
  // 恢复上次播放进度
  try {
    const lastId = localStorage.getItem('lastAudioId');
    const lastTime = parseFloat(localStorage.getItem('lastAudioTime'));
    if (lastId && getAllAudios().find(a => a.id === lastId)) {
      selectAudio(lastId, true, false);
      if (lastTime > 0) {
        setTimeout(() => {
          const ga = document.getElementById('globalAudio');
          if (ga) { ga.currentTime = lastTime; currentTime = lastTime; }
        }, 300);
      }
    }
  } catch(e) {}
  renderAudioList();
  renderFavorites();
  updateFavBtn();
  renderPlaylistBtn();
  
  // ===== 侧滑返回支持 =====
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  const SWIPE_THRESHOLD = 80; // 滑动阈值（像素）
  const SWIPE_VELOCITY = 0.3; // 最小滑动速度
  const EDGE_THRESHOLD = 40; // 边缘触发区域（像素）

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;
    const velocity = Math.abs(deltaX) / deltaTime;

    // 判断是否为从左边缘开始的右滑
    const fromLeftEdge = touchStartX < EDGE_THRESHOLD;
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD;
    const isRightSwipe = deltaX > 0;
    const isFastEnough = velocity > SWIPE_VELOCITY;

    // 检查当前页面（需要排除模态框等）
    const modal = document.querySelector('#addAudioModal[style*="flex"], .modal[style*="flex"]');
    if (modal) return; // 弹窗打开时不响应侧滑

    if (fromLeftEdge && isHorizontalSwipe && isRightSwipe && (Math.abs(deltaX) > SWIPE_THRESHOLD * 1.5 || isFastEnough)) {
      // 隐藏的页面ID列表（可以从这些页面返回）
      const hideablePages = ['playerPage', 'favPage', 'playlistPage'];
      let currentPageId = null;
      hideablePages.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.style.display !== 'none') currentPageId = id;
      });

      if (currentPageId) {
        // 播放页面返回列表页
        if (currentPageId === 'playerPage') {
          showPage('list');
        }
        // 收藏/歌单页面返回播放页面
        else if (currentPageId === 'favPage' || currentPageId === 'playlistPage') {
          showPage('player');
        }
      }
    }
  }, { passive: true });
}
