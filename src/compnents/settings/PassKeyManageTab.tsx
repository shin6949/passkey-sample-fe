import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  fetchRegistrationOptions,
  postPassKeyAtBackend,
} from "../../api/AuthApiService";
import {
  getPassKeyList,
  updatePassKeyLabel,
  deletePassKey,
} from "../../api/PassKeyApiService";
import { useToast } from "../../context/ToastContext";
import { useTranslation } from "react-i18next";
import { Button, Spinner, Table } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

interface PassKeyManageTabProps {}
export type PassKeyManageTabHandle = {
  loadPasskeys: () => Promise<void>;
};

type RegistrationState = {
  isLoading: boolean;
  credentialId: string | null;
};

const initialState: RegistrationState = {
  isLoading: false,
  credentialId: null,
};

type RegistrationOptionsResponse = {
  challenge: string;
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  rp: {
    id: string;
    name: string;
  };
  excludeCredentials?: Array<{
    type: "public-key";
    id: string; // 서버에서 전달받은 Base64 문자열
    transports?: AuthenticatorTransport[];
  }>;
  pubKeyCredParams: Array<{
    type: "public-key";
    alg: number;
  }>;
  timeout: number;
  attestation: "direct" | "indirect" | "none";
};

const createCredential = async (
  options: RegistrationOptionsResponse,
): Promise<PublicKeyCredential> => {
  // 수정 후 createCredential 함수 내부
  const publicKey: PublicKeyCredentialCreationOptions = {
    ...options,
    challenge: base64urlToBuffer(options.challenge),
    user: {
      ...options.user,
      id: base64urlToBuffer(options.user.id),
    },
    excludeCredentials:
      options.excludeCredentials?.map(cred => ({
        ...cred,
        id: base64urlToBuffer(cred.id),
      })) || [],
  };

  return navigator.credentials.create({
    publicKey,
  }) as Promise<PublicKeyCredential>;
};

const base64urlToBuffer = (base64url: string): ArrayBuffer => {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
};

const PassKeyManageTab = forwardRef<
  PassKeyManageTabHandle,
  PassKeyManageTabProps
