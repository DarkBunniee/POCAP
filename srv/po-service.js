const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

  const { POHeaders, POItems } = this.entities;
  const { poheader, poitem } = cds.entities('po.ust');

  /* =====================================================
   * BEFORE CREATE – PO HEADER
   * =====================================================*/
  this.before('CREATE', POHeaders, async (req) => {
    req.data.po_status = 'draft';
    req.data.po_doc_date = new Date();
    req.data.po_total_value = 0;
  });

  /* =====================================================
   * BEFORE CREATE – PO ITEM
   * =====================================================*/
  this.before('CREATE', POItems, async (req) => {
    if (req.data.po_item_quan?.order_quan <= 0) {
      req.reject(400, 'Order quantity must be greater than zero');
    }

    if (req.data.po_item_netprice < 0) {
      req.reject(400, 'Net price cannot be negative');
    }
  });

  /* =====================================================
   * AFTER CREATE – PO ITEM
   * =====================================================*/
  this.after('CREATE', POItems, async (data, req) => {
    const tx = cds.transaction(req);
    await recalcPOItem(tx, data);
    await recalcPOTotal(tx, data.po_id);
  });

  /* =====================================================
   * AFTER UPDATE – PO ITEM (CHANGE)
   * =====================================================*/
  this.after('UPDATE', POItems, async (data, req) => {
    const tx = cds.transaction(req);
    await recalcPOItem(tx, data);
    await recalcPOTotal(tx, data.po_id);
  });

  /* =====================================================
   * BEFORE DELETE – PO ITEM
   * =====================================================*/
  this.before('DELETE', POItems, async (req) => {
    const tx = cds.transaction(req);
    const item = await tx.run(
      SELECT.one.from(poitem).where(req.data)
    );

    if (!item) req.reject(404, 'PO Item not found');
    req._poItemBackup = item;
  });

  /* =====================================================
   * AFTER DELETE – PO ITEM
   * =====================================================*/
  this.after('DELETE', POItems, async (_, req) => {
    const tx = cds.transaction(req);
    const item = req._poItemBackup;
    if (!item) return;

    await recalcPOTotal(tx, item.po_id);
  });

  /* =====================================================
   * ACTION: Submit PO
   * =====================================================*/
  this.on('submitPO', POHeaders, async (req) => {
    const tx = cds.transaction(req);

    await tx.run(
      UPDATE(poheader)
        .set({ po_status: 'submitted' })
        .where({ po_id: req.params[0].po_id })
    );

    return { message: 'PO submitted successfully' };
  });

  /* =====================================================
   * ACTION: Approve PO
   * =====================================================*/
  this.on('approvePO', POHeaders, async (req) => {
    const tx = cds.transaction(req);

    await tx.run(
      UPDATE(poheader)
        .set({
          po_status: 'approved',
          po_approved: {
            po_approvedby: req.user?.id || 'SYSTEM',
            po_approvedat: new Date()
          }
        })
        .where({ po_id: req.params[0].po_id })
    );

    return { message: 'PO approved successfully' };
  });

  /* =====================================================
   * ACTION: Reject PO
   * =====================================================*/
  this.on('rejectPO', POHeaders, async (req) => {
    const { reason } = req.data;
    const tx = cds.transaction(req);

    await tx.run(
      UPDATE(poheader)
        .set({
          po_status: 'rejected',
          po_remarks: reason
        })
        .where({ po_id: req.params[0].po_id })
    );

    return { message: 'PO rejected' };
  });

  /* =====================================================
   * ACTION: Close PO
   * =====================================================*/
  this.on('closePO', POHeaders, async (req) => {
    const tx = cds.transaction(req);

    await tx.run(
      UPDATE(poheader)
        .set({ po_status: 'closed' })
        .where({ po_id: req.params[0].po_id })
    );

    return { message: 'PO closed successfully' };
  });

  /* =====================================================
   * FUNCTION: Get PO Total
   * =====================================================*/
  this.on('getPOTotal', async (req) => {
    const { po_id } = req.data;
    const result = await SELECT.one.from(poheader)
      .columns('po_total_value')
      .where({ po_id });

    return result?.po_total_value || 0;
  });

  /* =====================================================
   * FUNCTION: Get PO Status
   * =====================================================*/
  this.on('getPOStatus', async (req) => {
    const { po_id } = req.data;
    const result = await SELECT.one.from(poheader)
      .columns('po_status')
      .where({ po_id });

    return result?.po_status || 'UNKNOWN';
  });

  /* =====================================================
   * HELPER: Recalculate PO Item Amount
   * =====================================================*/
  async function recalcPOItem(tx, data) {
    const qty = data.po_item_quan?.order_quan || 0;
    const price = data.po_item_netprice || 0;
    const discount = data.po_item_discount || 0;
    const gst = data.po_item_gst || 0;

    const gross = qty * price;
    const discountAmt = gross * (discount / 100);
    const net = gross - discountAmt;
    const tax = net * (gst / 100);
    const total = net + tax;

    await tx.run(
      UPDATE(poitem)
        .set({
          po_item_netprice_value: total
        })
        .where({
          po_id: data.po_id,
          po_lineitem_number: data.po_lineitem_number
        })
    );
  }

  /* =====================================================
   * HELPER: Recalculate PO Header Total
   * =====================================================*/
  async function recalcPOTotal(tx, poId) {
    const items = await tx.run(
      SELECT.from(poitem)
        .columns('po_item_netprice_value')
        .where({ po_id: poId })
    );

    const total = items.reduce(
      (sum, i) => sum + (i.po_item_netprice_value || 0), 0
    );

    await tx.run(
      UPDATE(poheader)
        .set({ po_total_value: total })
        .where({ po_id: poId })
    );
  }

});
