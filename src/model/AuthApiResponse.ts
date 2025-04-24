export interface LoginResponse {
  accessToken: string;
}

type Base64URLString = string;

export interface PublicKeyCredentialRequestOptions {
  challenge: Base64URLString;
  rp: {
    id: string;
    name: string;
  };
  user: {
    id: Base64URLString;
    name: string;
    displayName: string;
  };
}
