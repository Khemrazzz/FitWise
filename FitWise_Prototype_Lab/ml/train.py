from __future__ import annotations

import json
from pathlib import Path
from time import perf_counter

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "gym_members_exercise_tracking.csv"
ARTIFACT_DIR = BASE_DIR / "artifacts"
ARTIFACT_DIR.mkdir(exist_ok=True)

TARGET = "Workout_Type"

# New-member-safe prototype features. These can be collected before a recommendation.
FEATURES = [
    "Age",
    "Gender",
    "Weight (kg)",
    "Height (m)",
    "Fat_Percentage",
    "Workout_Frequency (days/week)",
    "Experience_Level",
    "BMI",
]

CATEGORICAL = ["Gender"]
NUMERIC = [c for c in FEATURES if c not in CATEGORICAL]
RANDOM_STATE = 42


def load_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}\n"
            "Download gym_members_exercise_tracking.csv and place it under ml/data/."
        )

    df = pd.read_csv(DATA_PATH)
    missing = [c for c in FEATURES + [TARGET] if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    before = len(df)
    df = df.drop_duplicates().copy()
    print(f"Rows: {before} -> {len(df)} after duplicate removal")
    print("Target distribution:")
    print(df[TARGET].value_counts(dropna=False))
    return df


def build_preprocessor() -> ColumnTransformer:
    numeric_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipe, NUMERIC),
            ("cat", categorical_pipe, CATEGORICAL),
        ],
        remainder="drop",
    )


def candidate_models():
    """Each entry is (estimator, bounded hyperparameter grid) for GridSearchCV.

    Grids are deliberately small/bounded (per Ch3.5's "bounded grid or random
    search") rather than exhaustive, since the dataset is small (973 rows) and
    the point is documented, reproducible tuning rather than an unconstrained sweep.
    """
    return {
        "Logistic Regression": (
            LogisticRegression(max_iter=2000, random_state=RANDOM_STATE),
            {"model__C": [0.01, 0.1, 1, 10]},
        ),
        "Decision Tree": (
            DecisionTreeClassifier(random_state=RANDOM_STATE),
            {"model__max_depth": [3, 5, 7, None], "model__min_samples_leaf": [1, 2, 5]},
        ),
        "Random Forest": (
            RandomForestClassifier(
                class_weight="balanced_subsample",
                random_state=RANDOM_STATE,
                n_jobs=-1,
            ),
            {
                "model__n_estimators": [200, 400],
                "model__max_depth": [None, 10, 20],
                "model__min_samples_leaf": [1, 2],
            },
        ),
        "Support Vector Machine": (
            SVC(
                kernel="rbf",
                probability=True,
                class_weight="balanced",
                random_state=RANDOM_STATE,
            ),
            {"model__C": [0.1, 1, 10], "model__gamma": ["scale", "auto"]},
        ),
        "Gradient Boosting": (
            GradientBoostingClassifier(random_state=RANDOM_STATE),
            {
                "model__n_estimators": [100, 200],
                "model__learning_rate": [0.05, 0.1, 0.2],
                "model__max_depth": [2, 3],
            },
        ),
    }


