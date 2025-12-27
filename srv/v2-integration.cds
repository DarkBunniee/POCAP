@path: '/v2bridge'
service V2BridgeService {

  entity Products {
    key ProductID : Integer;
    ProductName  : String;
    UnitPrice    : Decimal;
    CategoryID   : Integer;
  }

}
