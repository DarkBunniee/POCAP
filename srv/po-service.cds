using { po.ust as ust } from '../db/schema';

@path : '/purchase'
service POService  {

  @Common.Label : 'Purchase Order Header'
  @(odata.draft.enabled: true)
  entity POHeaders as projection on ust.poheader;

  @Common.Label : 'Purchase Order Items'
  entity POItems as projection on ust.poitem;
}
