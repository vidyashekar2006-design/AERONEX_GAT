from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import (
    ExtraTreesClassifier,
    ExtraTreesRegressor,
    IsolationForest,
)
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline


RANDOM_STATE = 42


FEATURES = [
    "rpm",
    "cht",
    "egt",
    "oil_temperature",
    "oil_pressure",
    "fuel_flow",
    "vibration",
    "throttle",
    "altitude",
    "ambient_temperature",
]


TARGETS = {
    "health": "health_index",
    "degradation": "degradation_index",
    "rul": "rul_hours",
}


def rmse(y_true, y_pred):
    return float(
        np.sqrt(
            mean_squared_error(
                y_true,
                y_pred,
            )
        )
    )


def load_dataset(path: Path) -> pd.DataFrame:

    df = pd.read_csv(path)

    required = (
        FEATURES
        + [
            "engine_id",
            "fault_type",
            "anomaly",
            "health_index",
            "degradation_index",
            "rul_hours",
            "mission_success",
        ]
    )

    missing = [
        column
        for column in required
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Missing required columns: {missing}"
        )

    df = df.sort_values(
        ["engine_id", "sim_time"]
    ).reset_index(drop=True)

    return df


def split_by_engine(df):

    groups = df["engine_id"].unique()

    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.20,
        random_state=RANDOM_STATE,
    )

    train_idx, test_idx = next(
        splitter.split(
            df,
            groups=df["engine_id"],
        )
    )

    train = df.iloc[train_idx].copy()
    test = df.iloc[test_idx].copy()

    splitter2 = GroupShuffleSplit(
        n_splits=1,
        test_size=0.25,
        random_state=RANDOM_STATE,
    )

    train_idx2, validation_idx = next(
        splitter2.split(
            train,
            groups=train["engine_id"],
        )
    )

    train_final = train.iloc[
        train_idx2
    ].copy()

    validation = train.iloc[
        validation_idx
    ].copy()

    return (
        train_final,
        validation,
        test,
    )


def make_classifier():

    return Pipeline(
        [
            (
                "scaler",
                StandardScaler(),
            ),
            (
                "model",
                ExtraTreesClassifier(
                    n_estimators=300,
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                    class_weight="balanced",
                    min_samples_leaf=2,
                ),
            ),
        ]
    )


def make_regressor():

    return Pipeline(
        [
            (
                "scaler",
                StandardScaler(),
            ),
            (
                "model",
                ExtraTreesRegressor(
                    n_estimators=300,
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                    min_samples_leaf=2,
                ),
            ),
        ]
    )


def evaluate_classifier(
    model,
    X,
    y,
):

    predictions = model.predict(X)

    metrics = {
        "accuracy": float(
            accuracy_score(
                y,
                predictions,
            )
        ),
        "precision_macro": float(
            precision_score(
                y,
                predictions,
                average="macro",
                zero_division=0,
            )
        ),
        "recall_macro": float(
            recall_score(
                y,
                predictions,
                average="macro",
                zero_division=0,
            )
        ),
        "f1_macro": float(
            f1_score(
                y,
                predictions,
                average="macro",
                zero_division=0,
            )
        ),
        "confusion_matrix": (
            confusion_matrix(
                y,
                predictions,
            ).tolist()
        ),
        "classification_report": (
            classification_report(
                y,
                predictions,
                output_dict=True,
                zero_division=0,
            )
        ),
    }

    if hasattr(model, "predict_proba"):

        probabilities = model.predict_proba(X)

        if len(
            np.unique(y)
        ) == 2:

            metrics["roc_auc"] = float(
                roc_auc_score(
                    y,
                    probabilities[:, 1],
                )
            )

    return metrics


def evaluate_regressor(
    model,
    X,
    y,
):

    predictions = model.predict(X)

    return {
        "MAE": float(
            mean_absolute_error(
                y,
                predictions,
            )
        ),
        "RMSE": rmse(
            y,
            predictions,
        ),
        "R2": float(
            r2_score(
                y,
                predictions,
            )
        ),
    }


