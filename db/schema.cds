

namespace po.ust;

using { managed, cuid } from '@sap/cds/common';

// Aspects
// aspect primary : managed {}
aspect primary : managed, cuid {}
aspect secondary : managed, cuid {}

// ============================================
// Type Declarations
// ============================================

// type addresses {
//   vm_street  : String(30) default 'LA Street, L-245 California, NYC, US';
//   vm_city    : String(10) default 'New York';
//   vm_state   : String(10) default 'Rajasthan';
//   vm_country : String(6)  default 'India';
//   vm_postal  : String(10) default '352056';
// }

type addresses {
  vm_street  : String(60);
  vm_city    : String(20);
  vm_state   : String(20);
  vm_country : String(20);
  vm_postal  : String(10);
}



type material_type {
  raw_material : String(50) default 'Steel Set A CSGN';
  material_srv : String(5)  default 'MA';
  other        : String(255);
}

type uom {
  uom : String(2) default 'KG';
}

type currency {
  cuky : String(3) default 'USD';
}

type payment_terms {
  vendor      : String(10) default 'UST';
  vendor_date : DateTime;
}

type approved_aspect {
  po_approvedby : String(5) default 'BTP A';
  po_approvedat : DateTime;
}

type quantity {
  @assert.range : [ 1, 9999999 ]
  order_quan : Integer default 0;
}

type post_aspect {
  postedat   : DateTime;
  postedby   : String(5);
  verifiedat : DateTime;
  verifiedby : String(5);
}

type audit_aspect {
  auditby    : String(30);
  auditat    : DateTime;
  verifiedby : String(30);
  verifiedat : DateTime;
  approvedby : String(30);
  approvedat : DateTime;
}

type active_status : String enum {
  active;
  inactive;
}

// Enum value for status
type status : String enum {
  draft;
  approved;
  rejected;
  cancelled;
  verified;
  submitted;
  closed;
  other = 'N/A';
}

type report_status : String enum {
  open;
  partially_received;
  full_received;
  cancelled;
}

// ============================================
// Vendor Master Table
// ============================================

@Core.Description : 'Vendor Master Table'
@assert.unique: { vm_code: [ vm_code ] }
entity vendormaster : primary {

  @title : 'Vendor ID'
  @description : 'Vendor ID'
  @Common.Label : 'Vendor ID'
  @Core.Computed : false
  @readonly
  key vm_id : UUID not null;

  @title : 'Vendor Code'
  @Common.Label : 'Vendor Code'
  @mandatory
  @assert.format : '[A-Z0-9]+'
  vm_code : String(10) not null;

  @title : 'First Name'
  @Common.Label : 'First Name'
  vm_firstname : String(10) default 'John';

  @title : 'Last Name'
  @Common.Label : 'Last Name'
  vm_lastname : String(10) default 'vick';

  @title : 'Address'
  @Common.Label : 'Address'
  vm_addresses : addresses;

  @title : 'GST Number'
  @Common.Label : 'GST Number'
  @mandatory
  vm_gstno : String(15) not null;

  @title : 'Contact Person'
  @Common.Label : 'Contact Person'
  vm_person : String(10);

  @title : 'Email'
  @Common.Label : 'Email'
  @assert.format : '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
  vm_email : String(50);

  @title : 'Payment Terms'
  @Common.Label : 'Payment Terms'
  vm_payments : String(10) default '30 days';

  @title : 'Active Status'
  @Common.Label : 'Active Status'
  // @assert.range : [ 'active', 'inactive' ]
  // is_Active : String(8) not null default 'inactive';
  is_Active : active_status default #inactive;

  // Associations and Compositions
  to_invoice  : Composition of many inv_header on to_invoice.inv_header_vendor_id = $self.vm_id;
  to_purchase : Composition of many poheader   on to_purchase.po_vm_id            = $self.vm_id;
}

// ============================================
// Master Materials Table
// ============================================

@Core.Description : 'Master Material Table'
@assert.unique: { mm_code: [ mm_code ] }
entity mastermaterial : primary {

  @title : 'Material ID'
  @Common.Label : 'Material ID'
  @readonly
  key mm_id : UUID not null;

  @title : 'Material Code'
  @Common.Label : 'Material Code'
  @mandatory
  mm_code : String(20) not null default 'DOES_NOT_EXIST';

  @title : 'Material Description'
  @Common.Label : 'Material Description'
  mm_desc : String(25) default 'Tata steel CAT A';

  @title : 'Material Type'
  @Common.Label : 'Material Type'
  mm_types : material_type;

  @title : 'Standard Price'
  @Common.Label : 'Standard Price'
  @assert.range : [ 0, 9999999 ]
  mm_stdprice : Decimal(15,2);

  @title : 'Unit of Measure'
  @Common.Label : 'Unit of Measure'
  mm_uom : uom;

  @title : 'GST Number'
  @Common.Label : 'GST Number'
  @mandatory
  mm_gstno : String(15) not null;

  @title : 'Active Status'
  @Common.Label : 'Active Status'
  // @assert.range : [ 'active', 'inactive' ]
  // is_Active : String(8) not null default 'inactive';
  is_Active : active_status default #inactive;


  // Composition
  to_poitem : Composition of many poitem on to_poitem.po_item_material_id = $self.mm_id;
}

