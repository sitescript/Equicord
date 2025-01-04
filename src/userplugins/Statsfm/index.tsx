/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Sofia Lima
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings } from "@api/Settings";
import { Link } from "@components/Link";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { ApplicationAssetUtils, FluxDispatcher, Forms } from "@webpack/common";

interface ActivityAssets {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
}


interface ActivityButton {
    label: string;
    url: string;
}

interface Activity {
    state: string;
    details?: string;
    timestamps?: {
        start?: number;
    };
    assets?: ActivityAssets;
    buttons?: Array<string>;
    name: string;
    application_id: string;
    metadata?: {
        button_urls?: Array<string>;
    };
    type: number;
    flags: number;
}

interface TrackData {
    name: string;
    albums: string;
    artists: string;
    url: string;
    imageUrl?: string;
}

// only relevant enum values
const enum ActivityType {
    PLAYING = 0,
    LISTENING = 2,
}

const enum ActivityFlag {
    INSTANCE = 1 << 0,
}

const enum NameFormat {
    StatusName = "status-name",
    ArtistFirst = "artist-first",
    SongFirst = "song-first",
    ArtistOnly = "artist",
    SongOnly = "song",
    albumsName = "albums"
}

const applicationId = "1325126169179197500";
const placeholderId = "2a96cbd8b46e442fc41c2b86b821562f";

const logger = new Logger("StatsfmPresence");

const presenceStore = findByPropsLazy("getLocalPresence");

async function getApplicationAsset(key: string): Promise<string> {
    return (await ApplicationAssetUtils.fetchAssetIds(applicationId, [key]))[0];
}

function setActivity(activity: Activity | null) {
    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity,
        socketId: "StatsfmPresence",
    });
}

const settings = definePluginSettings({
    username: {
        description: "stats.fm username",
        type: OptionType.STRING,
    },
    shareUsername: {
        description: "show link to stats.fm profile",
        type: OptionType.BOOLEAN,
        default: false,
    },
    shareSong: {
        description: "show link to song on stats.fm",
        type: OptionType.BOOLEAN,
        default: true,
    },
    hideWithSpotify: {
        description: "hide stats.fm presence if spotify is running",
        type: OptionType.BOOLEAN,
        default: true,
    },
    statusName: {
        description: "custom status text",
        type: OptionType.STRING,
        default: "some music",
    },
    nameFormat: {
        description: "Show name of song and artist in status name",
        type: OptionType.SELECT,
        options: [
            {
                label: "Use custom status name",
                value: NameFormat.StatusName,
                default: true
            },
            {
                label: "Use format 'artist - song'",
                value: NameFormat.ArtistFirst
            },
            {
                label: "Use format 'song - artist'",
                value: NameFormat.SongFirst
            },
            {
                label: "Use artist name only",
                value: NameFormat.ArtistOnly
            },
            {
                label: "Use song name only",
                value: NameFormat.SongOnly
            },
            {
                label: "Use albums name (falls back to custom status text if song has no albums)",
                value: NameFormat.albumsName
            }
        ],
    },
    useListeningStatus: {
        description: 'show "Listening to" status instead of "Playing"',
        type: OptionType.BOOLEAN,
        default: false,
    },
    missingArt: {
        description: "When albums or albums art is missing",
        type: OptionType.SELECT,
        options: [
            {
                label: "Use large Stats.fm logo",
                value: "StatsFmLogo",
                default: true
            },
            {
                label: "Use generic placeholder",
                value: "placeholder"
            }
        ],
    },
    showStatsFmLogo: {
        description: "show the Stats.fm next to the albums cover",
        type: OptionType.BOOLEAN,
        default: true,
    }
});

