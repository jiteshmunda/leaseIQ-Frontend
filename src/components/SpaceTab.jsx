import React from "react";
import { FiFileText, FiExternalLink } from "react-icons/fi";
import { openPdfWithCitation, canNavigateToCitation, getCitationDisplayText } from "../service/citationUtils";
import { showError } from "../service/toast";
import FieldWithTooltip from "./Fieldwithamendments";

const getFieldCitation = (field) => {
  if (!field || typeof field !== "object") return "";
  if (typeof field.citation === "string") return field.citation;
  if (field.citation && typeof field.citation === "object") {
    if (typeof field.citation.value === "string") return field.citation.value;
  }
  return "";
};

const hasAmendments = (field) =>
  !!(
    field &&
    typeof field === "object" &&
    Array.isArray(field.amendments) &&
    field.amendments.length > 0
  );

const formatAmendmentsLabel = (filename) => {
  if (typeof filename !== "string") return "Amendments";
  const trimmed = filename.trim();
  if (!trimmed) return "Amendments";
  return trimmed.replace(/\.[^.]+$/i, "");
};

const SpaceTab = ({ leaseMeta, spaceInfo, getFieldValue, filename, documentId }) => {
  const parkingSpacesField =
    spaceInfo?.parking?.value && typeof spaceInfo.parking.value === "object"
      ? spaceInfo.parking.value
      : spaceInfo?.parking;

  // Handle citation click to open PDF viewer
  const handleCitationClick = async (citation) => {
    if (!documentId) {
      showError("Document not available for citation navigation");
      return;
    }

    try {
      await openPdfWithCitation(documentId, citation);
    } catch (err) {
      console.error("Failed to open citation:", err);
      showError("Failed to open PDF. Please try again.");
    }
  };

  // Enhanced citation tag component - now clickable
  const renderCitationTag = (citation, field, size) => {
    if (!citation) return null;
    
    // Get the full citation object if available (for structured citations)
    const citationObj = field?.citation || citation;
    const displayText = getCitationDisplayText(citationObj) || citation;
    const isNavigable = documentId && canNavigateToCitation(citationObj);
    
    const sizeClass = size === "small" ? " small" : "";
    
    if (isNavigable) {
      return (
        <button
          type="button"
          className={`provision-citation-tag provision-citation-clickable${sizeClass}`}
          onClick={() => handleCitationClick(citationObj)}
          title="Click to view in PDF"
        >
          <FiFileText className="provision-citation-icon" />
          <span className="provision-citation-text">{displayText}</span>
          <FiExternalLink className="provision-citation-link-icon" size={12} />
        </button>
      );
    }
    
    return (
      <div className={`provision-citation-tag${sizeClass}`}>
        <FiFileText className="provision-citation-icon" />
        <span className="provision-citation-text">{displayText}</span>
      </div>
    );
  };

  // Render amendments with citation support
  const renderAmendments = (field, filename) => {
    if (!field || !Array.isArray(field.amendments) || !field.amendments.length) {
      return null;
    }

    return (
      <div className="amendments-block">
        <span className="amendments-label">{formatAmendmentsLabel(filename)}</span>
        <ul className="amendments-list">
          {field.amendments.map((am, idx) => (
            <li key={idx}>
              {am?.effective_date ? <strong>{am.effective_date}: </strong> : null}
              {am?.description || (
                <span>
                  {am?.previous_value && (
                    <span>
                      Previous: {am.previous_value}{" "}
                    </span>
                  )}
                  {am?.new_value && <span>New: {am.new_value}</span>}
                </span>
              )}
              {am?.amendment_citation && (
                <div style={{ marginTop: "4px" }}>
                  {renderCitationTag(am.amendment_citation, null, "small")}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <section className="card">
      <div className="card-header">
        <h3>Space Information</h3>
      </div>
      <div className="info-grid">

        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.premises) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="PREMISES"
              amendments={spaceInfo?.premises?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.premises) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.premises) && renderCitationTag(getFieldCitation(spaceInfo?.premises), spaceInfo?.premises)}
          {renderAmendments(spaceInfo?.premises, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.unit) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="UNIT"
              amendments={spaceInfo?.unit?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.unit) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.unit) && renderCitationTag(getFieldCitation(spaceInfo?.unit), spaceInfo?.unit)}
          {renderAmendments(spaceInfo?.unit, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.building) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="BUILDING"
              amendments={spaceInfo?.building?.amendments}
            />
          </label>
          <p>
            {getFieldValue(spaceInfo?.building) ||
              leaseMeta?.property?.property_name || "N/A"}
          </p>
          {getFieldCitation(spaceInfo?.building) && renderCitationTag(getFieldCitation(spaceInfo?.building), spaceInfo?.building)}
          {renderAmendments(spaceInfo?.building, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.floor) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="FLOOR"
              amendments={spaceInfo?.floor?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.floor) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.floor) && renderCitationTag(getFieldCitation(spaceInfo?.floor), spaceInfo?.floor)}
          {renderAmendments(spaceInfo?.floor, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.zipCode) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="ZIP CODE"
              amendments={spaceInfo?.zipCode?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.zipCode) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.zipCode) && renderCitationTag(getFieldCitation(spaceInfo?.zipCode), spaceInfo?.zipCode)}
          {renderAmendments(spaceInfo?.zipCode, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.areaRentable) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="AREA (Rentable)"
              amendments={spaceInfo?.areaRentable?.amendments}
            />
          </label>
          <p>
            {getFieldValue(spaceInfo?.areaRentable) ||
              (leaseMeta?.unit?.square_ft
                ? `${leaseMeta.unit.square_ft} sqft`
                : "N/A")}
          </p>
          {getFieldCitation(spaceInfo?.areaRentable) && renderCitationTag(getFieldCitation(spaceInfo?.areaRentable), spaceInfo?.areaRentable)}
          {renderAmendments(spaceInfo?.areaRentable, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.areaUsable) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="AREA (Usable)"
              amendments={spaceInfo?.areaUsable?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.areaUsable) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.areaUsable) && renderCitationTag(getFieldCitation(spaceInfo?.areaUsable), spaceInfo?.areaUsable)}
          {renderAmendments(spaceInfo?.areaUsable, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.city) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="CITY"
              amendments={spaceInfo?.city?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.city) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.city) && renderCitationTag(getFieldCitation(spaceInfo?.city), spaceInfo?.city)}
          {renderAmendments(spaceInfo?.city, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.state) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="STATE"
              amendments={spaceInfo?.state?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.state) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.state) && renderCitationTag(getFieldCitation(spaceInfo?.state), spaceInfo?.state)}
          {renderAmendments(spaceInfo?.state, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.notes) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="NOTES"
              amendments={spaceInfo?.notes?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.notes) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.notes) && renderCitationTag(getFieldCitation(spaceInfo?.notes), spaceInfo?.notes)}
          {renderAmendments(spaceInfo?.notes, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.commonArea) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="COMMON AREA"
              amendments={spaceInfo?.commonArea?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.commonArea) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.commonArea) && renderCitationTag(getFieldCitation(spaceInfo?.commonArea), spaceInfo?.commonArea)}
          {renderAmendments(spaceInfo?.commonArea, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(parkingSpacesField) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="PARKING SPACES"
              amendments={parkingSpacesField?.amendments}
            />
          </label>
          <p>{getFieldValue(parkingSpacesField) || "N/A"}</p>
          {getFieldCitation(parkingSpacesField) && renderCitationTag(getFieldCitation(parkingSpacesField), parkingSpacesField)}
          {renderAmendments(parkingSpacesField, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.parking?.type) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="PARKING TYPE"
              amendments={spaceInfo?.parking?.type?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.parking?.type) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.parking?.type) && renderCitationTag(getFieldCitation(spaceInfo?.parking?.type), spaceInfo?.parking?.type)}
          {renderAmendments(spaceInfo?.parking?.type, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.storageArea) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="STORAGE AREA"
              amendments={spaceInfo?.storageArea?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.storageArea) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.storageArea) && renderCitationTag(getFieldCitation(spaceInfo?.storageArea), spaceInfo?.storageArea)}
          {renderAmendments(spaceInfo?.storageArea, filename)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.status) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="STATUS"
              amendments={spaceInfo?.status?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.status) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.status) && renderCitationTag(getFieldCitation(spaceInfo?.status), spaceInfo?.status)}
          {renderAmendments(spaceInfo?.status, filename)}
        </div>
      </div>
    </section>
  );
};

export default SpaceTab;