// ============================================
// Purchase Order Header
// ============================================

@Core.Description : 'Purchase Order Header'
@assert.unique: { po_number: [ po_number ] }
entity poheader : primary {

  @title : 'PO ID'
  @Common.Label : 'PO ID'
  @readonly
  key po_id : UUID not null;

  @title : 'PO Number'
  @Common.Label : 'PO Number'
  @mandatory
  @assert.range : [ 1, 9999999999 ]
  po_number : Integer64 not null;

  @title : 'Vendor ID'
  @Common.Label : 'Vendor ID'
  @mandatory
  po_vm_id : UUID not null;

  @title : 'Vendor Code'
  @Common.Label : 'Vendor Code'
  vendor : String(10);

  @title : 'Company Code'
  @Common.Label : 'Company Code'
  po_coco : String(5) not null default 'N/A';

  @title : 'Purchasing Org'
  @Common.Label : 'Purchasing Org'
  po_org : String(4) not null default 'N/A';

  @title : 'Currency'
  @Common.Label : 'Currency'
  po_curr : currency;

  @title : 'Document Date'
  @Common.Label : 'Document Date'
  po_doc_date : DateTime;

  @title : 'Delivery Date'
  @Common.Label : 'Delivery Date'
  po_delivery_date : DateTime;

  @title : 'Payment Terms'
  @Common.Label : 'Payment Terms'
  po_payment_terms : payment_terms;

  @title : 'Total Value'
  @Common.Label : 'Total Value'
  @readonly
  po_total_value : Decimal(15,2) default 0;

  @title : 'Status'
  @Common.Label : 'Status'
  po_status : status default #draft;

  @title : 'Remarks'
  @Common.Label : 'Remarks'
  po_remarks : String(255);

  @title : 'Approval Details'
  @Common.Label : 'Approval Details'
  po_approved : approved_aspect;

  // Associations
  to_vendormaster : Association to one vendormaster on to_vendormaster.vm_id = $self.po_vm_id;
  to_poitem       : Composition of many poitem      on to_poitem.po_id        = $self.po_id;
}

// ============================================
// Purchase Order Item
// ============================================

@Core.Description : 'Purchase Order Items'
entity poitem : primary {

  @title : 'PO ID'
  @Common.Label : 'PO ID'
  @mandatory
  key po_id : UUID not null;

  @title : 'Line Item Number'
  @Common.Label : 'Line Item Number'
  @mandatory
  key po_lineitem_number : Integer not null;

  @title : 'Material ID'
  @Common.Label : 'Material ID'
  @mandatory
  po_item_material_id : UUID not null;

  @title : 'Material Code'
  @Common.Label : 'Material Code'
  po_item_materials : String(20) default 'N/A';

  @title : 'Material Description'
  @Common.Label : 'Material Description'
  po_item_materialsdesc : String(25) default 'N/A';

  @title : 'Quantity'
  @Common.Label : 'Quantity'
  @mandatory
  // @assert.range : [ 1, 9999999 ]
  po_item_quan : quantity;


  @title : 'Unit of Measure'
  @Common.Label : 'Unit of Measure'
  po_item_uom : uom;

  @title : 'Net Price'
  @Common.Label : 'Net Price'
  @mandatory
  @assert.range : [ 0, 9999999 ]
  po_item_netprice : Decimal(15,2);

  @title : 'Discount'
  @Common.Label : 'Discount'
  @assert.range : [ 0, 100 ]
  po_item_discount : Integer default 0;

  @title : 'GST Percentage'
  @Common.Label : 'GST Percentage'
  @assert.range : [ 0, 100 ]
  po_item_gst : Integer;

  @title : 'Net Price Value'
  @Common.Label : 'Net Price Value'
  @readonly
  po_item_netprice_value : Decimal(15,2);

  @title : 'Net Price Value 2'
  @Common.Label : 'Net Price Value 2'
  po_item_netprice_value2 : Decimal(15,2) default 0;

  @title : 'Received Quantity'
  @Common.Label : 'Received Quantity'
  @readonly
  po_item_received_quan : Integer default 0;

  @title : 'Open Quantity'
  @Common.Label : 'Open Quantity'
  @readonly
  po_item_open_quan : Integer default 0;

  @title : 'Item Status'
  @Common.Label : 'Item Status'
  po_item_status : report_status default #open;

  // Associations
  to_materialmaster : Association to one mastermaterial on to_materialmaster.mm_id = $self.po_item_material_id;
  to_poheader       : Association to one poheader       on to_poheader.po_id       = $self.po_id;

  // to_gr_items : Composition of many gr_item
  //   on  to_gr_items.gr_item_poitem_id = $self.po_item_material_id
  //   and to_gr_items.gr_item_po_id     = $self.po_id;

  // to_invoice_items : Composition of many inv_item
  //   on  to_invoice_items.inv_item_po_id     = $self.po_id
  //   and to_invoice_items.inv_item_lineitem  = $self.po_lineitem_number;

  to_gr_items : Association to many gr_item
  on  to_gr_items.gr_item_po_id     = $self.po_id
  // and to_gr_items.gr_item_poitem_id = $self.po_item_material_id;
  
  // and to_gr_items.gr_item_lineitem_number = $self.po_item_material_id; //Critical Bug
  and to_gr_items.gr_item_lineitem_number = $self.po_lineitem_number;

  
  to_invoice_items : Association to many inv_item
  on  to_invoice_items.inv_item_po_id    = $self.po_id
  and to_invoice_items.inv_item_lineitem = $self.po_lineitem_number;



}

