import React from "react";
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

const renderAmendments = (field) => {
  if (!field || !Array.isArray(field.amendments) || !field.amendments.length) {
    return null;
  }

  return (
    <div className="amendments-block">
      <span className="amendments-label">Amendments</span>
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
          </li>
        ))}
      </ul>
    </div>
  );
};

const SpaceTab = ({ leaseMeta, spaceInfo, getFieldValue }) => {
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
          {getFieldCitation(spaceInfo?.premises) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.premises)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.premises)}
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
          {getFieldCitation(spaceInfo?.unit) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.unit)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.unit)}
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
          {getFieldCitation(spaceInfo?.building) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.building)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.building)}
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
          {getFieldCitation(spaceInfo?.floor) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.floor)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.floor)}
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
          {getFieldCitation(spaceInfo?.zipCode) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.zipCode)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.zipCode)}
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
          {getFieldCitation(spaceInfo?.areaRentable) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.areaRentable)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.areaRentable)}
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
          {getFieldCitation(spaceInfo?.areaUsable) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.areaUsable)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.areaUsable)}
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
          {getFieldCitation(spaceInfo?.city) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.city)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.city)}
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
          {getFieldCitation(spaceInfo?.state) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.state)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.state)}
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
          {getFieldCitation(spaceInfo?.notes) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.notes)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.notes)}
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
          {getFieldCitation(spaceInfo?.commonArea) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.commonArea)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.commonArea)}
        </div>
        <div
          className={`info-item ${
            hasAmendments(spaceInfo?.parking?.value) ? "has-amendments" : ""
          }`}
        >
          <label>
            <FieldWithTooltip
              value="PARKING SPACES"
              amendments={spaceInfo?.parking?.value?.amendments}
            />
          </label>
          <p>{getFieldValue(spaceInfo?.parking?.value) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.parking?.value) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.parking?.value)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.parking?.value)}
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
          {getFieldCitation(spaceInfo?.parking?.type) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.parking?.type)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.parking?.type)}
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
          {getFieldCitation(spaceInfo?.storageArea) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.storageArea)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.storageArea)}
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
          {getFieldCitation(spaceInfo?.status) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.status)}</span>
          ) : null}
          {renderAmendments(spaceInfo?.status)}
        </div>
      </div>
    </section>
  );
};

export default SpaceTab;
