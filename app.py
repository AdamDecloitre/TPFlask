from flask import Flask, render_template, request, jsonify, send_from_directory
import os

app = Flask(__name__)

# Dossier par défaut des images du site
IMAGE_FOLDER = os.path.join('static', 'images')

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/cv")
def cv():
    return render_template("cv.html")

@app.route("/gallerie")
def gallerie():
    return render_template('gallerie.html')

# ROUTE DE SCAN RÉCURSIF
@app.route('/scan_full_pc', methods=['POST'])
def scan_full_pc():
    data = request.json
    root_path = data.get('path') or "C:\\"
    root_path = os.path.normpath(root_path)

    if not os.path.exists(root_path):
        return jsonify({"error": "Chemin racine introuvable"}), 400

    folders_with_images = []

    try:
        # os.walk parcourt absolument toute l'arborescence
        for root, dirs, files in os.walk(root_path):
            # On filtre les fichiers images dans le dossier actuel
            images = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
            
            if images:
                # On enregistre le dossier s'il contient au moins une image
                folders_with_images.append({
                    "path": root.replace('\\', '/'),
                    "name": os.path.basename(root) or root,
                    "count": len(images),
                    "first_images": images[:10] # On envoie les 10 premiers noms pour la galerie
                })
        
        return jsonify({"results": folders_with_images})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ROUTE POUR SERVIR LES IMAGES EXTERNES
@app.route('/media/<path:full_path>')
def serve_media(full_path):
    # On décode le chemin et on sert le fichier
    full_path = os.path.normpath(full_path)
    directory = os.path.dirname(full_path)
    filename = os.path.basename(full_path)
    return send_from_directory(directory, filename)

if __name__ == "__main__":
    app.run(port=8000, debug=True)