import random

EAR_THRESHOLD = 0.23
CONSECUTIVE_FRAMES = 3

blink_count = 0
closed_eye_frames = 0
blink_detected = False


def detect_blink(ear):

    global blink_count
    global closed_eye_frames
    global blink_detected

    new_blink = False

    if ear < EAR_THRESHOLD:

        closed_eye_frames += 1

    else:

        if closed_eye_frames >= CONSECUTIVE_FRAMES:

            if not blink_detected:

                blink_count += 1

                blink_detected = True

                new_blink = True

        closed_eye_frames = 0

        if ear > EAR_THRESHOLD:

            blink_detected = False

    return blink_count, new_blink



challenge_index = 0

all_challenges = [
    "BLINK",
    "LOOK LEFT",
    "LOOK RIGHT",
    "LOOK UP"
]

challenges = random.sample(all_challenges, 3)
verification_complete = False

challenge_completed = False
last_blink_count = 0

def verify_challenge(new_blink, head_direction):

    global challenge_index
    global verification_complete
    global challenge_completed

    current_challenge = challenges[challenge_index]

    # ---------------- BLINK ---------------- #

    if current_challenge == "BLINK":

        if new_blink:

            challenge_index += 1

    # ---------------- LOOK LEFT ---------------- #

    elif current_challenge == "LOOK LEFT":

        if head_direction == "Looking Left":

            if not challenge_completed:

                challenge_index += 1

                challenge_completed = True

    # ---------------- LOOK RIGHT ---------------- #

    elif current_challenge == "LOOK RIGHT":

        if head_direction == "Looking Right":

            if not challenge_completed:

                challenge_index += 1

                challenge_completed = True

    # ---------------- LOOK UP ---------------- #

    elif current_challenge == "LOOK UP":

        if head_direction == "Looking Up":

            if not challenge_completed:

                challenge_index += 1

                challenge_completed = True

    # ---------------- RESET ---------------- #

    if current_challenge == "LOOK LEFT" and head_direction != "Looking Left":

        challenge_completed = False

    elif current_challenge == "LOOK RIGHT" and head_direction != "Looking Right":

        challenge_completed = False

    elif current_challenge == "LOOK UP" and head_direction != "Looking Up":

        challenge_completed = False

    # ---------------- COMPLETE ---------------- #

    if challenge_index >= len(challenges):

        verification_complete = True

        challenge_index = len(challenges) - 1

    return challenges[challenge_index]