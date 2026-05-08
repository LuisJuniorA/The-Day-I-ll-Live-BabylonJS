import { type ILoadingScreen } from "@babylonjs/core";

export class CustomLoadingScreen implements ILoadingScreen {
    // 1. Déclaration explicite des propriétés
    public loadingUIText: string = "";
    public loadingUIBackgroundColor: string = "#050508";

    private _loadingDiv: HTMLDivElement | null = null;

    public displayLoadingUI(): void {
        if (this._loadingDiv) return;

        this._loadingDiv = document.createElement("div");
        this._loadingDiv.id = "customLoadingScreen";

        Object.assign(this._loadingDiv.style, {
            position: "absolute",
            left: "0",
            top: "0",
            width: "100%",
            height: "100%",
            backgroundColor: this.loadingUIBackgroundColor,
            color: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "1000",
            fontFamily: "monospace",
            transition: "opacity 0.5s ease",
        });

        const textDiv = document.createElement("div");
        // On s'assure d'avoir un texte par défaut si loadingUIText est vide
        textDiv.textContent =
            this.loadingUIText || "INITIALISATION DU MONDE...";
        textDiv.style.fontSize = "22px";
        textDiv.style.letterSpacing = "6px";
        textDiv.style.fontWeight = "bold";
        textDiv.style.animation = "pulseCustom 2s infinite ease-in-out";

        // Ajout de l'animation dans le document
        if (!document.getElementById("loading-animation-style")) {
            const style = document.createElement("style");
            style.id = "loading-animation-style";
            style.innerHTML = `
                @keyframes pulseCustom {
                    0% { opacity: 0.2; transform: scale(0.98); }
                    50% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0.2; transform: scale(0.98); }
                }
            `;
            document.head.appendChild(style);
        }

        this._loadingDiv.appendChild(textDiv);
        document.body.appendChild(this._loadingDiv);
    }

    public hideLoadingUI(): void {
        if (!this._loadingDiv) return;

        this._loadingDiv.style.opacity = "0";
        setTimeout(() => {
            if (this._loadingDiv) {
                this._loadingDiv.remove();
                this._loadingDiv = null;
            }
        }, 500);
    }
}
