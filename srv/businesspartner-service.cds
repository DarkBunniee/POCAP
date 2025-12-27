@path: '/businesspartnar'
service BusinessPartnerService {

  @readonly
  entity BusinessPartners {
    key businessPartnerNumber : String;
        plantCode             : String;
        vendorCode            : String;
        customerCode          : String;
        businessPartnerName1  : String;
        businessPartnerName2  : String;
        partnerType_ID        : Integer;
        street                : String;
        city                  : String;
        postalCode            : String;
        country               : String;
        email                 : String;
        mobile                : String;
        countryKey_code       : String;
  }

}
