"""Class names, label parsing and short agronomy advice for the 38 PlantVillage classes.

IMPORTANT: the .keras file does not store class names. The list below is the standard
alphabetical PlantVillage folder order, which is what Keras `image_dataset_from_directory`
produces. If your training folders differ, put the exact list (in training order) in
`models/class_names.json` and it will override this one.
"""
from __future__ import annotations

import json
from pathlib import Path

DEFAULT_CLASS_NAMES: list[str] = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]


def load_class_names(override_path: Path) -> list[str]:
    """Use models/class_names.json if present (a JSON list of strings), else the default."""
    if override_path.is_file():
        names = json.loads(override_path.read_text(encoding="utf-8"))
        if not isinstance(names, list) or not all(isinstance(n, str) for n in names):
            raise ValueError(f"{override_path} must be a JSON list of strings")
        return names
    return list(DEFAULT_CLASS_NAMES)


# Folder names that read badly once underscores become spaces.
_DISEASE_DISPLAY = {
    "Cercospora_leaf_spot Gray_leaf_spot": "Cercospora / Gray leaf spot",
    "Common_rust_": "Common rust",
    "Spider_mites Two-spotted_spider_mite": "Spider mites (two-spotted)",
    "Esca_(Black_Measles)": "Esca (Black measles)",
    "Leaf_blight_(Isariopsis_Leaf_Spot)": "Leaf blight (Isariopsis leaf spot)",
    "Haunglongbing_(Citrus_greening)": "Citrus greening (Haunglongbing)",
}


def parse_label(label: str) -> tuple[str, str, bool]:
    """'Tomato___Late_blight' -> ('Tomato', 'Late blight', False)."""
    crop_raw, _, disease_raw = label.partition("___")
    if not disease_raw:  # custom label without the '___' separator
        crop_raw, disease_raw = "", label
    crop = crop_raw.replace("_", " ").strip()
    # "Cherry_(including_sour)" -> "Cherry", "Corn_(maize)" -> "Corn (maize)"
    if crop.startswith("Cherry"):
        crop = "Cherry"
    disease = _DISEASE_DISPLAY.get(disease_raw, disease_raw.replace("_", " ").strip())
    healthy = disease.lower() == "healthy"
    disease = "Healthy" if healthy else disease
    return crop, disease, healthy


# Short, general guidance keyed by disease keyword (matched case-insensitively against the
# label). This is a starting point, not a substitute for a local agronomist / extension officer.
_ADVICE: list[tuple[str, str, list[str]]] = [
    ("scab", "Fungal disease causing dark, scabby lesions on leaves and fruit.",
     ["Remove and destroy fallen leaves and infected fruit.", "Prune to improve airflow.",
      "Use a fungicide recommended locally, starting at early leaf emergence."]),
    ("black rot", "Fungal disease causing dark leaf spots and rotting fruit.",
     ["Remove mummified fruit and infected shoots.", "Keep canopy open so leaves dry quickly.",
      "Apply a locally recommended fungicide before and after bloom."]),
    ("cedar apple rust", "Fungal disease producing yellow-orange spots on leaves.",
     ["Remove nearby juniper/cedar hosts if possible.", "Apply a protective fungicide in spring.",
      "Plant resistant varieties."]),
    ("powdery mildew", "Fungal disease that leaves a white powdery coating on leaves.",
     ["Improve airflow and avoid overcrowding.", "Remove heavily infected leaves.",
      "Use sulfur or another locally approved fungicide."]),
    ("cercospora", "Fungal leaf spot that lowers yield in humid weather.",
     ["Rotate crops and bury crop residue.", "Use resistant hybrids.",
      "Apply a fungicide if spotting reaches upper leaves early."]),
    ("common rust", "Fungal disease with small reddish-brown pustules on leaves.",
     ["Plant resistant hybrids.", "Scout fields regularly in cool, humid weather.",
      "Apply a fungicide if infection is early and severe."]),
    ("northern leaf blight", "Fungal disease causing long grey-green cigar-shaped lesions.",
     ["Rotate crops and till residue.", "Use resistant hybrids.", "Spray fungicide if lesions appear before tasseling."]),
    ("esca", "Complex grapevine trunk disease causing striped leaves and berry spotting.",
     ["Prune out dead wood in dry weather.", "Disinfect pruning tools.", "Remove severely affected vines."]),
    ("leaf blight", "Leaf spotting and blight that reduces photosynthesis.",
     ["Remove infected leaves.", "Avoid overhead watering.", "Apply a locally recommended fungicide."]),
    ("haunglongbing", "Serious bacterial citrus disease spread by psyllid insects; there is no cure.",
     ["Report to your local agriculture office.", "Control psyllid insects.",
      "Remove infected trees to protect the rest of the grove."]),
    ("bacterial spot", "Bacterial disease causing small dark spots on leaves and fruit.",
     ["Use disease-free seed and transplants.", "Avoid working in wet fields.",
      "Copper-based sprays can slow spread; rotate crops."]),
    ("early blight", "Fungal disease with brown target-like rings on older leaves.",
     ["Remove infected lower leaves.", "Mulch and water at the base of plants.",
      "Rotate crops and apply a protective fungicide."]),
    ("late blight", "Fast-spreading disease that can destroy a crop in days in cool, wet weather.",
     ["Remove and destroy infected plants immediately.", "Avoid overhead watering.",
      "Apply a fungicide promptly and protect neighbouring plants."]),
    ("leaf mold", "Fungal disease causing yellow patches with mould underneath leaves.",
     ["Lower humidity and improve ventilation.", "Remove affected leaves.", "Use resistant varieties."]),
    ("septoria", "Fungal disease with many small circular spots with dark borders.",
     ["Remove infected leaves.", "Mulch to stop soil splash.", "Rotate crops and apply a fungicide."]),
    ("spider mites", "Tiny pests that cause stippling and webbing on leaves.",
     ["Spray plants with water to dislodge mites.", "Use insecticidal soap or a miticide.",
      "Avoid dusty, drought-stressed conditions."]),
    ("target spot", "Fungal disease with brown rings on leaves and fruit.",
     ["Improve airflow and remove debris.", "Avoid overhead watering.", "Use a locally recommended fungicide."]),
    ("yellow leaf curl", "Virus spread by whiteflies causing curled, yellow leaves and stunting.",
     ["Control whiteflies with traps or approved insecticide.", "Remove infected plants.", "Use resistant varieties."]),
    ("mosaic virus", "Virus causing mottled light and dark green leaves.",
     ["Remove infected plants.", "Disinfect tools and wash hands.", "Do not use tobacco near plants; use certified seed."]),
    ("leaf scorch", "Fungal disease causing purple-brown spots that merge and dry leaves.",
     ["Remove infected leaves after harvest.", "Avoid overhead watering.", "Use resistant varieties."]),
]

_HEALTHY = ("The plant looks healthy.",
            ["Keep up regular watering and nutrition.", "Continue scouting for early signs of disease.",
             "Keep the area free of weeds and fallen debris."])


def advice_for(label: str) -> tuple[str, list[str]]:
    """Return (description, treatment_steps) for a label."""
    _, disease, healthy = parse_label(label)
    if healthy:
        return _HEALTHY
    low = disease.lower()
    for key, desc, steps in _ADVICE:
        if key in low:
            return desc, steps
    return ("Disease detected.", ["Consult a local agriculture expert for treatment."])
