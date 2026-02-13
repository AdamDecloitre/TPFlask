from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
import os
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans, AgglomerativeClustering
import uuid

app = Flask(__name__)
IMAGE_FOLDER = os.path.join('static', 'images')
if not os.path.exists(IMAGE_FOLDER): os.makedirs(IMAGE_FOLDER)

@app.route("/")
def home(): return render_template("index.html")

@app.route("/gallerie")
def gallerie(): return render_template('gallerie.html')

@app.route("/cv")
def cv(): return render_template("cv.html")

@app.route("/about")
def about(): return render_template("about.html")

# --- EXPLORATEUR DE DOSSIERS ---
@app.route('/scan_full_pc', methods=['POST'])
def scan_full_pc():
    data = request.json
    root_path = os.path.normpath(data.get('path') or "C:\\")
    results = []
    try:
        for root, dirs, files in os.walk(root_path):
            imgs = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            if imgs:
                results.append({
                    "path": root.replace('\\', '/'),
                    "name": os.path.basename(root) or root,
                    "count": len(imgs),
                    "files": imgs
                })
        return jsonify({"results": results})
    except Exception as e: return jsonify({"error": str(e)}), 500

# --- MÉTHODE 1 : K-MEANS (CENTRES DE GRAVITÉ) ---
@app.route('/segment_kmeans', methods=['POST'])
def segment_kmeans():
    data = request.json
    img_path = os.path.normpath(data.get('path'))
    k = int(data.get('k', 3))
    try:
        with Image.open(img_path) as img:
            img = img.convert('RGB')
            img_np = np.array(img)
            w, h, d = img_np.shape
            pixels = img_np.reshape((w * h, d))
            
            model = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = model.fit_predict(pixels)
            new_pixels = model.cluster_centers_.astype('uint8')[labels]
            
            res = new_pixels.reshape((w, h, d))
            name = f"km_{uuid.uuid4().hex}.jpg"
            Image.fromarray(res).save(os.path.join(IMAGE_FOLDER, name))
            return jsonify({"segmented_url": url_for('static', filename='images/' + name)})
    except Exception as e: return jsonify({"error": str(e)}), 500

# --- MÉTHODE 2 : APPROCHE HIÉRARCHIQUE (CAH) ---
@app.route('/segment_hierarchique', methods=['POST'])
def segment_hierarchique():
    data = request.json
    img_path = os.path.normpath(data.get('path'))
    k = int(data.get('k', 3))
    try:
        with Image.open(img_path) as img:
            img = img.convert('RGB')
            # On réduit la taille pour le calcul hiérarchique (très lourd)
            small_img = img.resize((60, 60))
            img_np = np.array(small_img)
            w, h, d = img_np.shape
            pixels = img_np.reshape((w * h, d))

            model = AgglomerativeClustering(n_clusters=k, metric='euclidean', linkage='complete')
            labels = model.fit_predict(pixels)
            
            # Reconstitution des couleurs par la moyenne du cluster
            new_pixels = np.zeros_like(pixels)
            for i in range(k):
                mask = (labels == i)
                if np.any(mask):
                    new_pixels[mask] = pixels[mask].mean(axis=0)
            
            res = new_pixels.reshape((w, h, d))
            name = f"hi_{uuid.uuid4().hex}.jpg"
            # On remet à la taille d'origine pour l'affichage
            final_img = Image.fromarray(res.astype('uint8')).resize(img.size, Image.NEAREST)
            final_img.save(os.path.join(IMAGE_FOLDER, name))
            return jsonify({"segmented_url": url_for('static', filename='images/' + name)})
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/media/<path:full_path>')
def serve_media(full_path):
    full_path = os.path.normpath(full_path)
    return send_from_directory(os.path.dirname(full_path), os.path.basename(full_path))

if __name__ == "__main__":
    app.run(port=8000, debug=True)