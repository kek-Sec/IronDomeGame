// ts/assetLoader.ts

// Point to the new local asset paths.
export const spriteUrls = {
    bunker: 'assets/bunker.png',
    dome: 'assets/dome.png',
    comms: 'assets/tower.png',
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
            // No longer need crossOrigin for local files
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
