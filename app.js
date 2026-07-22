// Database with 200 Player Entries
const baseStarters = [
    { id: "p1", name: "Pelé", pos: "CAM", tier: "icon", img: "https://upload.wikimedia.org/wikipedia/commons/5/54/Pele_by_John_Mathew_Smith_crop.png" },
    { id: "p2", name: "Zinedine Zidane", pos: "CM", tier: "icon", img: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg" },
    { id: "p3", name: "Kylian Mbappé", pos: "ST", tier: "toty", img: "https://upload.wikimedia.org/wikipedia/commons/5/57/Kylian_Mbapp%C3%A9_2018.jpg" },
    { id: "p4", name: "Erling Haaland", pos: "ST", tier: "gold", img: "https://upload.wikimedia.org/wikipedia/commons/3/33/Erling_Haaland_2023.jpg" },
    { id: "p5", name: "Jude Bellingham", pos: "CAM", tier: "gold", img: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Jude_Bellingham_2023.jpg" },
    { id: "p6", name: "Lionel Messi", pos: "CF", tier: "gold", img: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-World-Cup_%28cropped%29.jpg" },
    { id: "p7", name: "Cristiano Ronaldo", pos: "ST", tier: "gold", img: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg" },
    { id: "p8", name: "Vinícius Jr.", pos: "LW", tier: "gold", img: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Vinicius_Junior_2021.jpg" },
    { id: "p9", name: "Lamine Yamal", pos: "RW", tier: "gold", img: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Lamine_Yamal_2024.jpg" },
    { id: "p10", name: "Bukayo Saka", pos: "RW", tier: "silver", img: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Bukayo_Saka_2021.jpg" }
];

const positions = ["ST", "RW", "LW", "CAM", "CM", "CDM", "CB", "LB", "RB", "GK"];
const tiers = ["gold", "silver", "bronze", "toty", "icon"];
const playersDb = [...baseStarters];

for (let i = 11; i <= 200; i++) {
    playersDb.push({
        id: `p${i}`,
        name: `Player ${i}`,
        pos: positions[i % positions.length],
        tier: tiers[i % tiers.length],
        img: `https://api.dicebear.com/7.x/bottts/svg?seed=Player${i}`
    });
}

// DOM Elements
const playerSearch = document.getElementById("playerSearch");
const suggestionsList = document.getElementById("suggestionsList");
const spinBtn = document.getElementById("spinBtn");
const closeBtn = document.getElementById("closeBtn");
const openWheelBtn = document.getElementById("openWheelBtn");
const wheelSvg = document.getElementById("wheelSvg");
const modalOverlay = document.getElementById("modalOverlay");
const statusMsg = document.getElementById("statusMsg");

const fcCard = document.getElementById("fcCard");
const cardName = document.getElementById("cardName");
const cardOvr = document.getElementById("cardOvr");
const cardPos = document.getElementById("cardPos");
const playerPic = document.getElementById("playerPic");

const statsMap = {
    PAC: { val: document.getElementById("statPAC"), item: document.getElementById("itemPAC") },
    SHO: { val: document.getElementById("statSHO"), item: document.getElementById("itemSHO") },
    PAS: { val: document.getElementById("statPAS"), item: document.getElementById("itemPAS") },
    DRI: { val: document.getElementById("statDRI"), item: document.getElementById("itemDRI") },
    DEF: { val: document.getElementById("statDEF"), item: document.getElementById("itemDEF") },
    PHY: { val: document.getElementById("statPHY"), item: document.getElementById("itemPHY") }
};

// State Variables
let selectedPlayer = null;
let activeStatKey = "PAC";
let cardStats = { PAC: null, DRI: null, SHO: null, DEF: null, PAS: null, PHY: null };
let currentRotation = 0;

const fallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='32' r='20' fill='%23ffffff'/><path d='M20 90 C20 60, 30 50, 50 50 C70 50, 80 60, 80 90 Z' fill='%23ffffff'/></svg>";
playerPic.onerror = function() { this.src = fallbackSvg; };

const wheelNumbers = Array.from({ length: 50 }, (_, i) => i + 50);
const totalSegments = wheelNumbers.length;
const segmentAngle = 360 / totalSegments;

// Search Logic
playerSearch.addEventListener("input", () => {
    const query = playerSearch.value.trim().toLowerCase();
    suggestionsList.innerHTML = "";

    if (!query) { 
        suggestionsList.classList.remove("visible"); 
        return; 
    }

    const matches = playersDb.filter(p => p.name.toLowerCase().includes(query)).slice(0, 12);

    if (matches.length > 0) {
        matches.forEach(p => {
            const row = document.createElement("div");
            row.className = "suggestion-row";
            row.innerHTML = `<span>${p.name}</span><strong>${p.pos}</strong>`;
            row.addEventListener("click", () => selectPlayer(p));
            suggestionsList.appendChild(row);
        });
        suggestionsList.classList.add("visible");
    } else {
        suggestionsList.classList.remove("visible");
    }
});

function selectPlayer(player) {
    selectedPlayer = player;
    playerSearch.value = player.name;
    suggestionsList.classList.remove("visible");

    cardName.innerText = player.name;
    cardPos.innerText = player.pos;

    playerPic.style.opacity = "0";
    playerPic.src = player.img || fallbackSvg;
    playerPic.onload = () => { playerPic.style.opacity = "1"; };

    openWheelBtn.disabled = false;
    resetCardStats();
    fcCard.className = `fut-card-base tier-${player.tier}`;
}

function resetCardStats() {
    cardOvr.innerText = "--";
    for (const key in statsMap) {
        cardStats[key] = null;
        statsMap[key].val.innerText = "--";
    }
}

// Wheel Creation
function buildWheel() {
    let svgMarkup = "";
    const cx = 150, cy = 150, r = 140;

    wheelNumbers.forEach((num, idx) => {
        const startAngle = idx * segmentAngle;
        const endAngle = (idx + 1) * segmentAngle;
        
        const radStart = ((startAngle - 90) * Math.PI) / 180;
        const radEnd = ((endAngle - 90) * Math.PI) / 180;

        const x1 = cx + r * Math.cos(radStart);
        const y1 = cy + r * Math.sin(radStart);
        const x2 = cx + r * Math.cos(radEnd);
        const y2 = cy + r * Math.sin(radEnd);

        const color = idx % 2 === 0 ? "#0f2027" : "#203a43";
        
        svgMarkup += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z" fill="${color}" stroke="#00ff88" stroke-width="0.5"/>`;

        const textAngle = startAngle + (segmentAngle / 2);
        const textRad = ((textAngle - 90) * Math.PI) / 180;
        const tx = cx + (r - 20) * Math.cos(textRad);
        const ty = cy + (r - 20) * Math.sin(textRad);

        svgMarkup += `<text x="${tx}" y="${ty}" fill="#00ff88" font-size="8" font-weight="900" text-anchor="middle" transform="rotate(${textAngle}, ${tx}, ${ty})" dominant-baseline="central">${num}</text>`;
    });

    svgMarkup += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#00ff88" stroke-width="3"/>`;
    svgMarkup += `<circle cx="${cx}" cy="${cy}" r="20" fill="#00ff88" stroke="#06090e" stroke-width="3"/>`;

    wheelSvg.innerHTML = svgMarkup;
}

// Modal & Spin Logic
function openModalForStat(statKey) {
    if (!selectedPlayer) return;

    if (!statKey) {
        const unspunKey = Object.keys(cardStats).find(k => cardStats[k] === null);
        activeStatKey = unspunKey || "PAC";
    } else {
        activeStatKey = statKey;
    }

    modalOverlay.classList.add("active");
    spinBtn.disabled = false;
    spinBtn.innerText = `SPIN FOR ${activeStatKey}`;
    statusMsg.innerText = `ROLLING ${activeStatKey}`;
}

closeBtn.addEventListener("click", () => modalOverlay.classList.remove("active"));
openWheelBtn.addEventListener("click", () => openModalForStat(null));

Object.keys(statsMap).forEach(key => {
    statsMap[key].item.addEventListener("click", () => openModalForStat(key));
});

spinBtn.addEventListener("click", () => {
    if (!activeStatKey) return;

    spinBtn.disabled = true;
    spinBtn.innerText = "SPINNING...";

    const selectedIndex = Math.floor(Math.random() * totalSegments);
    const chosenValue = wheelNumbers[selectedIndex];

    const targetWedgeAngle = (selectedIndex * segmentAngle) + (segmentAngle / 2);
    const correctiveRotation = 360 - targetWedgeAngle; 

    currentRotation += 1440 + correctiveRotation - (currentRotation % 360);
    wheelSvg.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        cardStats[activeStatKey] = chosenValue;
        statsMap[activeStatKey].val.innerText = chosenValue;

        let sum = 0, count = 0;
        for (const s in cardStats) {
            if (cardStats[s] !== null) {
                sum += cardStats[s];
                count++;
            }
        }
        cardOvr.innerText = Math.round(sum / count);

        spinBtn.innerText = "DONE!";
        statusMsg.innerText = `LANDED ON ${chosenValue}!`;
        
        setTimeout(() => {
            if (modalOverlay.classList.contains("active")) closeBtn.click();
        }, 1200);
    }, 4000);
});
