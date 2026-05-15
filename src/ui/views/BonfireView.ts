import {
    Rectangle,
    TextBlock,
    Control,
    AdvancedDynamicTexture,
    Button,
    Grid,
    ScrollViewer,
    Image,
    StackPanel,
} from "@babylonjs/gui";
import { BaseView } from "../../core/abstracts/BaseView";
import { Observable } from "@babylonjs/core";
import { AudioManager } from "../../managers/AudioManager";

const BONFIRE_CONFIG = {
    COLORS: {
        OVERLAY: "rgba(0, 0, 0, 0.85)",
        PANEL_BG: "rgba(10, 10, 15, 0.95)",
        BORDER: "rgba(255, 255, 255, 0.1)",
        ACCENT: "#e67e22",
        TEXT_GOLD: "#FFD700",
        TEXT_MUTED: "#888888",
        DISABLED: "rgba(50, 50, 50, 0.5)",
        ROW_HOVER: "rgba(255, 255, 255, 0.05)",
    },
    FONTS: {
        FAMILY: "Georgia, 'Times New Roman', serif",
        TITLE_SIZE: 36,
    },
    ICON_PATH: "./assets/ui/icons/utils/",
};

const STAT_DESCRIPTIONS: Record<string, { desc: string; icon: string }> = {
    strength: {
        desc: "Augmente la puissance brute et les dégâts physiques infligés par vos armes.",
        icon: "icon_strength.png",
    },
    vitality: {
        desc: "Augmente votre réserve de santé maximum pour survivre plus longtemps.",
        icon: "icon_vitality.png",
    },
    agility: {
        desc: "Améliore votre vitesse de déplacement et votre réactivité au sol.",
        icon: "icon_agility.png",
    },
    dexterity: {
        desc: "Augmente votre vitesse d'attaque, vous permettant de frapper plus souvent.",
        icon: "icon_dexterity.png",
    },
    intelligence: {
        desc: "Augmente la puissance de vos sorts de 5% par point.",
        icon: "icon_intelligence.png",
    },
};

export class BonfireView extends BaseView {
    private _statsGrid!: Grid;
    private _pointsText!: TextBlock;
    private _levelText!: TextBlock;
    private _descriptionText!: TextBlock;
    private _descriptionTitle!: TextBlock;
    private _descriptionIcon!: Image;
    private _lastStatsValues: string = "";

