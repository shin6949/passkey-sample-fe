import { useState, ChangeEvent, FormEvent } from "react";
import { signUp, checkDuplicateEmail } from "../api/UserApiService";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { InputGroup } from "react-bootstrap";

interface SignUpFormValues {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  useGravatar: boolean;
}

const SignUpPage = () => {
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [validated, setValidated] = useState(false);

  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [values, setValues] = useState<SignUpFormValues>({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    useGravatar: true,
  });

  const handleClickDuplicateEmail = async () => {
    if (!values.email) {
      showToast(t("signup.toast_email_input_is_empty"), "danger");
      return;
    }

    const response = await checkDuplicateEmail(values.email);

    // false일 경우 중복되지 않은 이메일
    if (!response.data.isExists) {
      setIsEmailChecked(true);
      showToast(t("signup.toast_email_not_duplicate"), "success");
    } else {
      setIsEmailChecked(false);
      showToast(t("signup.toast_email_duplicate"), "danger");
    }
  };

  const handleClickEmailCheckCancel = () => {
    setIsEmailChecked(false);
    showToast(t("signup.toast_email_check_cancel"), "success");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }

    setValidated(true);

    if (isEmailChecked === false) {
      showToast(t("signup.toast_remind_check_email"), "danger");
      return;
    }

    const response = await signUp({
      name: values.name,
      email: values.email,
      password: values.password,
      passwordConfirm: values.passwordConfirm,
      useGravatar: values.useGravatar,
    });

    if (response.status === 201) {
      showToast(t("signup.toast_signup_success"), "success");
      navigate("/login", { replace: true });
      return;
    }

    if (response.status === 400 && response.data.result === "DUPLICATE_EMAIL") {
      showToast(t("signup.toast_signup_fail_with_duplicate_email"), "danger");
      return;
    }

    showToast(t("signup.toast_signup_fail"), "danger");
    return;
  };

  return (
    <div
      className="d-flex justify-content-center"
      style={{ minHeight: "50vh" }}
    >
      <div className="align-self-center">
        <h2>{t("signup.title")}</h2>
        <p>{t("signup.description")}</p>
        <Form onSubmit={handleSubmit} validated={validated} noValidate>
          {/* 이름 입력 필드 */}
          <Form.Group className="mb-3" controlId="name">
            <Form.Label>{t("signup.input_label_name")}</Form.Label>
            <Form.Control
              type="text"
              name="name"
              autoComplete="name"
              onChange={handleChange}
              value={values.name}
              placeholder={t("signup.placeholder_name")}
              required
            />
            <Form.Text className="text-muted">
              {t("signup.description_name")}
            </Form.Text>
          </Form.Group>

          {/* 이메일 입력 필드 */}
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>{t("signup.input_label_email")}</Form.Label>
            <InputGroup hasValidation>
              <Form.Control
                type="email"
                name="email"
                autoComplete="email"
                onChange={handleChange}
                value={values.email}
                placeholder={t("signup.placeholder_email")}
                disabled={isEmailChecked}
                isValid={isEmailChecked}
                required
              />
              {isEmailChecked ? (
                <Button
                  onClick={handleClickEmailCheckCancel}
                  className="btn-secondary"
                >
                  {t("signup.btn_check_email_cancel")}
                </Button>
              ) : (
                <Button onClick={handleClickDuplicateEmail}>
                  {t("signup.btn_check_duplicate_email")}
                </Button>
              )}
              <Form.Control.Feedback type="invalid">
                {t("signup.invalid_email_message")}
              </Form.Control.Feedback>
            </InputGroup>

            <Form.Text className="text-muted">
              {t("signup.description_email")}
            </Form.Text>
          </Form.Group>

          {/* 비밀번호 입력 필드 */}
          <Form.Group className="mb-3" controlId="password">
            <Form.Label>{t("signup.input_label_password")}</Form.Label>
            <Form.Control
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder={t("signup.placeholder_password")}
              value={values.password}
              onChange={handleChange}
              required
              minLength={8}
            />
            <Form.Text className="text-muted">
              {t("signup.description_password")}
            </Form.Text>
          </Form.Group>

          {/* 비밀번호 확인 필드 */}
          <Form.Group className="mb-3" controlId="passwordConfirm">
            <Form.Label>{t("signup.input_label_password_confirm")}</Form.Label>
            <Form.Control
              type="password"
              name="passwordConfirm"
              autoComplete="new-password"
              placeholder={t("signup.placeholder_password_confirm")}
              value={values.passwordConfirm}
              onChange={handleChange}
              required
              minLength={8}
            />
            <Form.Text className="text-muted">
              {t("signup.description_password_confirm")}
            </Form.Text>
          </Form.Group>

          {/* Gravatar 사용 체크박스 */}
          <Form.Group className="mb-3" controlId="useGravatar">
            <Form.Label>{t("signup.input_label_use_gravatar")}</Form.Label>
            <Form.Check
              type="checkbox"
              name="useGravatar"
              checked={values.useGravatar}
              onChange={handleChange}
              label={t("signup.input_checkbox_use_gravatar")}
            />
            <Form.Text className="text-muted">
              <Trans i18nKey="signup.description_use_gravatar" />
            </Form.Text>
          </Form.Group>

          {/* 제출 버튼 */}
          <Button variant="primary" type="submit">
            {t("signup.btn_submit")}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default SignUpPage;
