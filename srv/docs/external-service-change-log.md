📘 external-service-change-log.md
# External Service Consumption in SAP CAP – Change Log

This document captures the complete journey, decisions, configurations, errors, and fixes
implemented while consuming **external REST and OData services** in a SAP CAP application.

Project: CAP (Node.js)  
Scope: External API consumption (REST, OData V4, OData V2 → V4)  
Environment: Local + SAP BTP ready  

---

## 1. Objective

Enable the CAP application to:
- Consume **open REST APIs**
- Consume **OData V4 services**
- Consume **OData V2 services and expose them as V4**
- Consume **SAP Business Accelerator Hub sandbox APIs**
- Expose all external data via **CAP srv layer**
- Keep the architecture **enterprise-ready**

---

## 2. Initial Requirement

- Consume external APIs **without SAP GUI / S/4HANA**
- Use public APIs and SAP sandbox APIs
- Convert OData V2 → OData V4 where required
- Expose all services as **OData V4 from CAP**
- Make solution compatible with **Fiori Elements**

---

## 3. REST API Consumption (Direct – POC)

### 3.1 Tooling
- axios

### 3.2 Example: Country API

**API**


https://restcountries.com/v3.1/all


**Implementation**
- Used axios inside `srv/*.js`
- Mapped REST JSON → CDS entity
- Exposed via CAP OData V4

**Use case**
- Fast POC
- Local development
- No authentication

**Limitations**
- Credentials hardcoded (if any)
- Not recommended for production

---

## 4. REST API Consumption (Enterprise – Destination based)

### 4.1 Configuration

Configured REST APIs using `cds.requires` with:
- `kind: rest`
- Destination-based credentials

**Advantages**
- No secrets in code
- Environment-specific configuration
- SAP recommended approach

---

## 5. OData V4 Consumption (Direct Remote Service)

### 5.1 Initial Attempt – EDMX Import

Tried:


cds import <OData V4 URL>


**Outcome**
- ❌ Failed
- cds import does NOT accept URLs
- Requires local EDMX file
- Some public OData V4 services (Northwind) are incompatible with cds import

### 5.2 Final Decision

- Do NOT import EDMX for public APIs
- Consume them dynamically as **remote OData services**

---

## 6. Remote OData V4 Consumption (Correct Approach)

### 6.1 Configuration

```json
"cds": {
  "requires": {
    "ExternalService": {
      "kind": "odata",
      "credentials": {
        "url": "<remote-odata-v4-url>"
      }
    }
  }
}

6.2 srv Layer

Define CDS entities manually (projection style)

Use cds.connect.to() + run(req.query)

Result

Native OData V4 passthrough

Supports $filter, $select, $top

Fiori-ready

7. OData V2 → OData V4 Conversion
7.1 Requirement

Consume legacy or open OData V2

Expose as OData V4

7.2 Solution

Used:

@cap-js-community/odata-v2-adapter

7.3 Configuration

server.js

const cds = require('@sap/cds');
const v2adapter = require('@cap-js-community/odata-v2-adapter');

cds.on('bootstrap', app => {
  app.use(v2adapter());
});

module.exports = cds.server;

7.4 Resulting Endpoints

/odata/v4/* → Native CAP V4

/odata/v2/* → Adapter-based V2

✔ Same service
✔ Dual protocol support

8. SAP Business Accelerator Hub (BAH) – Reality Check
8.1 Key Understanding

SAP Business Accelerator Hub is NOT a backend

It provides:

API documentation

Metadata

Sandbox / mock endpoints (limited)

8.2 Important Limitation

❌ Cannot consume real Sales Orders / Business Objects
without:

SAP S/4HANA

ABAP Trial

SAP backend system

9. SAP BAH Sandbox API Consumption (SUCCESS CASE)
9.1 API Used

Packaging Agreements – Business Partners

https://sandbox.api.sap.com/PackagingAgreementsCollaboration/odata/v4/MasterDataService/BusinessPartners


OData V4

API Key based authentication

GET only (sandbox)

10. Sandbox API Configuration in CAP
10.1 cds.requires
"PackagingBP": {
  "kind": "odata",
  "credentials": {
    "url": "https://sandbox.api.sap.com/PackagingAgreementsCollaboration/odata/v4/MasterDataService",
    "headers": {
      "APIKey": "<API_KEY>",
      "Accept": "application/json"
    }
  }
}

10.2 Important Learnings

Base URL MUST include service name (MasterDataService)

Missing service name results in HTTP 500

Accept: application/json is mandatory

Sandbox returns 500 instead of 404 for wrong paths

11. srv Layer Exposure
11.1 CDS
@path: '/bp'
service BusinessPartnerService {

  @readonly
  entity BusinessPartners {
    key businessPartnerNumber : String;
        businessPartnerName1  : String;
        city                  : String;
        countryKey_code       : String;
  }

}

11.2 Handler
const cds = require('@sap/cds');

module.exports = async function () {
  const bpApi = await cds.connect.to('PackagingBP');

  this.on('READ', 'BusinessPartners', req => {
    return bpApi.run(req.query);
  });
};

12. Errors Faced & Fixes
12.1 cds import URL error

Cause: cds import does not support URLs

Fix: Use local EDMX or remote service

12.2 Northwind EDMX incompatibility

Cause: Unsupported OData V4 metadata

Fix: Use remote consumption (no import)

12.3 Missing Cloud SDK

Error: @sap-cloud-sdk/http-client not found

Fix: Installed Cloud SDK dependencies

12.4 OData V2 Adapter error

Cause: Wrong import (createODataV2Adapter)

Fix: Use default export v2adapter()

12.5 Sandbox API 500 error

Cause: Wrong base URL

Fix: Added /MasterDataService

13. Final Architecture
External REST / OData APIs
        ↓
CAP Remote Service (cds.requires)
        ↓
CAP srv layer (CDS + JS)
        ↓
OData V4 (native)
        ↓
OData V2 (via adapter)
        ↓
Fiori / UI5 / External Apps

14. Best Practices Finalized

Do NOT import EDMX for public APIs

Always use Destination for SAP APIs in BTP

Prefer OData V4

Use projections, not raw entities

Sandbox APIs are READ-only

CAP acts as a clean integration & façade layer

15. Status

✅ External REST consumption
✅ OData V4 consumption
✅ OData V2 → V4 conversion
✅ SAP Sandbox API integration
✅ CAP srv exposure
✅ Enterprise-ready architecture

End of document.


---

## ✅ What you can do now

- Commit this file to Git
- Share as **project documentation**
- Use it as **training material**
- Reuse as **company template**

If you want next, I can:
- Convert this into **PDF / Word**
- Create **architecture diagram**
- Create **training slides**
- Add **security & destination sections**

Just tell me 👍