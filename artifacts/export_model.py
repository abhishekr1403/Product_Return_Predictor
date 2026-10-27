"""
Script to cleanly train and export model_data.joblib with correct scaler parameters.
"""

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "Dataset" / "cleaned_returns.csv"
OUTPUT_PATH = BASE_DIR / "artifacts" / "model_data.joblib"


def train_and_export():
    print(f"Loading data from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)

    X = df.drop(columns=["returned"])
    y = df["returned"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # 1. Outlier removal on log_price for training set only (matching notebook)
    q1, q3 = X_train["log_price"].quantile(0.25), X_train["log_price"].quantile(0.75)
    upper = q3 + 3 * (q3 - q1)
    mask = X_train["log_price"] <= upper
    X_train, y_train = X_train[mask], y_train[mask]

    # Feature groups
    binary_flags = [
        "fragile_item",
        "warranty_available",
        "delayed_delivery",
        "wishlist_before_purchase",
    ]
    categorical_features = [
        "product_category",
        "sub_category",
        "brand",
        "fulfillment_type",
        "payment_method",
    ]
    numeric_features = [
        c for c in X_train.columns if c not in binary_flags + categorical_features
    ]
    all_features = numeric_features + binary_flags

    # 2. Impute missing values with training set medians (raw scale)
    train_medians = X_train[all_features].median().to_dict()
    X_train[all_features] = X_train[all_features].fillna(train_medians)
    X_test[all_features] = X_test[all_features].fillna(train_medians)

    # 3. Fit StandardScaler on clean raw data
    scaler = StandardScaler()
    X_train[numeric_features] = scaler.fit_transform(X_train[numeric_features])
    X_test[numeric_features] = scaler.transform(X_test[numeric_features])

    # 4. One-hot encode categoricals
    X_train = pd.get_dummies(X_train, columns=categorical_features, dtype=int)
    X_test = pd.get_dummies(X_test, columns=categorical_features, dtype=int)
    X_test = X_test.reindex(columns=X_train.columns, fill_value=0)

    model_columns = list(X_train.columns)

    # 5. Fit Logistic Regression
    final_model = LogisticRegression(
        max_iter=1000, class_weight="balanced", random_state=42
    )
    final_model.fit(X_train, y_train)

    # 6. Evaluate metrics
    y_pred = final_model.predict(X_test)
    metrics = {
        "Accuracy": float(accuracy_score(y_test, y_pred)),
        "Precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "Recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "F1": float(f1_score(y_test, y_pred, zero_division=0)),
    }
    print("Metrics:", metrics)

    # 7. Compute feature importance (top 20)
    fi_values = np.abs(final_model.coef_[0])
    fi_series = pd.Series(fi_values, index=model_columns).sort_values(ascending=False)
    feature_importance = [
        {"feature": k, "importance": round(float(v), 6)}
        for k, v in fi_series.head(20).items()
    ]

    model_data = {
        "model": final_model,
        "model_name": "Logistic Regression",
        "scaler": scaler,
        "model_columns": model_columns,
        "numeric_features": numeric_features,
        "binary_flags": binary_flags,
        "categorical_features": categorical_features,
        "train_medians": train_medians,
        "metrics": metrics,
        "feature_importance": feature_importance,
        "threshold": 0.5,
    }

    joblib.dump(model_data, OUTPUT_PATH)
    print(f"Successfully saved clean model artifact to {OUTPUT_PATH}")


if __name__ == "__main__":
    train_and_export()
