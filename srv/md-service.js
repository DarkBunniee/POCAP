const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

  const { Vendors, Materials } = this.entities;
  const { vendormaster, mastermaterial } = cds.entities('po.ust');

  /* =====================================================
   * CREATE – VENDOR
   * =====================================================*/
  this.before('CREATE', Vendors, async (req) => {
    if (!req.data.vm_code || !req.data.vm_gstno) {
      req.reject(400, 'Vendor Code and GST Number are mandatory');
    }

    req.data.is_Active = 'inactive';
  });

  /* =====================================================
   * UPDATE – VENDOR (CHANGE)
   * =====================================================*/
  this.before('UPDATE', Vendors, async (req) => {
    if (req.data.vm_code === '') {
      req.reject(400, 'Vendor Code cannot be empty');
    }
  });

  /* =====================================================
   * DELETE – VENDOR
   * =====================================================*/
  this.before('DELETE', Vendors, async (req) => {
    const tx = cds.transaction(req);

    const vendor = await tx.run(
      SELECT.one.from(vendormaster).where(req.data)
    );

    if (!vendor) {
      req.reject(404, 'Vendor not found');
    }
  });

  /* =====================================================
   * CREATE – MATERIAL
   * =====================================================*/
  this.before('CREATE', Materials, async (req) => {
    if (!req.data.mm_code || !req.data.mm_gstno) {
      req.reject(400, 'Material Code and GST Number are mandatory');
    }

    req.data.is_Active = 'inactive';
  });

  /* =====================================================
   * UPDATE – MATERIAL (CHANGE)
   * =====================================================*/
  this.before('UPDATE', Materials, async (req) => {
    if (req.data.mm_stdprice < 0) {
      req.reject(400, 'Standard price cannot be negative');
    }
  });

  /* =====================================================
   * DELETE – MATERIAL
   * =====================================================*/
  this.before('DELETE', Materials, async (req) => {
    const tx = cds.transaction(req);

    const material = await tx.run(
      SELECT.one.from(mastermaterial).where(req.data)
    );

    if (!material) {
      req.reject(404, 'Material not found');
    }
  });

  /* =====================================================
   * ACTION: Activate Vendor
   * =====================================================*/
  this.on('activateVendor', async (req) => {
    const { vm_id } = req.data;
    const tx = cds.transaction(req);

    await tx.run(
      UPDATE(vendormaster)
        .set({ is_Active: 'active' })
        .where({ vm_id })
    );

    return { message: 'Vendor activated successfully' };
  });

  /* =====================================================
   * ACTION: Deactivate Vendor
   * =====================================================*/
  this.on('deactivateVendor', async (req) => {
    const { vm_id } = req.data;
    const tx = cds.transaction(req);

    await tx.run(
      UPDATE(vendormaster)
        .set({ is_Active: 'inactive' })
        .where({ vm_id })
    );

    return { message: 'Vendor deactivated successfully' };
  });

  /* =====================================================
   * ACTION: Activate Material
   * =====================================================*/
  this.on('activateMaterial', async (req) => {
    const { mm_id } = req.data;
    const tx = cds.transaction(req);

    await tx.run(
      UPDATE(mastermaterial)
        .set({ is_Active: 'active' })
        .where({ mm_id })
    );

    return { message: 'Material activated successfully' };
  });

  /* =====================================================
   * ACTION: Deactivate Material
   * =====================================================*/
  this.on('deactivateMaterial', async (req) => {
    const { mm_id } = req.data;
    const tx = cds.transaction(req);

    await tx.run(
      UPDATE(mastermaterial)
        .set({ is_Active: 'inactive' })
        .where({ mm_id })
    );

    return { message: 'Material deactivated successfully' };
  });

  /* =====================================================
   * FUNCTION: Check Vendor Exists
   * =====================================================*/
  this.on('vendorExists', async (req) => {
    const { vm_code } = req.data;

    const result = await SELECT.one
      .from(vendormaster)
      .where({ vm_code });

    return { exists: !!result };
  });

  /* =====================================================
   * FUNCTION: Get Active Vendors
   * =====================================================*/
  this.on('getActiveVendors', async () => {
    return SELECT.from(vendormaster).where({ is_Active: 'active' });
  });

  /* =====================================================
   * FUNCTION: Get Active Materials
   * =====================================================*/
  this.on('getActiveMaterials', async () => {
    return SELECT.from(mastermaterial).where({ is_Active: 'active' });
  });

});
