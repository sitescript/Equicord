import "./styles.css";

import ErrorBoundary from "@components/ErrorBoundary";
import { EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Clipboard, Toasts, React } from "@webpack/common";

interface User {
    id: string;
    username: string;
    avatar: string;
    discriminator: string;
    publicFlags: number;
    avatarDecorationData?: any;
    globalName: string;
}

interface ContactsList {
    id: string;
    type: number;
    nickname?: any;
    user: User;
    since: string;
}

function getUsernames(contacts: ContactsList[], type: number): string[] {
    return contacts
        .filter(e => e.type === type)
        .map(e => e.user.discriminator === "0" ? e.user.username : e.user.username + "#" + e.user.discriminator);
}

export default definePlugin({
    name: "ExportContacts",
    description: "Export a list of friends to your clipboard. Adds a new button to the menu bar for the friends tab.",
    authors: [EquicordDevs.dat_insanity],
    
    patches: [
        {
            find: "fetchRelationships(){",
            replacement: {
                match: /(\.then\(\i)=>(\i\.\i\.dispatch\({type:"LOAD_RELATIONSHIPS_SUCCESS",relationships:(\i\.body)}\))/,
                replace: "$1=>{$2; $self.getContacts($3)}"
            }
        },
        {
            find: "renderFriendsSection",
            replacement: {
                match: /function\((\w+)\){.*?return\s*(\w+)\.createElement/s,
                replace: function(_, props, createElement) {
                    return `function(${props}){
                        const originalResult = ${createElement}.createElement(
                            ${props}.type, 
                            ${props}.props, 
                            ${props}.children
                        );
                        
                        // Check if this is the friends section
                        if (${props}.props?.['aria-label'] === 'Friends') {
                            // Clone the original children
                            const children = React.Children.toArray(originalResult.props.children);
                            
                            // Add our export button at the end
                            children.push($self.addExportButton());
                            
                            // Recreate the element with modified children
                            return ${createElement}.createElement(
                                originalResult.type, 
                                originalResult.props, 
                                children
                            );
                        }
                        
                        return originalResult;
                    }`;
                }
            }
        }
    ],

    contactList: null as any,

    getContacts(contacts: ContactsList[]) {
        this.contactList = {
            friendsAdded: getUsernames(contacts, 1),
            blockedUsers: getUsernames(contacts, 2),
            incomingFriendRequests: getUsernames(contacts, 3),
            outgoingFriendRequests: getUsernames(contacts, 4)
        };
    },

    addExportButton() {
        return (
            <ErrorBoundary noop key="export-contacts-button">
                <button 
                    className="export-contacts-button" 
                    onClick={() => this.copyContactToClipboard()}
                >
                    Export Contacts
                </button>
            </ErrorBoundary>
        );
    },

    copyContactToClipboard() {
        if (this.contactList) {
            try {
                Clipboard.copy(JSON.stringify(this.contactList, null, 2));
                Toasts.show({
                    message: "Contacts copied to clipboard successfully.",
                    type: Toasts.Type.SUCCESS,
                    id: Toasts.genId(),
                    options: {
                        duration: 3000,
                        position: Toasts.Position.BOTTOM
                    }
                });
            } catch (error) {
                Toasts.show({
                    message: "Failed to copy contacts.",
                    type: Toasts.Type.FAILURE,
                    id: Toasts.genId(),
                    options: {
                        duration: 3000,
                        position: Toasts.Position.BOTTOM
                    }
                });
            }
            return;
        }

        Toasts.show({
            message: "Contact list is undefined. Click on the \"All\" tab before exporting.",
            type: Toasts.Type.FAILURE,
            id: Toasts.genId(),
            options: {
                duration: 3000,
                position: Toasts.Position.BOTTOM
            }
        });
    }
});
