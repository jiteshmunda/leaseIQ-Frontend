import { useMemo, useState } from "react";
import { FiEdit } from "react-icons/fi";

const InfoTab = ({
  leaseInfo,
  leaseMeta,
  chargeSchedules,
  // miscProvisions,
  premisesAndTerm,
  derivedSecurityDeposit,
  getFieldValue,
  // formatDisplayValue,
  leaseDetails,
  onUpdateLeaseDetails,
}) => {
  const keyDatesCount = useMemo(() => {
    const seen = new Set();

    const looksLikeDate = (s) => {
      const text = String(s ?? "").trim();
      if (!text) return false;
      // ISO-ish: 2025-12-30 or 2025-12-30T...
      if (/^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/.test(text)) return true;
      // Common US: 12/30/2025 or 12/30/25
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(text)) return true;
      return false;
    };

    const visit = (value) => {
      if (value == null) return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (typeof value === "object") {
        Object.values(value).forEach(visit);
        return;
      }
      if (typeof value === "string") {
        if (!looksLikeDate(value)) return;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return;
        const day = d.toISOString().slice(0, 10);
        seen.add(day);
      }
    };

    visit(leaseDetails);
    return seen.size;
  }, [leaseDetails]);

  const obligationsCount = useMemo(() => {
    const audit = leaseDetails?.audit;
    const totalItems = audit?.totalItems ?? audit?.total_items ?? audit?.summary?.totalItems;
    if (typeof totalItems === "number" && Number.isFinite(totalItems)) {
      return totalItems;
    }
    const source = audit?.identified_risks || audit?.audit_checklist;
    return Array.isArray(source) ? source.length : 0;
  }, [leaseDetails]);

  const keyTermsCount = useMemo(() => {
    const info = leaseDetails?.info?.leaseInformation;
    if (!info || typeof info !== "object") return 0;

    const isNonEmpty = (v) => {
      if (v == null) return false;
      if (typeof v === "string") return v.trim().length > 0;
      if (typeof v === "number") return Number.isFinite(v);
      if (typeof v === "boolean") return true;
      if (typeof v === "object" && "value" in v) {
        const inner = v.value;
        if (inner == null) return false;
        return String(inner).trim().length > 0;
      }
      return false;
    };

    return Object.values(info).filter(isNonEmpty).length;
  }, [leaseDetails]);

  const overviewCards = useMemo(
    () => [
      {
        key: "liabilities",
        color: "red",
        label: "Liabilities",
        value: leaseDetails?.audit ? "Hidden" : "N/A",
      },
      {
        key: "keyDates",
        color: "blue",
        label: "Key Dates",
        value: keyDatesCount,
      },
      {
        key: "obligations",
        color: "green",
        label: "Obligations",
        value: obligationsCount,
      },
      {
        key: "keyTerms",
        color: "orange",
        label: "Key Terms",
        value: keyTermsCount,
      },
    ],
    [leaseDetails, keyDatesCount, obligationsCount, keyTermsCount]
  );

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    lease: getFieldValue(leaseInfo?.lease) || "",
    propertyAddress: getFieldValue(leaseInfo?.property) || "",
    leaseFrom: getFieldValue(leaseInfo?.leaseFrom) || "",
    leaseTo: getFieldValue(leaseInfo?.leaseTo) || "",
    renewalOptions: getFieldValue(premisesAndTerm?.synopsis) || "",
    squareFeet:
      (leaseDetails?.info?.leaseInformation?.squareFeet?.value &&
        String(leaseDetails.info.leaseInformation.squareFeet.value)) ||
      (leaseMeta?.unit?.square_ft
        ? String(leaseMeta.unit.square_ft)
        : ""),
    baseRent:
      (chargeSchedules?.baseRent?.[0]?.monthlyAmount?.value &&
        String(chargeSchedules.baseRent[0].monthlyAmount.value)) ||
      (leaseMeta?.unit?.monthly_rent
        ? String(leaseMeta.unit.monthly_rent)
        : ""),
    securityDeposit:
      (leaseDetails?.info?.leaseInformation?.securityDeposit?.value &&
        String(leaseDetails.info.leaseInformation.securityDeposit.value)) ||
      (derivedSecurityDeposit || ""),
  });

  const startEditInfo = () => {
    setInfoForm({
      lease: getFieldValue(leaseInfo?.lease) || "",
      propertyAddress: getFieldValue(leaseInfo?.property) || "",
      leaseFrom: getFieldValue(leaseInfo?.leaseFrom) || "",
      leaseTo: getFieldValue(leaseInfo?.leaseTo) || "",
      renewalOptions: getFieldValue(premisesAndTerm?.synopsis) || "",
      squareFeet:
        (leaseDetails?.info?.leaseInformation?.squareFeet?.value &&
          String(leaseDetails.info.leaseInformation.squareFeet.value)) ||
        (leaseMeta?.unit?.square_ft
          ? String(leaseMeta.unit.square_ft)
          : ""),
      baseRent:
        (chargeSchedules?.baseRent?.[0]?.monthlyAmount?.value &&
          String(chargeSchedules.baseRent[0].monthlyAmount.value)) ||
        (leaseMeta?.unit?.monthly_rent
          ? String(leaseMeta.unit.monthly_rent)
          : ""),
      securityDeposit:
        (leaseDetails?.info?.leaseInformation?.securityDeposit?.value &&
          String(leaseDetails.info.leaseInformation.securityDeposit.value)) ||
        (derivedSecurityDeposit || ""),
    });
    setIsEditingInfo(true);
  };

  const handleChange = (field, value) => {
    setInfoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveInfo = () => {
    if (!onUpdateLeaseDetails || !leaseDetails) {
      setIsEditingInfo(false);
      return;
    }

    const updatedLeaseDetails = {
      ...leaseDetails,
      info: {
        ...(leaseDetails?.info || {}),
        leaseInformation: {
          ...(leaseDetails?.info?.leaseInformation || {}),
          lease: {
            ...(leaseDetails?.info?.leaseInformation?.lease || {}),
            value: infoForm.lease.trim(),
          },
          property: {
            ...(leaseDetails?.info?.leaseInformation?.property || {}),
            value: infoForm.propertyAddress.trim(),
          },
          leaseFrom: {
            ...(leaseDetails?.info?.leaseInformation?.leaseFrom || {}),
            value: infoForm.leaseFrom.trim(),
          },
          leaseTo: {
            ...(leaseDetails?.info?.leaseInformation?.leaseTo || {}),
            value: infoForm.leaseTo.trim(),
          },
          squareFeet: {
            ...(leaseDetails?.info?.leaseInformation?.squareFeet || {}),
            value: infoForm.squareFeet.trim(),
          },
          securityDeposit: {
            ...(leaseDetails?.info?.leaseInformation?.securityDeposit || {}),
            value: infoForm.securityDeposit.trim(),
          },
        },
      },
      misc: {
        ...(leaseDetails?.misc || {}),
        otherLeaseProvisions: {
          ...(leaseDetails?.misc?.otherLeaseProvisions || {}),
          premisesAndTerm: {
            ...(leaseDetails?.misc?.otherLeaseProvisions?.premisesAndTerm || {}),
            synopsis: {
              ...(leaseDetails?.misc?.otherLeaseProvisions?.premisesAndTerm?.synopsis || {}),
              value: infoForm.renewalOptions.trim(),
            },
          },
        },
      },
      "charge-schedules": (() => {
        const root = { ...(leaseDetails?.["charge-schedules"] || {}) };
        const schedules = { ...(root.chargeSchedules || {}) };

        if (Array.isArray(schedules.baseRent) && schedules.baseRent[0]) {
          const baseRentArr = [...schedules.baseRent];
          const first = { ...(baseRentArr[0] || {}) };
          first.monthlyAmount = {
            ...(first.monthlyAmount || {}),
            value: infoForm.baseRent.trim(),
          };
          baseRentArr[0] = first;
          schedules.baseRent = baseRentArr;
        }

        return {
          ...root,
          chargeSchedules: schedules,
        };
      })(),
    };

    onUpdateLeaseDetails(updatedLeaseDetails);
    setIsEditingInfo(false);
  };

  return (
    <>
      {/* Overview */}
      <section className="overview">
        {overviewCards.map((card) => (
          <div key={card.key} className={`overview-card ${card.color}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </section>

      {/* Lease Info */}
      <section className="card">
        <div className="card-header">
          <h3>Lease Information</h3>
          <button
            type="button"
            className="edit-btn"
            onClick={startEditInfo}
          >
            <FiEdit /> {isEditingInfo ? "Editing" : "Edit"}
          </button>
        </div>

        <div className="info-grid">
          <div>
            <label>Lease</label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.lease}
                onChange={(e) => handleChange("lease", e.target.value)}
                placeholder="Enter lease type"
              />
            ) : (
              <p>{getFieldValue(leaseInfo?.lease) || "N/A"}</p>
            )}
          </div>
          <div>
            <label>Property</label>
            <p>{leaseMeta?.property?.property_name || "N/A"}</p>
          </div>
          <div>
            <label>Property Address</label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.propertyAddress}
                onChange={(e) =>
                  handleChange("propertyAddress", e.target.value)
                }
                placeholder="Enter property address"
              />
            ) : (
              <p>{getFieldValue(leaseInfo?.property) || "N/A"}</p>
            )}
          </div>
          <div>
            <label>Lease From</label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.leaseFrom}
                onChange={(e) => handleChange("leaseFrom", e.target.value)}
                placeholder="Enter lease start date"
              />
            ) : (
              <p>{getFieldValue(leaseInfo?.leaseFrom) || "N/A"}</p>
            )}
          </div>
          <div>
            <label>Lease To</label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.leaseTo}
                onChange={(e) => handleChange("leaseTo", e.target.value)}
                placeholder="Enter lease end date"
              />
            ) : (
              <p>{getFieldValue(leaseInfo?.leaseTo) || "N/A"}</p>
            )}
          </div>
          <div>
            <label>Square Feet</label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.squareFeet}
                onChange={(e) => handleChange("squareFeet", e.target.value)}
                placeholder="Enter square feet"
              />
            ) : (
              <p>
                {(() => {
                  const val =
                    leaseDetails?.info?.leaseInformation?.squareFeet?.value ||
                    leaseMeta?.unit?.square_ft;
                  return val ? `${val} sqft` : "N/A";
                })()}
              </p>
            )}
          </div>
          <div>
            <label>Base Rent</label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.baseRent}
                onChange={(e) => handleChange("baseRent", e.target.value)}
                placeholder="Enter base rent (per month)"
              />
            ) : (
              <p>
                {chargeSchedules?.baseRent?.[0]?.monthlyAmount?.value
                  ? `${
                      chargeSchedules.baseRent[0].monthlyAmount.value
                    } / month`
                  : leaseMeta?.unit?.monthly_rent
                  ? `${leaseMeta.unit.monthly_rent} / month`
                  : "N/A"}
              </p>
            )}
          </div>
          <div>
            <label>Security Deposit</label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.securityDeposit}
                onChange={(e) =>
                  handleChange("securityDeposit", e.target.value)
                }
                placeholder="Enter security deposit"
              />
            ) : (
              <p>
                {leaseDetails?.info?.leaseInformation?.securityDeposit?.value ||
                  derivedSecurityDeposit || "N/A"}
              </p>
            )}
          </div>
          <div>
            <label>Renewal Options</label>
            {isEditingInfo ? (
              <textarea
                className="form-control"
                rows={2}
                value={infoForm.renewalOptions}
                onChange={(e) =>
                  handleChange("renewalOptions", e.target.value)
                }
                placeholder="Enter renewal options"
              />
            ) : (
              <p>{getFieldValue(premisesAndTerm?.synopsis) || "N/A"}</p>
            )}
          </div>
        </div>

        {isEditingInfo && (
          <div className="mt-3 d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setIsEditingInfo(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={handleSaveInfo}
            >
              Save Changes
            </button>
          </div>
        )}
      </section>

      
      {/* <section className="card">
        <div className="card-header">
          <h3>Executive Summary</h3>
          <button className="add-btn">
            <FiPlus /> Add Item
          </button>
        </div>

        <ul className="summary-list">
          {[
            premisesAndTerm?.synopsis?.value,
            premisesAndTerm?.keyParameters?.value,
            premisesAndTerm?.narrative?.value,
            miscProvisions?.operatingExpenses?.synopsis?.value,
            miscProvisions?.taxes?.synopsis?.value,
            miscProvisions?.repairsAndMaintenance?.synopsis?.value,
          ]
            .map((raw) => formatDisplayValue(raw))
            .filter((text) => text)
            .map((item, i) => (
              <li key={i} className="summary-item">
                <span className="summary-text">{item}</span>
                <span className="summary-actions">
                  <FiEdit />
                  <FiTrash2 />
                </span>
              </li>
            ))}
        </ul>
      </section> */}
    </>
  );
};

export default InfoTab;
