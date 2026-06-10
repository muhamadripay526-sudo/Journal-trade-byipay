// Database Mockup via Local Storage
let tradesData = JSON.parse(localStorage.getItem('pro_journal_trades')) || [];

// Inisialisasi Ikon Lucide saat DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initApp();
});

// Sistem Navigasi Tab Single Page Application (SPA)
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = item.getAttribute('data-tab');
        switchTab(targetTab);
    });
});

function switchTab(tabId) {
    // Kelola Status Aktif di Menu Sidebar
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`[data-tab="${tabId}"]`);
    if(activeNav) activeNav.classList.add('active');

    // Kelola Visibilitas Konten Tab
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Update Judul Header Utama
    const titles = {
        'dashboard': 'Dashboard Utama',
        'add-trade': 'Input Jurnal Posisi',
        'journal-logs': 'Semua Riwayat Jurnal',
        'risk-calc': 'Manajemen Risiko',
        'ai-assistant': 'AI Performance Assistant'
    };
    document.getElementById('page-title').innerText = titles[tabId] || 'PRO-Journal';
}

// Inisialisasi Aplikasi & Hitung metrik data
function initApp() {
    calculateDashboardStats();
    renderRecentTable();
    renderFullJournalTable();
    runAIEngine();
}

// Event handler input trade baru
document.getElementById('trade-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Mengambil Emosi yang Diceklist
    const checkedEmotions = [];
    document.querySelectorAll('.psychology-checklist input:checked').forEach(cb => {
        checkedEmotions.push(cb.value);
    });

    const newTrade = {
        id: 'TRD-' + Date.now(),
        pair: document.getElementById('form-pair').value.toUpperCase(),
        type: document.getElementById('form-type').value,
        entry: parseFloat(document.getElementById('form-entry').value),
        lot: parseFloat(document.getElementById('form-lot').value),
        sl: parseFloat(document.getElementById('form-sl').value),
        tp: parseFloat(document.getElementById('form-tp').value),
        exit: parseFloat(document.getElementById('form-exit').value),
        pnl: parseFloat(document.getElementById('form-pnl').value),
        emotions: checkedEmotions.length > 0 ? checkedEmotions.join(', ') : 'Disiplin',
        notes: document.getElementById('form-notes').value,
        screenshot: document.getElementById('form-screenshot').value || '',
        date: new Date().toLocaleDateString('id-ID')
    };

    tradesData.unshift(newTrade); // Simpan di urutan teratas
    localStorage.setItem('pro_journal_trades', JSON.stringify(tradesData));
    
    // Reset Form & Kembali ke Dashboard
    this.reset();
    initApp();
    switchTab('dashboard');
});

