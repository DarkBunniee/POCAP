@path: '/users'
service ExternalRestService {

  entity Data {
    key id : Integer;
        name : String;
        value : String;
  }

  action callPost(data : String) returns String;
}
