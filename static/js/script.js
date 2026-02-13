document.addEventListener('DOMContentLoaded', () => {
    let allResults = [];

    // 1. SCAN DES DOSSIERS
    document.getElementById('btn-scan').onclick = () => {
        const path = document.getElementById('root-path').value;
        document.getElementById('loader').style.display = 'block';
        fetch('/scan_full_pc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        })
            .then(res => res.json()).then(data => {
                document.getElementById('loader').style.display = 'none';
                allResults = data.results;
                document.getElementById('results-section').style.display = 'block';
                document.getElementById('folders-results').innerHTML = data.results.map((f, i) => `
                <li class="folder-item" onclick="openFolder(${i})">📁 ${f.name} (${f.count} images)</li>
            `).join('');
            });
    };

    // 2. AFFICHAGE DES IMAGES ET DES DEUX BOUTONS
    window.openFolder = (index) => {
        const folder = allResults[index];
        const grid = document.getElementById('images-grid');
        document.getElementById('gallery-display').style.display = 'block';
        document.getElementById('current-title').innerText = "Photos : " + folder.name;

        grid.innerHTML = folder.files.map(fileName => {
            const fullImgPath = folder.path + '/' + fileName;
            return `
                <div class="image-card">
                    <img src="/media/${encodeURI(fullImgPath)}" class="gallery-img">
                    <p class="img-name">${fileName}</p>
                    
                    <div style="margin-top:10px; border-top:1px solid var(--border); padding-top:10px; display:flex; flex-direction:column; gap:8px;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                            <label style="font-size:0.8rem;">Clusters (K) :</label>
                            <input type="number" class="k-input" value="3" min="2" max="10" style="width:45px; background:#000; color:#fff; border:1px solid var(--border);">
                        </div>
                        
                        <button onclick="runSeg('${fullImgPath}', this, '/segment_kmeans')" class="btn-primary" style="font-size:0.7rem; background:#58a6ff;">Approche K-Means</button>
                        <button onclick="runSeg('${fullImgPath}', this, '/segment_hierarchique')" class="btn-primary" style="font-size:0.7rem; background:#2ea043;">Approche Hiérarchique</button>
                    </div>

                    <div class="result-zone" style="display:none; margin-top:15px;">
                        <p style="font-size:0.75rem; color:var(--accent);">Image segmentée :</p>
                        <img src="" class="gallery-img segmented-res" style="border: 2px solid var(--accent);">
                    </div>
                </div>`;
        }).join('');
    };

    // 3. FONCTION COMMUNE DE SEGMENTATION
    window.runSeg = (path, btn, route) => {
        const card = btn.closest('.image-card');
        const kValue = card.querySelector('.k-input').value;
        const resImg = card.querySelector('.segmented-res');
        const resZone = card.querySelector('.result-zone');
        const originalText = btn.innerText;

        btn.innerText = "⏳...";
        btn.disabled = true;

        fetch(route, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path, k: kValue })
        })
            .then(res => res.json()).then(data => {
                btn.innerText = originalText;
                btn.disabled = false;
                if (data.error) return alert(data.error);

                resImg.src = data.segmented_url;
                resZone.style.display = 'block';
            });
    };
});