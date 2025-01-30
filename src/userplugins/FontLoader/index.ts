/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    PresetFonts: {
        description: "Use preset fonts",
        type: OptionType.SELECT,
        options: [
            {
                label: "Almarai",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Almarai/Almarai-font-snippet.json",
                default: false
            },
            {
                label: "Cabin",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Cabin/Cabin-font-snippet.json",
                default: false
            },
            {
                label: "Evolve Sans EVO",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Evolve-Sans-EVO/Evolve-Sans-EVO-font-snippet.json",
                default: false
            },
            {
                label: "Fira Code",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Fira-Code/Fira-Code-font-snippet.json",
                default: false
            },
            {
                label: "Gantari",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Gantari/Gantari-font-snippet.json",
                default: false
            },
            {
                label: "Golos Text",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Golos-Text/Golos-Text-font-snippet.json",
                default: false
            },
            {
                label: "GoogleSans",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/GoogleSans/GoogleSans-font-snippet.json",
                default: false
            },
            {
                label: "IBM Plex Mono",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/IBM_Plex_Mono/ibm_flex_mono.json",
                default: false
            },
            {
                label: "InstrumentSans",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/InstrumentSans/InstrumentSans-font-snippet.json",
                default: false
            },
            {
                label: "Inter",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Inter/Inter-font-snippet.json",
                default: false
            },
            {
                label: "JetBrains Mono",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/JetBrainsMono/JetBrainsMono-font-snippet.json",
                default: false
            },
            {
                label: "Linotte",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Linotte/Linotte-font-snippet.json",
                default: false
            },
            {
                label: "Meloso",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Meloso/Meloso-font-snippet.json",
                default: false
            },
            {
                label: "Mikhak",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Mikhak/Mikhak-font-snippet.json",
                default: false
            },
            {
                label: "OpenDyslexic",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/OpenDyslexic/OpenDyslexic-font-snippet.json",
                default: false
            },
            {
                label: "Playfair",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Playfair/Playfair-font-snippet.json",
                default: false
            },
            {
                label: "Quicksand",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Quicksand/Quicksand-font-snippet.json",
                default: false
            },
            {
                label: "San Francisco Pro Display",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/SF-Pro-Display/SF-Pro-Display-font-snippet.json",
                default: false
            },
            {
                label: "Source Code Pro",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Source-Code-Pro/Source-Code-Pro-font-snippet.json",
                default: false
            },
            {
                label: "Space Mono",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/main/Space-Mono/Space-Mono-font-snippet.json",
                default: false
            },
            {
                label: "Trakya",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/refs/heads/main/Trakya/Trakya-Sans-font-snippet.json",
                default: false
            },
            {
                label: "Ubuntu Sans Mono",
                value: "https://raw.githubusercontent.com/Rairof/Theme-Fonts/refs/heads/main/UbuntuSansMono/UbuntuSansMono-font-snippet.json",
                default: false
            }
        ]
    },
});

export default definePlugin({
    name: "CustomFontLoader",
    description: "Load a custom font from URL",
    authors: [EquicordDevs.Crxa, EquicordDevs.vmohammad],
    settings,

    start() {
        const style = document.createElement("style");
        style.textContent = `
            @font-face {
                font-family: '{font.name}';
                src: url(https://github.com/Rairof/Theme-Fonts/raw/main/{font.name}/{font.name}-{font.type}.tff?raw=1) format('truetype');
                font-weight: normal;
                font-style: normal;
            }

            @font-face {
                font-family: '{font.name}';
                src: url(https://github.com/Rairof/Theme-Fonts/raw/main/{font.name}/{font.name}-{font.type}.tff?raw=1) format('truetype');
                font-weight: bold;
                font-style: normal;
            }

            @font-face {
                font-family: '{font.name}';
                src: url(https://github.com/Rairof/Theme-Fonts/raw/main/{font.name}/{font.name}-{font.type}.tff?raw=1) format('truetype');
                font-weight: bold;
                font-style: italic;
            }

            * {
                font-family: '{font.name}', sans-serif !important;
            }
        `;
        document.head.appendChild(style);
    },
    stop() {
        const styles = document.head.getElementsByTagName("style");
        for (const style of Array.from(styles)) {
            if (style.textContent?.includes("Fontname")) {
                document.head.removeChild(style);
            }
        }
    }
});
