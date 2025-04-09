/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Clipboard, Menu, Toasts } from "@webpack/common";
const UserProfileStore = findByPropsLazy("getUserProfile");

function getProfileColors(userId) {
    try {
        const profile = UserProfileStore.getUserProfile(userId);

        if (!profile || !profile.themeColors || profile.themeColors.length < 2) {
            return null;
        }

        const primaryColor = profile.themeColors[0].toString(16).padStart(6, "0");
        const secondaryColor = profile.themeColors[1].toString(16).padStart(6, "0");

        return { primaryColor, secondaryColor };
    } catch (e) {
        console.error("Failed to get profile colors:", e);
        return null;
    }
}


function copyProfileColors(userId) {
    const colors = getProfileColors(userId);

    if (!colors) {
        Toasts.show({
            type: Toasts.Type.FAILURE,
            message: "No profile colors found!",
            id: Toasts.genId()
        });
        return;
    }

    const { primaryColor, secondaryColor } = colors;

    //  Formatting color stuff
    const formattedColors = `Primary-color #${primaryColor}, Secondary-Color #${secondaryColor}`;

    try {
        Clipboard.copy(formattedColors);
        Toasts.show({
            type: Toasts.Type.SUCCESS,
            message: "Profile colors copied to clipboard!",
            id: Toasts.genId()
        });
    } catch (e) {
        console.error("Failed to copy to clipboard:", e);
        Toasts.show({
            type: Toasts.Type.FAILURE,
            message: "Error copying profile colors!",
            id: Toasts.genId()
        });
    }
}

// spawning in the context menu
const userContextMenuPatch: NavContextMenuPatchCallback = (children, { user }) => {
    if (!user) return;
    children.push(
        <Menu.MenuItem
            id="copy-profile-colors"
            label="Copy Profile Colors"
            action={() => copyProfileColors(user.id)}
        />
    );
};

export default definePlugin({
    name: "CopyProfileColors",
    description: "A plugin to copy people's profile gradient colors to clipboard.",
    authors: [EquicordDevs.Crxa],

    start() {
        addContextMenuPatch("user-context", userContextMenuPatch);
        addContextMenuPatch("user-profile-actions", userContextMenuPatch);
    },

    stop() {
        // bye bye menu options
        removeContextMenuPatch("user-context", userContextMenuPatch);
        removeContextMenuPatch("user-profile-actions", userContextMenuPatch);
    }
});
