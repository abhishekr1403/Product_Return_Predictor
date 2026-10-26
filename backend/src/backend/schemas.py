"""
schemas.py — Pydantic v2 request and response models.

All categorical inputs are validated against known enum values that were
present in the training data.  Unknown values will produce a clear 422 error.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Categorical Enums  (derived from OHE columns in model_data.joblib)
# ---------------------------------------------------------------------------


class ProductCategory(str, Enum):
    Beauty = "Beauty"
    Books = "Books"
    Electronics = "Electronics"
    Fashion = "Fashion"
    Home = "Home"
    Sports = "Sports"
    Toys = "Toys"


class SubCategory(str, Enum):
    Academic = "Academic"
    Accessories = "Accessories"
    Action_Figures = "Action Figures"
    Audio = "Audio"
    Decor = "Decor"
    Educational = "Educational"
    Fiction = "Fiction"
    Fitness = "Fitness"
    Footwear = "Footwear"
    Furniture = "Furniture"
    Haircare = "Haircare"
    Kids = "Kids"
    Kitchen = "Kitchen"
    Laptops = "Laptops"
    Makeup = "Makeup"
    Men = "Men"
    Mobiles = "Mobiles"
    Non_Fiction = "Non-Fiction"
    Outdoor = "Outdoor"
    Outdoor_Play = "Outdoor Play"
    Skincare = "Skincare"
    Team_Sports = "Team Sports"
    Women = "Women"


class Brand(str, Enum):
    Brand_1 = "Brand_1"
    Brand_2 = "Brand_2"
    Brand_3 = "Brand_3"
    Brand_4 = "Brand_4"
    Brand_5 = "Brand_5"
    Brand_6 = "Brand_6"
    Brand_7 = "Brand_7"
    Brand_8 = "Brand_8"
    Brand_9 = "Brand_9"
    Brand_10 = "Brand_10"
    Brand_11 = "Brand_11"
    Brand_12 = "Brand_12"
    Brand_13 = "Brand_13"
    Brand_14 = "Brand_14"
    Brand_15 = "Brand_15"
    Brand_16 = "Brand_16"
    Brand_17 = "Brand_17"
    Brand_18 = "Brand_18"
    Brand_19 = "Brand_19"
    Brand_20 = "Brand_20"
    Brand_21 = "Brand_21"
    Brand_22 = "Brand_22"
    Brand_23 = "Brand_23"
    Brand_24 = "Brand_24"
    Brand_25 = "Brand_25"
    Brand_26 = "Brand_26"
    Brand_27 = "Brand_27"
    Brand_28 = "Brand_28"
    Brand_29 = "Brand_29"
    Brand_30 = "Brand_30"


class FulfillmentType(str, Enum):
    Marketplace_Fulfilled = "Marketplace Fulfilled"
    Seller_Fulfilled = "Seller Fulfilled"


class PaymentMethod(str, Enum):
    COD = "COD"
    Credit_Card = "Credit Card"
    Debit_Card = "Debit Card"
    UPI = "UPI"
    Wallet = "Wallet"


# ---------------------------------------------------------------------------
# Request Model
# ---------------------------------------------------------------------------


class PredictionRequest(BaseModel):
    """
    Input schema for the /predict endpoint.

    Numeric fields are optional — missing values are filled with per-feature
    scaled medians stored inside model_data.joblib.

    The user submits `price` (raw); the backend computes log1p(price).
    """

    # --- Numeric features (all optional; defaults filled from train_medians) ---
    discount_percent: Optional[float] = Field(
        default=None, ge=0, le=100, description="Discount applied as a percentage (0–100)"
    )
    product_rating: Optional[float] = Field(
        default=None, ge=1, le=5, description="Product rating (1–5)"
    )
    review_count: Optional[int] = Field(
        default=None, ge=0, description="Total number of product reviews"
    )
    product_return_rate: Optional[float] = Field(
        default=None, ge=0, le=1, description="Historical return rate for this product (0–1)"
    )
    category_return_rate: Optional[float] = Field(
        default=None, ge=0, le=1, description="Average return rate for this category (0–1)"
    )
    brand_return_rate: Optional[float] = Field(
        default=None, ge=0, le=1, description="Average return rate for this brand (0–1)"
    )
    defect_rate: Optional[float] = Field(
        default=None, ge=0, le=1, description="Product defect rate (0–1)"
    )
    seller_rating: Optional[float] = Field(
        default=None, ge=1, le=5, description="Seller rating (1–5)"
    )
    seller_return_rate: Optional[float] = Field(
        default=None, ge=0, le=1, description="Seller's overall return rate (0–1)"
    )
    quantity: Optional[int] = Field(
        default=None, ge=1, description="Number of units ordered"
    )
    shipping_distance_km: Optional[float] = Field(
        default=None, ge=0, description="Distance to delivery address in kilometres"
    )
    product_page_views: Optional[int] = Field(
        default=None, ge=0, description="Number of page views before purchase"
    )
    total_support_contacts: Optional[int] = Field(
        default=None, ge=0, description="Number of support contacts related to this order"
    )
    price: float = Field(
        ..., gt=0, description="Product price in INR (raw value; log-transformed internally)"
    )

    # --- Binary flags ---
    fragile_item: bool = Field(default=False, description="Is the item fragile?")
    warranty_available: bool = Field(default=False, description="Does the product have a warranty?")
    wishlist_before_purchase: bool = Field(
        default=False, description="Was the product on the customer's wishlist before purchase?"
    )
    delayed_delivery: bool = Field(default=False, description="Was the delivery delayed?")

    # --- Categorical features ---
    product_category: ProductCategory = Field(..., description="Top-level product category")
    sub_category: SubCategory = Field(..., description="Sub-category of the product")
    brand: Brand = Field(..., description="Brand name")
    fulfillment_type: FulfillmentType = Field(..., description="Fulfillment method")
    payment_method: PaymentMethod = Field(..., description="Payment method used")

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("price must be greater than 0")
        return v


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------


class PredictionResponse(BaseModel):
    """Response from the /predict endpoint."""

    will_return: bool = Field(description="True if the model predicts the item will be returned")
    return_probability: float = Field(
        description="Model's probability (0–1) that the item will be returned"
    )
    confidence: str = Field(
        description="Confidence band: 'High' (>0.80 or <0.20), 'Medium' (0.60–0.80 or 0.20–0.40), 'Low' (0.40–0.60)"
    )
    threshold_used: float = Field(description="Decision threshold applied to the probability")
    model_name: str = Field(description="Name of the underlying ML model")


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class ModelInfoResponse(BaseModel):
    """Response from the GET /model/info endpoint."""

    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    threshold: float
    top_features: list[FeatureImportanceItem]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
