// ==================== UTILITY FUNCTIONS ====================
const getEl = (id) => document.getElementById(id);

const parseCSV = (text) => {
    return text.trim().split('\n').map(line => {
        const regex = /(?:^|,)(?:"([^"]*)"|([^",]*))/g;
        const row = []; let match;
        while ((match = regex.exec(line)) !== null) { 
            row.push(match[1] ? match[1].replace(/""/g, '"') : match[2]); 
        }
        return row;
    });
};

const parseRupiah = (str) => {
    if (typeof str === 'number') return str;
    if (typeof str !== 'string') return 0;
    let cleaned = str.replace(/[Rp\s]/g, '');
    if (cleaned.includes(',') && cleaned.includes('.')) { 
        cleaned = cleaned.replace(/\./g, '').replace(',', '.'); 
    } else if (cleaned.includes(',') && !cleaned.includes('.')) { 
        cleaned = cleaned.replace(',', '.'); 
    }
    return parseFloat(cleaned) || 0;
};

const formatRupiah = (num) => {
    if (num === null || isNaN(num) || num === undefined) return 'Rp 0';
    const absNum = Math.abs(num);
    let formatted;
    if (absNum >= 1000) { 
        formatted = Math.floor(absNum).toString(); 
    } else { 
        formatted = absNum.toFixed(2); 
    }
    let [integer, decimal] = formatted.split('.');
    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const sign = num < 0 ? '- ' : '';
    return sign + 'Rp ' + integer + (decimal ? ',' + decimal : '');
};

const formatShortRupiah = (num) => {
    if (num >= 1000000000) {
        return 'Rp ' + (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return 'Rp ' + (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return 'Rp ' + (num / 1000).toFixed(1) + 'K';
    }
    return formatRupiah(num);
};

const parseDateSafe = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return new Date(NaN);
    const match1 = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})/);
    if (match1) return new Date(parseInt(match1[1],10), parseInt(match1[2],10)-1, parseInt(match1[3],10), parseInt(match1[4],10), parseInt(match1[5],10), parseInt(match1[6],10));
    const match2 = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{1,2})/);
    if (match2) return new Date(parseInt(match2[3],10), parseInt(match2[2],10)-1, parseInt(match2[1],10), parseInt(match2[4],10), parseInt(match2[5],10));
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? new Date(NaN) : fallback;
};

// ==================== AVATAR FUNCTIONS ====================
function findAvatarIdInConfig(rows) {        
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length > 0) {
            const label = (row[0] || '').toLowerCase();
            if (label.includes('avatar') || label.includes('foto') || label.includes('profile')) {
                
                if (row.length > 2 && row[2] && row[2].trim()) {
                    const avatarId = row[2].trim();
                    if (isValidDriveId(avatarId)) {
                        return avatarId;
                    }
                }
                
                if (row.length > 1 && row[1] && row[1].trim()) {
                    const avatarId = row[1].trim();
                    if (isValidDriveId(avatarId)) {
                        return avatarId;
                    }
                }
            }
        }
    }
    
    if (rows.length > 11 && rows[11].length > 2 && rows[11][2]) {
        const potentialId = rows[11][2].trim();
        if (isValidDriveId(potentialId)) {
            return potentialId;
        }
    }
    
    return CONFIG.DEFAULT_AVATAR_ID;
}

function isValidDriveId(id) {
    if (!id || typeof id !== 'string') return false;
    
    const cleanId = id.trim();
    if (cleanId.length < 10 || cleanId.length > 50) return false;
    if (cleanId.includes(' ')) return false;
    
    const patterns = [
        /^[a-zA-Z0-9_-]{15,}$/,
        /^https?:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/,
        /^https?:\/\/drive\.google\.com\/thumbnail\?id=[a-zA-Z0-9_-]+/,
        /^https?:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]+/
    ];
    
    return patterns.some(pattern => pattern.test(cleanId));
}

