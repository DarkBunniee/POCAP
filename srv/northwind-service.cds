@path: '/northwind'
service NorthwindService {

  entity Products {
    key ProductID : Integer;
    ProductName  : String;
    UnitPrice    : Decimal;
  }

  entity Customers {
    key CustomerID : String;
    CompanyName   : String;
    Country       : String;
  }

}
