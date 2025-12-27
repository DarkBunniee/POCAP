using {po.ust as ust} from '../db/schema';

@path: '/globe'
@(odata.draft.enabled: true)
service GLOBService {

    @Common.Label: 'Purchase Order Header'
    // @(odata.draft.enabled: true)
    entity POHeaders      as projection on ust.poheader;

    @Common.Label: 'Purchase Order Items'
    entity POItems        as projection on ust.poitem;

    @Common.Label: 'PUrchase Order Global Services'
    // @(odata.draft.enabled: true)
    entity POAudits       as projection on ust.audit;

    @Common.Label: 'Goods Receipt Header'
    // @(odata.draft.enabled: true)
    entity GRHeaders      as projection on ust.gr_header;

    @Common.Label: 'Goods Receipt Items'
    entity GRItems        as projection on ust.gr_item;

    @Common.Label: 'Invoice Header'
    // @(odata.draft.enabled: true)
    entity InvoiceHeaders as projection on ust.inv_header;

    @Common.Label: 'Invoice Items'
    entity InvoiceItems   as projection on ust.inv_item;

    @Common.Label: 'Vendors'

    entity Vendors        as projection on ust.vendormaster;

    @Common.Label: 'Materials'
    entity Materials      as projection on ust.mastermaterial;


}
