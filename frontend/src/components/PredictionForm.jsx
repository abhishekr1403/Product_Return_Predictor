import { useState } from 'react';
import {
  PRODUCT_CATEGORIES,
  SUB_CATEGORIES,
  BRANDS,
  FULFILLMENT_TYPES,
  PAYMENT_METHODS,
} from '../constants';

const REQUIRED_FIELDS = ['price', 'product_category', 'sub_category', 'brand', 'fulfillment_type', 'payment_method'];

const BOOLEAN_FIELDS = [
  { key: 'fragile_item',             label: '🧊 Fragile Item' },
  { key: 'warranty_available',       label: '✅ Warranty Available' },
  { key: 'wishlist_before_purchase', label: '❤️ Was on Wishlist' },
  { key: 'delayed_delivery',         label: '🚚 Delivery Delayed' },
];

const INITIAL_STATE = {
  // Required
  price: '',
  product_category: '',
  sub_category: '',
  brand: '',
  fulfillment_type: '',
  payment_method: '',
  // Optional numerics
  discount_percent: '',
  product_rating: '',
  review_count: '',
  product_return_rate: '',
  category_return_rate: '',
  brand_return_rate: '',
  defect_rate: '',
  seller_rating: '',
  seller_return_rate: '',
  quantity: '',
  shipping_distance_km: '',
  product_page_views: '',
  total_support_contacts: '',
  // Boolean flags
  fragile_item: false,
  warranty_available: false,
  wishlist_before_purchase: false,
  delayed_delivery: false,
};

