using { po.ust as ust } from '../db/schema';

@path : '/invoice'
service InvoiceService {

  @Common.Label : 'Invoice Header'
  @(odata.draft.enabled: true)
  entity InvoiceHeaders as projection on ust.inv_header;

  @Common.Label : 'Invoice Items'
  entity InvoiceItems as projection on ust.inv_item;
}
