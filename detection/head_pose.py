import cv2 as cv
import numpy as np

def estimate_head_pose(face_landmarks, frame_w, frame_h):

    face_2d = []
    face_3d = []

    landmark_ids = [33, 263, 1, 61, 291, 199]

    for idx in landmark_ids:

        landmark = face_landmarks.landmark[idx]

        x = int(landmark.x * frame_w)
        y = int(landmark.y * frame_h)

        face_2d.append([x, y])

        face_3d.append([
            x,
            y,
            landmark.z
        ])

    face_2d = np.array(face_2d, dtype=np.float64)
    face_3d = np.array(face_3d, dtype=np.float64)

    focal_length = frame_w

    cam_matrix = np.array([
        [focal_length, 0, frame_w / 2],
        [0, focal_length, frame_h / 2],
        [0, 0, 1]
    ])

    dist_matrix = np.zeros((4, 1), dtype=np.float64)

    success, rotation_vec, translation_vec = cv.solvePnP(
        face_3d,
        face_2d,
        cam_matrix,
        dist_matrix
    )

    rotation_matrix, jacobian = cv.Rodrigues(rotation_vec)

    angles, mtxR, mtxQ, Qx, Qy, Qz = cv.RQDecomp3x3(
        rotation_matrix
    )

    x_angle = angles[0] * 360
    y_angle = angles[1] * 360
    z_angle = angles[2] * 360

    return x_angle, y_angle, z_angle