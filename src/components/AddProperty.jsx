import { useState } from "react";
import "../styles/addProperty.css";
import { useNavigate } from "react-router-dom";
import { showError, showSuccess } from "../service/toast";
import AnimatedBackground from "./AnimatedBackground";
const AddProperty = ({ data, setData, onNext }) => {
  const [propertyName, setPropertyName] = useState(data.propertyName || "");
  const [address, setAddress] = useState(data.address || "");
  const [errors, setErrors] = useState({});
const [touched, setTouched] = useState({});

  const isFormValid = propertyName.trim().length >= 3;
  const navigate = useNavigate();
  const validate = () => {
  const newErrors = {};
  const name = propertyName.trim();

  if (!name) {
    newErrors.propertyName = "Property name is required";
  } 
  else if (name.length < 3) {
    newErrors.propertyName = "Property name must be at least 3 characters";
  }
  else if (!/[a-zA-Z]/.test(name)) {
    newErrors.propertyName = "Property name must contain letters";
  }
  else if (!/^[a-zA-Z0-9\s.,-]+$/.test(name)) {
    newErrors.propertyName =
      "Only letters, numbers, spaces, dots and hyphens are allowed";
  }

  return newErrors;
};


 
  const handleContinue = () => {
  const validationErrors = validate();
  setErrors(validationErrors);

  if (Object.keys(validationErrors).length > 0) {
    // Show first validation error
    const firstError = Object.values(validationErrors)[0];
    showError(firstError);
    return;
  }

  // Success
  showSuccess("Property details saved successfully!");

  setData({
    propertyName,
    address,
  });

  onNext();
};

 
const handleBlur = (field) => {
  setTouched((prev) => ({ ...prev, [field]: true }));
  setErrors(validate());
};


  return (
    <>
    <AnimatedBackground />
    <div className="add-property-page">
      <div className="property-wrapper">
        <div className="back-link" onClick={() => navigate("/landing")}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="back-icon"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Back</span>
        </div>
        <div className="property-card">
          <div className="step-text">Step 1 of 3</div>

          <h2>Add Property</h2>
          <p className="subtitle-addproperty">
            Let's start by adding your first property or building
          </p>

          <div className="form-group">
            <label>
              Property/Building Name <span>*</span>
            </label>
            <input
  type="text"
  value={propertyName}
  onChange={(e) => setPropertyName(e.target.value)}
  onBlur={() => handleBlur("propertyName")}
  placeholder="e.g., Downtown Plaza, Main Street Building"
/>
{touched.propertyName && errors.propertyName && (
  <p className="error-text">{errors.propertyName}</p>
)}

          </div>

          <div className="form-group">
            <label>Address (optional)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., 123 Main Street, City, State ZIP"
            />
          </div>

          <div className="button-row">
            <button
              className="btn-continue"
              disabled={!isFormValid}
              onClick={handleContinue}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AddProperty;
