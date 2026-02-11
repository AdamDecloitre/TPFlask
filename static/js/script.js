document.addEventListener('DOMContentLoaded', () => {
    let allResults = [];

    document.getElementById('btn-scan').onclick = () => {
        const path = document.getElementById('root-path').value;
        const loader = document.getElementById('loader');
        loader.style.display = 'block';

        fetch('/scan_full_pc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        })
            .then(res => res.json())
            .then(data => {
                loader.style.display = 'none';
                if (data.error) return alert(data.error);
                allResults = data.results;
                document.getElementById('results-section').style.display = 'block';
                document.getElementById('folders-results').innerHTML = data.results.map((f, index) => `
                <li class="folder-item" onclick="openFolder(${index})">
                    <span>📁 ${f.name}</span> <small>(${f.count} images)</small>
                </li>
            `).join('');
            });
    };

    window.openFolder = (index) => {
        const folder = allResults[index];
        const grid = document.getElementById('images-grid');
        document.getElementById('gallery-display').style.display = 'block';
        document.getElementById('current-title').innerText = "Photos de : " + folder.name;

        grid.innerHTML = folder.files.map(fileName => {
            const fullPath = folder.path + '/' + fileName;
            return `
                <div class="image-card">
                    <img src="/media/${encodeURI(fullPath)}" class="gallery-img">
                    <p class="img-name">${fileName}</p>
                    
                    <div style="margin-top:15px; border-top:1px solid var(--border); padding-top:10px;">
                        <label style="font-size:0.8rem;">Clusters (K) :</label>
                        <input type="number" class="k-input" value="3" min="2" max="10" 
                               style="width:45px; background:var(--bg); color:white; border:1px solid var(--border); border-radius:4px;">
                        <button onclick="runSegmentation('${fullPath}', this)" class="btn-primary" style="padding:5px 10px; font-size:0.75rem;">Segmenter</button>
                    </div>

                    <div class="result-zone" style="display:none; margin-top:15px;">
                        <p style="font-size:0.75rem; color:var(--accent);">Résultat K-Means :</p>
                        <img src="" class="gallery-img segmented-res">
                    </div>
                </div>
            `;
        }).join('');
    };

    window.runSegmentation = function (imgPath, btn) {
        const card = btn.closest('.image-card');
        const kValue = card.querySelector('.k-input').value;
        const resultImg = card.querySelector('.segmented-res');
        const resultZone = card.querySelector('.result-zone');

        btn.innerText = "⏳...";

        fetch('/segment_image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: imgPath, k: kValue })
        })
            .then(res => res.json())
            .then(data => {
                btn.innerText = "Segmenter";
                if (data.error) return alert(data.error);
                resultImg.src = data.segmented_url;
                resultZone.style.display = 'block';
            });
    };
});