    public onUpgradeStat = new Observable<string>();
    public onBackObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "BonfireView");
        this.buildUI();
        this.hide();
    }

    protected buildUI(): void {
        this.rootContainer.background = BONFIRE_CONFIG.COLORS.OVERLAY;

        const mainPanel = new Rectangle("BonfireMain");
        mainPanel.width = "900px";
        mainPanel.height = "600px";
        mainPanel.thickness = 1;
        mainPanel.color = BONFIRE_CONFIG.COLORS.BORDER;
        mainPanel.background = BONFIRE_CONFIG.COLORS.PANEL_BG;
        this.rootContainer.addControl(mainPanel);

        const title = new TextBlock("BonfireTitle", "REPOS AU FEU");
        title.fontFamily = BONFIRE_CONFIG.FONTS.FAMILY;
        title.fontSize = BONFIRE_CONFIG.FONTS.TITLE_SIZE;
        title.color = BONFIRE_CONFIG.COLORS.TEXT_GOLD;
        title.height = "80px";
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        title.top = "20px";
        mainPanel.addControl(title);

        const contentLayout = new Grid("ContentLayout");
        contentLayout.addColumnDefinition(0.65);
        contentLayout.addColumnDefinition(0.35);
        contentLayout.height = "380px";
        contentLayout.width = "90%";
        contentLayout.top = "20px";
        mainPanel.addControl(contentLayout);

        const scrollViewer = new ScrollViewer("StatsScroll");
        scrollViewer.thickness = 0;
        contentLayout.addControl(scrollViewer, 0, 0);

        this._statsGrid = new Grid("StatsGrid");
        this._statsGrid.width = "100%";
        this._statsGrid.addColumnDefinition(1.0);
        scrollViewer.addControl(this._statsGrid);

        const descPanel = new Rectangle("DescPanel");
        descPanel.thickness = 1;
        descPanel.color = "rgba(255,255,255,0.05)";
        descPanel.background = "rgba(0,0,0,0.2)";
        descPanel.paddingLeft = "20px";
        contentLayout.addControl(descPanel, 0, 1);

        const descStack = new StackPanel("DescStack");
        descStack.width = "100%";
        descPanel.addControl(descStack);

        this._descriptionTitle = new TextBlock("DescTitle", "DÉTAILS");
        this._descriptionTitle.color = BONFIRE_CONFIG.COLORS.TEXT_GOLD;
        this._descriptionTitle.fontSize = 20;
        this._descriptionTitle.height = "40px";
        descStack.addControl(this._descriptionTitle);

        this._descriptionIcon = new Image("DescIcon", "");
        this._descriptionIcon.width = "128px";
        this._descriptionIcon.height = "128px";
        this._descriptionIcon.stretch = Image.STRETCH_UNIFORM;
        this._descriptionIcon.isVisible = false;
        descStack.addControl(this._descriptionIcon);

        this._descriptionText = new TextBlock(
            "DescText",
            "Sélectionnez une statistique.",
        );
        this._descriptionText.color = BONFIRE_CONFIG.COLORS.TEXT_MUTED;
        this._descriptionText.fontSize = 16;
        this._descriptionText.textWrapping = true;
        this._descriptionText.height = "150px";
        descStack.addControl(this._descriptionText);

        const footerInfo = new StackPanel("FooterInfo");
        footerInfo.isVertical = false;
        footerInfo.height = "40px";
        footerInfo.width = "90%";
        footerInfo.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        footerInfo.top = "-100px";
        mainPanel.addControl(footerInfo);

        this._levelText = new TextBlock("LevelText", "NIVEAU ACTUEL : 1");
        this._levelText.width = "50%";
        this._levelText.color = "white";
        this._levelText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        footerInfo.addControl(this._levelText);

        this._pointsText = new TextBlock(
            "PointsText",
            "POINTS DISPONIBLES : 0",
        );
        this._pointsText.width = "50%";
        this._pointsText.color = BONFIRE_CONFIG.COLORS.ACCENT;
        this._pointsText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        footerInfo.addControl(this._pointsText);

        const backBtn = Button.CreateSimpleButton("BackBtn", "QUITTER LE FEU");
        backBtn.width = "250px";
        backBtn.height = "45px";
        backBtn.color = "white";
        backBtn.background = "rgba(255,255,255,0.05)";
        backBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        backBtn.top = "-30px";
        backBtn.onPointerUpObservable.add(() => {
            AudioManager.getInstance().playSfx("UI_CLICK");
            this.onBackObservable.notifyObservers();
        });
        mainPanel.addControl(backBtn);
    }

    public updateStats(
        stats: any,
        availablePoints: number,
        currentLevel: number,
    ): void {
        const statsArray = Array.isArray(stats)
            ? stats
            : [
                  { id: "strength", label: "Force", val: stats.strength },
                  { id: "vitality", label: "Vitalité", val: stats.vitality },
                  { id: "agility", label: "Agilité", val: stats.agility || 1 },
                  {
                      id: "dexterity",
                      label: "Dextérité",
                      val: stats.dexterity || 1,
                  },
                  {
                      id: "intelligence",
                      label: "Intelligence",
                      val: stats.intelligence || 1,
                  },
              ];

        const statsHash =
            JSON.stringify(statsArray) + availablePoints + currentLevel;
        if (this._lastStatsValues === statsHash) return;
        this._lastStatsValues = statsHash;

        this._pointsText.text = `POINTS DISPONIBLES : ${availablePoints}`;
        this._levelText.text = `NIVEAU ACTUEL : ${currentLevel}`;

        this._statsGrid.clearControls();
        while (this._statsGrid.rowCount > 0) {
            this._statsGrid.removeRowDefinition(0);
        }

        statsArray.forEach((stat, index) => {
            this._statsGrid.addRowDefinition(60, true);

            const data = STAT_DESCRIPTIONS[stat.id] || {
                desc: "Effet inconnu",
                icon: "icon_strength.png",
            };

            const rowContainer = new Rectangle("row_" + stat.id);
            rowContainer.background = "transparent";
            rowContainer.thickness = 0;
            rowContainer.isPointerBlocker = true;
            this._statsGrid.addControl(rowContainer, index, 0);

            const rowLayout = new Grid();
            rowLayout.addColumnDefinition(60, true);
            rowLayout.addColumnDefinition(0.5);
            rowLayout.addColumnDefinition(0.2);
            rowLayout.addColumnDefinition(0.2);
            rowLayout.isHitTestVisible = false;
            rowContainer.addControl(rowLayout);

            const iconPath = BONFIRE_CONFIG.ICON_PATH + data.icon;

            // --- LE FIX DÉFINITIF ---
            // 1. Plus de wrapper. On initialise l'image avec une source VIDE comme pour la Description
            const icon = new Image("icon_" + stat.id, "");
            icon.width = "40px";
            icon.height = "40px";
            icon.stretch = Image.STRETCH_UNIFORM;

            // On s'assure qu'elle est bien centrée dans sa colonne de 60px
            icon.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            icon.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

            // 2. On l'ajoute directement au layout AVANT d'assigner la source
            rowLayout.addControl(icon, 0, 0);

            // 3. On lui injecte l'URL du SVG. La Grid connaît déjà la place disponible
            icon.source = iconPath;

            // 4. Force le rafraîchissement au chargement
            icon.onImageLoadedObservable.addOnce(() => {
                icon.width = "41px";
                icon.width = "40px";
            });
            // ------------------------

            const label = new TextBlock("", stat.label.toUpperCase());
            label.color = "white";
            label.fontSize = 16;
            label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            label.paddingLeft = "10px";
            rowLayout.addControl(label, 0, 1);

            const value = new TextBlock("", stat.val.toString());
            value.color = BONFIRE_CONFIG.COLORS.TEXT_GOLD;
            rowLayout.addControl(value, 0, 2);

            const upBtn = Button.CreateSimpleButton("up_" + stat.id, "+");
            upBtn.width = "40px";
            upBtn.height = "40px";
            upBtn.cornerRadius = 20;
            upBtn.isPointerBlocker = true;

            const canAfford = availablePoints > 0;
            upBtn.color = canAfford
                ? BONFIRE_CONFIG.COLORS.ACCENT
                : BONFIRE_CONFIG.COLORS.DISABLED;
            upBtn.isEnabled = canAfford;
            if (canAfford) {
                upBtn.onPointerUpObservable.add(() => {
                    AudioManager.getInstance().playSfx("UI_CLICK");
                    this.onUpgradeStat.notifyObservers(stat.id);
                });
            }
            rowLayout.addControl(upBtn, 0, 3);

            rowContainer.onPointerEnterObservable.add(() => {
                rowContainer.background = BONFIRE_CONFIG.COLORS.ROW_HOVER;
                this._descriptionTitle.text = stat.label.toUpperCase();
                this._descriptionText.text = data.desc;
                this._descriptionIcon.source = iconPath;
                this._descriptionIcon.isVisible = true;
            });

            rowContainer.onPointerOutObservable.add(() => {
                rowContainer.background = "transparent";
            });
        });
    }
}
