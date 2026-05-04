export class ExperienceManager {
    public level: number = 1;
    public currentXp: number = 0;
    public xpToNextLevel: number = 100;

    private readonly EXPOSANT_LVL_COURBE = 1.5;

    public addXp(amount: number): boolean {
        this.currentXp += amount;
        if (this.currentXp >= this.xpToNextLevel) {
            this.levelUp();
            return true; // A monté de niveau
        }
        return false;
    }

    private levelUp(): void {
        this.currentXp -= this.xpToNextLevel;
        this.level++;
        this.xpToNextLevel = Math.floor(
            Math.pow(this.level, this.EXPOSANT_LVL_COURBE) * 100,
        );
        console.log(`Level Up! Nouveau niveau : ${this.level}`);
    }
}
