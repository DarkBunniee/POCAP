
// Global Version of State Management in CAP with CRUD with this.on vs this.before vs this.after 
const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

  const {
    POHeaders,
    POItems,
    POAudits,
    GRHeaders,
    GRItems,
    InvoiceHeaders,
    InvoiceItems,
    Vendors,
    Materials
  } = this.entities;

  const {
    poheader,
    poitem,
    gr_item,
    inv_item,
    inv_header,
    audit,
    vendormaster,
    mastermaterial
  } = cds.entities('po.ust');

  /* =====================================================
   * GLOBAL VALIDATION – CREATE / UPDATE
   * =====================================================*/
  this.before(['CREATE', 'UPDATE'], async (req) => {
    if (!req.data) return;

    // Block changes on closed PO
    if (req.target === POHeaders || req.target === POItems) {
      const poId = req.data.po_id;
      if (poId) {
        const po = await SELECT.one.from(poheader).where({ po_id: poId });
        if (po?.po_status === 'closed') {
          req.reject(400, 'Closed PO cannot be modified');
        }
      }
    }
  });

  /* =====================================================
   * PO ITEM → RECALCULATE PO TOTAL (GLOBAL)
   * =====================================================*/
  this.after(['CREATE', 'UPDATE', 'DELETE'], POItems, async (_, req) => {
    const tx = cds.transaction(req);
    const poId = req.data?.po_id || req._poItemBackup?.po_id;
    if (!poId) return;

    const items = await tx.run(
      SELECT.from(poitem)
        .columns('po_item_netprice_value')
        .where({ po_id: poId })
    );

    const total = items.reduce(
      (s, i) => s + (i.po_item_netprice_value || 0), 0
    );

    await tx.run(
      UPDATE(poheader)
        .set({ po_total_value: total })
        .where({ po_id: poId })
    );
  });

  /* =====================================================
   * GR ITEM → UPDATE PO RECEIPTS (GLOBAL)
   * =====================================================*/
  this.after(['CREATE', 'UPDATE', 'DELETE'], GRItems, async (data, req) => {
    const tx = cds.transaction(req);

    const poId = data?.gr_item_po_id || req._grItemBackup?.gr_item_po_id;
    const line = data?.gr_item_lineitem_number || req._grItemBackup?.gr_item_lineitem_number;
    if (!poId || !line) return;

    const receipts = await tx.run(
      SELECT.from(gr_item)
        .columns('gr_item_received_quan')
        .where({
          gr_item_po_id: poId,
          gr_item_lineitem_number: line
        })
    );

    const received = receipts.reduce((s, r) => s + r.gr_item_received_quan, 0);

    const item = await tx.run(
      SELECT.one.from(poitem).where({
        po_id: poId,
        po_lineitem_number: line
      })
    );

    if (!item) return;

    const ordered = item.po_item_quan?.order_quan || 0;
    const open = Math.max(ordered - received, 0);

    await tx.run(
      UPDATE(poitem)
        .set({
          po_item_received_quan: received,
          po_item_open_quan: open,
          po_item_status: open === 0 ? 'full_received' : 'partially_received'
        })
        .where({
          po_id: poId,
          po_lineitem_number: line
        })
    );
  });

  /* =====================================================
   * INVOICE ITEM → UPDATE INVOICE HEADER TOTALS
   * =====================================================*/
  this.after(['CREATE', 'UPDATE', 'DELETE'], InvoiceItems, async (data, req) => {
    const tx = cds.transaction(req);
    const invId = data?.inv_id || req._invItemBackup?.inv_id;
    if (!invId) return;

    const items = await tx.run(
      SELECT.from(inv_item)
        .columns('inv_item_netamt', 'inv_item_taxamt', 'inv_item_totalamt')
        .where({ inv_id: invId })
    );

    const net = items.reduce((s, i) => s + (i.inv_item_netamt || 0), 0);
    const tax = items.reduce((s, i) => s + (i.inv_item_taxamt || 0), 0);
    const total = items.reduce((s, i) => s + (i.inv_item_totalamt || 0), 0);

    await tx.run(
      UPDATE(inv_header)
        .set({
          inv_header_totalamt_before: net,
          inv_header_taxamt: tax,
          inv_header_total_amount: total
        })
        .where({ inv_header_id: invId })
    );
  });

  /* =====================================================
   * AUDIT LOGGING – GLOBAL
   * =====================================================*/
  this.after(['CREATE', 'UPDATE', 'DELETE'], async (data, req) => {
    const tx = cds.transaction(req);

    await tx.run(
      INSERT.into(audit).entries({
        error_po: data?.po_id || data?.inv_id || null,
        error_status: req.event,
        audit_status: `${req.target?.name || 'ENTITY'}_${req.event}`,
        audit_log: {
          auditby: req.user?.id || 'SYSTEM',
          auditat: new Date()
        }
      })
    );
  });

  /* =====================================================
   * MASTER DATA SAFETY
   * =====================================================*/
  this.before('DELETE', Vendors, async (req) => {
    const used = await SELECT.one.from(poheader)
      .where({ po_vm_id: req.data.vm_id });

    if (used) req.reject(400, 'Vendor is used in PO and cannot be deleted');
  });

  this.before('DELETE', Materials, async (req) => {
    const used = await SELECT.one.from(poitem)
      .where({ po_item_material_id: req.data.mm_id });

    if (used) req.reject(400, 'Material is used in PO and cannot be deleted');
  });

});
