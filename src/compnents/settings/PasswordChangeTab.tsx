import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { useTranslation } from "react-i18next";
import { Form, Button, Container } from "react-bootstrap";
import {
  checkCurrentPassword,
  updatePassword,
  revokePasswordChangeAuthorizationToken,
} from "../../api/ProfileApiService";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const PasswordChangeTab = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 토큰 유효성 검사
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // 현재 비밀번호 검증
  const verifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await checkCurrentPassword(formData.currentPassword);

      if (response.status === 200 && response.data.data.isMatch === true) {
        setStep(2);
        showToast(
          t("change_password.step_1_toast_success_to_verify_password"),
          "success",
        );
      } else {
        showToast(
          t("change_password.step_1_toast_fail_to_verify_password"),
          "danger",
        );
      }
    } catch (error) {
      showToast(
        t("change_password.step_1_toast_fail_to_verify_password"),
        "danger",
      );
    } finally {
      setIsLoading(false);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  // 비밀번호 변경 취소
  const cancelPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      revokePasswordChangeAuthorizationToken();
    } catch (error) {
      console.log(error);
    } finally {
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setStep(1);
    }
  };

  // 새 비밀번호 변경
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      showToast(t("change_password.step_2_toast_not_match_password"), "danger");
      return;
    }

    setIsLoading(true);

    try {
      const response = await updatePassword(
        formData.newPassword,
        formData.confirmPassword,
      );

      if (response.status === 200) {
        showToast(
          t("change_password.step_2_toast_success_to_change_password"),
          "success",
        );
      } else {
        showToast(
          t("change_password.step_2_toast_fail_to_change_password"),
          "danger",
        );
      }
    } catch (error) {
      console.log(error);
      showToast(
        t("change_password.step_2_toast_fail_to_change_password"),
        "danger",
      );
    } finally {
      setIsLoading(false);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setStep(1);
    }
  };

  return (
    <Container>
      <h1>{t("change_password.title")}</h1>

      {step === 1 ? (
        <>
          <p>{t("change_password.step_1_description")}</p>
          <Container>
            <Form onSubmit={verifyCurrentPassword}>
              <Form.Group className="mb-3">
                <Form.Label>
                  {t("change_password.step_1_input_label_current_password")}
                </Form.Label>
                <Form.Control
                  type="password"
                  value={formData.currentPassword}
                  autoComplete="current-password"
                  placeholder={t(
                    "change_password.step_1_input_placeholder_current_password",
                  )}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit" disabled={isLoading}>
                {isLoading
                  ? t("change_password.step_1_btn_disabled")
                  : t("change_password.step_1_btn_next")}
              </Button>
            </Form>
          </Container>
        </>
      ) : (
        <>
          <Container>
            <p>{t("change_password.step_2_description")}</p>
            <Form onSubmit={handlePasswordChange}>
              <Form.Group className="mb-3">
                <Form.Label>
                  {t("change_password.step_2_input_label_new_password")}
                </Form.Label>
                <Form.Control
                  type="password"
                  value={formData.newPassword}
                  autoComplete="new-password"
                  onChange={e =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  required
                  minLength={8}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  {t("change_password.step_2_input_label_new_password_confirm")}
                </Form.Label>
                <Form.Control
                  type="password"
                  value={formData.confirmPassword}
                  autoComplete="new-password"
                  onChange={e =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>
              <p>{t("change_password.step_2_warning_message")}</p>
              <div className="d-flex gap-2">
                <Button variant="secondary" onClick={cancelPasswordChange}>
                  {t("change_password.step_2_back_button")}
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading
                    ? t("change_password.step_2_btn_disabled")
                    : t("change_password.step_2_btn_change")}
                </Button>
              </div>
            </Form>
          </Container>
        </>
      )}
    </Container>
  );
};

export default PasswordChangeTab;