def train_fault_model(
    train,
    validation,
    test,
    output,
):

    model = make_classifier()

    X_train = train[FEATURES]
    y_train = train["fault_type"]

    model.fit(
        X_train,
        y_train,
    )

    validation_metrics = evaluate_classifier(
        model,
        validation[FEATURES],
        validation["fault_type"],
    )

    test_metrics = evaluate_classifier(
        model,
        test[FEATURES],
        test["fault_type"],
    )

    joblib.dump(
        model,
        output / "models" / "fault.joblib",
    )

    metadata = {
        "model": "fault",
        "algorithm": "ExtraTreesClassifier",
        "features": FEATURES,
        "validation": validation_metrics,
        "test": test_metrics,
    }

    write_metadata(
        output,
        "fault",
        metadata,
    )

    print("\nFAULT MODEL")
    print(
        json.dumps(
            test_metrics,
            indent=2,
        )
    )


def train_health_model(
    train,
    validation,
    test,
    output,
):

    model = make_regressor()

    model.fit(
        train[FEATURES],
        train["health_index"],
    )

    validation_metrics = evaluate_regressor(
        model,
        validation[FEATURES],
        validation["health_index"],
    )

    test_metrics = evaluate_regressor(
        model,
        test[FEATURES],
        test["health_index"],
    )

    joblib.dump(
        model,
        output / "models" / "health.joblib",
    )

    write_metadata(
        output,
        "health",
        {
            "model": "health",
            "algorithm": "ExtraTreesRegressor",
            "target": "health_index",
            "features": FEATURES,
            "validation": validation_metrics,
            "test": test_metrics,
        },
    )

    print("\nHEALTH MODEL")
    print(
        json.dumps(
            test_metrics,
            indent=2,
        )
    )


def train_degradation_model(
    train,
    validation,
    test,
    output,
):

    model = make_regressor()

    model.fit(
        train[FEATURES],
        train["degradation_index"],
    )

    validation_metrics = evaluate_regressor(
        model,
        validation[FEATURES],
        validation["degradation_index"],
    )

    test_metrics = evaluate_regressor(
        model,
        test[FEATURES],
        test["degradation_index"],
    )

    joblib.dump(
        model,
        output / "models" / "degradation.joblib",
    )

    write_metadata(
        output,
        "degradation",
        {
            "model": "degradation",
            "algorithm": "ExtraTreesRegressor",
            "target": "degradation_index",
            "features": FEATURES,
            "validation": validation_metrics,
            "test": test_metrics,
        },
    )

    print("\nDEGRADATION MODEL")
    print(
        json.dumps(
            test_metrics,
            indent=2,
        )
    )


def train_rul_model(
    train,
    validation,
    test,
    output,
):

    model = make_regressor()

    model.fit(
        train[FEATURES],
        train["rul_hours"],
    )

    validation_metrics = evaluate_regressor(
        model,
        validation[FEATURES],
        validation["rul_hours"],
    )

    test_metrics = evaluate_regressor(
        model,
        test[FEATURES],
        test["rul_hours"],
    )

    joblib.dump(
        model,
        output / "models" / "rul.joblib",
    )

    write_metadata(
        output,
        "rul",
        {
            "model": "rul",
            "algorithm": "ExtraTreesRegressor",
            "target": "rul_hours",
            "features": FEATURES,
            "validation": validation_metrics,
            "test": test_metrics,
            "note": (
                "RUL is a synthetic representative "
                "research target generated by the "
                "Aeronex simulation dataset."
            ),
        },
    )

    print("\nRUL MODEL")
    print(
        json.dumps(
            test_metrics,
            indent=2,
        )
    )


def train_mission_model(
    train,
    validation,
    test,
    output,
):

    model = make_classifier()

    model.fit(
        train[FEATURES],
        train["mission_success"],
    )

    validation_metrics = evaluate_classifier(
        model,
        validation[FEATURES],
        validation["mission_success"],
    )

    test_metrics = evaluate_classifier(
        model,
        test[FEATURES],
        test["mission_success"],
    )

    joblib.dump(
        model,
        output / "models" / "mission.joblib",
    )

    write_metadata(
        output,
        "mission",
        {
            "model": "mission",
            "algorithm": "ExtraTreesClassifier",
            "target": "mission_success",
            "features": FEATURES,
            "validation": validation_metrics,
            "test": test_metrics,
        },
    )

    print("\nMISSION MODEL")
    print(
        json.dumps(
            test_metrics,
            indent=2,
        )
    )


