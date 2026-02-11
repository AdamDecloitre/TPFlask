from flask import Flask, render_template, url_for, request, jsonify, send_from_directory
import os

app = Flask(__name__)

# Dossier par défaut des images du site
IMAGE_FOLDER = os.path.join('static', 'images')

# Variable globale pour mémoriser le dernier dossier scanné
# C'est ce qui permet à la route /external_images de savoir où chercher
indexed_folder = ""

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
    # S'assure que le dossier existe pour éviter une erreur
    if not os.path.exists(IMAGE_FOLDER):
        os.makedirs(IMAGE_FOLDER)
        
    # Liste les images de base du projet
    images = [f for f in os.listdir(IMAGE_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
    return render_template('gallerie.html', images=images)

@app.route('/scan_folder', methods=['POST'])
def scan_folder():
    global indexed_folder
    data = request.json
    folder_path = data.get('path')
    
    # os.path.normpath transforme les "/" en "\" (ou inversement) selon ton système
    if folder_path:
        indexed_folder = os.path.normpath(folder_path)
    
    if not indexed_folder or not os.path.exists(indexed_folder):
        return jsonify({"error": "Dossier introuvable"}), 400

    try:
        # On liste les images du dossier externe
        ext_images = [f for f in os.listdir(indexed_folder) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
        return jsonify({"images": ext_images, "folder": indexed_folder})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/external_images/<path:filename>')
def external_images(filename):
    # L'utilisation de <path:filename> permet de gérer les noms de fichiers avec des caractères spéciaux
    global indexed_folder
    if not indexed_folder:
        return "Aucun dossier indexé", 404
    return send_from_directory(indexed_folder, filename)

if __name__ == "__main__":
    # Lance le serveur sur le port 8000
    app.run(port=8000, debug=True)