import { useState, useEffect, useCallback } from "react";
import {
  login,
  fetchPassKeyAuthenticateOptions,
  fetchPassKeyLogin,
  getTokenByPassKey,
} from "../api/AuthApiService";
import { Button, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useToast } from "../context/ToastContext";

declare global {
  interface Window {
    PublicKeyCredential: any;
  }
}

interface LoginFormValues {
  email: string;
  password: string;
}

interface WebAuthnResponse {
  authenticated: boolean;
  redirectUrl: string;
}

export default function SignInPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [values, setValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues(prev => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };
  const [error, setError] = useState("");

  useEffect(() => {
    const checkWebAuthn = async () => {
      if (window.PublicKeyCredential) {
        const isSupported =
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        console.log("WebAuthn 지원 여부:", isSupported);
      }
    };
    checkWebAuthn();
  }, []);

  const base64url = {
    encode: (buffer: ArrayBuffer) => {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    },
    decode: (base64url: string) => {
      const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
      const binStr = atob(base64);
      const bin = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) {
        bin[i] = binStr.charCodeAt(i);
      }
      return bin.buffer;
    },
  };

  const authenticate = useCallback(async () => {
    if (!window.PublicKeyCredential) {
      showToast(t("login.toast_not_support_passkey"), "danger");
    }

    try {
      // 1. 인증 옵션 요청
      const optionsResponse = await fetchPassKeyAuthenticateOptions();

      if (!optionsResponse.ok) throw new Error("옵션 요청 실패");
      const options = await optionsResponse.json();

      // 2. WebAuthn 인증 수행
      const credential = (await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: base64url.decode(options.challenge),
        },
      })) as PublicKeyCredential;

      // 3. 인증 결과 전송
      const response = credential.response as AuthenticatorAssertionResponse;
      const body = JSON.stringify({
        id: credential.id,
        rawId: base64url.encode(credential.rawId),
        response: {
          authenticatorData: base64url.encode(response.authenticatorData),
          clientDataJSON: base64url.encode(response.clientDataJSON),
          signature: base64url.encode(response.signature),
          userHandle: response.userHandle
            ? base64url.encode(response.userHandle)
            : undefined,
        },
      });
      const verificationResponse = await fetchPassKeyLogin(body);

      if (!verificationResponse.ok) throw new Error("인증 검증 실패");
      const result: WebAuthnResponse = await verificationResponse.json();

      const tokenResult = await getTokenByPassKey(credential.id);
      // 토큰 저장
      localStorage.removeItem("accessToken");
      localStorage.setItem("accessToken", tokenResult.data.accessToken);
      showToast(t("login.toast_login_success"), "success");

      // 홈으로 리다이렉트
      window.location.href = "/";
    } catch (error) {
      setError(t("login.error_invalid_passkey"));
    }
  }, []);

  useEffect(() => {
    // WebAuthn 지원 여부 체크
    if (!window.PublicKeyCredential) {
      console.warn("이 브라우저는 WebAuthn을 지원하지 않습니다");
    }
  }, []);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError(""); // 에러 초기화

    try {
      const response = await login(values);
      if (response.result === "PASSWORD_MISMATCH") {
        setError(t("login.error_invalid_credentials"));
        return;
      }

      // 토큰 저장
      localStorage.removeItem("accessToken");
      localStorage.setItem("accessToken", response.data.accessToken);

      showToast(t("login.toast_login_success"), "success");

      // 홈으로 리다이렉트
      window.location.href = "/";
    } catch (err) {
      localStorage.removeItem("accessToken");
      setError(t("login.error_invalid_credentials"));
    }
  };

  return (
    <div
      className="d-flex justify-content-center"
      style={{ minHeight: "50vh" }}
    >
      <div className="align-self-center" style={{ minWidth: "25vw" }}>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <h2>{t("login.title")}</h2>
        <br></br>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="form-group mb-3">
            <Form.Label>{t("login.input_label_email")}</Form.Label>
            <Form.Control
              type="text"
              className="form-control"
              id="email"
              value={values.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>{t("login.input_label_password")}</Form.Label>
            <Form.Control
              type="password"
              className="form-control"
              id="password"
              value={values.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="current-password"
            />
          </Form.Group>
          <Button type="submit" className="btn primary w-100 py-2">
            {t("login.btn_submit")}
          </Button>

          <Button
            type="button"
            className="btn w-100 py-2 mt-3"
            variant="outline-secondary"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              authenticate();
            }}
          >
            <img
              alt="Passkey Logo"
              src="/img/canonical_passkey_icon.png"
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{" "}
            {t("login.btn_passkey")}
          </Button>
        </Form>
      </div>
    </div>
  );
}
