const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

  const { GRHeaders, GRItems } = this.entities;
  const { poitem } = cds.entities('po.ust');

  /* =====================================================
   * BEFORE CREATE – GR HEADER
   * =====================================================*/
  this.before('CREATE', GRHeaders, async (req) => {
    if (!req.data.gr_date) {
      req.data.gr_date = new Date();
    }

    req.data.gr_status = 'draft';
  });

  /* =====================================================
   * BEFORE CREATE – GR ITEM
   * =====================================================*/
  this.before('CREATE', GRItems, async (req) => {
    if (req.data.gr_item_received_quan <= 0) {
      req.reject(400, 'Received quantity must be greater than zero');
    }
  });

  /* =====================================================
   * AFTER CREATE – GR ITEM
   * Update PO Item quantities
   * =====================================================*/
  this.after('CREATE', GRItems, async (data, req) => {
    const tx = cds.transaction(req);

    const poItem = await tx.run(
      SELECT.one.from(poitem).where({
        po_id: data.gr_item_po_id,
        po_lineitem_number: data.gr_item_lineitem_number
      })
    );

    if (!poItem) return;

    const newReceived =
      (poItem.po_item_received_quan || 0) + data.gr_item_received_quan;

    const orderedQty = poItem.po_item_quan?.order_quan || 0;
    const openQty = Math.max(orderedQty - newReceived, 0);

    await tx.run(
      UPDATE(poitem)
        .set({
          po_item_received_quan: newReceived,
          po_item_open_quan: openQty,
          po_item_status:
            openQty === 0 ? 'full_received' : 'partially_received'
        })
        .where({
          po_id: data.gr_item_po_id,
          po_lineitem_number: data.gr_item_lineitem_number
        })
    );
  });

  /* =====================================================
   * BEFORE UPDATE – GR ITEM (CHANGE)
   * =====================================================*/
  this.before('UPDATE', GRItems, async (req) => {
    if (req.data.gr_item_received_quan < 0) {
      req.reject(400, 'Received quantity cannot be negative');
    }
  });

  /* =====================================================
   * AFTER UPDATE – GR ITEM
   * Recalculate PO Item quantities
   * =====================================================*/
  this.after('UPDATE', GRItems, async (data, req) => {
    const tx = cds.transaction(req);

    const totalReceived = await tx.run(
      SELECT.from(GRItems)
        .columns('gr_item_received_quan')
        .where({
          gr_item_po_id: data.gr_item_po_id,
          gr_item_lineitem_number: data.gr_item_lineitem_number
        })
    );

    const receivedSum = totalReceived.reduce(
      (sum, r) => sum + (r.gr_item_received_quan || 0),
      0
    );

    const poItem = await tx.run(
      SELECT.one.from(poitem).where({
        po_id: data.gr_item_po_id,
        po_lineitem_number: data.gr_item_lineitem_number
      })
    );

    if (!poItem) return;

    const orderedQty = poItem.po_item_quan?.order_quan || 0;
    const openQty = Math.max(orderedQty - receivedSum, 0);

    await tx.run(
      UPDATE(poitem)
        .set({
          po_item_received_quan: receivedSum,
          po_item_open_quan: openQty,
          po_item_status:
            openQty === 0 ? 'full_received' : 'partially_received'
        })
        .where({
          po_id: data.gr_item_po_id,
          po_lineitem_number: data.gr_item_lineitem_number
        })
    );
  });

  /* =====================================================
   * BEFORE DELETE – GR ITEM
   * =====================================================*/
  this.before('DELETE', GRItems, async (req) => {
    const tx = cds.transaction(req);

    const grItem = await tx.run(
      SELECT.one.from(GRItems).where(req.data)
    );

    if (!grItem) {
      req.reject(404, 'GR Item not found');
    }

    req._grItemBackup = grItem;
  });

  /* =====================================================
   * AFTER DELETE – GR ITEM
   * Recalculate PO Item quantities
   * =====================================================*/
  this.after('DELETE', GRItems, async (_, req) => {
    const tx = cds.transaction(req);
    const grItem = req._grItemBackup;
    if (!grItem) return;

    const remaining = await tx.run(
      SELECT.from(GRItems)
        .columns('gr_item_received_quan')
        .where({
          gr_item_po_id: grItem.gr_item_po_id,
          gr_item_lineitem_number: grItem.gr_item_lineitem_number
        })
    );

    const receivedSum = remaining.reduce(
      (sum, r) => sum + (r.gr_item_received_quan || 0),
      0
    );

    const poItem = await tx.run(
      SELECT.one.from(poitem).where({
        po_id: grItem.gr_item_po_id,
        po_lineitem_number: grItem.gr_item_lineitem_number
      })
    );

    if (!poItem) return;

    const orderedQty = poItem.po_item_quan?.order_quan || 0;
    const openQty = Math.max(orderedQty - receivedSum, 0);

    await tx.run(
      UPDATE(poitem)
        .set({
          po_item_received_quan: receivedSum,
          po_item_open_quan: openQty,
          po_item_status:
            openQty === 0 ? 'full_received' : 'partially_received'
        })
        .where({
          po_id: grItem.gr_item_po_id,
          po_lineitem_number: grItem.gr_item_lineitem_number
        })
    );
  });

});
