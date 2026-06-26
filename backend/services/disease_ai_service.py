import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Recommendation mapping dictionary
RECOMMENDATIONS = {

    # ================= APPLE =================
    "Apple Scab":
        "Remove infected leaves and fallen debris. Apply captan or mancozeb fungicide.",

    "Black Rot":
        "Prune infected branches, remove mummified fruits, and spray fungicide.",

    "Cedar Apple Rust":
        "Apply myclobutanil fungicide and remove nearby cedar hosts if possible.",

    "Healthy":
        "No treatment required. Continue regular monitoring and proper irrigation.",

    # ================= BLUEBERRY =================
    "Blueberry Healthy":
        "No treatment required. Maintain proper irrigation and nutrition.",

    # ================= CHERRY =================
    "Powdery Mildew":
        "Spray sulfur or neem oil. Improve air circulation and avoid excessive humidity.",

    "Cherry Healthy":
        "No treatment required. Continue good orchard management.",

    # ================= CORN =================
    "Cercospora Leaf Spot Gray Leaf Spot":
        "Apply fungicide and practice crop rotation. Remove infected crop residues.",

    "Common Rust":
        "Use resistant hybrids and apply fungicide if infection becomes severe.",

    "Northern Leaf Blight":
        "Use resistant varieties and apply fungicide during early infection.",

    "Corn Healthy":
        "No treatment required. Maintain proper fertilization.",

    # ================= GRAPE =================
    "Black Rot":
        "Remove infected leaves and berries. Spray appropriate fungicide regularly.",

    "Esca (Black Measles)":
        "Prune infected vines and disinfect pruning tools.",

    "Leaf Blight (Isariopsis Leaf Spot)":
        "Apply copper fungicide and improve vineyard ventilation.",

    "Grape Healthy":
        "No treatment required. Continue normal vineyard care.",

    # ================= ORANGE =================
    "Haunglongbing (Citrus Greening)":
        "Remove infected trees immediately and control psyllid insects.",

    # ================= PEACH =================
    "Bacterial Spot":
        "Apply copper-based bactericide and avoid overhead irrigation.",

    "Peach Healthy":
        "No treatment required. Continue routine orchard maintenance.",

    # ================= PEPPER =================
    "Pepper Bell Bacterial Spot":
        "Use copper sprays and certified disease-free seeds.",

    "Pepper Bell Healthy":
        "No treatment required. Maintain balanced fertilization.",

    # ================= POTATO =================
    "Early Blight":
        "Remove infected leaves and spray chlorothalonil or mancozeb fungicide.",

    "Late Blight":
        "Destroy infected plants immediately and apply copper fungicide.",

    "Potato Healthy":
        "No treatment required. Continue field monitoring.",

    # ================= RASPBERRY =================
    "Raspberry Healthy":
        "No treatment required. Maintain proper pruning and irrigation.",

    # ================= SOYBEAN =================
    "Soybean Healthy":
        "No treatment required. Maintain balanced soil nutrients.",

    # ================= SQUASH =================
    "Powdery Mildew":
        "Apply sulfur or potassium bicarbonate spray. Improve airflow around plants.",

    # ================= STRAWBERRY =================
    "Leaf Scorch":
        "Remove infected leaves and apply fungicide if disease spreads rapidly.",

    "Strawberry Healthy":
        "No treatment required. Maintain clean growing conditions.",

    # ================= TOMATO =================
    "Bacterial Spot":
        "Apply copper bactericide and avoid working with wet plants.",

    "Early Blight":
        "Remove infected leaves and apply chlorothalonil or mancozeb fungicide.",

    "Late Blight":
        "Destroy infected plants and spray copper fungicide immediately.",

    "Leaf Mold":
        "Improve greenhouse ventilation and apply fungicide.",

    "Septoria Leaf Spot":
        "Remove infected foliage and apply fungicide regularly.",

    "Spider Mites Two Spotted Spider Mite":
        "Use miticide or neem oil. Increase humidity around plants if possible.",

    "Target Spot":
        "Apply fungicide and reduce prolonged leaf wetness.",

    "Tomato Yellow Leaf Curl Virus":
        "Control whiteflies and remove infected plants immediately.",

    "Tomato Mosaic Virus":
        "Remove infected plants and disinfect tools. No chemical cure exists.",

    "Tomato Healthy":
        "No treatment required. Continue routine crop monitoring."
}

