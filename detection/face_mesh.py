import mediapipe as mp

mp_face_mesh = mp.solutions.face_mesh

face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True
)

def process_face_mesh(rgb_frame):

    results = face_mesh.process(rgb_frame)

    return results