>((_, ref) => {
  // PassKey Registration
  const [state, setState] = useState<RegistrationState>(initialState);
  const [passKeyLabel, setPassKeyLabel] = useState("");

  // PassKey List
  const [passkeyList, setPasskeyList] = useState<PassKeyListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // PassKey List -> Label Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedLabel, setEditedLabel] = useState("");

  // 공통
  const { showToast } = useToast();
  const { t } = useTranslation();

  const fetchPasskeys = useCallback(async () => {
    try {
      const response = await getPassKeyList();
      setPasskeyList(response.data);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      loadPasskeys: fetchPasskeys,
    }),
    [fetchPasskeys],
  );

  const handleSaveEdit = async () => {
    if (!editingId || !editedLabel.trim()) return;

    try {
      // 기존 axios 직접 호출 대신 정의된 API 함수 사용
      const response = await updatePassKeyLabel({
        uuid: editingId,
        name: editedLabel,
      });

      if (response.status === 200) {
        setPasskeyList(
          passkeyList.map(pk =>
            pk.uuid === editingId ? { ...pk, label: editedLabel } : pk,
          ),
        );
        showToast(
          t("manage_passkey.toast_success_to_update_passkey"),
          "success",
        );
        setEditingId(null);
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error("패스키 라벨 수정 실패:", error);
      showToast(t("manage_passkey.toast_fail_to_update_passkey"), "danger");
      setEditingId(null);
    }
  };

  const handleDeletePasskey = async (uuid: string) => {
    const response = await deletePassKey(uuid);
    if (response.status === 200) {
      showToast(t("manage_passkey.toast_success_to_delete_passkey"), "success");
    } else {
      showToast(t("manage_passkey.toast_fail_to_delete_passkey"), "danger");
    }

    await fetchPasskeys();
  };

  const handleRegister = async () => {
    try {
      setState({ isLoading: true, credentialId: null });

      const options = await fetchRegistrationOptions();
      if (options.status !== 200) {
        console.log("Failed to fetch registration options");
        showToast(t("manage_passkey.toast_fail_to_register_passkey"), "danger");
        return;
      }

      const optionsData = options.data;
      const credential = await createCredential(optionsData);
      const result = await postPassKeyAtBackend(credential, passKeyLabel);

      setState({
        isLoading: false,
        credentialId: result.credentialId,
      });

      setPassKeyLabel("");

      showToast(
        t("manage_passkey.toast_success_to_register_passkey"),
        "success",
      );

      await fetchPasskeys();
    } catch (error) {
      let errorMessage = t("manage_passkey.toast_fail_to_register_passkey");
      console.error("Raw error object:", error);

      if (error instanceof DOMException) {
        switch (error.name) {
          case "InvalidStateError":
            errorMessage = t(
              "manage_passkey.toast_fail_to_register_passkey_duplicate",
            );
            showToast(errorMessage, "danger");
            break;
          case "NotAllowedError":
            errorMessage = t(
              "manage_passkey.toast_fail_to_register_passkey_user_canceled",
            );
            showToast(errorMessage, "warning");
            break;
          default:
            showToast(`${t("common.unknown_error")}: ${error.name}`, "danger");
        }
      } else {
        showToast(errorMessage, "danger");
      }

      setState({
        isLoading: false,
        credentialId: null,
      });
      setPassKeyLabel("");
    }
  };

  return (
    <div style={{ minHeight: "50vh" }}>
      <h1>{t("manage_passkey.title")}</h1>
      <p>{t("manage_passkey.description")}</p>

      <Form className="mb-3">
        <h3>{t("manage_passkey.title_add_passkey")}</h3>
        <InputGroup>
          <Form.Control
            placeholder={t("manage_passkey.input_placeholder_passkey")}
            // aria-label={t("manage_passkey.input_label_passkey")}
            // aria-describedby="basic-addon2"
            value={passKeyLabel}
            onChange={e => setPassKeyLabel(e.target.value)}
            type="text"
            // 엔터를 누르면, 등록 버튼을 클릭한 것과 동일한 효과를 내도록 함.
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRegister();
              }
            }}
            defaultValue={t("manage_passkey.input_default_value_passkey")}
            disabled={state.isLoading}
          />

          <Button
            onClick={handleRegister}
            disabled={state.isLoading}
            variant="outline-secondary"
            id="button-addon2"
          >
            {t("manage_passkey.btn_add_passkey")}
          </Button>
        </InputGroup>
      </Form>

      <br></br>
      <h2>{t("manage_passkey.title_passkey_list")}</h2>

      {isLoading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : passkeyList.length === 0 ? (
        <div>{t("manage_passkey.description_no_passkey")}</div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>{t("manage_passkey.table_column_name")}</th>
              <th>{t("manage_passkey.table_column_created_at")}</th>
              <th>{t("manage_passkey.table_column_last_used_at")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {passkeyList.map(passkey => (
              <tr key={passkey.uuid}>
                <td
                  onDoubleClick={() => {
                    setEditingId(passkey.uuid);
                    setEditedLabel(passkey.label);
                  }}
                >
                  {editingId === passkey.uuid ? (
                    <input
                      type="text"
                      value={editedLabel}
                      onChange={e => setEditedLabel(e.target.value)}
                      className="form-control"
                      // 엔터를 누르면, 등록 버튼을 클릭한 것과 동일한 효과를 내도록 함.
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveEdit();
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    passkey.label
                  )}
                </td>

                <td>{new Date(passkey.createdAt).toLocaleString()}</td>
                <td>
                  {passkey.lastUsedAt
                    ? new Date(passkey.lastUsedAt).toLocaleString()
                    : t("manage_passkey.never_used")}
                </td>
                <td>
                  {editingId === passkey.uuid ? (
                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleSaveEdit}
                      >
                        {t("manage_passkey.btn_save")}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        {t("manage_passkey.btn_cancel")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeletePasskey(passkey.uuid)}
                    >
                      {t("manage_passkey.btn_delete")}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <p>{t("manage_passkey.hint_modify_passkey")}</p>
        </Table>
      )}
    </div>
  );
});

export default PassKeyManageTab;
