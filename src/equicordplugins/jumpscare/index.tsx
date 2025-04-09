/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, ReactDOM, useEffect, useState } from "@webpack/common";
import { Root } from "react-dom/client";

let jumpscareRoot: Root | undefined;

const settings = definePluginSettings({
    imageSource: {
        type: OptionType.STRING,
        description: "Sets the image url of the jumpscare",
        default: "https://github.com/Equicord/Equibored/blob/main/icons/jumpscare/troll.gif?raw=true"
    },
    audioSource: {
        type: OptionType.STRING,
        description: "Sets the audio url of the jumpscare",
        default: "https://github.com/Equicord/Equibored/raw/main/sounds/jumpscare/trollolol.mp3?raw=true"
    },
    chance: {
        type: OptionType.NUMBER,
        description: "The chance of a jumpscare happening (1 in X so: 100 = 1/100 or 1%, 50 = 1/50 or 2%, etc.)",
        default: 1000
    }
});

function getJumpscareRoot(): Root {
    if (!jumpscareRoot) {
        const element = document.createElement("div");
        element.id = "jumpscare-root";
        element.classList.add("jumpscare-root");
        document.body.append(element);
        jumpscareRoot = ReactDOM.createRoot(element);
    }

    return jumpscareRoot;
}

export default definePlugin({
    name: "Jumpscare",
    description: "Adds a configurable chance of jumpscaring you whenever you open a channel. Inspired by Geometry Dash Mega Hack",
    authors: [Devs.surgedevs],
    settings,

    start() {
        getJumpscareRoot().render(
            <this.JumpscareComponent />
        );
    },

    stop() {
        jumpscareRoot?.unmount();
        jumpscareRoot = undefined;
    },

    JumpscareComponent() {
        const [isPlaying, setIsPlaying] = useState(false);

        const audio = new Audio(settings.store.audioSource);

        const jumpscare = event => {
            if (isPlaying) return;

            const chance = 1 / settings.store.chance;
            if (Math.random() > chance) return;

            setIsPlaying(true);
            audio.play();

            console.log(isPlaying);

            setTimeout(() => {
                setIsPlaying(false);
            }, 1000);
        };

        useEffect(() => {
            FluxDispatcher.subscribe("CHANNEL_SELECT", jumpscare);

            return () => {
                FluxDispatcher.unsubscribe("CHANNEL_SELECT", jumpscare);
            };
        });

        return <img className={`jumpscare-img ${isPlaying ? "jumpscare-animate" : ""}`} src={settings.store.imageSource} />;
    }
});
