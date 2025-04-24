import { Tab, Nav, Row, Col, Container, ListGroup } from "react-bootstrap";
import { Trans, useTranslation } from "react-i18next";
import React from "react";
import { Suspense, useRef, useEffect } from "react";
const PassKeyManageTab = React.lazy(
  () => import("../compnents/settings/PassKeyManageTab"),
);
import { ProfileEditTabHandle } from "../compnents/settings/ProfileEditTab";
const ProfileEditTab = React.lazy(
  () => import("../compnents/settings/ProfileEditTab"),
);
import { PassKeyManageTabHandle } from "../compnents/settings/PassKeyManageTab";
const PasswordChangeTab = React.lazy(
  () => import("../compnents/settings/PasswordChangeTab"),
);

interface TabConfig {
  eventKey: string;
  label: string;
  component: React.ReactNode;
  onEnter?: () => void;
}

const SettingsPage = () => {
  const { t } = useTranslation();

  const profileEditRef = useRef<ProfileEditTabHandle>(null);
  const passkeyRef = useRef<PassKeyManageTabHandle>(null);

  const tabsConfig: TabConfig[] = [
    {
      eventKey: "profile",
      label: t("settings.tab_name_profile"),
      component: (
        <Suspense fallback={<div>{t("settings.component_loading")}</div>}>
          <ProfileEditTab ref={profileEditRef} />
        </Suspense>
      ),
      onEnter: () => profileEditRef.current?.loadUserData(),
    },
    {
      eventKey: "password",
      label: t("settings.tab_name_password"),
      component: (
        <Suspense fallback={<div>{t("settings.component_loading")}</div>}>
          <PasswordChangeTab />
        </Suspense>
      ),
    },
    {
      eventKey: "passkey",
      label: t("settings.tab_name_passkey"),
      component: (
        <Suspense fallback={<div>{t("settings.component_loading")}</div>}>
          <PassKeyManageTab ref={passkeyRef} />
        </Suspense>
      ),
      onEnter: () => passkeyRef.current?.loadPasskeys(),
    },
  ];

  return (
    <div>
      <h1>{t("settings.title")}</h1>
      <Container className="mt-3">
        <Tab.Container defaultActiveKey={tabsConfig[0].eventKey}>
          <Row>
            <Col sm={3}>
              <Nav variant="pills" className="flex-column">
                <ListGroup.Item
                  as="li"
                  className="bg-light fw-bold border-0"
                  aria-label="Account section"
                >
                  <Trans i18nKey="settings.group_name_account" />
                </ListGroup.Item>
                {tabsConfig.map(tab => (
                  <Nav.Item key={tab.eventKey}>
                    <Nav.Link eventKey={tab.eventKey}>{tab.label}</Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
              <br />
            </Col>

            <Col sm={9}>
              <Tab.Content>
                {tabsConfig.map(tab => (
                  <Tab.Pane
                    key={tab.eventKey}
                    eventKey={tab.eventKey}
                    onEnter={tab.onEnter}
                  >
                    {tab.component}
                  </Tab.Pane>
                ))}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Container>
    </div>
  );
};

export default SettingsPage;