// ============================================
// Goods Receipt Header
// ============================================

@Core.Description : 'Goods Receipt Header'
@assert.unique: { gr_number: [ gr_number ] }
entity gr_header : managed {

  @title : 'GR ID'
  @Common.Label : 'GR ID'
  @readonly
  key gr_id : UUID not null;

  @title : 'GR Number'
  @Common.Label : 'GR Number'
  @mandatory
  gr_number : Integer default 0;

  @title : 'PO ID'
  @Common.Label : 'PO ID'
  @mandatory
  gr_po : UUID;

  @title : 'GR Date'
  @Common.Label : 'GR Date'
  gr_date : Date;

  @title : 'Storage Location'
  @Common.Label : 'Storage Location'
  gr_stor_loc : String(3) default 'N/A';

  @title : 'Status'
  @Common.Label : 'Status'
  gr_status : status default #draft;

  @title : 'Received Quantity Status'
  @Common.Label : 'Received Quantity Status'
  gr_item_receivedquan : report_status;

  // Composition
  to_gr_items : Composition of many gr_item on to_gr_items.gr_item_ref_id = $self.gr_id;

  // Association to PO Header
  to_poheader : Association to one poheader on to_poheader.po_id = $self.gr_po;
}

// ============================================
// Goods Receipt Item
// ============================================

@Core.Description : 'Goods Receipt Item'
entity gr_item : managed {

  @title : 'GR Item ID'
  @Common.Label : 'GR Item ID'
  @readonly
  key gr_item_id : UUID not null;

  @title : 'GR Header ID'
  @Common.Label : 'GR Header ID'
  @mandatory
  gr_item_ref_id : UUID not null;

  @title : 'PO ID'
  @Common.Label : 'PO ID'
  @mandatory
  gr_item_po_id : UUID not null;

  @title : 'PO Item Material ID'
  @Common.Label : 'PO Item Material ID'
  @mandatory
  // gr_item_poitem_id : UUID not null;
  gr_item_lineitem_number : Integer not null;

  @title : 'Received Quantity'
  @Common.Label : 'Received Quantity'
  @mandatory
  @assert.range : [ 1, 9999999 ]
  gr_item_received_quan : Integer default 0;

  @title : 'Unit of Measure'
  @Common.Label : 'Unit of Measure'
  gr_item_uom : uom;

  @title : 'Batch Number'
  @Common.Label : 'Batch Number'
  gr_item_batchno : Integer default 0;

  @title : 'Remarks'
  @Common.Label : 'Remarks'
  gr_item_remarks : String(255);

  // Associations
  // to_po_items : Association to one poitem
  //   on  to_po_items.po_id              = $self.gr_item_po_id
  //   and to_po_items.po_item_material_id = $self.gr_item_poitem_id;

  to_po_items : Association to one poitem
  on  to_po_items.po_id               = $self.gr_item_po_id
  and to_po_items.po_lineitem_number  = $self.gr_item_lineitem_number;


  to_gr_header : Association to one gr_header on to_gr_header.gr_id = $self.gr_item_ref_id;
}

// ============================================
// Invoice Header
// ============================================

