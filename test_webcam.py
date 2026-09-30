"""
Phase 2 - Live capture + detection test.

Confirms the camera pipeline works before wiring in matching: reads
frames from a webcam or an RTSP CCTV stream and draws bounding boxes
around every face using YOLOv8-Face.

Usage:
    python test_webcam.py                        # local webcam
    python test_webcam.py --source rtsp://...     # CCTV stream
"""
import argparse

import cv2
from ultralytics import YOLO

# YOLOv8-Face is used here instead of RetinaFace because it is
# noticeably faster on multi-face, high-FPS live video -- the small
# accuracy trade-off is worth it for a real-time crowd feed.
# (RetinaFace stays in Phase 1 for one-time, high-accuracy enrollment.)
model = YOLO("yolov8n-face.pt")


def run(source):
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video source: {source}")

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        results = model(frame, verbose=False)[0]
        for box in results.boxes.xyxy.cpu().numpy():
            x1, y1, x2, y2 = box.astype(int)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        cv2.imshow("Phase 2 - face detection test", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=0, help="0 for webcam, or an RTSP URL")
    args = parser.parse_args()
    source = int(args.source) if str(args.source).isdigit() else args.source
    run(source)
