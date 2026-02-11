document.addEventListener('DOMContentLoaded', () => {
    const btnScan = document.getElementById('btn-scan-pc');
    const rootInput = document.getElementById('root-path');
    const loader = document.getElementById('loader');
    const resultsSection = document.getElementById('results-section');
    const foldersResults = document.getElementById('folders-results');
    const galleryDisplay = document.getElementById('gallery-display');
    const imagesGrid = document.getElementById('images-grid');

    // Visionneuse
    const viewer = document.getElementById('image-viewer');
    const fullImg = document.getElementById('full-img');
    const closeBtn = document.getElementById('close-viewer');

    btnScan.addEventListener('click', () => {
        const path = rootInput.value;
        loader.style.display = 'block';
        resultsSection.style.display = 'none';
        galleryDisplay.style.display = 'none';
        foldersResults.innerHTML = '';

        fetch('/scan_full_pc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        })
            .then(res => res.json())
            .then(data => {
                loader.style.display = 'none';
                if (data.error) return alert(data.error);

                resultsSection.style.display = 'block';
                data.results.forEach(folder => {
                    const li = document.createElement('li');
                    li.className = "folder-item";
                    li.style.cursor = "pointer";
                    li.style.marginBottom = "10px";
                    li.innerHTML = `
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <span>📁 <strong>${folder.name}</strong></span>
                        <span style="color: var(--accent);">${folder.count} images</span>
                    </div>
                    <small style="color: var(--text-dim); display:block;">${folder.path}</small>
                `;
                    li.onclick = () => displayFolderImages(folder);
                    foldersResults.appendChild(li);
                });
            });
    });

    function displayFolderImages(folder) {
        galleryDisplay.style.display = 'block';
        document.getElementById('current-folder-title').innerText = "Photos dans : " + folder.name;
        imagesGrid.innerHTML = '';

        folder.first_images.forEach(imgName => {
            const imgPath = folder.path + '/' + imgName;
            const card = document.createElement('div');
            card.className = "image-card";
            card.innerHTML = `
                <img src="/media/${encodeURIComponent(imgPath)}" class="gallery-img">
                <p class="img-name">${imgName}</p>
            `;
            // Clic pour visionneuse
            card.querySelector('img').onclick = () => {
                viewer.style.display = 'flex';
                fullImg.src = card.querySelector('img').src;
            };
            imagesGrid.appendChild(card);
        });

        // Scroll automatique vers la galerie
        galleryDisplay.scrollIntoView({ behavior: 'smooth' });
    }

    closeBtn.onclick = () => viewer.style.display = 'none';
    viewer.onclick = (e) => { if (e.target === viewer) viewer.style.display = 'none'; };
});