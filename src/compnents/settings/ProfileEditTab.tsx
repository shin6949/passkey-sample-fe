import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  ProfileFetchResponse,
  ProfileUpdateRequest,
} from "../../model/ProfileApiResponse";
import { useToast } from "../../context/ToastContext";
import { PersonCircle } from "react-bootstrap-icons";
import { fetchProfile, updateProfile } from "../../api/ProfileApiService";
import { useTranslation } from "react-i18next";
import { Form, Button, Container, InputGroup } from "react-bootstrap";
import { Trans } from "react-i18next";
import { useUser } from "../../context/UserProvider";
import { fetchLoginUser, checkDuplicateEmail } from "../../api/UserApiService";

interface ProfileEditTabProps {}
export type ProfileEditTabHandle = {
  loadUserData: () => Promise<void>;
};

const ProfileEditTab = forwardRef<ProfileEditTabHandle, ProfileEditTabProps>(
  (_, ref) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { user, setUser } = useUser();

    const [userData, setUserData] = useState<ProfileFetchResponse>({
      email: "",
      name: "",
      profileImage: "",
      useGravatar: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [isEmailChanged, setIsEmailChanged] = useState(false);
    const [isProfileImageChanged, setIsProfileImageChanged] = useState(false);
    const [isEmailChecked, setIsEmailChecked] = useState(false);
    const [firstEmail, setFirstEmail] = useState("");

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewURL, setPreviewURL] = useState<string>(userData.profileImage);
    const fileRef = useRef<HTMLInputElement>(null);

    const [hasErrors, setHasErrors] = useState<boolean>(false);

    const fetchUserData = useCallback(async () => {
      const response = await fetchProfile();
      if (response.data.result !== "SUCCESS") {
        showToast(t("edit_profile.toast_fail_to_fetch_profile"), "danger");
        setHasErrors(true);
        return;
      }

      setUserData(response.data.data);
      setFirstEmail(response.data.data.email);
      setPreviewURL(response.data.data.profileImage);
    }, []);

    useEffect(() => {
      fetchUserData();
    }, [fetchUserData]);

    useImperativeHandle(
      ref,
      () => ({
        loadUserData: fetchUserData,
      }),
      [fetchUserData],
    );

    const handleClickDuplicateEmail = async () => {
      if (!userData.email) {
        showToast(t("signup.toast_email_input_is_empty"), "danger");
        return;
      }

      const response = await checkDuplicateEmail(userData.email);

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

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();

      // 이메일이 변경되었다면, 중복 체크를 했는지 확인
      if (isEmailChanged && !isEmailChecked) {
        showToast(t("edit_profile.toast_email_check_not_run"), "danger");
        return;
      }

      try {
        const updateRequest: ProfileUpdateRequest = {
          email: userData.email,
          name: userData.name,
          useGravatar: userData.useGravatar,
          isProfileImageChanged: isProfileImageChanged,
          isEmailChanged: isEmailChanged,
          isEmailChecked: isEmailChecked, // 실제 검증 로직과 연동 필요
        };

        // API 호출
        await updateProfile(profileImage, updateRequest);

        // 성공 후 상태 리셋
        setIsEmailChanged(false);
        setIsProfileImageChanged(false);

        // 프로필 데이터 갱신
        await fetchUserData();
        showToast(t("edit_profile.toast_success_to_update_profile"), "success");

        // Header 프로필 갱신
        fetchLoginUser()
          .then(response => {
            setUser(response.data);
          })
          .catch(console.error);
      } catch (error) {
        console.error("업데이트 실패:", error);
        showToast(t("edit_profile.toast_fail_to_update_profile"), "danger");
      }
    };

    const handleChange = (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const { name, value, type } = e.target;
      const isCheckbox = type === "checkbox";
      const checked = (e.target as HTMLInputElement).checked;

      // 이메일 변경 추적
      if (name === "email") {
        setIsEmailChanged(true);
        setIsEmailChecked(false);

        if (name === "email" && value === firstEmail) {
          setIsEmailChanged(false);
        }
      }

      setUserData(prev => ({
        ...prev,
        [name]: isCheckbox ? checked : value,
      }));
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      setIsProfileImageChanged(!!file);

      const MAX_FILE_SIZE_MB = 10;

      if (file) {
        // 파일 크기 검사 (1MB = 1024*1024 bytes)
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          showToast(
            t("edit_profile.toast_image_size_exceed", {
              size: MAX_FILE_SIZE_MB,
            }),
            "danger",
          );
          event.target.value = ""; // 파일 입력 초기화
          return;
        }

        setProfileImage(file);

        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setPreviewURL(reader.result);
          }
        };
        reader.readAsDataURL(file);
        setUserData(prev => ({
          ...prev,
          useGravatar: false,
        }));
      }
    };

    const handleProfileDeleteBtnClick = () => {
      setProfileImage(null);
      setPreviewURL("");
      setIsProfileImageChanged(true);
    };

    const handleFileButtonClick = () => {
      fileRef.current?.click();
    };

    return (
      <>
        <Container>
          <h2>{t("edit_profile.title")}</h2>
          {!hasErrors ? (
            <>
              <p>
                <Trans i18nKey={"edit_profile.description"} />
              </p>
            </>
          ) : (
            <p>
              <Trans i18nKey={"edit_profile.description_on_error"} />
            </p>
          )}
        </Container>

        {!hasErrors ? (
          <>
            <Container>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {t("edit_profile.label_profile_image")}
                  </Form.Label>
                  <div>
                    {profileImage || previewURL ? (
                      <img
                        className="rounded-circle"
                        src={previewURL}
                        alt="Profile Image"
                        style={{ width: "128px", height: "128px" }}
                      />
                    ) : (
                      <PersonCircle size={128} color="#6c757d" />
                    )}
                    <input
                      type="file"
                      ref={fileRef}
                      hidden
                      onChange={handleFileChange}
                    />
                  </div>
                  <div>
                    <Button onClick={handleFileButtonClick}>
                      <Trans i18nKey="edit_profile.btn_change_profile_image" />
                    </Button>

                    {(profileImage || previewURL) &&
                    previewURL &&
                    !previewURL.startsWith("https://gravatar.com") ? (
                      <Button
                        variant="danger"
                        className="ms-2"
                        onClick={handleProfileDeleteBtnClick}
                      >
                        <Trans i18nKey="edit_profile.btn_delete_profile_image" />
                      </Button>
                    ) : null}
                  </div>
                  {previewURL &&
                  previewURL.startsWith("https://gravatar.com") ? (
                    <Form.Text className="text-muted">
                      <Trans i18nKey="edit_profile.description_profile_image_from_gravatar" />
                    </Form.Text>
                  ) : null}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t("signup.input_label_name")}</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder={t("signup.placeholder_name")}
                    value={userData.name}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>{t("signup.input_label_email")}</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control
                      type="email"
                      name="email"
                      autoComplete="email"
                      onChange={handleChange}
                      value={userData.email}
                      placeholder={t("signup.placeholder_email")}
                      disabled={isEmailChecked}
                      isValid={isEmailChecked}
                      required
                    />
                    {isEmailChecked && isEmailChanged ? (
                      <Button
                        onClick={handleClickEmailCheckCancel}
                        className="btn-secondary"
                      >
                        {t("signup.btn_check_email_cancel")}
                      </Button>
                    ) : null}

                    {!isEmailChecked && isEmailChanged ? (
                      <Button onClick={handleClickDuplicateEmail}>
                        {t("signup.btn_check_duplicate_email")}
                      </Button>
                    ) : null}

                    <Form.Control.Feedback type="invalid">
                      {t("signup.invalid_email_message")}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    {t("signup.input_label_use_gravatar")}
                  </Form.Label>
                  <Form.Check
                    type="checkbox"
                    name="useGravatar"
                    checked={userData.useGravatar}
                    onChange={handleChange}
                    label={t("signup.input_checkbox_use_gravatar")}
                    // ()를 풀면, null인 경우가 있어 오류 발생하여 !!로 강제 변환
                    isInvalid={!!(profileImage && userData.useGravatar)}
                  />
                  <Form.Text className="text-muted">
                    <Trans i18nKey="edit_profile.description_use_gravatar" />
                  </Form.Text>
                  {!!(profileImage && userData.useGravatar) ? (
                    <Form.Text className="text-muted">
                      <br></br>
                      <Trans i18nKey="edit_profile.warn_duplicate_profile_settings" />
                    </Form.Text>
                  ) : null}
                </Form.Group>

                <Button variant="primary" type="submit">
                  <Trans i18nKey="edit_profile.btn_save" />
                </Button>
              </Form>

              <div className="mt-3">
                <p>
                  <Trans i18nKey="edit_profile.label_created_at" />
                  {new Date(userData.createdAt).toLocaleString()}
                </p>
                <p>
                  <Trans i18nKey="edit_profile.label_updated_at" />
                  {new Date(userData.updatedAt).toLocaleString()}
                </p>
              </div>
            </Container>
          </>
        ) : null}
      </>
    );
  },
);

export default ProfileEditTab;
