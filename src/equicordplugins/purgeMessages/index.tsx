/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
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

import "@equicordplugins/_misc/styles.css";

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { Devs, EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Forms, MessageStore, UserStore } from "@webpack/common";
import { Channel, Message } from "discord-types/general";

const MessageActions = findByPropsLazy("deleteMessage", "startEditMessage");

async function deleteMessages(amount: number, channel: Channel, delay: number = 1500): Promise<number> {
    let deleted = 0;
    const userId = UserStore.getCurrentUser().id;
    const messages: Message[] = JSON.parse(JSON.stringify(MessageStore.getMessages(channel.id)._array.filter((m: Message) => m.author.id === userId).reverse()));

    for (const message of messages) {
        MessageActions.deleteMessage(channel.id, message.id);
        amount--;
        deleted++;
        if (amount === 0) break;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    return deleted;
}

export default definePlugin({
    name: "PurgeMessages",
    description: "Purges messages from a channel",
    authors: [EquicordDevs.bhop, Devs.nyx],
    settingsAboutComponent: () => <>
        <Forms.FormText className="plugin-warning">
            We can't guarantee this plugin won't get you warned or banned.
        </Forms.FormText>
    </>,
    commands: [
        {
            name: "purge",
            description: "Purge a chosen amount of messages from a channel",
            options: [
                {
                    name: "amount",
                    description: "How many messages you wish to purge",
                    type: ApplicationCommandOptionType.INTEGER,
                    required: true
                },
                {
                    name: "channel",
                    description: "Channel ID you wish to purge from",
                    type: ApplicationCommandOptionType.CHANNEL,
                    required: false
                },
                {
                    name: "delay",
                    description: "Delay inbetween deleting messages",
                    type: ApplicationCommandOptionType.INTEGER,
                    required: false
                }
            ],
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: async (opts, ctx) => {
                const amount: number = findOption(opts, "amount", 0);
                const channel: Channel = findOption(opts, "channel", ctx.channel);
                const delay: number = findOption(opts, "delay", 1500);

                sendBotMessage(ctx.channel.id, {
                    content: `> deleting ${amount} messages.`
                });

                deleteMessages(amount, channel, delay).then((deleted: number) => {
                    sendBotMessage(ctx.channel.id,
                        {
                            content: `> deleted ${deleted} messages`
                        }
                    );
                });
            },
        }
    ],
});