export default definePlugin({
    name: "StatsfmPresence",
    description: "Statsfm presence to track your music",
    authors: [Devs.Crxa],

    settingsAboutComponent: () => (
        <>
            <Forms.FormTitle tag="h3">How does this work?</Forms.FormTitle>
            <Forms.FormText>
                Hey this is just here to explain how this works. By putting your stats.fm username in the settings, it will show what you're currently listening to on your discord profile. (this doesnt require an api but requires you to have your listening history public)
            </Forms.FormText>
        </>
    ),

    settings,

    start() {
        this.updatePresence();
        this.updateInterval = setInterval(() => { this.updatePresence(); }, 16000);
    },

    stop() {
        clearInterval(this.updateInterval);
    },

    async fetchTrackData(): Promise<TrackData | null> {
        if (!settings.store.username)
            return null;

        try {
            const params = new URLSearchParams({
               // method: "user.getitem",
                user: settings.store.username,
            });

            const res = await fetch(`https://api.stats.fm/api/v1/users/${params}/streams/current`);
            if (!res.ok) throw `${res.status} ${res.statusText}`;

            const json = await res.json();
            if (json.error) {
                logger.error("Error from Stats.fm API", `${json.error}: ${json.message}`);
                return null;
            }

            const trackData = json.recenttracks?.track[0];

            if (!trackData?.["item"]?.isPlaying) // item is legit what its root is in api :sob:
                return null;

            return {
                name: trackData.name || "Unknown",
                albums: trackData.albums["name"] || "Unknown",
                artists: trackData.artists["name"] || "Unknown",
                url: trackData.url, // https://stats.fm/track/665906 / https://twirl.cx/dj2gL.png reminder of what the id looks like to fetch track
                imageUrl: trackData.image?.find((x: any) => x["image"])?.["image"]
            };
        } catch (e) {
            logger.error("Failed to query Stats.fm API", e);
            // will clear the rich presence if API fails
            return null;
        }
    },

    async updatePresence() {
        setActivity(await this.getActivity());
    },

    getLargeImage(track: TrackData): string | undefined {
        if (track.imageUrl && !track.imageUrl.includes(placeholderId))
            return track.imageUrl;

        if (settings.store.missingArt === "placeholder")
            return "placeholder";
    },

    async getActivity(): Promise<Activity | null> {
        if (settings.store.hideWithSpotify) {
            for (const activity of presenceStore.getActivities()) {
                if (activity.type === ActivityType.LISTENING && activity.application_id !== applicationId) {
                    return null;
                }
            }
        }

        const trackData = await this.fetchTrackData();
        if (!trackData) return null;

        const largeImage = this.getLargeImage(trackData);
        const assets: ActivityAssets = largeImage ?
            {
                large_image: await getApplicationAsset(largeImage),
                large_text: trackData.albums || undefined,
                ...(settings.store.showStatsFmLogo && {
                    small_image: await getApplicationAsset("StatsFm-small"),
                    small_text: "Stats.fm"
                }),
            } : {
                large_image: await getApplicationAsset("StatsFm-large"),
                large_text: trackData.albums || undefined,
            };

        const buttons: ActivityButton[] = [];

        if (settings.store.shareUsername)
            buttons.push({
                label: "Stats.fm Profile",
                url: `https://stats.fm/${settings.store.username}`,
            });

        if (settings.store.shareSong)
            buttons.push({
                label: "View Song",
                url: trackData.url,
            });

        const statusName = (() => {
            switch (settings.store.nameFormat) {
                case NameFormat.ArtistFirst:
                    return trackData.artists + " - " + trackData.name;
                case NameFormat.SongFirst:
                    return trackData.name + " - " + trackData.artists;
                case NameFormat.ArtistOnly:
                    return trackData.artists;
                case NameFormat.SongOnly:
                    return trackData.name;
                case NameFormat.albumsName:
                    return trackData.albums || settings.store.statusName;
                default:
                    return settings.store.statusName;
            }
        })();

        return {
            application_id: applicationId,
            name: statusName,

            details: trackData.name,
            state: trackData.artists,
            assets,

            buttons: buttons.length ? buttons.map(v => v.label) : undefined,
            metadata: {
                button_urls: buttons.map(v => v.url),
            },

            type: settings.store.useListeningStatus ? ActivityType.LISTENING : ActivityType.PLAYING,
            flags: ActivityFlag.INSTANCE,
        };
    }
});