@Core.Description : 'Invoice Header'
@assert.unique: { inv_header_invnumber: [ inv_header_invnumber ] }
entity inv_header : primary {

  @title : 'Invoice Header ID'
  @Common.Label : 'Invoice Header ID'
  @readonly
  key inv_header_id : UUID not null;

  @title : 'Invoice Number'
  @Common.Label : 'Invoice Number'
  @mandatory
  inv_header_invnumber : Integer not null;

  @title : 'Vendor ID'
  @Common.Label : 'Vendor ID'
  @mandatory
  inv_header_vendor_id : UUID not null;

  @title : 'Vendor Code'
  @Common.Label : 'Vendor Code'
  inv_header_vendor : String(10);

  @title : 'Reference PO Number'
  @Common.Label : 'Reference PO Number'
  inv_header_refpo : Integer64;

  @title : 'GR Number'
  @Common.Label : 'GR Number'
  inv_header_gr : Integer;

  @title : 'Invoice Date'
  @Common.Label : 'Invoice Date'
  inv_header_date : Date;

  @title : 'Posting Date'
  @Common.Label : 'Posting Date'
  inv_header_postdate : Date;

  @title : 'Currency'
  @Common.Label : 'Currency'
  inv_header_cuky : currency;

  @title : 'Total Amount Before Tax'
  @Common.Label : 'Total Amount Before Tax'
  @readonly
  inv_header_totalamt_before : Decimal(15,2) default 0;

  @title : 'Status'
  @Common.Label : 'Status'
  inv_header_status : status default #draft;

  @title : 'Tax Amount'
  @Common.Label : 'Tax Amount'
  @readonly
  inv_header_taxamt : Decimal(15,2) default 0;

  @title : 'Total Amount'
  @Common.Label : 'Total Amount'
  @readonly
  inv_header_total_amount : Decimal(15,2) default 0;

  @title : 'Reason for Rejection'
  @Common.Label : 'Reason for Rejection'
  inv_header_reason_rejection : String(255);

  @title : 'Posting Details'
  @Common.Label : 'Posting Details'
  inv_header_aspect : post_aspect;

  // Associations
  to_vendor    : Association to one vendormaster on to_vendor.vm_id          = $self.inv_header_vendor_id;
  to_inv_items : Composition of many inv_item    on to_inv_items.inv_id      = $self.inv_header_id;
}

// ============================================
// Invoice Item
// ============================================

@Core.Description : 'Invoice Item'
entity inv_item : primary {

  @title : 'Invoice Item ID'
  @Common.Label : 'Invoice Item ID'
  @readonly
  key inv_item_id : UUID not null;

  @title : 'Invoice Header ID'
  @Common.Label : 'Invoice Header ID'
  @mandatory
  inv_id : UUID not null;

  @title : 'PO ID'
  @Common.Label : 'PO ID'
  @mandatory
  inv_item_po_id : UUID not null;

  @title : 'PO Line Item'
  @Common.Label : 'PO Line Item'
  @mandatory
  inv_item_lineitem : Integer not null;

  @title : 'GR Item ID'
  @Common.Label : 'GR Item ID'
  inv_item_refgr : UUID;

  @title : 'Invoice Quantity'
  @Common.Label : 'Invoice Quantity'
  @mandatory
  // @assert.range : [ 1, 9999999 ]
  inv_item_quaninv : quantity;

  @title : 'Unit of Measure'
  @Common.Label : 'Unit of Measure'
  inv_item_uom : uom;

  @title : 'Net Price'
  @Common.Label : 'Net Price'
  inv_item_netprice : Decimal(15,2);

  @title : 'Discount'
  @Common.Label : 'Discount'
  inv_item_discount : Integer;

  @title : 'GST Percentage'
  @Common.Label : 'GST Percentage'
  inv_item_gst : Integer;

  @title : 'Net Amount'
  @Common.Label : 'Net Amount'
  @readonly
  inv_item_netamt : Decimal(15,2) default 0;

  @title : 'Tax Amount'
  @Common.Label : 'Tax Amount'
  @readonly
  inv_item_taxamt : Decimal(15,2) default 0;

  @title : 'Total Amount'
  @Common.Label : 'Total Amount'
  @readonly
  inv_item_totalamt : Decimal(15,2) default 0;

  // Associations
  to_po_items  : Association to one poitem     on to_po_items.po_id             = $self.inv_item_po_id
                                             and to_po_items.po_lineitem_number = $self.inv_item_lineitem;
  to_in_header : Association to one inv_header on to_in_header.inv_header_id    = $self.inv_id;
}

// ============================================
// Error Log and Audit
// ============================================

@Core.Description : 'Audit and Error Log'
entity audit : secondary {

  @title : 'PO ID'
  @Common.Label : 'PO ID'
  error_po : UUID;

  @title : 'Error Status'
  @Common.Label : 'Error Status'
  error_status : String(30) default '404';

  @title : 'Audit Status'
  @Common.Label : 'Audit Status'
  audit_status : String(50) default 'Unchanged';

  @title : 'Audit Log'
  @Common.Label : 'Audit Log'
  audit_log : audit_aspect;
}
