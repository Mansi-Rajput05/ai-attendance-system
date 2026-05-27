import cv2 as cv

from detection.face_mesh import process_face_mesh
from detection.blink_detector import calculate_ear
from anti_spoof.liveness import detect_blink
from detection.head_pose import estimate_head_pose

import anti_spoof.liveness as liveness

from recognition.recognize import (
    load_known_faces,
    recognize_face
)

# ---------------- LOAD DATABASE FACES ---------------- #

known_faces = load_known_faces()

# ---------------- CAMERA ---------------- #

capture = cv.VideoCapture(0)

capture.set(cv.CAP_PROP_FRAME_WIDTH, 640)
capture.set(cv.CAP_PROP_FRAME_HEIGHT, 480)

# ---------------- STATES ---------------- #

attendance_marked = False

recognized_name = "Unknown"
recognized_id = "N/A"
attendance_status = ""

# ---------------- LOOP ---------------- #

frame_counter = 0

while True:
    frame_counter += 1

    if frame_counter % 2 != 0:
        continue

    isTrue, frame = capture.read()

    if not isTrue:
        break

    frame = cv.flip(frame, 1)

    rgb_frame = cv.cvtColor(
        frame,
        cv.COLOR_BGR2RGB
    )

    results = process_face_mesh(rgb_frame)

    if results.multi_face_landmarks:

        for face_landmarks in results.multi_face_landmarks:

            h, w, c = frame.shape

            # ---------------- EAR ---------------- #

            ear, eye_points = calculate_ear(
                face_landmarks,
                w,
                h
            )

            # ---------------- DRAW EYE POINTS ---------------- #

            for point in eye_points:

                cv.circle(
                    frame,
                    point,
                    3,
                    (0,255,0),
                    -1
                )

            # ---------------- BLINK ---------------- #

            blink_count, new_blink = detect_blink(ear)

            # ---------------- HEAD POSE ---------------- #

            x_angle, y_angle, z_angle = estimate_head_pose(
                face_landmarks,
                w,
                h
            )

            # ---------------- HEAD DIRECTION ---------------- #

            head_direction = "Forward"

            if y_angle < -10:

                head_direction = "Looking Left"

            elif y_angle > 10:

                head_direction = "Looking Right"

            elif x_angle < -10:

                head_direction = "Looking Down"

            elif x_angle > 10:

                head_direction = "Looking Up"

            # ---------------- CHALLENGE ---------------- #

            current_challenge = liveness.verify_challenge(
                new_blink,
                head_direction
            )

            # ---------------- CHALLENGE TEXT ---------------- #

            if liveness.verification_complete:

                challenge_text = "COMPLETED"

            else:

                challenge_text = current_challenge

            # ---------------- DISPLAY LIVE DATA ---------------- #

            if not liveness.verification_complete:

                cv.putText(
                    frame,
                    f"EAR: {ear:.2f}",
                    (30, 50),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0,255,0),
                    2
                )

                cv.putText(
                    frame,
                    f"Blinks: {blink_count}",
                    (30, 100),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0,255,0),
                    2
                )

                cv.putText(
                    frame,
                    head_direction,
                    (30, 150),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0,255,0),
                    2
                )

                cv.putText(
                    frame,
                    f"Challenge: {challenge_text}",
                    (30, 250),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0,255,255),
                    2
                )

            # ---------------- VERIFICATION COMPLETE ---------------- #

            if liveness.verification_complete:

                cv.putText(
                    frame,
                    "VERIFICATION SUCCESSFUL",
                    (30, 250),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0,255,0),
                    3
                )

                cv.putText(
                    frame,
                    "Scanning Face...",
                    (30, 310),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0,255,255),
                    2
                )

                # ---------- RECOGNIZE ONLY ONCE ---------- #

                if not attendance_marked:

                    recognized_name, recognized_id, attendance_status = recognize_face(
                        frame,
                        known_faces
                    )

                    attendance_marked = True

            # ---------------- DISPLAY RECOGNITION ---------------- #

            if attendance_marked:

                cv.putText(
                    frame,
                    f"Name: {recognized_name}",
                    (30, 380),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0,255,0),
                    2
                )

                cv.putText(
                    frame,
                    f"ID: {recognized_id}",
                    (30, 430),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0,255,0),
                    2
                )

                cv.putText(
                    frame,
                    attendance_status,
                    (30, 480),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0,255,255),
                    2
                )

    # ---------------- SHOW WINDOW ---------------- #

    cv.imshow(
        "AI Attendance System",
        frame
    )

    # ---------------- EXIT ---------------- #

    if cv.waitKey(1) & 0xFF == ord('d'):
        break

# ---------------- CLEANUP ---------------- #

capture.release()

cv.destroyAllWindows()