import cv2
import torch
import os

from src.anti_spoof_predict import AntiSpoofPredict
from src.generate_patches import CropImage
from src.utility import parse_model_name


model_dir = "resources/anti_spoof_models"

model_test = AntiSpoofPredict(0)

image_cropper = CropImage()

cap = cv2.VideoCapture(0)

while True:

    ret, frame = cap.read()

    if not ret:
        break

    image_bbox = model_test.get_bbox(frame)

    prediction = torch.zeros((1, 3))

    for model_name in os.listdir(model_dir):

        h_input, w_input, model_type, scale = parse_model_name(
            model_name
        )

        param = {
            "org_img": frame,
            "bbox": image_bbox,
            "scale": scale,
            "out_w": w_input,
            "out_h": h_input,
            "crop": True,
        }

        img = image_cropper.crop(**param)

        prediction += model_test.predict(
            img,
            os.path.join(model_dir, model_name)
        )

    label = torch.argmax(prediction).item()

    if label == 1:

        text = "REAL FACE"
        color = (0,255,0)

    else:

        text = "FAKE FACE"
        color = (0,0,255)

    cv2.putText(
        frame,
        text,
        (30,60),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        color,
        2
    )

    cv2.imshow("Silent Face Test", frame)

    if cv2.waitKey(1) & 0xFF == ord('d'):
        break

cap.release()

cv2.destroyAllWindows()