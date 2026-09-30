"""
Phase 3 - Real-time matching.

The core loop: detect every face in a live frame (YOLOv8-Face), turn
each one into an ArcFace embedding, and check it against the FAISS
database built in Phase 1. Prints a match to the console whenever
similarity crosses the confidence threshold.

This is the CPU-side logic that Phase 4 later wraps in a FastAPI
service instead of a cv2.imshow() window.
"""
import argparse
import os

import cv2
import insightface
from ultralytics import YOLO

from database import get_person, init_db, load_or_create_index, search

MATCH_THRESHOLD = 0.55  # cosine similarity; tune against your own test set

detector = YOLO("yolov8n-face.pt")

# Point directly at the ArcFace model already downloaded by enroll.py
# (part of the buffalo_l pack). Reusing this exact file -- instead of
# a separate named model -- guarantees enrollment and live matching
# produce embeddings that are actually comparable to each other.
RECOGNITION_MODEL_PATH = os.path.expanduser(
    "~/.insightface/models/buffalo_l/w600k_r50.onnx"
)
recognizer = insightface.model_zoo.get_model(RECOGNITION_MODEL_PATH)
recognizer.prepare(ctx_id=-1)  # ctx_id=-1 runs on CPU


def get_embedding(face_crop):
    face_crop = cv2.resize(face_crop, (112, 112))
    return recognizer.get_feat(face_crop)


def run(source):
    conn = init_db()
    index = load_or_create_index()
    cap = cv2.VideoCapture(source)

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        detections = detector(frame, verbose=False, device="cpu")[0]
        for box in detections.boxes.xyxy.cpu().numpy():
            x1, y1, x2, y2 = box.astype(int)
            crop = frame[max(0, y1):y2, max(0, x1):x2]
            if crop.size == 0:
                continue

            embedding = get_embedding(crop)
            matches = search(index, embedding, top_k=1)

            label = "Unknown"
            if matches and matches[0][1] >= MATCH_THRESHOLD:
                person_id, score = matches[0]
                person = get_person(conn, person_id)
                label = f"{person['name']} ({score:.2f})"
                print(f"MATCH: {person['name']} - similarity {score:.2f}")

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(frame, label, (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        cv2.imshow("Phase 3 - real-time matching", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=0)
    args = parser.parse_args()
    source = int(args.source) if str(args.source).isdigit() else args.source
    run(source)