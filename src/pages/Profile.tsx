// ProfilePage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchUser } from "../api/UserApiService";
import { Card } from "react-bootstrap";
import { Button, ButtonGroup } from "react-bootstrap";
import { useToast } from "../context/ToastContext";
import { useTranslation } from "react-i18next";
import { PersonCircle } from "react-bootstrap-icons";
import { useUser } from "../context/UserProvider";

const ProfilePage = () => {
  const { user: currentLoginUser } = useUser();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result: UserResponse = (await fetchUser(userId ? userId : "me"))
          .data;
        setProfile(result);
      } catch (err) {
        setError(t("profile.toast_fail_to_get_profile"));
        showToast(t("profile.toast_fail_to_get_profile"), "danger");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ minHeight: "50vh" }}>
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <div className="well well-sm">
              <div className="media">
                <a className="thumbnail pull-left" href="#">
                  {profile?.profileUrl === null ? (
                    <PersonCircle size={120} color="#6c757d" />
                  ) : (
                    <Card.Img
                      width="18rem"
                      className="media-object rounded-circle"
                      variant="top"
                      src={profile?.profileUrl}
                    ></Card.Img>
                  )}
                </a>
                <div className="media-body">
                  <h4 className="media-heading">{profile?.name}</h4>
                  {currentLoginUser?.id === profile?.id ? (
                    <>
                      <ButtonGroup vertical>
                        <Button
                          onClick={() => navigate("/profile/edit")}
                          className="edit-button"
                        >
                          {t("profile.btn_modify_profile")}
                        </Button>

                        <Button
                          onClick={() => navigate("/profile/edit/password")}
                          className="edit-button"
                        >
                          {t("profile.btn_modify_password")}
                        </Button>
                        <Button
                          onClick={() => navigate("/profile/edit/passkey")}
                          className="btn"
                          variant="outline-secondary"
                        >
                          <img
                            alt="Passkey Logo"
                            src="/img/canonical_passkey_icon.png"
                            width="30"
                            height="30"
                            className="d-inline-block align-top"
                          />{" "}
                          {t("profile.btn_manage_passkey")}
                        </Button>
                      </ButtonGroup>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