// Perhitungan Statistik Metrik Utama Dashboard
function calculateDashboardStats() {
    if (tradesData.length === 0) {
        resetDashboardDOM();
        return;
    }

    let totalProfit = 0;
    let wins = 0;
    let totalRR = 0;
    let currentStreakWins = 0;
    let highestWinStreak = 0;

    tradesData.forEach(trade => {
        totalProfit += trade.pnl;
        if (trade.pnl > 0) {
            wins++;
            currentStreakWins++;
            if (currentStreakWins > highestWinStreak) highestWinStreak = currentStreakWins;
        } else {
            currentStreakWins = 0;
        }

        // Kalkulasi kasar Risk to Reward ratio
        let distanceRisk = Math.abs(trade.entry - trade.sl);
        let distanceReward = Math.abs(trade.exit - trade.entry);
        if(distanceRisk > 0) {
            totalRR += (distanceReward / distanceRisk);
        }
    });

    const totalTrades = tradesData.length;
    const winRate = Math.round((wins / totalTrades) * 100);
    const avgRR = (totalRR / totalTrades).toFixed(1);

    // Update DOM Dashboard
    document.getElementById('stat-total-profit').innerText = `$${totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('stat-total-profit').className = totalProfit >= 0 ? 'text-neon' : 'text-loss';
    
    document.getElementById('stat-winrate').innerText = `${winRate}%`;
    document.getElementById('winrate-progress').style.width = `${winRate}%`;
    
    document.getElementById('stat-total-trades').innerText = totalTrades;
    document.getElementById('stat-wins').innerText = wins;
    document.getElementById('stat-losses').innerText = totalTrades - wins;
    
    document.getElementById('stat-avg-rr').innerText = `1:${avgRR}`;
    document.getElementById('stat-streak').innerText = `Best Win Streak: ${highestWinStreak}`;

    // Update Progress Target Bulanan (Simulasi target $5000)
    const targetProgressPct = Math.min(Math.max((totalProfit / 5000) * 100, 0), 100);
    document.getElementById('target-current').innerText = `$${totalProfit.toFixed(0)}`;
    document.getElementById('target-progress').style.width = `${targetProgressPct}%`;
}

function resetDashboardDOM() {
    document.getElementById('stat-total-profit').innerText = "$0.00";
    document.getElementById('stat-winrate').innerText = "0%";
    document.getElementById('winrate-progress').style.width = "0%";
    document.getElementById('stat-total-trades').innerText = "0";
    document.getElementById('stat-avg-rr').innerText = "1:0.0";
    document.getElementById('target-current').innerText = "$0";
    document.getElementById('target-progress').style.width = "0%";
}

// Render Tabel Transaksi Terakhir di Dashboard
function renderRecentTable() {
    const tbody = document.querySelector('#recent-trades-table tbody');
    tbody.innerHTML = '';
    
    const recentTrades = tradesData.slice(0, 4); // Ambil maksimal 4 data terbaru
    if(recentTrades.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;" class="text-muted">Belum ada data transaksi.</td></tr>`;
        return;
    }

    recentTrades.forEach(trade => {
        const tr = document.createElement('tr');
        const statusClass = trade.pnl >= 0 ? 'badge-success' : 'badge-danger';
        const statusText = trade.pnl >= 0 ? 'WIN' : 'LOSS';
        
        tr.innerHTML = `
            <td><strong>${trade.pair}</strong></td>
            <td>${trade.type}</td>
            <td>${trade.entry}</td>
            <td>${trade.exit}</td>
            <td>1:2.0</td>
            <td class="${trade.pnl >= 0 ? 'text-neon' : 'text-loss'}">$${trade.pnl}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Render Seluruh Log Jurnal Transaksi di Tab Log Jurnal
function renderFullJournalTable() {
    const tbody = document.getElementById('journal-table-body');
    tbody.innerHTML = '';

    if(tradesData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;" class="text-muted">Tidak ada log jurnal trading.</td></tr>`;
        return;
    }

    tradesData.forEach((trade, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${trade.pair}</strong> <br><small class="text-muted">${trade.date}</small></td>
            <td>${trade.type}</td>
            <td>${trade.entry}</td>
            <td>${trade.exit}</td>
            <td>${trade.lot}</td>
            <td>1:1.5</td>
            <td class="${trade.pnl >= 0 ? 'text-neon' : 'text-loss'}">$${trade.pnl}</td>
            <td><span class="text-muted">${trade.emotions}</span></td>
            <td><button class="btn btn-text" style="color:var(--color-loss)" onclick="deleteTrade(${index})"><i data-lucide="trash-2"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons(); // render ulang icon setelah manipulasi DOM table
}

// Fungsi Hapus Item Jurnal
window.deleteTrade = function(index) {
    if(confirm("Apakah Anda yakin ingin menghapus catatan trade ini?")) {
        tradesData.splice(index, 1);
        localStorage.setItem('pro_journal_trades', JSON.stringify(tradesData));
        initApp();
    }
}

// Fitur Filter Pencarian Data Cepat di Tab Jurnal
document.getElementById('search-journal').addEventListener('input', function(e) {
    const term = e.target.value.toUpperCase();
    const rows = document.querySelectorAll('#journal-table-body tr');
    
    rows.forEach(row => {
        const pairCell = row.querySelector('td')?.innerText || '';
        if(pairCell.toUpperCase().includes(term)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// Fitur Kalkulator Ukuran Lot Posisi
window.calculateLotSize = function() {
    const balance = parseFloat(document.getElementById('calc-balance').value);
    const riskPct = parseFloat(document.getElementById('calc-risk-pct').value);
    const slPips = parseFloat(document.getElementById('calc-sl-pips').value);
    const pipValue = parseFloat(document.getElementById('calc-pip-value').value);

    const cashRisk = balance * (riskPct / 100);
    const lotSize = cashRisk / (slPips * pipValue);

    document.getElementById('result-lot').innerText = `${lotSize.toFixed(2)} Lot`;
    document.getElementById('result-cash').innerText = `$${cashRisk.toLocaleString()}`;
    document.getElementById('calc-lot-result').style.display = 'block';
}

// Fitur AI Trading Assistant (Analisis Psikologi & Performa Statis Otomatis)
function runAIEngine() {
    const aiBrief = document.getElementById('ai-brief-text');
    const aiFlaw = document.getElementById('ai-flaw');
    const aiStrength = document.getElementById('ai-strength');

    if(tradesData.length < 3) {
        return;
    }

    // Hitung Rasio Masalah Emosional Terbanyak
    let emotionsMap = {};
    let lossCounter = 0;
    
    tradesData.forEach(t => {
        if(t.pnl < 0) lossCounter++;
        let emoArr = t.emotions.split(', ');
        emoArr.forEach(emo => {
            emotionsMap[emo] = (emotionsMap[emo] || 0) + 1;
        });
    });

    // Urutkan emosi terbanyak
    let topEmotion = Object.keys(emotionsMap).reduce((a, b) => emotionsMap[a] > emotionsMap[b] ? a : b);

    // Output Insight AI Dinamis ke Panel UI
    aiBrief.innerText = `Sistem mendeteksi aktivitas perdagangan Anda stabil. Masalah emosional paling dominan saat ini berhubungan dengan keadaan "${topEmotion}".`;
    
    if (topEmotion === "FOMO" || topEmotion === "Revenge Trade") {
        aiFlaw.innerText = `AI Mendeteksi Anda rentan kehilangan modal karena ${topEmotion}. Ini biasanya memicu trade tanpa konfirmasi setup teknikal matang.`;
        aiStrength.innerText = `Performa terbaik Anda terjadi ketika Anda bersikap tenang dan memilih pola eksekusi yang direncanakan matang.`;
    } else {
        aiFlaw.innerText = `Anda memiliki kedisiplinan yang moderat, pertahankan membatasi resiko lot harian agar terhindar dari Drawdown ekstrem.`;
        aiStrength.innerText = `Pasangan aset (Pair) terakhir yang Anda gunakan mencatatkan rasio eksekusi yang bersih dan teratur.`;
    }
}

// Backup Ekspor File Data JSON
document.getElementById('btn-export').addEventListener('click', () => {
    if(tradesData.length === 0) return alert("Belum ada data untuk diekspor!");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tradesData));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PRO_Journal_Backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

// Fitur Mengubah Tema (Dark/Light mode)
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    document.getElementById('theme-toggle').innerHTML = isLight ? `<i data-lucide="moon"></i>` : `<i data-lucide="sun"></i>`;
    lucide.createIcons();
});

// Reset Seluruh Data Aplikasi
document.getElementById('btn-clear-data').addEventListener('click', () => {
    if(confirm("Apakah Anda ingin menghapus SEMUA data trading di jurnal? Tindakan ini permanen.")) {
        localStorage.removeItem('pro_journal_trades');
        tradesData = [];
        initApp();
    }
});