def main():
    df = load_data()
    X = df[FEATURES].copy()
    y = df[TARGET].astype(str)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        stratify=y,
        random_state=RANDOM_STATE,
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    rows: list[dict] = []
    fitted: dict[str, Pipeline] = {}

    baseline = DummyClassifier(strategy="most_frequent", random_state=RANDOM_STATE)
    baseline.fit(X_train, y_train)
    baseline_pred = baseline.predict(X_test)
    baseline_row = {
        "model": "Baseline (majority class)",
        "best_params": {},
        "cv_macro_f1_mean": None,
        "cv_macro_f1_std": None,
        "test_accuracy": round(float(accuracy_score(y_test, baseline_pred)), 4),
        "test_macro_precision": round(float(precision_score(y_test, baseline_pred, average="macro", zero_division=0)), 4),
        "test_macro_recall": round(float(recall_score(y_test, baseline_pred, average="macro", zero_division=0)), 4),
        "test_macro_f1": round(float(f1_score(y_test, baseline_pred, average="macro", zero_division=0)), 4),
        "candidates_evaluated": 1,
        "tuning_seconds": 0.0,
    }
    rows.append(baseline_row)
    print(json.dumps(baseline_row, indent=2))

    for name, (estimator, param_grid) in candidate_models().items():
        pipeline = Pipeline(
            steps=[
                ("preprocess", build_preprocessor()),
                ("model", estimator),
            ]
        )

        search = GridSearchCV(
            pipeline,
            param_grid=param_grid,
            scoring="f1_macro",
            cv=cv,
            n_jobs=-1,
            refit=True,
        )

        start = perf_counter()
        search.fit(X_train, y_train)
        tuning_seconds = perf_counter() - start

        best_pipeline = search.best_estimator_
        cv_std = float(search.cv_results_["std_test_score"][search.best_index_])
        pred = best_pipeline.predict(X_test)

        row = {
            "model": name,
            "param_grid": param_grid,
            "best_params": {k.replace("model__", ""): v for k, v in search.best_params_.items()},
            "cv_macro_f1_mean": round(float(search.best_score_), 4),
            "cv_macro_f1_std": round(cv_std, 4),
            "test_accuracy": round(float(accuracy_score(y_test, pred)), 4),
            "test_macro_precision": round(float(precision_score(y_test, pred, average="macro", zero_division=0)), 4),
            "test_macro_recall": round(float(recall_score(y_test, pred, average="macro", zero_division=0)), 4),
            "test_macro_f1": round(float(f1_score(y_test, pred, average="macro", zero_division=0)), 4),
            "candidates_evaluated": len(search.cv_results_["params"]),
            "tuning_seconds": round(tuning_seconds, 3),
        }
        rows.append(row)
        fitted[name] = best_pipeline
        print(json.dumps(row, indent=2))

    # Select on CV macro-F1 to avoid selecting purely on the held-out test set.
    # (Baseline is excluded from selection -- it exists only as a reference row.)
    tuned_rows = [r for r in rows if r["cv_macro_f1_mean"] is not None]
    best_row = max(tuned_rows, key=lambda r: r["cv_macro_f1_mean"])
    best_name = best_row["model"]
    best_pipeline = fitted[best_name]
    best_pred = best_pipeline.predict(X_test)

    report = classification_report(y_test, best_pred, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_test, best_pred, labels=sorted(y.unique())).tolist()

    results = {
        "feature_profile": "new_member_safe_v1",
        "features": FEATURES,
        "target": TARGET,
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "selection_metric": "5-fold CV macro F1 (best hyperparameter combination per model via GridSearchCV)",
        "selected_model": best_name,
        "selected_model_best_params": best_row["best_params"],
        "models": rows,
        "classification_report": report,
        "confusion_matrix_labels": sorted(y.unique()),
        "confusion_matrix": cm,
        "important_note": (
            "Prototype performance may be modest because the dataset records workouts performed, "
            "not necessarily expert-labelled optimal workout recommendations. Do not describe Workout_Type "
            "as a clinical ground-truth recommendation without evidence."
        ),
    }

    metadata = {
        "model_name": best_name,
        "model_version": "prototype-0.1.0",
        "feature_profile": "new_member_safe_v1",
        "features": FEATURES,
        "target": TARGET,
        "classes": [str(v) for v in sorted(y.unique())],
        "random_state": RANDOM_STATE,
        "best_hyperparameters": best_row["best_params"],
    }

    joblib.dump(best_pipeline, ARTIFACT_DIR / "workout_pipeline.joblib")
    (ARTIFACT_DIR / "model_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    (ARTIFACT_DIR / "model_results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")

    print("\nSelected model:", best_name)
    print("Saved:", ARTIFACT_DIR / "workout_pipeline.joblib")
    print("Saved:", ARTIFACT_DIR / "model_metadata.json")
    print("Saved:", ARTIFACT_DIR / "model_results.json")


if __name__ == "__main__":
    main()
