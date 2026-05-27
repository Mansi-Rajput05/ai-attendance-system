from utils.geometry import euclidean_distance

LEFT_EYE = [33, 160, 158, 133, 153, 144]

def calculate_ear(face_landmarks, w, h):

    points = []

    for idx in LEFT_EYE:

        landmark = face_landmarks.landmark[idx]

        x = int(landmark.x * w)
        y = int(landmark.y * h)

        points.append((x, y))

    horizontal_length = euclidean_distance(
        points[0],
        points[3]
    )

    vertical_length1 = euclidean_distance(
        points[1],
        points[5]
    )

    vertical_length2 = euclidean_distance(
        points[2],
        points[4]
    )

    ear = (
        vertical_length1 +
        vertical_length2
    ) / (2 * horizontal_length)

    return ear, points