const getFieldCitation = (field) => {
  if (!field || typeof field !== "object") return "";
  if (typeof field.citation === "string") return field.citation;
  if (field.citation && typeof field.citation === "object") {
    if (typeof field.citation.value === "string") return field.citation.value;
  }
  return "";
};

const SpaceTab = ({ leaseMeta, spaceInfo, getFieldValue }) => {
  return (
    <section className="card">
      <div className="card-header">
        <h3>Space Information</h3>
      </div>
      <div className="info-grid">

        <div className="info-item">
          <label>PREMISES</label>
          <p>{getFieldValue(spaceInfo?.premises) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.premises) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.premises)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>UNIT</label>
          <p>{getFieldValue(spaceInfo?.unit) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.unit) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.unit)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>BUILDING</label>
          <p>
            {getFieldValue(spaceInfo?.building) ||
              leaseMeta?.property?.property_name || "N/A"}
          </p>
          {getFieldCitation(spaceInfo?.building) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.building)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>FLOOR</label>
          <p>{getFieldValue(spaceInfo?.floor) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.floor) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.floor)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>ZIP CODE</label>
          <p>{getFieldValue(spaceInfo?.zipCode) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.zipCode) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.zipCode)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>AREA (Rentable)</label>
          <p>
            {getFieldValue(spaceInfo?.areaRentable) ||
              (leaseMeta?.unit?.square_ft
                ? `${leaseMeta.unit.square_ft} sqft`
                : "N/A")}
          </p>
          {getFieldCitation(spaceInfo?.areaRentable) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.areaRentable)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>AREA (Usable)</label>
          <p>{getFieldValue(spaceInfo?.areaUsable) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.areaUsable) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.areaUsable)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>CITY</label>
          <p>{getFieldValue(spaceInfo?.city) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.city) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.city)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>STATE</label>
          <p>{getFieldValue(spaceInfo?.state) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.state) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.state)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>NOTES</label>
          <p>{getFieldValue(spaceInfo?.notes) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.notes) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.notes)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>COMMON AREA</label>
          <p>{getFieldValue(spaceInfo?.commonArea) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.commonArea) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.commonArea)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>PARKING SPACES</label>
          <p>{getFieldValue(spaceInfo?.parking?.value) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.parking?.value) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.parking?.value)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>PARKING TYPE</label>
          <p>{getFieldValue(spaceInfo?.parking?.type) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.parking?.type) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.parking?.type)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>STORAGE AREA</label>
          <p>{getFieldValue(spaceInfo?.storageArea) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.storageArea) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.storageArea)}</span>
          ) : null}
        </div>
        <div className="info-item">
          <label>STATUS</label>
          <p>{getFieldValue(spaceInfo?.status) || "N/A"}</p>
          {getFieldCitation(spaceInfo?.status) ? (
            <span className="citation">Citation : {getFieldCitation(spaceInfo?.status)}</span>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default SpaceTab;