def train_anomaly_model(
    train,
    test,
    output,
):

    normal = train[
        train["fault_type"] == "normal"
    ]

    model = Pipeline(
        [
            (
                "scaler",
                StandardScaler(),
            ),
            (
                "model",
                IsolationForest(
                    n_estimators=300,
                    random_state=RANDOM_STATE,
                    contamination="auto",
                    n_jobs=-1,
                ),
            ),
        ]
    )

    model.fit(
        normal[FEATURES]
    )

    normal_scores = -model.decision_function(
        normal[FEATURES]
    )

    warning_threshold = float(
        np.quantile(
            normal_scores,
            0.95,
        )
    )

    high_threshold = float(
        np.quantile(
            normal_scores,
            0.99,
        )
    )

    test_scores = -model.decision_function(
        test[FEATURES]
    )

    predicted_anomaly = (
        test_scores >= warning_threshold
    ).astype(int)

    true_anomaly = test[
        "anomaly"
    ].astype(int).to_numpy()

    metrics = {
        "warning_threshold": warning_threshold,
        "high_threshold": high_threshold,
        "precision": float(
            precision_score(
                true_anomaly,
                predicted_anomaly,
                zero_division=0,
            )
        ),
        "recall": float(
            recall_score(
                true_anomaly,
                predicted_anomaly,
                zero_division=0,
            )
        ),
        "f1": float(
            f1_score(
                true_anomaly,
                predicted_anomaly,
                zero_division=0,
            )
        ),
    }

    joblib.dump(
        model,
        output / "models" / "anomaly.joblib",
    )

    write_metadata(
        output,
        "anomaly",
        {
            "model": "anomaly",
            "algorithm": "IsolationForest",
            "features": FEATURES,
            "training_population": (
                "normal telemetry only"
            ),
            "thresholds": {
                "warning": warning_threshold,
                "high": high_threshold,
            },
            "test": metrics,
        },
    )

    print("\nANOMALY MODEL")
    print(
        json.dumps(
            metrics,
            indent=2,
        )
    )


def write_metadata(
    output,
    name,
    metadata,
):

    path = (
        output
        / "metadata"
        / f"{name}.json"
    )

    path.write_text(
        json.dumps(
            metadata,
            indent=2,
        ),
        encoding="utf-8",
    )


def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--data",
        default=(
            "data/generated/"
            "aeronex_ml_v2.csv"
        ),
    )

    parser.add_argument(
        "--out",
        default="artifacts",
    )

    args = parser.parse_args()

    data_path = Path(args.data)
    output = Path(args.out)

    output.mkdir(
        parents=True,
        exist_ok=True,
    )

    for directory in [
        output / "models",
        output / "metadata",
        output / "preprocessors",
    ]:
        directory.mkdir(
            parents=True,
            exist_ok=True,
        )

    print(
        f"Loading dataset: {data_path}"
    )

    df = load_dataset(
        data_path
    )

    print(
        f"Rows: {len(df):,}"
    )

    print(
        f"Engines: "
        f"{df.engine_id.nunique()}"
    )

    train, validation, test = (
        split_by_engine(df)
    )

    print("\nDATA SPLIT")
    print(
        f"Train rows: {len(train):,}"
    )
    print(
        f"Validation rows: "
        f"{len(validation):,}"
    )
    print(
        f"Test rows: {len(test):,}"
    )

    print(
        "\nTraining engines:",
        train.engine_id.nunique(),
    )

    print(
        "Validation engines:",
        validation.engine_id.nunique(),
    )

    print(
        "Test engines:",
        test.engine_id.nunique(),
    )

    train_fault_model(
        train,
        validation,
        test,
        output,
    )

    train_health_model(
        train,
        validation,
        test,
        output,
    )

    train_degradation_model(
        train,
        validation,
        test,
        output,
    )

    train_rul_model(
        train,
        validation,
        test,
        output,
    )

    train_mission_model(
        train,
        validation,
        test,
        output,
    )

    train_anomaly_model(
        train,
        test,
        output,
    )

    manifest = {
        "version": "2.0.0",
        "dataset": str(
            data_path
        ),
        "rows": len(df),
        "engines": int(
            df.engine_id.nunique()
        ),
        "features": FEATURES,
        "models": [
            "fault",
            "health",
            "degradation",
            "rul",
            "mission",
            "anomaly",
        ],
        "split": "engine-held-out",
        "random_state": RANDOM_STATE,
        "note": (
            "Representative synthetic "
            "Aeronex simulation dataset. "
            "Not validated against a real "
            "aero piston engine."
        ),
    }

    write_metadata(
        output,
        "manifest",
        manifest,
    )

    print(
        "\n================================"
    )
    print(
        "AERONEX ML V2 TRAINING COMPLETE"
    )
    print(
        "================================"
    )


if __name__ == "__main__":
    main()