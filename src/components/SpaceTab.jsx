const SpaceTab = ({ leaseMeta, spaceInfo, getFieldValue }) => {
  return (
    <section className="card">
      <div className="card-header">
                <h3>Lease Information</h3>
                <button
                  type="button"
                  className="edit-btn"
                  
                >
                  
                </button>
              </div>
      <div className="info-grid">
        
        <div>
          <label>Premises</label>
          <p>{getFieldValue(spaceInfo?.premises) || "N/A"}</p>
        </div>
        <div>
          <label>Unit</label>
          <p>{getFieldValue(spaceInfo?.unit) || "N/A"}</p>
        </div>
        <div>
          <label>Building</label>
          <p>
            {getFieldValue(spaceInfo?.building) ||
              leaseMeta?.property?.property_name || "N/A"}
          </p>
        </div>
        <div>
          <label>Floor</label>
          <p>{getFieldValue(spaceInfo?.floor) || "N/A"}</p>
        </div>
        <div>
          <label>Zip Code</label>
          <p>{getFieldValue(spaceInfo?.zipCode) || "N/A"}</p>
        </div>
        <div>
          <label>Area (Rentable)</label>
          <p>
            {getFieldValue(spaceInfo?.areaRentable) ||
              (leaseMeta?.unit?.square_ft
                ? `${leaseMeta.unit.square_ft} sqft`
                : "N/A")}
          </p>
        </div>
        <div>
          <label>Area (Usable)</label>
          <p>{getFieldValue(spaceInfo?.areaUsable) || "N/A"}</p>
        </div>
        <div>
          <label>City</label>
          <p>{getFieldValue(spaceInfo?.city) || "N/A"}</p>
        </div>
        <div>
          <label>State</label>
          <p>{getFieldValue(spaceInfo?.state) || "N/A"}</p>
        </div>
        <div>
          <label>Notes</label>
          <p>{getFieldValue(spaceInfo?.notes) || "N/A"}</p>
        </div>
        <div>
          <label>Common Area</label>
          <p>{getFieldValue(spaceInfo?.commonArea) || "N/A"}</p>
        </div>
        <div>
          <label>Parking Spaces</label>
          <p>{getFieldValue(spaceInfo?.parking?.value) || "N/A"}</p>
        </div>
        <div>
          <label>Parking Type</label>
          <p>{getFieldValue(spaceInfo?.parking?.type) || "N/A"}</p>
        </div>
        <div>
          <label>Storage Area</label>
          <p>{getFieldValue(spaceInfo?.storageArea) || "N/A"}</p>
        </div>
        <div>
          <label>Status</label>
          <p>{getFieldValue(spaceInfo?.status) || "N/A"}</p>
        </div>
      </div>
    </section>
  );
};

export default SpaceTab;
