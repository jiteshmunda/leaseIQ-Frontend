import { useState } from "react";
import "../styles/addUnitSuite.css";
import { showError, showSuccess } from "../service/toast";
import AnimatedBackground from "./AnimatedBackground";

const AddUnitSuite = ({ data, setData, onBack, onNext }) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [unitNumber, setUnitNumber] = useState(data.unitNumber || "");
  const [tenantName, setTenantName] = useState(data.tenantName || "");
  const [squareFootage, setSquareFootage] = useState(data.squareFootage || "");
  const validate = () => {
    const newErrors = {};

    const unit = unitNumber.trim();
    const tenant = tenantName.trim();

    // UNIT / SUITE VALIDATION
    if (!unit) {
      newErrors.unitNumber = "Unit / Suite number is required";
    } else if (!/\d/.test(unit)) {
      newErrors.unitNumber = "Unit number must contain at least one number";
    } else if (!/^[a-zA-Z0-9\s-]+$/.test(unit)) {
      newErrors.unitNumber =
        "Only letters, numbers, spaces and hyphens are allowed";
    }

    // TENANT NAME VALIDATION
    if (!tenant) {
      newErrors.tenantName = "Tenant name is required";
    } else if (tenant.length < 3) {
      newErrors.tenantName = "Tenant name must be at least 3 characters";
    } else if (!/[a-zA-Z]/.test(tenant)) {
      newErrors.tenantName = "Tenant name must contain letters";
    } else if (!/^[a-zA-Z0-9\s.,&'-]+$/.test(tenant)) {
      newErrors.tenantName =
        "Only letters, numbers, spaces, and . , & - are allowed";
    }

    return newErrors;
  };

  const isFormValid = Object.keys(validate()).length === 0;

  const handleContinue = () => {
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Show first validation error
      const firstError = Object.values(validationErrors)[0];
      showError(firstError);
      return;
    }

    // Success toast
    showSuccess("Unit / Suite details saved successfully!");

    setData({
      unitNumber,
      tenantName,
      squareFootage,
    });

    onNext();
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    // Validate creates new errors based on current state
    setErrors(validate());
  };


  return (
    <>
      <AnimatedBackground />
      <div className="add-unit-page-background">
        <div className="unit-wrapper">

          {/* Back */}
          <div className="back-link" onClick={onBack}>
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

          {/* Card */}
          <div className="unit-card">
            <div className="step-text">Step 2 of 3</div>

            <h2>Add Unit/Suite</h2>
            <p className="subtitle-addunitsuite">
              Add a unit or suite
            </p>

            <div className="form-group">
              <label>
                Unit/Suite Number <span>*</span>
              </label>
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                onBlur={() => handleBlur("unitNumber")}
                placeholder="e.g., Suite 200, Unit A"
              />

              {touched.unitNumber && errors.unitNumber && (
                <p className="error-text">{errors.unitNumber}</p>
              )}

            </div>

            <div className="form-group">
              <label>Tenant Name <span>*</span></label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                onBlur={() => handleBlur("tenantName")}
                placeholder="e.g., ACME Corporation"
              />

              {touched.tenantName && errors.tenantName && (
                <p className="error-text">{errors.tenantName}</p>
              )}

            </div>

            <div className="form-group">
              <label>Square Footage (optional)</label>
              <input
                type="number"
                value={squareFootage}
                onChange={(e) => setSquareFootage(e.target.value)}
                placeholder="e.g., 2500"
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

export default AddUnitSuite;