# Global variables to reuse model
MODEL = None
LABELS = []
MODEL_LOADED = False
LOAD_ERROR = None

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "ai_models")
MODEL_PATH_KERAS = os.path.join(MODEL_DIR, "plant_disease_model.keras")
MODEL_PATH_H5 = os.path.join(MODEL_DIR, "model.h5")
LABELS_PATH = os.path.join(MODEL_DIR, "labels.txt")

def init_ai_model():
    global MODEL, LABELS, MODEL_LOADED, LOAD_ERROR
    
    # Try importing TensorFlow, NumPy, and Pillow (lazy import to prevent startup crashes if missing)
    try:
        import tensorflow as tf
        import numpy as np
        from PIL import Image
    except ImportError as e:
        LOAD_ERROR = f"Required dependencies are missing: {str(e)}"
        logger.warning(LOAD_ERROR)
        return

    # Check model path
    model_path = None
    if os.path.exists(MODEL_PATH_KERAS):
        model_path = MODEL_PATH_KERAS
    elif os.path.exists(MODEL_PATH_H5):
        model_path = MODEL_PATH_H5
        
    if not model_path:
        LOAD_ERROR = "Model file (plant_disease_model.keras or model.h5) is missing."
        logger.warning(LOAD_ERROR)
        return

    # Check labels path
    if not os.path.exists(LABELS_PATH):
        LOAD_ERROR = "Labels file (labels.txt) is missing."
        logger.warning(LOAD_ERROR)
        return

    try:
        # Load labels
        with open(LABELS_PATH, "r") as f:
            LABELS = [line.strip() for line in f.readlines() if line.strip()]
            
        # Load model only once
        MODEL = tf.keras.models.load_model(model_path)
        MODEL_LOADED = True
        logger.info("AI model and labels loaded successfully.")
    except Exception as e:
        LOAD_ERROR = f"Failed to load model/labels: {str(e)}"
        logger.error(LOAD_ERROR)

# Initialize
init_ai_model()

def clean_label_name(raw_label: str) -> str:
    cleaned = raw_label
    if "___" in cleaned:
        parts = cleaned.split("___")
        cleaned = parts[1] if len(parts) > 1 else cleaned
        
    cleaned = cleaned.replace("_", " ").title()
    
    # Map to standard database keys if matched
    for key in RECOMMENDATIONS.keys():
        if key.lower() in cleaned.lower():
            return key
            
    return cleaned

def predict_disease(image_path: str) -> dict:
    global MODEL, LABELS, MODEL_LOADED, LOAD_ERROR
    
    if not MODEL_LOADED:
        raise RuntimeError(f"AI Model is not loaded. {LOAD_ERROR}")
        
    import numpy as np
    from PIL import Image
    import tensorflow as tf
    
    try:
        # 1. Open image and convert to RGB
        img = Image.open(image_path).convert('RGB')
        
        # 2. Resize to model input shape (default to 224x224)
        input_shape = MODEL.input_shape
        img_height = input_shape[1] if len(input_shape) > 1 and input_shape[1] is not None else 224
        img_width = input_shape[2] if len(input_shape) > 2 and input_shape[2] is not None else 224
        
        img = img.resize((img_width, img_height))
        
        # 3. Convert to numpy array and normalize pixels
        img_array = np.array(img, dtype=np.float32) / 255.0
        
        # 4. Expand batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        # 5. Run prediction
        predictions = MODEL.predict(img_array)
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx]) * 100
        
        # Resolve class label
        if predicted_class_idx < len(LABELS):
            raw_label = LABELS[predicted_class_idx]
        else:
            raw_label = "Healthy"
            
        disease_name = clean_label_name(raw_label)
        recommendation = RECOMMENDATIONS.get(disease_name, "No treatment required.")
        is_healthy = (disease_name.lower() == "healthy")
        
        return {
            "disease": disease_name,
            "confidence": round(confidence, 1),
            "recommendation": recommendation,
            "healthy": is_healthy
        }
    except Exception as e:
        logger.error(f"Error during AI model prediction: {str(e)}")
        raise e
