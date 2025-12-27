
const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

  const { InvoiceHeaders, InvoiceItems } = this.entities;
  const { poitem, gr_item } = cds.entities('po.ust');

  /* =====================================================
   * BEFORE CREATE – INVOICE HEADER
   * =====================================================*/
  this.before('CREATE', InvoiceHeaders, async (req) => {
    if (!req.data.inv_header_date) {
      req.data.inv_header_date = new Date();
    }

    req.data.inv_header_status = 'draft';
  });

  /* =====================================================
   * BEFORE CREATE – INVOICE ITEM
   * =====================================================*/
  this.before('CREATE', InvoiceItems, async (req) => {
    if (req.data.inv_item_quaninv?.order_quan <= 0) {
      req.reject(400, 'Invoice quantity must be greater than zero');
    }
  });

  /* =====================================================
   * AFTER CREATE – INVOICE ITEM
   * Calculate amounts + update header totals
   * =====================================================*/
  this.after('CREATE', InvoiceItems, async (data, req) => {
    const tx = cds.transaction(req);

    /* ---- Calculate item amounts ---- */
    const qty = data.inv_item_quaninv?.order_quan || 0;
    const price = data.inv_item_netprice || 0;
    const discount = data.inv_item_discount || 0;
    const gst = data.inv_item_gst || 0;

    const gross = qty * price;
    const discountAmt = gross * (discount / 100);
    const netAmt = gross - discountAmt;
    const taxAmt = netAmt * (gst / 100);
    const totalAmt = netAmt + taxAmt;

    await tx.run(
      UPDATE(InvoiceItems)
        .set({
          inv_item_netamt: netAmt,
          inv_item_taxamt: taxAmt,
          inv_item_totalamt: totalAmt
        })
        .where({ inv_item_id: data.inv_item_id })
    );

    await recalcInvoiceHeader(tx, data.inv_id);
  });

  /* =====================================================
   * AFTER UPDATE – INVOICE ITEM (CHANGE)
   * =====================================================*/
  this.after('UPDATE', InvoiceItems, async (data, req) => {
    const tx = cds.transaction(req);

    const item = await tx.run(
      SELECT.one.from(InvoiceItems).where({ inv_item_id: data.inv_item_id })
    );

    if (!item) return;

    const qty = item.inv_item_quaninv?.order_quan || 0;
    const price = item.inv_item_netprice || 0;
    const discount = item.inv_item_discount || 0;
    const gst = item.inv_item_gst || 0;

    const gross = qty * price;
    const discountAmt = gross * (discount / 100);
    const netAmt = gross - discountAmt;
    const taxAmt = netAmt * (gst / 100);
    const totalAmt = netAmt + taxAmt;

    await tx.run(
      UPDATE(InvoiceItems)
        .set({
          inv_item_netamt: netAmt,
          inv_item_taxamt: taxAmt,
          inv_item_totalamt: totalAmt
        })
        .where({ inv_item_id: item.inv_item_id })
    );

    await recalcInvoiceHeader(tx, item.inv_id);
  });

  /* =====================================================
   * BEFORE DELETE – INVOICE ITEM
   * =====================================================*/
  this.before('DELETE', InvoiceItems, async (req) => {
    const tx = cds.transaction(req);

    const item = await tx.run(
      SELECT.one.from(InvoiceItems).where(req.data)
    );

    if (!item) {
      req.reject(404, 'Invoice item not found');
    }

    req._invItemBackup = item;
  });

  /* =====================================================
   * AFTER DELETE – INVOICE ITEM
   * =====================================================*/
  this.after('DELETE', InvoiceItems, async (_, req) => {
    const tx = cds.transaction(req);
    const item = req._invItemBackup;
    if (!item) return;

    await recalcInvoiceHeader(tx, item.inv_id);
  });

  /* =====================================================
   * AFTER DELETE – INVOICE HEADER
   * =====================================================*/
  this.after('DELETE', InvoiceHeaders, async (data, req) => {
    console.log('Invoice deleted:', data.inv_header_invnumber);
  });

  /* =====================================================
   * HELPER: Recalculate Invoice Header Totals
   * =====================================================*/
  async function recalcInvoiceHeader(tx, invId) {
    const items = await tx.run(
      SELECT.from(InvoiceItems)
        .columns(
          'inv_item_netamt',
          'inv_item_taxamt',
          'inv_item_totalamt'
        )
        .where({ inv_id: invId })
    );

    const netTotal = items.reduce(
      (sum, i) => sum + (i.inv_item_netamt || 0), 0
    );
    const taxTotal = items.reduce(
      (sum, i) => sum + (i.inv_item_taxamt || 0), 0
    );
    const grandTotal = items.reduce(
      (sum, i) => sum + (i.inv_item_totalamt || 0), 0
    );

    await tx.run(
      UPDATE(InvoiceHeaders)
        .set({
          inv_header_totalamt_before: netTotal,
          inv_header_taxamt: taxTotal,
          inv_header_total_amount: grandTotal
        })
        .where({ inv_header_id: invId })
    );
  }

});
