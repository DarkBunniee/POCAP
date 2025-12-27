@path: '/country'
service CountryService {

  entity Countries {
    key cca3        : String;
        name        : String;
        capital     : String;
        region      : String;
        population  : Integer;
  }

}
