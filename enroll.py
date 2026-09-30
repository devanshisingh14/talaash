"""
Phase 1 - Enrollment script.

Takes a photo of a missing person, extracts their face embedding
(RetinaFace for detection + ArcFace for the embedding, both bundled
in the `insightface` package), and stores it in the local database.

Usage:
    python enroll.py --image photos/john_doe.jpg --name "John Doe" --age 34 --contact "police@example.com"
"""
import argparse

import cv2
import insightface

from database import add_person, init_db, load_or_create_index

# insightface's FaceAnalysis bundles RetinaFace (detection) and
# ArcFace (recognition/embedding) behind one API, which is simpler
# to install and keep in sync than wiring the two libraries by hand.
face_app = insightface.app.FaceAnalysis(name="buffalo_l")
face_app.prepare(ctx_id=-1, det_size=(640, 640))  # ctx_id=-1 runs on CPU


def enroll(image_path, name, age=None, gender=None, contact=None):
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not read image: {image_path}")

    faces = face_app.get(img)
    if not faces:
        raise ValueError("No face detected in the enrollment photo.")
    if len(faces) > 1:
        print(f"Warning: {len(faces)} faces found, using the largest one.")

    # Pick the largest detected face (by bounding-box area) in case
    # the enrollment photo isn't perfectly cropped to one person.
    face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    embedding = face.embedding  # 512-d ArcFace vector

    conn = init_db()
    index = load_or_create_index()
    person_id = add_person(conn, index, name, embedding, age, gender, contact, image_path)
    print(f"Enrolled '{name}' with database id {person_id}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--age", type=int, default=None)
    parser.add_argument("--gender", default=None)
    parser.add_argument("--contact", default=None)
    args = parser.parse_args()
    enroll(args.image, args.name, args.age, args.gender, args.contact)
