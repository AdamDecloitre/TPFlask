document.getElementById('btn-scan').addEventListener('click', () => {
    const path = document.getElementById('folder-path').value;
    const resultDiv = document.getElementById('scan-results');

    fetch('/scan_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: path })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultDiv.innerHTML = `<p style="color: #ff7b72;">Erreur : ${data.error}</p>`;
            } else {
                // On crée la galerie pour les images externes
                let html = `<p style="color: var(--accent);">✅ ${data.images.length} images trouvées</p>`;
                html += `<div class="gallery">`;

                data.images.forEach(img => {
                    // Ici on utilise /external_images/ pour contourner le blocage de sécurité
                    html += `
                    <div class="card-image-item">
                        <img src="/external_images/${img}" class="gallery-img">
                        <p class="img-name">${img}</p>
                    </div>`;
                });

                html += `</div>`;
                resultDiv.innerHTML = html;
            }
        });
});