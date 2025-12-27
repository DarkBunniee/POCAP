using { po.ust as ust } from '../db/schema';

@path : '/goodreciept'
service GRService {

  @Common.Label : 'Goods Receipt Header'
  @(odata.draft.enabled: true)
  entity GRHeaders as projection on ust.gr_header;

  @Common.Label : 'Goods Receipt Items'
  entity GRItems as projection on ust.gr_item;
}
