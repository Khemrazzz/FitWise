# Dataset

Download the **Gym Members Exercise Dataset** and place the CSV here with the exact filename:

```text
gym_members_exercise_tracking.csv
```

Expected columns:

```text
Age
Gender
Weight (kg)
Height (m)
Max_BPM
Avg_BPM
Resting_BPM
Session_Duration (hours)
Calories_Burned
Workout_Type
Fat_Percentage
Water_Intake (liters)
Workout_Frequency (days/week)
Experience_Level
BMI
```

The default model prototype uses only values that can reasonably be available when a new member is assessed:

- Age
- Gender
- Weight (kg)
- Height (m)
- Fat_Percentage
- Workout_Frequency (days/week)
- Experience_Level
- BMI

`Workout_Type` is the target.

The following fields are deliberately excluded from the default model because they can be session/post-workout values and may not exist for a brand-new member:

- Max_BPM
- Avg_BPM
- Session_Duration (hours)
- Calories_Burned
- Water_Intake (liters)

`Resting_BPM` can be added later if the final onboarding process genuinely measures it before prediction.
