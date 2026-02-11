from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
import os
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans
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

@app.route('/scan_full_pc', methods=['POST'])
def scan_full_pc():
    data = request.json
    root_path = os.path.normpath(data.get('path') or "C:\\")
    results = []
    try:
        for root, dirs, files in os.walk(root_path):
            images = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            if images:
                results.append({
                    "path": root.replace('\\', '/'),
                    "name": os.path.basename(root) or root,
                    "count": len(images),
                    "files": images
                })
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/segment_image', methods=['POST'])
def segment_image():
    data = request.json
    img_path = os.path.normpath(data.get('path'))
    k = int(data.get('k', 3))
    try:
        with Image.open(img_path) as img:
            img = img.convert('RGB')
            img_np = np.array(img)
            w, h, d = img_np.shape
            pixels = img_np.reshape((w * h, d))
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(pixels)
            new_pixels = kmeans.cluster_centers_.astype('uint8')[labels]
            segmented_img = new_pixels.reshape((w, h, d))
            output_name = f"seg_{uuid.uuid4().hex}.jpg"
            save_path = os.path.join(IMAGE_FOLDER, output_name)
            Image.fromarray(segmented_img).save(save_path)
            return jsonify({"segmented_url": url_for('static', filename='images/' + output_name)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/media/<path:full_path>')
def serve_media(full_path):
    full_path = os.path.normpath(full_path)
    return send_from_directory(os.path.dirname(full_path), os.path.basename(full_path))

if __name__ == "__main__":
    app.run(port=8000, debug=True)