# CAP Project – Service JS Change Log & Error Register

This document is a **single source of truth** for everything that was **changed, fixed, refactored, or corrected** across the schema, services, and data files during this conversation.

It records:

* ❌ Original mistakes / errors
* ✅ Correct decisions
* 🔧 Exact fixes applied
* 🧠 Design rationale
* 📁 Impacted files

---

## 0. High-Level Summary

**Root causes across issues**

* Composition misuse (multiple parents)
* Wrong join keys (UUID vs line item)
* Structured type validation misuse
* Monetary fields modeled as Integer
* CSV / seed data not aligned with CDS
* SQLite schema not reset after model change
* Missing actions/functions in CDS vs JS mismatch

**Outcome**

* Clean CAP domain model
* SAP-style PO → GR → Invoice lifecycle
* Draft-safe services
* SQLite + HANA Cloud compatible
* Production-ready orchestration

---

## 1. Schema (`db/schema.cds`) – Errors & Fixes

### 1.1 ❌ Composition Misuse

**Problem**

* `poitem` had `Composition of many gr_item`
* `gr_item` already owned by `gr_header`

**Fix**

```cds
// WRONG
Composition of many gr_item

// CORRECT
Association to many gr_item
```

**Reason**

> A CDS entity can have only **one composition owner**.

---

### 1.2 ❌ Wrong GR → PO Join Logic

**Problem**

```cds
gr_item_poitem_id : UUID   // material id
```

Linked GR to PO via material → breaks if same material repeats.

**Fix**

```cds
gr_item_lineitem_number : Integer
```

Join via:

```cds
po_id + po_lineitem_number
```

**SAP-style rationale**

* Matches EKPO / EKBE
* Supports partial GRs

---

### 1.3 ❌ Structured Type Validation Misuse

**Problem**

```cds
po_item_quan : quantity;
@assert.range : [1,9999999]
```

Annotation applied to nothing.

**Fix**

```cds
type quantity {
  @assert.range : [1,9999999]
  order_quan : Integer;
}
```

---

### 1.4 ❌ String + Range for Status

**Problem**

```cds
is_Active : String;
@assert.range : ['active','inactive']
```

**Fix**

```cds
type active_status : String enum { active; inactive; }
is_Active : active_status default #inactive;
```

**Result**

* Fiori dropdown
* CAP validation
* Stored as NVARCHAR in HANA

---

### 1.5 ❌ Monetary Fields as Integer

**Problem**

* Amounts, prices stored as Integer

**Fix**

```cds
Decimal(15,2)
```

**Applied to**

* PO totals
* PO item values
* Invoice item/header totals

---

### 1.6 ❌ UUID Keys Without Generation

**Problem**

```cds
aspect primary : managed {}
```

UUIDs not auto-generated.

**Fix**

```cds
aspect primary : managed, cuid {}
```

---

## 2. SQLite & CSV Errors

### 2.1 ❌ Column Removed from CDS but Present in CSV

**Error**

```
no column named gr_item_poitem_id
```

**Cause**

* CDS changed
* CSV still used old column

**Fix**

```csv
# OLD
gr_item_poitem_id

# NEW
gr_item_lineitem_number
```

UUIDs replaced with integers (10,20,…).

---

### 2.2 ❌ SQLite Not Reset After CDS Change

**Fix Required Every Time**

```bash
rm -rf db/sqlite.db
cds deploy --to sqlite
```

SQLite does **not auto-migrate** schema.

---

## 3. Service Layer – What Was Implemented

### 3.1 Audit Service (`au-service.js`)

**Handled**

* CREATE
* UPDATE (CHANGE)
* DELETE

**Key Points**

* Draft-safe
* Central audit fields auto-filled
* CHANGE = UPDATE in CAP

---

### 3.2 Goods Receipt Service (`gr-service.js`)

**Handled**

* GR Header & Item CRUD
* PO received/open qty recalculation
* Partial & full GR handling

**Critical Logic**

```text
SUM(all GR items) → update PO item
```

---

### 3.3 Invoice Service (`inv-service.js`)

**Handled**

* Invoice Header & Item CRUD
* Net, tax, total calculation
* Header totals aggregation

**Formula**

```text
Gross → Discount → Net → GST → Total
```

---

### 3.4 Master Data Service (`md-service.js`)

**Handled**

* Vendor & Material CRUD
* Activate / Deactivate actions
* Read-only functions

**Business Rules**

* Cannot delete vendor/material if used

---

### 3.5 Purchase Order Service (`po-service.js`)

**Handled**

* PO Header & Item CRUD
* Draft lifecycle
* Submit / Approve / Reject / Close actions
* PO total auto-calculation

**PO Lifecycle**

```text
draft → submitted → approved → closed
```

---

### 3.6 Global Orchestration Service (`global-service.js`)

**Purpose**

* Cross-entity governance
* Central recalculation & validation

**Handled Globally**

* PO totals
* GR receipt sync
* Invoice totals
* Audit logging
* Master data protection

**Design Pattern**

> One façade service, many domain services

---

## 4. CAP Rules Reinforced

* CHANGE ≡ UPDATE
* One composition owner per entity
* Use AFTER handlers for calculations
* Use transaction(req) always
* Structured types ≠ primitives
* CDS enums ≠ DB enums

---

## 5. Final State

✔ Clean CDS model
✔ Error-free SQLite deploy
✔ Draft-safe services
✔ SAP-style PO-GR-Invoice flow
✔ Production-ready design

---

## 6. Recommendation

Keep this file as:

* Technical handover
* Architecture decision log
* Interview / design discussion proof
* Future regression checklist

---

**End of Log**
