import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Dropdown from "react-bootstrap/Dropdown";
import { useEffect } from "react";
import { fetchLoginUser } from "../../api/UserApiService";
import { PersonCircle } from "react-bootstrap-icons";
import { Trans, useTranslation } from "react-i18next";
import { logout } from "../../api/AuthApiService";
import { useToast } from "../../context/ToastContext";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserProvider";
import { memo } from "react";

const Header = memo(() => {
  const { showToast } = useToast();
  const { user, setUser } = useUser();
  let accessToken = localStorage.getItem("accessToken");
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("accessToken");
    accessToken = null;
    showToast(t("header.toast_logout_success"), "success");
    // 홈으로 리다이렉트
    window.location.href = "/";
  };

  useEffect(() => {
    if (accessToken && !user?.id) {
      fetchLoginUser()
        .then(response => {
          setUser(response.data);
        })
        .catch(console.error);
    }
  }, [user]);

  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <Trans i18nKey={"header.title"} />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">
                <Trans i18nKey={"header.home"} />
              </Nav.Link>
              {user && Object.keys(user).length > 0 ? (
                <>
                  <Nav.Link as={Link} to="/">
                    <Trans i18nKey={"header.about"} />
                  </Nav.Link>
                </>
              ) : null}
            </Nav>

            {user && Object.keys(user).length > 0 ? (
              <Nav className="ms-auto">
                <Dropdown align="end">
                  <Dropdown.Toggle as="div" role="toggle">
                    {user.profileUrl ? (
                      <img
                        src={user.profileUrl}
                        alt={user.name}
                        className="rounded-circle"
                        loading="lazy"
                        decoding="async"
                        width={30}
                        height={30}
                      />
                    ) : (
                      <PersonCircle size={30} color="#6c757d" />
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/settings">
                      <Trans i18nKey={"header.settings"} />
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <Trans i18nKey={"header.logout"} />
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
            ) : (
              <>
                <Link to="/login">
                  <Button className="me-2" variant="primary">
                    <Trans i18nKey={"header.login"} />
                  </Button>
                </Link>

                <Link to="/signup">
                  <Button variant="secondary">
                    <Trans i18nKey={"header.signup"} />
                  </Button>
                </Link>
              </>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
});

export default Header;
