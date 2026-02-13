document.addEventListener('DOMContentLoaded', () => {
    let allResults = [];

    document.getElementById('btn-scan').onclick = () => {
        const path = document.getElementById('root-path').value;
        document.getElementById('loader').style.display = 'block';
        fetch('/scan_full_pc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: path }) })
            .then(res => res.json()).then(data => {
                document.getElementById('loader').style.display = 'none';
                allResults = data.results;
                document.getElementById('results-section').style.display = 'block';
                document.getElementById('folders-results').innerHTML = data.results.map((f, i) => `
                <li class="folder-item" onclick="openFolder(${i})">📁 ${f.name} (${f.count} images)</li>
            `).join('');
            });
    };

    window.openFolder = (index) => {
        const folder = allResults[index];
        document.getElementById('gallery-display').style.display = 'block';
        document.getElementById('images-grid').innerHTML = folder.files.map(fileName => {
            const fullPath = folder.path + '/' + fileName;
            return `
                <div class="image-card">
                    <img src="/media/${encodeURI(fullPath)}" class="gallery-img">
                    <div style="margin-top:10px; border-top:1px solid var(--border); padding-top:10px; display:flex; flex-direction:column; gap:8px;">
                        <div style="display:flex; justify-content:center; gap:10px; font-size:0.7rem;">
                            <span>K: <input type="number" class="k-input" value="3" style="width:30px; background:#000; color:#fff;"></span>
                            <span>Eps: <input type="number" class="eps-input" value="5" style="width:30px; background:#000; color:#fff;"></span>
                        </div>
                        <button onclick="runSeg('${fullPath}', this, '/segment_kmeans')" class="btn-primary" style="font-size:0.6rem; background:#58a6ff;">K-Means</button>
                        <button onclick="runSeg('${fullPath}', this, '/segment_hierarchique')" class="btn-primary" style="font-size:0.6rem; background:#2ea043;">Hiérarchique</button>
                        <button onclick="runSegDB('${fullPath}', this)" class="btn-primary" style="font-size:0.6rem; background:#f26716;">DBSCAN (Densité)</button>
                    </div>
                    <div class="result-zone" style="display:none; margin-top:15px;">
                        <img src="" class="gallery-img segmented-res" style="border: 2px solid var(--accent);">
                        <div class="db-info"></div>
                    </div>
                </div>`;
        }).join('');
    };

    window.runSeg = (path, btn, route) => {
        const card = btn.closest('.image-card');
        const kVal = card.querySelector('.k-input').value;
        const oldT = btn.innerText; btn.innerText = "⏳";
        fetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: path, k: kVal }) })
            .then(res => res.json()).then(data => {
                btn.innerText = oldT;
                card.querySelector('.segmented-res').src = data.segmented_url;
                card.querySelector('.result-zone').style.display = 'block';
                if (card.querySelector('.db-info')) card.querySelector('.db-info').innerHTML = "";
            });
    };

    window.runSegDB = (path, btn) => {
        const card = btn.closest('.image-card');
        const epsVal = card.querySelector('.eps-input').value;
        const resImg = card.querySelector('.segmented-res');
        const resZone = card.querySelector('.result-zone');
        btn.innerText = "⏳";

        fetch('/segment_dbscan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: path, eps: epsVal }) })
            .then(res => res.json()).then(data => {
                btn.innerText = "DBSCAN (Densité)";
                resImg.src = data.segmented_url;
                resZone.style.display = 'block';
                card.querySelector('.db-info').innerHTML = `
                <div style="margin-top:10px; background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; border:1px solid var(--border);">
                    <p style="font-size:0.7rem; margin:0 0 5px 0;">🎨 ${data.k_detected} Clusters détectés</p>
                    <div style="display:flex; flex-wrap:wrap; gap:4px;">
                        ${data.colors.map(c => `<div style="width:12px; height:12px; border-radius:50%; background:${c}; border:1px solid #fff;"></div>`).join('')}
                        ${data.has_outliers ? `<div title="Outliers" style="width:12px; height:12px; border-radius:50%; background:#000; border:1px dashed #fff;"></div>` : ''}
                    </div>
                    <p style="font-size:0.6rem; color:var(--text-dim); margin-top:4px;">${data.has_outliers ? '⚫ Noir = Bruit/Outliers' : ''}</p>
                </div>`;
            });
    };
});