function extractDriveId(input) {
    if (!input) return CONFIG.DEFAULT_AVATAR_ID;
    
    let id = input.trim();
    
    const patterns = [
        /https?:\/\/drive\.google\.com\/file\/d\/([^\/]+)/,
        /https?:\/\/drive\.google\.com\/thumbnail\?id=([^&]+)/,
        /https?:\/\/drive\.google\.com\/open\?id=([^&]+)/,
        /https?:\/\/drive\.google\.com\/uc\?id=([^&]+)/
    ];
    
    for (const pattern of patterns) {
        const match = id.match(pattern);
        if (match && match[1]) {
            id = match[1];
            break;
        }
    }
    
    id = id.split('/')[0];
    id = id.split('?')[0];
    
    return id || CONFIG.DEFAULT_AVATAR_ID;
}

function buildFallbackAvatar(userName) {
    const name = userName || 'User';
    const cleanName = name.split('@')[0];
    const initials = cleanName.split(' ')
        .filter(word => word.length > 0)
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=667eea&color=fff&bold=true&size=150`;
}

function getAvatarUrl(avatarId, userName) {
    if (!isValidDriveId(avatarId)) {
        return buildFallbackAvatar(userName);
    }
    
    const cleanId = extractDriveId(avatarId);
    return `https://drive.google.com/thumbnail?id=${cleanId}&sz=w500`;
}

// ==================== DATA PROCESSING ====================
function processConfigData(rows) {
    const data = {
        totalAsetBruto: 0,
        totalLiabilitas: 0,
        asetNetto: 0,
        sisaTarget: 0,
        targetHariIdeal: 0,
        dailyRate: 0,
        estimasiDate: '',
        targetAset: CONFIG.DEFAULT_TARGET,
        runningText: 'Rheiwa lagi di-update nih...',
        dashboardName: 'Halo, Bekalaner! 👋',
        avatarId: findAvatarIdInConfig(rows),
        emailKontak: '',
        lastUpdated: new Date().toISOString()
    };
    
    rows.forEach((row, index) => {
        if (row.length < 2) return;
        const label = (row[0] || '').toLowerCase();
        const value = row[1];
        
        if (label.includes('total aset bruto')) data.totalAsetBruto = parseRupiah(value);
        else if (label.includes('total liabilitas')) data.totalLiabilitas = parseRupiah(value);
        else if (label.includes('aset netto')) data.asetNetto = parseRupiah(value);
        else if (label.includes('sisa target')) data.sisaTarget = parseRupiah(value);
        else if (label.includes('target hari ideal')) data.targetHariIdeal = parseInt(value) || 0;
        else if (label.includes('daily rate')) data.dailyRate = parseRupiah(value);
        else if (label.includes('target aset')) data.targetAset = parseRupiah(value);
        
        if (row.length > 2 && row[2]) {
            if (label.includes('estimasi tercapai')) data.estimasiDate = row[2];
            else if (label.includes('running_text')) data.runningText = row[2];
            else if (label.includes('nama_pengguna')) data.dashboardName = row[2];
            else if (label.includes('email_kontak')) data.emailKontak = row[2];
        }
    });
    
    return data;
}

function processLogData(rows) {
    const logData = [];
    rows.slice(1).forEach(row => {
        if (row.length < 4) return;
        const dateObj = parseDateSafe(row[0]);
        if (row[0] && !isNaN(parseRupiah(row[1]))) {
            logData.push({
                date: isNaN(dateObj.getTime()) ? row[0] : dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
                rawDate: isNaN(dateObj.getTime()) ? new Date() : dateObj,
                value: parseRupiah(row[1]),
                change: parseRupiah(row[2]) || 0,
                description: row[3] || '-'
            });
        }
    });
    return logData.sort((a, b) => b.rawDate - a.rawDate);
}

function processYearlyLogData(rows) {
    const yearlyData = [];
    rows.forEach(row => {
        if (row.length >= 7) { 
            const dateObj = parseDateSafe(row[5]); 
            const val = parseRupiah(row[6]);
            if (!isNaN(dateObj.getTime()) && !isNaN(val)) {
                yearlyData.push({ x: dateObj, y: val });
            }
        }
    });
    return yearlyData.sort((a, b) => a.x - b.x);
}
