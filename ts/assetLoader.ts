// ts/assetLoader.ts

// Point to the new local asset paths.
export const spriteUrls = {
    // Structures
    bunker: 'assets/bunker.png',
    dome: 'assets/dome.png',
    comms: 'assets/tower.png',
    // Rockets
    standardRocket: 'assets/standard_rocket.png',
    armoredRocket: 'assets/armored_rocket.png',
    mirvRocket: 'assets/mirv_rocket.png',
    swarmerRocket: 'assets/swarmer_rocket.png',
    droneRocket: 'assets/drone_rocket.png',
    stealthRocket: 'assets/stealth_rocket.png',
    designatorRocket: 'assets/artillery_designator.png',
    shell: 'assets/artillery_shell.png',
};

// This object will hold our loaded images so they are globally accessible.
export const loadedSprites: Record<string, HTMLImageElement> = {};

/**
 * Asynchronously loads all game assets defined in spriteUrls.
 * @returns A promise that resolves when all images are loaded.
 */
export function loadGameAssets(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const key in spriteUrls) {
        const url = spriteUrls[key as keyof typeof spriteUrls];
        const promise = new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                loadedSprites[key] = img;
                resolve();
            };
            img.onerror = () => reject(new Error(`Failed to load sprite: ${key} at ${url}`));
            img.src = url;
        });
        promises.push(promise);
    }

    // Return a single promise that resolves when all individual image promises have resolved.
    return Promise.all(promises).then(() => {});
}