function SelectField({ id, label, required, hint, value, onChange, options, placeholder, error }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label} {required && <span className="required">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={error ? { borderColor: 'rgba(239,68,68,0.6)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : {}}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {error && <span style={{ fontSize: 11, color: '#f87171', marginTop: 3 }}>⚠ {error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

function NumberField({ id, label, required, hint, value, onChange, min, max, step, placeholder, error }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        step={step || 'any'}
        placeholder={placeholder || 'Leave blank for auto-fill'}
        style={error ? { borderColor: 'rgba(239,68,68,0.6)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : {}}
      />
      {error && <span style={{ fontSize: 11, color: '#f87171', marginTop: 3 }}>⚠ {error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export default function PredictionForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key) => (val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    // Clear error on change
    if (fieldErrors[key]) setFieldErrors(prev => ({ ...prev, [key]: null }));
  };
  const toggle = (key) => () => setForm(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = (e) => {
    e.preventDefault();

    // --- Validate required fields ---
    const errors = {};
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
      errors.price = 'Required — enter a price greater than 0';
    }
    if (!form.product_category) errors.product_category = 'Required';
    if (!form.sub_category) errors.sub_category = 'Required';
    if (!form.brand) errors.brand = 'Required';
    if (!form.fulfillment_type) errors.fulfillment_type = 'Required';
    if (!form.payment_method) errors.payment_method = 'Required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Scroll to first error
      const firstKey = Object.keys(errors)[0];
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setFieldErrors({});

    // Build payload — omit empty optional numbers
    const payload = {
      price: parseFloat(form.price),
      product_category: form.product_category,
      sub_category: form.sub_category,
      brand: form.brand,
      fulfillment_type: form.fulfillment_type,
      payment_method: form.payment_method,
      fragile_item: form.fragile_item,
      warranty_available: form.warranty_available,
      wishlist_before_purchase: form.wishlist_before_purchase,
      delayed_delivery: form.delayed_delivery,
    };

    const optionalNumbers = {
      discount_percent: parseFloat,
      product_rating: parseFloat,
      review_count: parseInt,
      product_return_rate: parseFloat,
      category_return_rate: parseFloat,
      brand_return_rate: parseFloat,
      defect_rate: parseFloat,
      seller_rating: parseFloat,
      seller_return_rate: parseFloat,
      quantity: parseInt,
      shipping_distance_km: parseFloat,
      product_page_views: parseInt,
      total_support_contacts: parseInt,
    };

    Object.entries(optionalNumbers).forEach(([key, parser]) => {
      const val = form[key];
      if (val !== '' && val !== null && val !== undefined) {
        const parsed = parser(val);
        if (!isNaN(parsed)) payload[key] = parsed;
      }
    });

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="form-layout" noValidate>
      {/* ── Required Identifiers ── */}
      <div className="card">
        <div className="section-title">Product Details</div>
        <div className="form-grid-2">
          <SelectField
            id="product_category"
            label="Category"
            required
            value={form.product_category}
            onChange={set('product_category')}
            options={PRODUCT_CATEGORIES}
            error={fieldErrors.product_category}
          />
          <SelectField
            id="sub_category"
            label="Sub-Category"
            required
            value={form.sub_category}
            onChange={set('sub_category')}
            options={SUB_CATEGORIES}
            error={fieldErrors.sub_category}
          />
          <SelectField
            id="brand"
            label="Brand"
            required
            value={form.brand}
            onChange={set('brand')}
            options={BRANDS}
            error={fieldErrors.brand}
          />
          <NumberField
            id="price"
            label="Price (INR)"
            required
            value={form.price}
            onChange={set('price')}
            min={0.01}
            placeholder="e.g. 2499"
            hint="Raw price — log-transform applied internally"
            error={fieldErrors.price}
          />
          <NumberField
            id="discount_percent"
            label="Discount %"
            value={form.discount_percent}
            onChange={set('discount_percent')}
            min={0} max={100}
            placeholder="0 – 100"
          />
          <NumberField
            id="quantity"
            label="Quantity Ordered"
            value={form.quantity}
            onChange={set('quantity')}
            min={1}
            step={1}
            placeholder="e.g. 1"
          />
        </div>
      </div>

      {/* ── Product Quality ── */}
      <div className="card">
        <div className="section-title">Product Quality & Reviews</div>
        <div className="form-grid-2">
          <NumberField
            id="product_rating"
            label="Product Rating"
            value={form.product_rating}
            onChange={set('product_rating')}
            min={1} max={5} step={0.1}
            placeholder="1.0 – 5.0"
          />
          <NumberField
            id="review_count"
            label="Review Count"
            value={form.review_count}
            onChange={set('review_count')}
            min={0} step={1}
            placeholder="e.g. 420"
          />
          <NumberField
            id="defect_rate"
            label="Defect Rate"
            value={form.defect_rate}
            onChange={set('defect_rate')}
            min={0} max={1} step={0.001}
            placeholder="0.0 – 1.0"
            hint="Fraction of defective units"
          />
          <NumberField
            id="product_return_rate"
            label="Historical Return Rate"
            value={form.product_return_rate}
            onChange={set('product_return_rate')}
            min={0} max={1} step={0.001}
            placeholder="0.0 – 1.0"
            hint="Product's past return rate"
          />
          <NumberField
            id="category_return_rate"
            label="Category Return Rate"
            value={form.category_return_rate}
            onChange={set('category_return_rate')}
            min={0} max={1} step={0.001}
            placeholder="0.0 – 1.0"
          />
          <NumberField
            id="product_page_views"
            label="Page Views"
            value={form.product_page_views}
            onChange={set('product_page_views')}
            min={0} step={1}
            placeholder="e.g. 1200"
          />
        </div>
      </div>

      {/* ── Seller & Logistics ── */}
      <div className="card">
        <div className="section-title">Seller & Logistics</div>
        <div className="form-grid-2">
          <SelectField
            id="fulfillment_type"
            label="Fulfillment Type"
            required
            value={form.fulfillment_type}
            onChange={set('fulfillment_type')}
            options={FULFILLMENT_TYPES}
            error={fieldErrors.fulfillment_type}
          />
          <SelectField
            id="payment_method"
            label="Payment Method"
            required
            value={form.payment_method}
            onChange={set('payment_method')}
            options={PAYMENT_METHODS}
            error={fieldErrors.payment_method}
          />
          <NumberField
            id="seller_rating"
            label="Seller Rating"
            value={form.seller_rating}
            onChange={set('seller_rating')}
            min={1} max={5} step={0.1}
            placeholder="1.0 – 5.0"
          />
          <NumberField
            id="seller_return_rate"
            label="Seller Return Rate"
            value={form.seller_return_rate}
            onChange={set('seller_return_rate')}
            min={0} max={1} step={0.001}
            placeholder="0.0 – 1.0"
          />
          <NumberField
            id="brand_return_rate"
            label="Brand Return Rate"
            value={form.brand_return_rate}
            onChange={set('brand_return_rate')}
            min={0} max={1} step={0.001}
            placeholder="0.0 – 1.0"
          />
          <NumberField
            id="shipping_distance_km"
            label="Shipping Distance (km)"
            value={form.shipping_distance_km}
            onChange={set('shipping_distance_km')}
            min={0}
            placeholder="e.g. 350"
          />
          <NumberField
            id="total_support_contacts"
            label="Support Contacts"
            value={form.total_support_contacts}
            onChange={set('total_support_contacts')}
            min={0} step={1}
            placeholder="e.g. 2"
            hint="Number of CS contacts for this order"
          />
        </div>
      </div>

      {/* ── Boolean flags ── */}
      <div className="card">
        <div className="section-title">Order Flags</div>
        <div className="toggles-grid">
          {BOOLEAN_FIELDS.map(({ key, label }) => (
            <label
              key={key}
              className={`toggle-item${form[key] ? ' active' : ''}`}
              htmlFor={`toggle-${key}`}
            >
              <div className="toggle-switch">
                <input
                  id={`toggle-${key}`}
                  type="checkbox"
                  checked={form[key]}
                  onChange={toggle(key)}
                />
                <span className="toggle-track" />
              </div>
              <span className="toggle-label">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="submit-area">
        <button
          id="btn-run-prediction"
          type="submit"
          className="btn-predict"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              Analysing…
            </>
          ) : (
            <>
              <span className="btn-icon">🔮</span>
              Run Prediction
            </>
          )}
        </button>
      </div>
    </form>
  );
}
