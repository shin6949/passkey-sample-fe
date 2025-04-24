import { AxiosResponse } from "axios";
import { ApiResponse } from "../model/ApiResponse";
import { LoginResponse } from "../model/AuthApiResponse";
import axiosInstance from "./AxiosInstance";

/** LOGIN API */
export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<ApiResponse<LoginResponse>> => {
  const data = { email: email, password };
  const response: AxiosResponse<ApiResponse<LoginResponse>> =
    await axiosInstance.post(`/api/auth/login`, data);

  return response.data;
};

export const logout = async (): Promise<boolean> => {
  try {
    const response = await axiosInstance.post("/api/auth/logout", null);

    console.log(response.status);

    // 클라이언트 측 상태 초기화
    sessionStorage.removeItem("accessToken");

    return true;
  } catch (error) {
    console.error("Logout failed:", error);
    // throw new Error("로그아웃 처리 중 오류 발생");
    return false;
  }
};

export const fetchPassKeyAuthenticateOptions = async () => {
  const optionsResponse = await fetch(`/webauthn/authenticate/options`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return optionsResponse;
};

export const fetchPassKeyLogin = async (body: string) => {
  const passKeyRequest = await fetch(`/login/webauthn`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });
  return passKeyRequest;
};

export const getTokenByPassKey = async (body: string) => {
  const passKeyRequest = await axiosInstance.post(`/api/auth/login/passkey`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log(passKeyRequest.data);
  return passKeyRequest;
};

export const fetchRegistrationOptions = async () => {
  const response = await axiosInstance.post("/webauthn/register/options");
  return response; // challenge, rpId 포함
};

type RegistrationResponse = {
  credentialId: string;
  transports?: AuthenticatorTransport[];
};

export const postPassKeyAtBackend = async (
  credential: PublicKeyCredential,
  passKeyLabel: string,
): Promise<RegistrationResponse> => {
  const response = credential.response as AuthenticatorAttestationResponse;

  const data = {
    publicKey: {
      credential: {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        response: {
          attestationObject: bufferToBase64url(response.attestationObject),
          clientDataJSON: bufferToBase64url(response.clientDataJSON),
          transports: response.getTransports?.() || [],
        },
        type: credential.type,
        clientExtensionResults: credential.getClientExtensionResults(),
        authenticatorAttachment: credential.authenticatorAttachment,
      },
      label: passKeyLabel ? passKeyLabel : "Web PassKey",
    },
  };

  const result = await fetch("/webauthn/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!result.ok) {
    throw response; // 오류 객체 전파
  }

  return result.json();
};

const bufferToBase64url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const verifyPassKeyAtBackend = async (passkey: object) => {
  const response = await axiosInstance.post("/login/webauthn", passkey);
  console.log(response.data);
  return response.data; // challenge, rpId 포함
};
