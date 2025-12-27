

using { po.ust as ust } from '../db/schema';

@path : '/audits'
service AUDService {

  @Common.Label : 'PO Audit Log'
  @(odata.draft.enabled: true)
  entity POAudits as projection on ust.audit;


}
