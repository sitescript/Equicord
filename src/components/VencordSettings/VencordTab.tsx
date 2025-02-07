/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./VencordTab.css";

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { openPluginModal } from "@components/PluginSettings/PluginModal";
import { gitRemote } from "@shared/vencordUserAgent";
import { openInviteModal } from "@utils/discord";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { relaunch, showItemInFolder } from "@utils/native";
import { useAwaiter } from "@utils/react";
import {
  Button,
  Card,
  Forms,
  React,
  Select,
  showToast,
  Switch,
} from "@webpack/common";

import {
  Flex,
  FolderIcon,
  GithubIcon,
  Heart,
  LogIcon,
  PaintbrushIcon,
  RestartIcon,
} from "..";
import { openNotificationSettingsModal } from "./NotificationSettings";
import { QuickAction, QuickActionCard } from "./quickActions";
import { SettingsTab, wrapTab } from "./shared";

const cl = classNameFactory("vc-settings-");

const DEFAULT_DONATE_IMAGE =
  "https://cdn.discordapp.com/emojis/1026533090627174460.png";
const SHIGGY_DONATE_IMAGE = "https://i.imgur.com/57ATLZu.png";

type KeysOfType<Object, Type> = {
  [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

function EquicordSettings() {
  const [settingsDir, , settingsDirPending] = useAwaiter(
    VencordNative.settings.getSettingsDir,
    {
      fallbackValue: "Loading...",
    },
  );
  const settings = useSettings();

  const discordInvite = "bFp57wxCkv";
  const donateImage = React.useMemo(
    () => (Math.random() > 0.5 ? DEFAULT_DONATE_IMAGE : SHIGGY_DONATE_IMAGE),
    [],
  );

  const isWindows = navigator.platform.toLowerCase().startsWith("win");
  const isMac = navigator.platform.toLowerCase().startsWith("mac");
  const needsVibrancySettings = IS_DISCORD_DESKTOP && isMac;

  const Switches: Array<
    | false
    | {
        key: KeysOfType<typeof settings, boolean>;
        title: string;
        note: string;
        warning: { enabled: boolean; message?: string };
      }
  > = [
    {
      key: "useQuickCss",
      title: "Enable Custom CSS",
      note: "Loads your Custom CSS",
      warning: { enabled: false },
    },
    !IS_WEB && {
      key: "enableReactDevtools",
      title: "Enable React Developer Tools",
      note: "Requires a full restart",
      warning: { enabled: false },
    },
    !IS_WEB &&
      (!IS_DISCORD_DESKTOP || !isWindows
        ? {
            key: "frameless",
            title: "Disable the window frame",
            note: "Requires a full restart",
            warning: { enabled: false },
          }
        : {
            key: "winNativeTitleBar",
            title:
              "Use Windows' native title bar instead of Discord's custom one",
            note: "Requires a full restart",
            warning: { enabled: false },
          }),
    !IS_WEB && {
      key: "transparent",
      title: "Enable window transparency.",
      note: "You need a theme that supports transparency or this will do nothing. Requires a full restart!",
      warning: {
        enabled: isWindows,
        message: "Enabling this will prevent you from snapping this window.",
      },
    },
    !IS_WEB &&
      isWindows && {
        key: "winCtrlQ",
        title:
          "Register Ctrl+Q as shortcut to close Discord (Alternative to Alt+F4)",
        note: "Requires a full restart",
        warning: { enabled: false },
      },
    IS_DISCORD_DESKTOP && {
      key: "disableMinSize",
      title: "Disable minimum window size",
      note: "Requires a full restart",
      warning: { enabled: false },
    },
  ];

  return (
    <SettingsTab title="Equicord Settings">
      <DiscordInviteCard invite={discordInvite} image={donateImage} />
      <Forms.FormSection title="Quick Actions">
        <QuickActionCard>
          <QuickAction
            Icon={LogIcon}
            text="Notification Log"
            action={openNotificationLogModal}
          />
          <QuickAction
            Icon={PaintbrushIcon}
            text="Edit QuickCSS"
            action={() => VencordNative.quickCss.openEditor()}
          />
          {!IS_WEB && (
            <QuickAction
              Icon={RestartIcon}
              text="Relaunch Discord"
              action={relaunch}
            />
          )}
          {!IS_WEB && (
            <QuickAction
              Icon={FolderIcon}
              text="Open Settings Folder"
              action={() => showItemInFolder(settingsDir)}
            />
          )}
          <QuickAction
            Icon={GithubIcon}
            text="View Source Code"
            action={() =>
              VencordNative.native.openExternal(
                "https://github.com/" + gitRemote,
              )
            }
          />
        </QuickActionCard>
      </Forms.FormSection>

      <Forms.FormDivider />

      <Forms.FormSection className={Margins.top16} title="Settings" tag="h5">
        <Forms.FormText
          className={Margins.bottom20}
          style={{ color: "var(--text-muted)" }}
        >
          Hint: You can change the position of this settings section in the{" "}
          <Button
            look={Button.Looks.BLANK}
            style={{ color: "var(--text-link)", display: "inline-block" }}
            onClick={() => openPluginModal(Vencord.Plugins.plugins.Settings)}
          >
            settings of the Settings plugin
          </Button>
          !
        </Forms.FormText>

        {Switches.map(
          s =>
            s && (
              <Switch
                key={s.key}
                value={settings[s.key]}
                onChange={v => (settings[s.key] = v)}
                note={
                  s.warning.enabled ? (
                    <>
                      {s.note}
                      <div className="form-switch-warning">
                        {s.warning.message}
                      </div>
                    </>
                  ) : (
                    s.note
                  )
                }
              >
                {s.title}
              </Switch>
            ),
        )}
      </Forms.FormSection>

      {needsVibrancySettings && (
        <>
          <Forms.FormTitle tag="h5">
            Window vibrancy style (requires restart)
          </Forms.FormTitle>
          <Select
            className={Margins.bottom20}
            placeholder="Window vibrancy style"
            options={[
              // Sorted from most opaque to most transparent
              {
                label: "No vibrancy",
                value: undefined,
              },
              {
                label: "Under Page (window tinting)",
                value: "under-page",
              },
              {
                label: "Content",
                value: "content",
              },
              {
                label: "Window",
                value: "window",
              },
              {
                label: "Selection",
                value: "selection",
              },
              {
                label: "Titlebar",
                value: "titlebar",
              },
              {
                label: "Header",
                value: "header",
              },
              {
                label: "Sidebar",
                value: "sidebar",
              },
              {
                label: "Tooltip",
                value: "tooltip",
              },
              {
                label: "Menu",
                value: "menu",
              },
              {
                label: "Popover",
                value: "popover",
              },
              {
                label: "Fullscreen UI (transparent but slightly muted)",
                value: "fullscreen-ui",
              },
              {
                label: "HUD (Most transparent)",
                value: "hud",
              },
            ]}
            select={v => (settings.macosVibrancyStyle = v)}
            isSelected={v => settings.macosVibrancyStyle === v}
            serialize={identity}
          />
        </>
      )}

      <Forms.FormSection
        className={Margins.top16}
        title="Equicord Notifications"
        tag="h5"
      >
        <Flex>
          <Button onClick={openNotificationSettingsModal}>
            Notification Settings
          </Button>
          <Button onClick={openNotificationLogModal}>
            View Notification Log
          </Button>
        </Flex>
      </Forms.FormSection>
    </SettingsTab>
  );
}

interface DiscordInviteProps {
  invite: string;
  image: string;
}

function DiscordInviteCard({ invite, image }: DiscordInviteProps) {
  return (
    <Card className={cl("card", "discordinvite")}>
      <div>
        <Forms.FormTitle tag="h5">Join the discord!</Forms.FormTitle>
        <Forms.FormText>
          Please consider joining the discord for any news on breaking changes,
          or new bigger updates!
        </Forms.FormText>
        <Forms.FormText>
          <Heart />
          You can also donate to me if you'd like to support this project.
        </Forms.FormText>

        <div className={cl("card-buttons")}>
          <Button
            className="vc-joindiscordbutton vc-settingbuttons"
            onClick={async e => {
              e.preventDefault();
              openInviteModal(invite).catch(() =>
                showToast("Invalid or expired invite"),
              );
            }}
          >
            Join
          </Button>

          <Button
            className="vc-donatebutton vc-settingbuttons"
            onClick={() => {
              VencordNative.native.openExternal(
                "https://github.com/sponsors/verticalsync",
              );
            }}
          >
            Donate
          </Button>
        </div>
      </div>
      <img
        role="presentation"
        src={image}
        alt=""
        height={128}
        style={{
          marginLeft: "auto",
        }}
      />
    </Card>
  );
}

export default wrapTab(EquicordSettings, "Equicord Settings");
