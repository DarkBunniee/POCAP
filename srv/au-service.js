const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

  const { POAudits } = this.entities;

  /* ---------------------------------------------------
   * BEFORE CREATE
   * ---------------------------------------------------*/
  this.before('CREATE', POAudits, async (req) => {
    req.data.audit_status = 'CREATED';

    req.data.audit_log = {
      auditby: req.user?.id || 'SYSTEM',
      auditat: new Date(),
      verifiedby: null,
      verifiedat: null,
      approvedby: null,
      approvedat: null
    };
  });

  /* ---------------------------------------------------
   * BEFORE UPDATE (CHANGE)
   * ---------------------------------------------------*/
  this.before('UPDATE', POAudits, async (req) => {
    req.data.audit_status = 'UPDATED';

    req.data.audit_log = {
      ...req.data.audit_log,
      auditby: req.user?.id || 'SYSTEM',
      auditat: new Date()
    };
  });

  /* ---------------------------------------------------
   * BEFORE DELETE
   * ---------------------------------------------------*/
  this.before('DELETE', POAudits, async (req) => {
    const tx = cds.transaction(req);

    const existing = await tx.run(
      SELECT.one.from(POAudits).where(req.data)
    );

    if (!existing) {
      req.reject(404, 'Audit record not found');
    }

    // Optional: log deletion elsewhere
    console.log('Deleting audit record:', existing);
  });

  /* ---------------------------------------------------
   * AFTER CREATE
   * ---------------------------------------------------*/
  this.after('CREATE', POAudits, async (data) => {
    console.log('Audit Created:', data.error_po);
  });

  /* ---------------------------------------------------
   * AFTER UPDATE
   * ---------------------------------------------------*/
  this.after('UPDATE', POAudits, async (data) => {
    console.log('Audit Updated:', data.error_po);
  });

  /* ---------------------------------------------------
   * AFTER DELETE
   * ---------------------------------------------------*/
  this.after('DELETE', POAudits, async (data) => {
    console.log('Audit Deleted:', data);
  });

});
